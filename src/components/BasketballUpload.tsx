// File: src/components/BasketballUpload.tsx
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import type {
  ChangeEvent,
  DragEvent,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import "./BasketballUpload.css";
import {
  SHOT,
  clampPull,
  depthScale,
  isAimValid,
  isBehindRim,
  launch,
  previewShot,
  solveShot,
  stepFlight,
} from "./basketballPhysics";
import type { CourtGeometry, Flight, Point } from "./basketballPhysics";

/* ---------- constants ---------- */
const BALL = 64;
const HALF = BALL / 2;
const DRAG_THRESHOLD = 6; // px before a press counts as a drag
const KEY_STEP = 6; // px of pull per arrow-key press

export type UploadPhase = "idle" | "ready" | "shoot" | "uploading" | "done" | "error";

export type UploadHandler = (file: File, onProgress: (percent: number) => void) => Promise<void>;

export interface BasketballUploadProps {
  /** Do the real upload here; call onProgress with 0–100. Falls back to a simulated upload. */
  onUpload?: UploadHandler;
  /** Input accept string, e.g. "image/*,.pdf". Also applied to files dropped on the court. */
  accept?: string;
  /** Reject files larger than this many megabytes. Defaults to 25. */
  maxSizeMB?: number;
  /** Take an assisted shot automatically as soon as a file is chosen. */
  autoShoot?: boolean;
  /** Called after a successful upload. */
  onComplete?: (file: File) => void;
}

type AimState = "none" | "invalid" | "miss" | "on";
type ErrorKind = "validation" | "upload";

interface DragState {
  pointerId: number;
  offsetX: number;
  offsetY: number;
  startX: number;
  startY: number;
  moved: boolean;
}

/* ---------- helpers ---------- */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Mirrors the <input accept> rules so dropped files get the same check as picked ones. */
function matchesAccept(file: File, accept?: string): boolean {
  const tokens = (accept ?? "")
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
  if (!tokens.length) return true;
  const name = file.name.toLowerCase();
  const type = (file.type || "").toLowerCase();
  return tokens.some((t) => {
    if (t.startsWith(".")) return name.endsWith(t);
    if (t.endsWith("/*")) return type.startsWith(t.slice(0, -1));
    return type === t;
  });
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOutBack = (t: number) => 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2);
const easeIn = (t: number) => t * t;
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const defaultGeometry = (width: number, height: number): CourtGeometry => ({
  width,
  height,
  hoopX: width / 2,
  rimY: 133,
  rimHalf: 54,
  floorY: 340,
  restX: width / 2,
  restY: 340 - HALF,
  ballRadius: 30,
});

// Fallback used when `onUpload` isn't passed (fake progress for demos).
const simulateUpload: UploadHandler = (_file, onProgress) =>
  new Promise<void>((resolve) => {
    let p = 0;
    const id = window.setInterval(() => {
      p = Math.min(100, p + 8 + Math.random() * 14);
      onProgress(p);
      if (p >= 100) {
        window.clearInterval(id);
        resolve();
      }
    }, 160);
  });

function Ball() {
  return (
    <svg className="bbu__ball" viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="30" fill="#eeebda" />
      <ellipse cx="24" cy="20" rx="15" ry="11" fill="#fff" opacity="0.13" />
      <path d="M8 46a30 30 0 0 0 48 0a30 22 0 0 1-48 0z" fill="#000" opacity="0.12" />
      <g stroke="#282b4a" strokeWidth="2.2" fill="none">
        <circle cx="32" cy="32" r="30" />
        <path d="M32 2v60M2 32h60" />
        <path d="M9 11c14 10 14 32 0 42M55 11C41 21 41 43 55 53" />
      </g>
    </svg>
  );
}

function Net() {
  return (
    <svg className="bbu__net" viewBox="0 0 112 90" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round">
        <path d="M6 4 L30 86M24 2 L40 86M44 2 L48 86M68 2 L64 86M88 2 L72 86M106 4 L82 86" />
        <path d="M10 22 Q56 34 102 22M16 42 Q56 54 96 42M24 62 Q56 72 88 62M32 80 Q56 88 80 80" />
      </g>
    </svg>
  );
}

export default function BasketballUpload({
  onUpload,
  accept,
  maxSizeMB = 25,
  autoShoot = false,
  onComplete,
}: BasketballUploadProps) {
  const [phase, setPhase] = useState<UploadPhase>("idle");
  const [fileDragging, setFileDragging] = useState(false);
  const [held, setHeld] = useState(false); // ball is being dragged
  const [moving, setMoving] = useState(false); // ball is animating
  const [aim, setAim] = useState<AimState>("none");
  const [scored, setScored] = useState(false);
  const [swish, setSwish] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [errorKind, setErrorKind] = useState<ErrorKind>("upload");
  const [nudge, setNudge] = useState("");

  const stageRef = useRef<HTMLDivElement>(null);
  const floorRef = useRef<HTMLDivElement>(null);
  const rimRef = useRef<HTMLDivElement>(null);
  const ballRef = useRef<HTMLButtonElement>(null);
  const spinRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);
  const bandRef = useRef<SVGLineElement>(null);
  const arcRef = useRef<SVGPathElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const geom = useRef<CourtGeometry>(defaultGeometry(380, 460));
  const pos = useRef<Point>({ x: 190, y: 308 });
  const drag = useRef<DragState | null>(null);
  const pull = useRef<Point | null>(null); // current aim (pointer or keyboard)
  const raf = useRef<number | null>(null);
  const timers = useRef<number[]>([]);
  const suppressClick = useRef(false);
  const uploading = useRef(false); // guards against duplicate upload requests
  const mounted = useRef(false);
  const phaseRef = useRef<UploadPhase>("idle");
  const fileRef = useRef<File | null>(null);
  const propsRef = useRef({ onUpload, onComplete });
  // keep the latest callbacks for async handlers, without writing during render
  useLayoutEffect(() => {
    propsRef.current = { onUpload, onComplete };
  });

  const go = (p: UploadPhase) => {
    phaseRef.current = p;
    setPhase(p);
  };

  /* ---------- court geometry (measured from the DOM, so it follows resizes) ---------- */
  const stageOrigin = useCallback((): Point => {
    const s = stageRef.current;
    if (!s) return { x: 0, y: 0 };
    const r = s.getBoundingClientRect();
    return { x: r.left + s.clientLeft, y: r.top + s.clientTop };
  }, []);

  const measure = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const o = stageOrigin();
    const g = defaultGeometry(stage.clientWidth, stage.clientHeight);
    const rim = rimRef.current?.getBoundingClientRect();
    if (rim && rim.width > 0) {
      g.hoopX = rim.left - o.x + rim.width / 2;
      g.rimY = rim.top - o.y + rim.height / 2;
      g.rimHalf = rim.width / 2 - 2;
    }
    const floor = floorRef.current?.getBoundingClientRect();
    if (floor && floor.height > 0) g.floorY = floor.top - o.y;
    g.restY = g.floorY - HALF;
    geom.current = g;
    if (shadowRef.current) shadowRef.current.style.top = `${g.floorY - 6}px`;
  }, [stageOrigin]);

  /* ---------- low-level drawing ---------- */
  const paint = useCallback(
    (x: number, y: number, opts: { rot?: number; scale?: number; opacity?: number } = {}) => {
      const g = geom.current;
      const scale = opts.scale ?? depthScale(g, y);
      const opacity = opts.opacity ?? 1;
      pos.current = { x, y };
      const ball = ballRef.current;
      if (ball) {
        ball.style.transform = `translate3d(${x - HALF}px, ${y - HALF}px, 0) scale(${scale})`;
        ball.style.opacity = String(opacity);
      }
      if (spinRef.current) spinRef.current.style.transform = opts.rot ? `rotate(${opts.rot}deg)` : "";
      const shadow = shadowRef.current;
      if (shadow) {
        const height = Math.max(0, g.floorY - (y + HALF * scale));
        const s = clamp(1 - height / 320, 0.3, 1);
        shadow.style.transform = `translateX(${x - 24}px) scale(${s})`;
        shadow.style.opacity = String(clamp(0.7 - height / 380, 0.1, 0.7) * opacity);
      }
    },
    []
  );

  const setBehind = (behind: boolean) => ballRef.current?.classList.toggle("is-behind", behind);

  const placeAtRest = useCallback(() => {
    const g = geom.current;
    ballRef.current?.classList.remove("is-behind");
    paint(g.restX, g.restY, { opacity: 1 });
  }, [paint]);

  const stopAnim = useCallback(() => {
    if (raf.current !== null) cancelAnimationFrame(raf.current);
    raf.current = null;
  }, []);

  const tween = (ms: number, frame: (t: number) => void) =>
    new Promise<void>((resolve) => {
      stopAnim();
      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / ms);
        frame(t);
        if (t < 1) raf.current = requestAnimationFrame(step);
        else {
          raf.current = null;
          resolve();
        }
      };
      raf.current = requestAnimationFrame(step);
    });

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  useLayoutEffect(() => {
    mounted.current = true;
    measure();
    placeAtRest();
    const stage = stageRef.current;
    let ro: ResizeObserver | null = null;
    if (stage && typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => {
        measure();
        const ph = phaseRef.current;
        if (!drag.current && raf.current === null && (ph === "idle" || ph === "ready" || ph === "error")) {
          pull.current = null;
          placeAtRest();
        }
      });
      ro.observe(stage);
    }
    const pending = timers.current;
    return () => {
      mounted.current = false;
      ro?.disconnect();
      stopAnim();
      pending.forEach((t) => window.clearTimeout(t));
    };
  }, [measure, placeAtRest, stopAnim]);

  /* ---------- aiming guide + trajectory preview ---------- */
  const drawAim = (from: Point | null, p: Point | null) => {
    const band = bandRef.current;
    const arc = arcRef.current;
    if (!from || !p) {
      band?.setAttribute("visibility", "hidden");
      arc?.setAttribute("d", "");
      setAim("none");
      return;
    }
    const g = geom.current;
    if (band) {
      band.setAttribute("x1", String(g.restX));
      band.setAttribute("y1", String(g.restY));
      band.setAttribute("x2", String(from.x));
      band.setAttribute("y2", String(from.y));
      band.setAttribute("visibility", "visible");
    }
    if (!isAimValid(p)) {
      arc?.setAttribute("d", "");
      setAim("invalid");
      return;
    }
    const { points, scored: willScore } = previewShot(g, from, p);
    arc?.setAttribute(
      "d",
      points.map((q, i) => `${i ? "L" : "M"}${q.x.toFixed(1)} ${q.y.toFixed(1)}`).join("")
    );
    setAim(willScore ? "on" : "miss");
  };

  /* ---------- motions ---------- */
  const springBack = async () => {
    const from = { ...pos.current };
    const g = geom.current;
    setBehind(false);
    setMoving(true);
    await tween(prefersReducedMotion() ? 1 : 420, (t) => {
      const e = easeOutBack(t);
      paint(lerp(from.x, g.restX, e), lerp(from.y, g.restY, e));
    });
    if (mounted.current) setMoving(false);
  };

  /** Run the physics in real time until the ball scores or settles. */
  const fly = (f: Flight) =>
    new Promise<void>((resolve) => {
      stopAnim();
      const g = geom.current;
      let last = performance.now();
      let acc = 0;
      const frame = (now: number) => {
        acc += Math.min(0.05, (now - last) / 1000);
        last = now;
        while (acc >= SHOT.dt && f.outcome !== "scored" && !f.settled) {
          stepFlight(g, f);
          acc -= SHOT.dt;
        }
        setBehind(isBehindRim(g, f));
        paint(f.x, f.y, { rot: f.spin });
        if (f.outcome === "scored" || f.settled) {
          raf.current = null;
          resolve();
        } else raf.current = requestAnimationFrame(frame);
      };
      raf.current = requestAnimationFrame(frame);
    });

  /* ---------- upload (the existing handler, called once per successful shot) ---------- */
  const runUpload = async (f: File) => {
    if (uploading.current) return;
    uploading.current = true;
    go("uploading");
    setProgress(0);
    setError("");
    try {
      const handler = propsRef.current.onUpload ?? simulateUpload;
      await handler(f, (percent) => {
        if (mounted.current) setProgress(clamp(percent, 0, 100));
      });
      if (!mounted.current) return;
      setProgress(100);
      go("done");
      propsRef.current.onComplete?.(f);
    } catch (e: unknown) {
      if (!mounted.current) return;
      setError(e instanceof Error && e.message ? e.message : "Upload failed. Check your connection and retry.");
      setErrorKind("upload");
      setScored(false);
      go("error");
      placeAtRest();
    } finally {
      uploading.current = false;
    }
  };

  const onScored = async (f: Flight) => {
    const g = geom.current;
    const reduce = prefersReducedMotion();
    setScored(true);
    setSwish(true);
    later(() => mounted.current && setSwish(false), 900);
    setBehind(true);
    const from = { x: f.x, y: f.y };
    const scale = depthScale(g, g.rimY);
    // drop through the net
    await tween(reduce ? 1 : 460, (t) => {
      paint(lerp(from.x, g.hoopX, Math.min(1, t * 1.6)), lerp(from.y, g.rimY + 85, easeIn(t)), {
        rot: f.spin + 90 * t,
        scale,
        opacity: t < 0.45 ? 1 : 1 - (t - 0.45) / 0.55,
      });
    });
    const picked = fileRef.current;
    if (picked) await runUpload(picked);
  };

  const onMissed = async () => {
    setNudge("Missed. Adjust your aim and try again.");
    go("ready");
    await springBack();
  };

  /** Launch a shot with the given pull. `windUp` first draws the ball back from rest. */
  const shoot = async (p: Point, windUp = false) => {
    if (phaseRef.current !== "ready" || !fileRef.current) return;
    go("shoot");
    setNudge("");
    setScored(false);
    drawAim(null, null);
    setMoving(true);
    const g = geom.current;
    const reduce = prefersReducedMotion();

    if (windUp && !reduce) {
      const from = { ...pos.current };
      const to = { x: g.restX + p.x, y: g.restY + p.y };
      await tween(240, (t) => {
        const e = easeInOut(t);
        paint(lerp(from.x, to.x, e), lerp(from.y, to.y, e));
      });
    }

    const start = windUp ? { x: g.restX + p.x, y: g.restY + p.y } : { ...pos.current };
    const f = launch(start, p);
    if (reduce) {
      while (f.outcome === "flying" && !f.settled) stepFlight(g, f);
    } else {
      await fly(f);
    }
    if (!mounted.current) return;
    setMoving(false);
    if (f.outcome === "scored") await onScored(f);
    else await onMissed();
  };

  /** Keyboard / button alternative: aim automatically and take a real (scoring) shot. */
  const assistedShot = () => {
    if (phaseRef.current !== "ready") return;
    const g = geom.current;
    const aimed = pull.current && isAimValid(pull.current) ? pull.current : null;
    pull.current = null;
    if (aimed) {
      void shoot(aimed);
      return;
    }
    const solved = solveShot(g, { x: g.restX, y: g.restY });
    if (!solved) {
      setNudge("No clear shot from here. Drag the ball to aim.");
      return;
    }
    void shoot(solved, true);
  };

  /* ---------- file selection ---------- */
  const loadFile = (f: File | null | undefined) => {
    if (!f) return;
    const ph = phaseRef.current;
    if (ph === "shoot" || ph === "uploading") return;
    stopAnim();
    setMoving(false);
    pull.current = null;
    drawAim(null, null);
    setFile(f);
    fileRef.current = f;
    setProgress(0);
    setNudge("");
    setScored(false);
    placeAtRest();
    if (!matchesAccept(f, accept)) {
      setError("This file type isn't accepted here. Choose a different file.");
      setErrorKind("validation");
      go("error");
      return;
    }
    if (f.size > maxSizeMB * 1024 * 1024) {
      setError(`This file is larger than ${maxSizeMB} MB. Choose a smaller file.`);
      setErrorKind("validation");
      go("error");
      return;
    }
    setError("");
    go("ready");
    if (autoShoot) later(assistedShot, 250);
  };

  const reset = () => {
    stopAnim();
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    drag.current = null;
    pull.current = null;
    drawAim(null, null);
    go("idle");
    setFile(null);
    fileRef.current = null;
    setProgress(0);
    setError("");
    setNudge("");
    setScored(false);
    setSwish(false);
    setMoving(false);
    setHeld(false);
    if (inputRef.current) inputRef.current.value = "";
    placeAtRest();
  };

  const openPicker = () => inputRef.current?.click();
  const changeFile = () => {
    reset();
    openPicker();
  };

  /* ---------- ball dragging: pull back, aim, release (pointer events: mouse, touch, pen) ---------- */
  const canGrab = phase === "idle" || phase === "ready";

  const localPoint = (e: ReactPointerEvent): Point => {
    const o = stageOrigin();
    return { x: e.clientX - o.x, y: e.clientY - o.y };
  };

  /** Turn a desired ball position into a clamped pull and paint it. */
  const aimTo = (raw: Point) => {
    const g = geom.current;
    const c = clampPull(raw);
    const at = {
      x: clamp(g.restX + c.x, HALF, g.width - HALF),
      y: clamp(g.restY + c.y, HALF, g.height - HALF),
    };
    const p = { x: at.x - g.restX, y: at.y - g.restY };
    pull.current = p;
    paint(at.x, at.y);
    drawAim(at, p);
  };

  const onBallPointerDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const ph = phaseRef.current;
    if ((ph !== "idle" && ph !== "ready") || e.button !== 0) return;
    stopAnim();
    setMoving(false);
    measure();
    const p = localPoint(e);
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = {
      pointerId: e.pointerId,
      offsetX: p.x - pos.current.x,
      offsetY: p.y - pos.current.y,
      startX: p.x,
      startY: p.y,
      moved: false,
    };
  };

  const onBallPointerMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId) return;
    const p = localPoint(e);
    if (!d.moved) {
      if (Math.hypot(p.x - d.startX, p.y - d.startY) <= DRAG_THRESHOLD) return;
      d.moved = true;
      setHeld(true);
      setNudge("");
    }
    const g = geom.current;
    aimTo({ x: p.x - d.offsetX - g.restX, y: p.y - d.offsetY - g.restY });
  };

  const endDrag = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId) return null;
    drag.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    return d;
  };

  const onBallPointerUp = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const d = endDrag(e);
    if (!d || !d.moved) return; // a plain tap: the click handler takes it

    // swallow the click that follows a drag; reset in case the browser never sends one
    suppressClick.current = true;
    later(() => (suppressClick.current = false), 0);
    setHeld(false);

    const p = pull.current;
    pull.current = null;
    drawAim(null, null);

    if (phaseRef.current === "idle") {
      setNudge("Select a file first");
      void springBack();
      return;
    }
    if (!p || !isAimValid(p)) {
      setNudge("Pull the ball down, away from the hoop, then let go.");
      void springBack();
      return;
    }
    void shoot(p);
  };

  const onBallPointerCancel = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (!endDrag(e)) return;
    setHeld(false);
    pull.current = null;
    drawAim(null, null);
    void springBack();
  };

  const onBallClick = (e: ReactMouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    const ph = phaseRef.current;
    if (ph === "idle") openPicker();
    else if (ph === "ready") {
      // keyboard activation (Enter/Space) shoots; a pointer tap explains how to aim
      if (e.detail === 0) assistedShot();
      else setNudge("Drag the ball down to aim, then let go.");
    }
  };

  /** Arrow keys aim (left/right = direction, up/down = power), Escape cancels. */
  const onBallKeyDown = (e: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (phaseRef.current !== "ready") return;
    if (e.key === "Escape" && pull.current) {
      e.preventDefault();
      pull.current = null;
      drawAim(null, null);
      void springBack();
      return;
    }
    const steps: Record<string, Point> = {
      ArrowLeft: { x: KEY_STEP, y: 0 },
      ArrowRight: { x: -KEY_STEP, y: 0 },
      ArrowUp: { x: 0, y: KEY_STEP },
      ArrowDown: { x: 0, y: -KEY_STEP },
    };
    const s = steps[e.key];
    if (!s) return;
    e.preventDefault();
    stopAnim();
    setMoving(false);
    const g = geom.current;
    const base = pull.current ?? solveShot(g, { x: g.restX, y: g.restY }) ?? { x: 0, y: 90 };
    aimTo({ x: base.x + s.x, y: Math.max(0, base.y + s.y) });
  };

  /* ---------- files dragged in from the desktop ---------- */
  const acceptsFiles = phase !== "shoot" && phase !== "uploading";

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    if (!acceptsFiles || !Array.from(e.dataTransfer.types).includes("Files")) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    if (!fileDragging) setFileDragging(true);
  };

  const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFileDragging(false);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setFileDragging(false);
    if (acceptsFiles) loadFile(e.dataTransfer.files?.[0]);
  };

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    loadFile(e.target.files?.[0]);
    e.target.value = ""; // allow re-selecting the same file later
  };

  /* ---------- render ---------- */
  const ballHidden = phase === "uploading" || phase === "done";
  const pct = Math.round(progress);

  const cls = [
    "bbu",
    `bbu--${phase}`,
    `bbu--aim-${aim}`,
    aim !== "none" && "bbu--aiming",
    fileDragging && "bbu--filedrag",
    held && "bbu--held",
    moving && "bbu--moving",
    swish && "bbu--swish",
    scored && "bbu--scored",
  ]
    .filter(Boolean)
    .join(" ");

  const ballLabel =
    phase === "ready" && file
      ? `Shoot ${file.name}. Press Enter to shoot, or use the arrow keys to aim first.`
      : "Choose a file to upload";

  const aimText =
    aim === "on"
      ? "On target. Let go to shoot."
      : aim === "miss"
        ? "Off target. Adjust your aim."
        : "Pull down, away from the hoop.";

  let status = "";
  if (phase === "ready") status = aim !== "none" ? aimText : nudge || "Pull the ball back, aim at the hoop, let go.";
  else if (phase === "shoot") status = scored ? "Nice shot! Uploading your file…" : "Shooting…";
  else if (phase === "uploading") status = pct > 0 ? `Nice shot! Uploading… ${pct}%` : "Nice shot! Uploading your file…";
  else if (phase === "done") status = "Upload complete";
  else if (phase === "error") status = error;

  return (
    <div className={cls}>
      <span className="bbu__light bbu__light--a" />
      <span className="bbu__light bbu__light--b" />

      <div
        ref={stageRef}
        className="bbu__stage"
        onClick={() => phaseRef.current === "idle" && openPicker()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <div ref={floorRef} className="bbu__floor" />

        <div className="bbu__hoop bbu__hoop--back">
          <div className="bbu__board" />
          <div className="bbu__rim-back" />
        </div>

        <svg className="bbu__aim" aria-hidden="true">
          <line ref={bandRef} className="bbu__aim-band" visibility="hidden" />
          <path ref={arcRef} className="bbu__aim-arc" d="" />
        </svg>

        <div ref={shadowRef} className="bbu__ball-shadow" style={{ visibility: ballHidden ? "hidden" : "visible" }} />

        <button
          ref={ballRef}
          type="button"
          className="bbu__ball-btn"
          aria-label={ballLabel}
          disabled={!canGrab}
          style={{ visibility: ballHidden ? "hidden" : "visible" }}
          onPointerDown={onBallPointerDown}
          onPointerMove={onBallPointerMove}
          onPointerUp={onBallPointerUp}
          onPointerCancel={onBallPointerCancel}
          onClick={onBallClick}
          onKeyDown={onBallKeyDown}
        >
          <div className="bbu__ball-y">
            <div ref={spinRef} className="bbu__spin">
              <Ball />
            </div>
          </div>
        </button>

        <div className="bbu__hoop bbu__hoop--front">
          <Net />
          <div ref={rimRef} className="bbu__rim-front" />
        </div>

        {phase === "idle" && (
          <div className="bbu__copy">
            <p className="bbu__title">{fileDragging ? "Release to load the ball" : "Drop a file on the court"}</p>
            <p className="bbu__hint" aria-live="polite">
              {nudge || (aim !== "none" ? "Select a file first" : `or click to browse, up to ${maxSizeMB} MB`)}
            </p>
          </div>
        )}

        {phase !== "idle" && file && (
          <div className="bbu__card" onClick={(e) => e.stopPropagation()}>
            <div className="bbu__file">
              <span className="bbu__name">{file.name}</span>
              <span className="bbu__size">{formatSize(file.size)}</span>
            </div>
            <div
              className={`bbu__bar${phase === "uploading" && pct === 0 ? " bbu__bar--busy" : ""}`}
              role="progressbar"
              aria-label="Upload progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={phase === "error" ? 0 : pct}
            >
              <span style={{ width: `${phase === "error" ? 0 : pct}%` }} />
            </div>
            <div className="bbu__status">
              <span role="status" aria-live="polite">
                {status}
              </span>
              <span className="bbu__actions">
                {phase === "ready" && (
                  <>
                    <button type="button" className="bbu__btn" onClick={changeFile}>
                      Change file
                    </button>
                    <button type="button" className="bbu__btn bbu__btn--primary" onClick={assistedShot}>
                      Shoot
                    </button>
                  </>
                )}
                {phase === "done" && (
                  <button type="button" className="bbu__btn" onClick={reset}>
                    Upload another
                  </button>
                )}
                {phase === "error" && errorKind === "upload" && (
                  <>
                    <button type="button" className="bbu__btn" onClick={changeFile}>
                      Change file
                    </button>
                    <button
                      type="button"
                      className="bbu__btn bbu__btn--primary"
                      onClick={() => fileRef.current && void runUpload(fileRef.current)}
                    >
                      Retry upload
                    </button>
                  </>
                )}
                {phase === "error" && errorKind === "validation" && (
                  <button type="button" className="bbu__btn bbu__btn--primary" onClick={changeFile}>
                    Choose another file
                  </button>
                )}
              </span>
            </div>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="bbu__sr"
          tabIndex={-1}
          aria-hidden="true"
          onChange={onInputChange}
        />
      </div>
    </div>
  );
}
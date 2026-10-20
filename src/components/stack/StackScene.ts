// File: src/components/stack/StackScene.ts
import {
  AmbientLight,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  DirectionalLight,
  Group,
  LineBasicMaterial,
  LineLoop,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Points,
  PointsMaterial,
  Scene,
  Shape,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from "three";
import type { Material, Object3D } from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { stackStore, stackTargets } from "../../lib/stack";
import type { StackTargets } from "../../lib/stack";

/*
 * The hero's 3D object: the four layers of a web application as glass
 * plates, each etched with a line drawing of what lives on it.
 *
 *   Interface       a UI wireframe (window, sidebar, cards)
 *   APIs/services   a graph of endpoints
 *   Data            a table
 *   Infrastructure  server rack units
 *
 * Cost control, in order of impact:
 *   • It renders on demand. The loop runs while something is moving (scroll
 *     easing, pointer easing, the intro) or while the hero is on screen (for
 *     the idle float), then stops itself. Below the hero, a still page costs
 *     nothing.
 *   • Pixel ratio is capped, lower in lite mode (phones, low core counts,
 *     Save-Data), where the idle float and the data particles are also off.
 *   • ~4k triangles in total. No textures except one 128px glow.
 *   • Everything is disposed on destroy, and the GL context is released, so
 *     React StrictMode's double mount doesn't leak a context.
 */

const VANILLA = "#eeebda";
const W = 3.4; // plate width  (x)
const D = 2.3; // plate depth  (z)
const T = 0.1; // plate thickness
const GAP_MIN = 0.17;
const GAP_MAX = 1.08;
const INTRO_SECONDS = 1.7;
const FOV = 28;

export interface StackSceneOptions {
  lite: boolean;
  reduced: boolean;
  isCompact: () => boolean;
  onContextLost: () => void;
}

interface Plate {
  group: Group;
  body: MeshStandardMaterial;
  lines: { mat: LineBasicMaterial; base: number }[];
}

/* ---------- line-drawing helpers (x/z on the plate's top face) ---------- */

class Etch {
  readonly pts: number[] = [];
  seg(x1: number, z1: number, x2: number, z2: number) {
    this.pts.push(x1, z1, x2, z2);
    return this;
  }
  rect(x: number, z: number, w: number, d: number) {
    return this.seg(x, z, x + w, z).seg(x + w, z, x + w, z + d).seg(x + w, z + d, x, z + d).seg(x, z + d, x, z);
  }
  circle(cx: number, cz: number, r: number, n = 18) {
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2;
      const a1 = ((i + 1) / n) * Math.PI * 2;
      this.seg(cx + Math.cos(a0) * r, cz + Math.sin(a0) * r, cx + Math.cos(a1) * r, cz + Math.sin(a1) * r);
    }
    return this;
  }
  /** A line between two circles, trimmed so it meets their edges. */
  link(a: [number, number, number], b: [number, number, number]) {
    const dx = b[0] - a[0];
    const dz = b[1] - a[1];
    const len = Math.hypot(dx, dz);
    const ux = dx / len;
    const uz = dz / len;
    return this.seg(a[0] + ux * a[2], a[1] + uz * a[2], b[0] - ux * b[2], b[1] - uz * b[2]);
  }
  geometry(y: number) {
    const n = this.pts.length / 2;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = this.pts[i * 2];
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = this.pts[i * 2 + 1];
    }
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(pos, 3));
    return g;
  }
}

function etchInterface() {
  const e = new Etch();
  e.rect(-1.42, -0.87, 2.84, 1.74); // window
  e.seg(-1.42, -0.6, 1.42, -0.6); // title bar
  [-1.28, -1.16, -1.04].forEach((x) => e.circle(x, -0.735, 0.035, 10));
  e.seg(-0.74, -0.6, -0.74, 0.87); // sidebar
  [-0.42, -0.26, -0.1, 0.06].forEach((z, i) => e.seg(-1.28, z, i === 0 ? -0.9 : -1.0, z));
  [-0.58, 0.07, 0.72].forEach((x) => e.rect(x, -0.44, 0.56, 0.46)); // cards
  e.rect(-0.58, 0.16, 1.86, 0.56); // content block
  [0.3, 0.44, 0.58].forEach((z, i) => e.seg(-0.44, z, [1.0, 0.6, 0.82][i], z));
  return e;
}

function etchApi() {
  const e = new Etch();
  const hub: [number, number, number] = [0.05, 0, 0.17];
  const nodes: [number, number, number][] = [
    [-1.15, -0.55, 0.1],
    [-1.15, 0.55, 0.1],
    [1.12, -0.66, 0.1],
    [1.12, 0.02, 0.1],
    [1.12, 0.7, 0.1],
  ];
  e.circle(hub[0], hub[1], hub[2], 24).circle(hub[0], hub[1], hub[2] * 0.45, 14);
  nodes.forEach((n) => e.circle(n[0], n[1], n[2]).link(n, hub));
  e.link(nodes[0], nodes[1]);
  // request/response ticks along two of the links
  e.seg(-0.62, -0.42, -0.5, -0.36).seg(0.52, 0.32, 0.64, 0.38);
  return e;
}

function etchData() {
  const e = new Etch();
  e.rect(-1.42, -0.82, 2.84, 1.64);
  e.seg(-1.42, -0.52, 1.42, -0.52); // header
  [-0.25, 0.02, 0.29, 0.56].forEach((z) => e.seg(-1.42, z, 1.42, z));
  [-0.62, 0.36].forEach((x) => e.seg(x, -0.82, x, 0.82));
  e.circle(-1.24, -0.67, 0.05, 10); // primary key
  return e;
}

function etchInfra() {
  const e = new Etch();
  [-0.78, -0.2, 0.38].forEach((z) => {
    e.rect(-1.32, z, 2.64, 0.42);
    for (let x = -1.16; x <= -0.66; x += 0.1) e.seg(x, z + 0.1, x, z + 0.32); // vents
    e.circle(0.98, z + 0.21, 0.04, 10).circle(1.12, z + 0.21, 0.04, 10); // status lights
  });
  return e;
}

function roundedOutline(y: number, r = 0.14) {
  const s = new Shape();
  const x0 = -W / 2;
  const z0 = -D / 2;
  s.moveTo(x0 + r, z0);
  s.lineTo(x0 + W - r, z0);
  s.quadraticCurveTo(x0 + W, z0, x0 + W, z0 + r);
  s.lineTo(x0 + W, z0 + D - r);
  s.quadraticCurveTo(x0 + W, z0 + D, x0 + W - r, z0 + D);
  s.lineTo(x0 + r, z0 + D);
  s.quadraticCurveTo(x0, z0 + D, x0, z0 + D - r);
  s.lineTo(x0, z0 + r);
  s.quadraticCurveTo(x0, z0, x0 + r, z0);
  const pts = s.getPoints(6);
  const pos = new Float32Array(pts.length * 3);
  pts.forEach((p, i) => {
    pos[i * 3] = p.x;
    pos[i * 3 + 1] = y;
    pos[i * 3 + 2] = p.y;
  });
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(pos, 3));
  return g;
}

function glowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d");
  if (ctx) {
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, "rgba(238,235,218,0.55)");
    g.addColorStop(0.45, "rgba(238,235,218,0.14)");
    g.addColorStop(1, "rgba(238,235,218,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
  }
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

const CORNERS: [number, number][] = [
  [-1.25, -0.8],
  [1.25, -0.8],
  [1.25, 0.8],
  [-1.25, 0.8],
];

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/* ======================================================================== */

export class StackScene {
  private renderer: WebGLRenderer;
  private scene = new Scene();
  private camera = new PerspectiveCamera(FOV, 1, 0.1, 100);
  private root = new Group();
  private plates: Plate[] = [];
  private pillars: LineSegments;
  private particles: Points | null = null;
  private particleSeeds: { corner: number; gap: number; phase: number; speed: number; up: boolean }[] = [];
  private glow: Mesh;

  private current: StackTargets;
  private target: StackTargets;
  private pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  private raf = 0;
  private last = 0;
  private time = 0;
  private intro: number;
  private width = 0;
  private height = 0;
  private dir = new Vector3(1, 0.78, 1.2).normalize();
  private tmp = new Vector3();
  private destroyed = false;
  private cleanups: (() => void)[] = [];
  private host: HTMLElement;
  private labels: HTMLElement[];
  private opts: StackSceneOptions;

  constructor(host: HTMLElement, labels: HTMLElement[], opts: StackSceneOptions) {
    this.host = host;
    this.labels = labels;
    this.opts = opts;
    this.intro = opts.reduced ? 1 : 0;

    this.renderer = new WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: opts.lite ? "low-power" : "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, opts.lite ? 1.25 : 1.75));
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = SRGBColorSpace;
    const canvas = this.renderer.domElement;
    canvas.setAttribute("aria-hidden", "true");
    host.appendChild(canvas);

    const onLost = (e: Event) => {
      e.preventDefault();
      opts.onContextLost();
    };
    canvas.addEventListener("webglcontextlost", onLost);
    this.cleanups.push(() => canvas.removeEventListener("webglcontextlost", onLost));

    /* ---------- lights ---------- */
    this.scene.add(new AmbientLight("#8d92c8", 0.7));
    const key = new DirectionalLight("#fff6dd", 2.3);
    key.position.set(4, 9, 5);
    this.scene.add(key);
    const fill = new DirectionalLight("#5b609c", 0.8);
    fill.position.set(-6, -2, -4);
    this.scene.add(fill);

    /* ---------- plates ---------- */
    const bodyGeo = new RoundedBoxGeometry(W, T, D, 3, 0.05);
    const topOutline = roundedOutline(T / 2 + 0.002);
    const bottomOutline = roundedOutline(-T / 2 - 0.002);
    const etches = [etchInterface(), etchApi(), etchData(), etchInfra()];

    etches.forEach((etch, i) => {
      const group = new Group();
      const body = new MeshStandardMaterial({
        color: "#363a64",
        emissive: "#1d1f37",
        emissiveIntensity: 0.35,
        roughness: 0.36,
        metalness: 0.18,
        transparent: true,
        opacity: 0.88,
      });
      const mesh = new Mesh(bodyGeo, body);
      // Translucent: draw far to near. The camera looks down from above, so
      // the bottom plate (i = 3) is farthest and goes first.
      const order = (3 - i) * 3;
      mesh.renderOrder = order;
      group.add(mesh);

      const mk = (opacity: number) => new LineBasicMaterial({ color: VANILLA, transparent: true, opacity });
      const lines: Plate["lines"] = [];
      const add = (obj: LineLoop | LineSegments, mat: LineBasicMaterial, base: number, order: number) => {
        obj.renderOrder = (3 - i) * 3 + order;
        group.add(obj);
        lines.push({ mat, base });
      };
      const mTop = mk(0.95);
      add(new LineLoop(topOutline, mTop), mTop, 0.95, 1);
      const mBottom = mk(0.28);
      add(new LineLoop(bottomOutline, mBottom), mBottom, 0.28, 1);
      const mEtch = mk(0.55);
      add(new LineSegments(etch.geometry(T / 2 + 0.004), mEtch), mEtch, 0.55, 2);

      this.root.add(group);
      this.plates.push({ group, body, lines });
    });

    /* ---------- pillars between plates ---------- */
    const pillarGeo = new BufferGeometry();
    pillarGeo.setAttribute("position", new BufferAttribute(new Float32Array(3 * 4 * 2 * 3), 3));
    this.pillars = new LineSegments(
      pillarGeo,
      new LineBasicMaterial({ color: VANILLA, transparent: true, opacity: 0.22 }),
    );
    this.root.add(this.pillars);

    /* ---------- requests travelling between layers ---------- */
    if (!opts.lite && !opts.reduced) {
      const n = 10;
      for (let i = 0; i < n; i++) {
        this.particleSeeds.push({
          corner: i % 4,
          gap: i % 3,
          phase: (i * 0.37) % 1,
          speed: 0.28 + ((i * 7) % 5) * 0.05,
          up: i % 2 === 0,
        });
      }
      const g = new BufferGeometry();
      g.setAttribute("position", new BufferAttribute(new Float32Array(n * 3), 3));
      this.particles = new Points(
        g,
        new PointsMaterial({ color: VANILLA, size: 3.5, sizeAttenuation: false, transparent: true, opacity: 0 }),
      );
      this.root.add(this.particles);
    }

    /* ---------- soft light pooled under the stack ---------- */
    this.glow = new Mesh(
      new PlaneGeometry(8, 6),
      new MeshBasicMaterial({ map: glowTexture(), transparent: true, depthWrite: false, opacity: 0.5 }),
    );
    this.glow.rotation.x = -Math.PI / 2;
    this.glow.renderOrder = -1;
    this.root.add(this.glow);

    this.scene.add(this.root);

    /* ---------- state ---------- */
    const layout = this.layout();
    this.target = stackTargets(stackStore.get(), layout);
    this.current = { ...this.target };

    this.cleanups.push(
      stackStore.subscribe(() => {
        this.target = stackTargets(stackStore.get(), this.layout());
        this.request();
      }),
    );

    /* ---------- input ---------- */
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    if (fine.matches && !opts.reduced) {
      const onMove = (e: PointerEvent) => {
        this.pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
        this.pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
        this.request();
      };
      window.addEventListener("pointermove", onMove, { passive: true });
      this.cleanups.push(() => window.removeEventListener("pointermove", onMove));
    }

    const onVisible = () => !document.hidden && this.request();
    document.addEventListener("visibilitychange", onVisible);
    this.cleanups.push(() => document.removeEventListener("visibilitychange", onVisible));

    const ro = new ResizeObserver(() => this.resize());
    ro.observe(host);
    this.cleanups.push(() => ro.disconnect());

    this.resize();
  }

  private layout() {
    return { compact: this.opts.isCompact(), reduced: this.opts.reduced };
  }

  private resize() {
    const w = this.host.clientWidth || window.innerWidth;
    const h = this.host.clientHeight || window.innerHeight;
    if (w === this.width && h === this.height) return;
    this.width = w;
    this.height = h;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.target = stackTargets(stackStore.get(), this.layout());
    if (this.opts.reduced) this.current = { ...this.target };
    this.request();
  }

  private request() {
    if (this.raf || this.destroyed || document.hidden) return;
    this.raf = requestAnimationFrame(this.frame);
  }

  private frame = (now: number) => {
    this.raf = 0;
    if (this.destroyed) return;

    const dt = this.last ? Math.min(0.05, (now - this.last) / 1000) : 1 / 60;
    this.last = now;
    this.time += dt;

    /* ease toward the scroll targets (a scrub of ~0.6s, like GSAP's) */
    let moving = false;
    const k = this.opts.reduced ? 1 : 1 - Math.exp(-dt * 6.5);
    const cur = this.current as unknown as Record<string, number>;
    const tgt = this.target as unknown as Record<string, number>;
    for (const key in tgt) {
      const d = tgt[key] - cur[key];
      if (Math.abs(d) > 1e-4) {
        cur[key] += d * k;
        moving = true;
      } else {
        cur[key] = tgt[key];
      }
    }

    const kp = 1 - Math.exp(-dt * 3.5);
    const p = this.pointer;
    if (Math.abs(p.tx - p.x) > 1e-4 || Math.abs(p.ty - p.y) > 1e-4) {
      p.x += (p.tx - p.x) * kp;
      p.y += (p.ty - p.y) * kp;
      moving = true;
    }

    if (this.intro < 1) {
      this.intro = Math.min(1, this.intro + dt / INTRO_SECONDS);
      moving = true;
    }

    this.apply();
    this.renderer.render(this.scene, this.camera);
    this.placeLabels();

    const idle = stackStore.get().heroVisible && !this.opts.reduced && !this.opts.lite;
    if (moving || idle) {
      this.request();
    } else {
      this.last = 0; // the next run starts with a fresh dt
    }
  };

  private apply() {
    const c = this.current;
    const gap = GAP_MIN + (GAP_MAX - GAP_MIN) * c.explode;
    const idle = stackStore.get().heroVisible && !this.opts.reduced && !this.opts.lite;

    /* camera: fixed angle, distance by zoom, framing by lens shift */
    const aspect = this.camera.aspect;
    const fit = 2.35 / (Math.tan(((FOV / 2) * Math.PI) / 180) * Math.min(aspect, 1.6));
    const dist = Math.max(15, fit) * c.zoom;
    this.camera.position.copy(this.dir).multiplyScalar(dist);
    this.camera.lookAt(0, 0, 0);
    this.camera.setViewOffset(
      this.width,
      this.height,
      -c.shiftX * this.width,
      -c.shiftY * this.height,
      this.width,
      this.height,
    );

    /* group: scroll spin + pointer parallax + idle float */
    this.root.rotation.y = c.spin + this.pointer.x * 0.16;
    this.root.rotation.x = this.pointer.y * 0.06;
    this.root.position.y = idle ? Math.sin(this.time * 0.7) * 0.05 : 0;

    /* plates: spacing, intro drop-in, a little independent float */
    const ys: number[] = [];
    this.plates.forEach((plate, i) => {
      const t = easeOutCubic(clamp01((this.intro - i * 0.11) / 0.6));
      const float = idle ? Math.sin(this.time * 1.1 + i * 1.3) * 0.018 * c.explode : 0;
      const y = (1.5 - i) * gap + (1 - t) * 2.4 + float;
      plate.group.position.y = y;
      ys.push(y);
      if (this.intro < 1 || plate.body.opacity !== 0.88) {
        plate.body.opacity = 0.88 * t;
        plate.lines.forEach((l) => (l.mat.opacity = l.base * t));
      }
    });

    /* pillars span the gaps between consecutive plates */
    const pos = this.pillars.geometry.getAttribute("position") as BufferAttribute;
    let v = 0;
    for (let g = 0; g < 3; g++) {
      const top = ys[g] - T / 2;
      const bottom = ys[g + 1] + T / 2;
      for (const [x, z] of CORNERS) {
        pos.setXYZ(v++, x, top, z);
        pos.setXYZ(v++, x, bottom, z);
      }
    }
    pos.needsUpdate = true;
    (this.pillars.material as LineBasicMaterial).opacity = 0.22 * easeOutCubic(this.intro);

    /* particles ride the pillars; only visible once the plates have parted */
    if (this.particles) {
      const pp = this.particles.geometry.getAttribute("position") as BufferAttribute;
      this.particleSeeds.forEach((s, i) => {
        const top = ys[s.gap] - T / 2;
        const bottom = ys[s.gap + 1] + T / 2;
        const f = (this.time * s.speed + s.phase) % 1;
        const [x, z] = CORNERS[s.corner];
        pp.setXYZ(i, x, s.up ? bottom + (top - bottom) * f : top - (top - bottom) * f, z);
      });
      pp.needsUpdate = true;
      (this.particles.material as PointsMaterial).opacity =
        0.9 * clamp01((c.explode - 0.35) / 0.4) * easeOutCubic(this.intro);
    }

    this.glow.position.y = ys[3] - 0.45;

    /* the stage dims while it sits behind reading text */
    const presence = c.presence.toFixed(3);
    if (this.host.style.opacity !== presence) this.host.style.opacity = presence;
  }

  private placeLabels() {
    const show = this.current.labels * easeOutCubic(this.intro);
    const compact = this.opts.isCompact();
    this.labels.forEach((el, i) => {
      if (show < 0.01 || compact) {
        if (el.style.visibility !== "hidden") el.style.visibility = "hidden";
        return;
      }
      const plate = this.plates[i]?.group;
      if (!plate) return;
      this.tmp.set(W / 2 + 0.12, 0, -D / 2 + 0.25);
      plate.localToWorld(this.tmp);
      this.tmp.project(this.camera);
      const x = ((this.tmp.x + 1) / 2) * this.width;
      const y = ((1 - this.tmp.y) / 2) * this.height;
      el.style.visibility = "visible";
      el.style.opacity = show.toFixed(3);
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(18px, -50%)`;
    });
  }

  destroy() {
    this.destroyed = true;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.cleanups.forEach((fn) => fn());
    this.cleanups = [];

    const seen = new Set<unknown>();
    this.scene.traverse((obj: Object3D) => {
      const o = obj as Object3D & { geometry?: BufferGeometry; material?: Material | Material[] };
      if (o.geometry && !seen.has(o.geometry)) {
        seen.add(o.geometry);
        o.geometry.dispose();
      }
      const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
      mats.forEach((m) => {
        if (seen.has(m)) return;
        seen.add(m);
        (m as MeshBasicMaterial).map?.dispose();
        m.dispose();
      });
    });

    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.renderer.domElement.remove();
  }
}
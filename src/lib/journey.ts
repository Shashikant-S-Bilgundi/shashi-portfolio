/**
 * The camera journey: one shared 3D scene whose pose is a pure function of
 * scroll position.
 *
 * GSAP scrubs `journey.y` toward the real scroll position (that lag is the
 * cinematic ease), and the scene reads `poseAt(journey.y)` each frame. Each
 * section owns a keyframe anchored at its measured offset; between anchors
 * the pose eases in and out. Because nothing accumulates, scrolling back,
 * resizing, refreshing or deep-linking always lands on the right pose.
 */

export interface Pose {
  /** camera position */
  cx: number;
  cy: number;
  cz: number;
  /** camera target; moving it sideways puts the structure beside the text */
  tx: number;
  ty: number;
  tz: number;
  /** layout weights for the four layer plates (they're normalised) */
  stack: number;
  grid: number;
  line: number;
  corridor: number;
  /** how far apart the stacked layers float */
  explode: number;
  /** turn of the whole structure, radians */
  spin: number;
  /** 0–1 opacity of the structure, lowered behind long reading */
  presence: number;
  /** 0–1 visibility of the lines that connect the layers */
  links: number;
  /** 0–1 visibility of the square portals around the core */
  portals: number;
}

const P = (p: Partial<Pose>): Pose => ({
  cx: 0, cy: 2, cz: 12, tx: 0, ty: 0, tz: 0,
  stack: 1, grid: 0, line: 0, corridor: 0,
  explode: 0, spin: 0, presence: 1, links: 0, portals: 0,
  ...p,
});

/**
 * Keyframes, in page order. `id` is a section id; `at` is where the pose is
 * reached, as a fraction of the viewport above (−) or below (+) that
 * section's top. `start` is the top of the page.
 */
export const KEYFRAMES: { id: string; at: number; pose: Pose }[] = [
  // wide establishing shot
  { id: "start", at: 0, pose: P({ cx: 0, cy: 4.2, cz: 21, tx: -4.6, ty: 0.6, spin: -0.55, explode: 0, portals: 1 }) },
  // dolly in close to the core as the hero clears
  { id: "about", at: -0.9, pose: P({ cx: 1.4, cy: 1.4, cz: 7.2, tx: -1.6, ty: 0.1, spin: 0.15, explode: 0.25, portals: 0.8 }) },
  // swing around it; the layers separate: interface, APIs, data, infrastructure
  { id: "about", at: 0.05, pose: P({ cx: -6.4, cy: 2.4, cz: 6.4, tx: -2.6, ty: 0.3, spin: 0.9, explode: 1, links: 0.35, portals: 0.3 }) },
  // the layers stand up as four modules
  { id: "expertise", at: 0, pose: P({ cx: 0, cy: 0.6, cz: 11.5, tx: 0, ty: 0, stack: 0, grid: 1, spin: 0, presence: 0.55 }) },
  // a corridor of product showcases the camera travels through
  { id: "projects", at: 0, pose: P({ cx: 0, cy: 0.8, cz: 9, ty: 0, tz: -4, stack: 0, corridor: 1, presence: 0.5 }) },
  { id: "skills", at: -0.6, pose: P({ cx: 0, cy: 0.6, cz: -9, ty: 0, tz: -22, stack: 0, corridor: 1, presence: 0.5 }) },
  // the modules regroup into a connected ecosystem, seen from above
  { id: "skills", at: 0.1, pose: P({ cx: 0, cy: 9, cz: 8, ty: -0.5, stack: 0, grid: 1, spin: 0.4, presence: 0.55, links: 1 }) },
  // a path: the layers line up as workflow stages
  { id: "workflow", at: 0, pose: P({ cx: 0, cy: 2.2, cz: 12.5, ty: -1.2, stack: 0, line: 1, presence: 0.6, links: 1 }) },
  // quieter, editorial
  { id: "experience", at: 0, pose: P({ cx: 5, cy: 1.2, cz: 15, tx: -3.4, ty: 0, explode: 0.4, spin: 1.6, presence: 0.35 }) },
  { id: "achievements", at: 0, pose: P({ cx: -4, cy: 3, cz: 15, tx: 2.4, explode: 0.6, spin: 2.1, presence: 0.3, links: 0.4 }) },
  // settle: assembled beside the contact section, held through the footer
  { id: "contact", at: -0.15, pose: P({ cx: 3.4, cy: 2.2, cz: 10.5, tx: -2.6, ty: -0.5, explode: 0.12, spin: 2.6 + Math.PI / 2, presence: 1, portals: 0.25 }) },
];

const KEYS = Object.keys(KEYFRAMES[0].pose) as (keyof Pose)[];

/** Shared, mutable state. Read inside the render loop; never React state. */
export const journey = {
  /** smoothed scroll position in px, scrubbed by GSAP */
  y: 0,
  anchors: [] as { y: number; pose: Pose }[],
  /** −1…1 pointer position, desktop only */
  pointer: { x: 0, y: 0 },
  /** index of the highlighted layer (About's system map), −1 for none */
  highlight: -1,
  /** compact screens keep the structure centred and dimmer */
  compact: false,
  /** set by the scene: request one more frame */
  invalidate: () => {},
};

export function setHighlight(i: number) {
  journey.highlight = i;
  journey.invalidate();
}

/** Measure anchor offsets. Call after every layout change (ScrollTrigger refresh). */
export function measureAnchors() {
  const vh = window.innerHeight;
  const max = Math.max(1, document.documentElement.scrollHeight - vh);
  const ys = KEYFRAMES.map(({ id, at }) => {
    if (id === "start") return 0;
    const el = document.getElementById(id);
    if (!el) return null;
    const top = el.getBoundingClientRect().top + window.scrollY;
    return Math.min(max, Math.max(0, top + at * vh));
  });
  const anchors: { y: number; pose: Pose }[] = [];
  let last = -1;
  KEYFRAMES.forEach((k, i) => {
    const y = ys[i];
    if (y === null || y <= last) return; // keep anchors strictly increasing
    last = y;
    anchors.push({ y, pose: adapt(k.pose, journey.compact) });
  });
  journey.anchors = anchors;
  journey.invalidate();
}

/** On narrow screens the text is full width: keep the structure centred, back and dim. */
function adapt(p: Pose, compact: boolean): Pose {
  if (!compact) return p;
  return { ...p, tx: 0, cz: p.cz * 1.25, ty: p.ty - 0.6, presence: p.presence * (p === KEYFRAMES[0].pose ? 1 : 0.55) };
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** The pose at scroll position y: eased interpolation between anchors. */
export function poseAt(y: number, anchors = journey.anchors): Pose {
  if (!anchors.length) return KEYFRAMES[0].pose;
  if (y <= anchors[0].y) return anchors[0].pose;
  for (let i = 1; i < anchors.length; i++) {
    const a = anchors[i - 1];
    const b = anchors[i];
    if (y <= b.y) {
      const t = ease((y - a.y) / (b.y - a.y || 1));
      const out = {} as Pose;
      for (const k of KEYS) out[k] = a.pose[k] + (b.pose[k] - a.pose[k]) * t;
      return out;
    }
  }
  return anchors[anchors.length - 1].pose;
}

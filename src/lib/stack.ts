// File: src/lib/stack.ts
/*
 * The 3D stack's choreography, as data.
 *
 * ScrollTrigger never tweens the scene directly. It only records how far the
 * reader is through three ranges of the page:
 *
 *   hero     0 → 1 across the pinned hero
 *   page     0 → 1 from the start of About to the top of Contact
 *   contact  0 → 1 across the Contact section
 *
 * `stackTargets()` turns those three numbers into the pose the scene should be
 * in. Because the pose is a pure function of scroll position, scrolling up
 * reverses everything exactly, and two triggers can never fight over the same
 * property. The WebGL scene eases toward the targets each frame; the CSS
 * fallback applies them directly.
 */

export interface StackState {
  hero: number;
  page: number;
  contact: number;
  /** True while the hero is on screen; the scene idles only then. */
  heroVisible: boolean;
}

type Listener = () => void;

const state: StackState = { hero: 0, page: 0, contact: 0, heroVisible: true };
const listeners = new Set<Listener>();

export const stackStore = {
  get: (): Readonly<StackState> => state,
  set(next: Partial<StackState>) {
    let changed = false;
    for (const key of Object.keys(next) as (keyof StackState)[]) {
      if (state[key] !== next[key]) {
        (state as Record<keyof StackState, unknown>)[key] = next[key];
        changed = true;
      }
    }
    if (changed) listeners.forEach((l) => l());
  },
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  /** Test helper: back to the top of the page. */
  reset() {
    Object.assign(state, { hero: 0, page: 0, contact: 0, heroVisible: true });
  },
};

/* -------------------------------------------------------------------------- */

export interface StackTargets {
  /** 0 = plates stacked tight, 1 = fully exploded. */
  explode: number;
  /** Camera distance multiplier. < 1 zooms in, > 1 zooms out. */
  zoom: number;
  /** Where the stack sits on screen, as a fraction of viewport width/height
   *  from the centre. Positive x is right, positive y is down. */
  shiftX: number;
  shiftY: number;
  /** Rotation about the vertical axis, radians. */
  spin: number;
  /** Opacity of the layer labels beside the plates. */
  labels: number;
  /** Opacity of the whole stage, so the stack can sit quietly behind text. */
  presence: number;
}

export interface StackLayout {
  /** Phones and narrow tablets: the stack sits above the copy, not beside it. */
  compact: boolean;
  reduced: boolean;
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
/** Progress of `t` through [a, b], eased (smoothstep). */
const seg = (t: number, a: number, b: number) => {
  const x = clamp01((t - a) / (b - a));
  return x * x * (3 - 2 * x);
};
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** The resting pose, used for reduced motion and as the hero's first frame. */
export function restingTargets({ compact }: StackLayout): StackTargets {
  return {
    explode: 0.42,
    zoom: compact ? 1.38 : 1,
    shiftX: compact ? 0 : 0.22,
    shiftY: compact ? -0.29 : 0,
    spin: -0.62,
    labels: 0,
    presence: 1,
  };
}

export function stackTargets(s: StackState, layout: StackLayout): StackTargets {
  const rest = restingTargets(layout);
  if (layout.reduced) return rest;

  const { compact } = layout;
  const h = s.hero;

  /* ---- hero: zoom in, take the stack apart, name the layers ---- */
  const open = seg(h, 0.04, 0.46); // explode + zoom in, drift to centre
  const label = seg(h, 0.24, 0.48) * (1 - seg(h, 0.7, 0.86)); // labels on, then off
  const recede = seg(h, 0.7, 1); // zoom back out and step aside

  let explode = mix(0.18, 1, open);
  let zoom = mix(compact ? 1.38 : 1, compact ? 0.96 : 0.8, open);
  let shiftX = mix(rest.shiftX, compact ? 0 : 0.03, open);
  let shiftY = mix(rest.shiftY, compact ? -0.02 : 0.01, open);
  let spin = mix(rest.spin, -0.34, open);
  let presence = 1;

  zoom = mix(zoom, compact ? 1.5 : 1.3, recede);
  shiftX = mix(shiftX, compact ? 0 : 0.3, recede);
  shiftY = mix(shiftY, compact ? -0.08 : 0.04, recede);
  presence = mix(presence, compact ? 0.32 : 0.5, recede);

  /* ---- reading the page: a slow turn, plates drift together, kept dim ---- */
  const p = s.page;
  spin += p * 1.05;
  explode = mix(explode, 0.62, seg(p, 0, 1));
  presence = mix(presence, compact ? 0.14 : 0.34, seg(p, 0, 0.18));

  /* ---- contact: the stack reassembles ---- */
  const c = seg(s.contact, 0, 1);
  explode = mix(explode, 0.06, c);
  zoom = mix(zoom, compact ? 1.45 : 1.08, c);
  shiftX = mix(shiftX, compact ? 0 : 0.27, c);
  // on phones it rebuilds above the heading rather than behind it
  shiftY = mix(shiftY, compact ? -0.3 : 0.04, c);
  presence = mix(presence, compact ? 0.24 : 0.72, c);

  return { explode, zoom, shiftX, shiftY, spin, labels: label, presence };
}
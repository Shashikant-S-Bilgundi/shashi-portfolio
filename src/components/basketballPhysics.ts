/*
 * Lightweight, deterministic shot physics for BasketballUpload.
 *
 * All values are court pixels, origin at the top-left of the court's padding box.
 * The same fixed-step integrator drives both the aiming preview and the real flight,
 * so the dotted preview is an honest estimate of what happens on release.
 *
 * Model: a 2.5D front view. The ball shrinks as it rises (it is travelling away from
 * the viewer, toward the hoop). On the way up it passes *in front of* the hoop; only on
 * the way down can it touch the rim or drop through it.
 */

export interface Point {
  x: number;
  y: number;
}

export interface CourtGeometry {
  width: number;
  height: number;
  /** Horizontal centre of the rim. */
  hoopX: number;
  /** Vertical position of the rim plane. */
  rimY: number;
  /** Distance from rim centre to each rim tip. */
  rimHalf: number;
  /** Top edge of the floor. */
  floorY: number;
  /** Ball centre when resting on the floor. */
  restX: number;
  restY: number;
  /** Unscaled ball radius. */
  ballRadius: number;
}

export type ShotOutcome = "flying" | "scored" | "missed";

export interface Flight {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Seconds since launch. */
  t: number;
  /** Floor bounces so far. */
  bounces: number;
  /** Accumulated spin in degrees, for rendering. */
  spin: number;
  outcome: ShotOutcome;
  /** True once the ball has come to rest or left the court. */
  settled: boolean;
}

export const SHOT = {
  gravity: 1600, // px/s²
  dt: 1 / 120, // fixed simulation step, seconds
  power: 11, // launch speed (px/s) per px of pull
  minPull: 28, // shorter pulls are treated as "not aimed yet"
  maxPull: 130,
  farScale: 0.7, // ball scale at rim height
  rimTip: 3, // collision radius of each rim tip
  rimBounce: 0.5,
  floorBounce: 0.5,
  wallBounce: 0.6,
  rollFriction: 0.8,
  settleSpeed: 140, // below this rebound speed the ball stops bouncing
  maxTime: 3.5, // safety stop for a single flight, seconds
} as const;

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** Visual scale of the ball at height y (1 on the floor, smaller toward the hoop). */
export function depthScale(g: CourtGeometry, y: number): number {
  const span = Math.max(1, g.restY - g.rimY);
  const t = clamp((g.restY - y) / span, 0, 1.25);
  return 1 - (1 - SHOT.farScale) * t;
}

export const ballRadiusAt = (g: CourtGeometry, y: number) => g.ballRadius * depthScale(g, y);

/** Half-width of the window the ball's centre must be in to drop cleanly through the rim. */
const scoringHalfWidth = (g: CourtGeometry, r: number) => g.rimHalf - SHOT.rimTip - r;

/** Limit a pull vector to the maximum slingshot length. */
export function clampPull(pull: Point): Point {
  const len = Math.hypot(pull.x, pull.y);
  if (len <= SHOT.maxPull) return pull;
  const k = SHOT.maxPull / len;
  return { x: pull.x * k, y: pull.y * k };
}

/**
 * A pull is a shot only if it is long enough and points the launch upward
 * (the ball is pulled down/away from the hoop, so it flies up/toward it).
 */
export function isAimValid(pull: Point): boolean {
  return Math.hypot(pull.x, pull.y) >= SHOT.minPull && pull.y > Math.abs(pull.x) * 0.25;
}

/** Start a flight from `from`, launched opposite to the pull vector. */
export function launch(from: Point, pull: Point): Flight {
  return {
    x: from.x,
    y: from.y,
    vx: -pull.x * SHOT.power,
    vy: -pull.y * SHOT.power,
    t: 0,
    bounces: 0,
    spin: 0,
    outcome: "flying",
    settled: false,
  };
}

function collideRim(g: CourtGeometry, f: Flight, r: number) {
  const min = r + SHOT.rimTip;
  for (const side of [-1, 1]) {
    const tx = g.hoopX + side * g.rimHalf;
    const dx = f.x - tx;
    const dy = f.y - g.rimY;
    const dist = Math.hypot(dx, dy);
    if (dist >= min || dist === 0) continue;
    const nx = dx / dist;
    const ny = dy / dist;
    // push the ball out of the rim, then reflect the inbound velocity component
    f.x = tx + nx * min;
    f.y = g.rimY + ny * min;
    const vn = f.vx * nx + f.vy * ny;
    if (vn < 0) {
      f.vx -= (1 + SHOT.rimBounce) * vn * nx;
      f.vy -= (1 + SHOT.rimBounce) * vn * ny;
    }
  }
}

/** Advance a flight by one fixed step (mutates and returns it). */
export function stepFlight(g: CourtGeometry, f: Flight): Flight {
  if (f.settled || f.outcome === "scored") return f;
  const { dt } = SHOT;
  const prevY = f.y;

  f.vy += SHOT.gravity * dt;
  f.x += f.vx * dt;
  f.y += f.vy * dt;
  f.t += dt;
  f.spin += f.vx * dt * 1.6;

  const r = ballRadiusAt(g, f.y);

  // The rim only matters on the way down: rising, the ball is in front of the hoop.
  if (f.outcome === "flying" && f.vy > 0) collideRim(g, f, r);

  // A basket = the centre crosses the rim plane downward, from above, before any floor
  // bounce, with the whole ball inside the rim. Touching or overlapping is not enough.
  if (
    f.outcome === "flying" &&
    f.bounces === 0 &&
    f.vy > 0 &&
    prevY < g.rimY &&
    f.y >= g.rimY &&
    Math.abs(f.x - g.hoopX) <= scoringHalfWidth(g, r)
  ) {
    f.outcome = "scored";
    return f;
  }

  // side walls
  if (f.x < r) {
    f.x = r;
    f.vx = Math.abs(f.vx) * SHOT.wallBounce;
  } else if (f.x > g.width - r) {
    f.x = g.width - r;
    f.vx = -Math.abs(f.vx) * SHOT.wallBounce;
  }

  // floor: only when falling onto it from above (a pulled-back ball may start below it)
  const prevBottom = prevY + ballRadiusAt(g, prevY);
  if (f.vy > 0 && f.y + r >= g.floorY && prevBottom <= g.floorY + 0.5) {
    f.y = g.floorY - r;
    f.vy = -f.vy * SHOT.floorBounce;
    f.vx *= SHOT.rollFriction;
    f.bounces += 1;
    if (f.outcome === "flying") f.outcome = "missed";
    if (Math.abs(f.vy) < SHOT.settleSpeed) {
      f.vy = 0;
      f.settled = true;
    }
  }

  if (f.y - r > g.height || f.t > SHOT.maxTime) {
    if (f.outcome === "flying") f.outcome = "missed";
    f.settled = true;
  }
  return f;
}

/** Whether the ball should be drawn behind the front rim and net (dropping into the hoop). */
export function isBehindRim(g: CourtGeometry, f: Flight): boolean {
  if (f.outcome === "scored") return true;
  if (f.outcome !== "flying" || f.vy <= 0 || f.y >= g.rimY) return false;
  const r = ballRadiusAt(g, f.y);
  return g.rimY - f.y < r * 2.5 && Math.abs(f.x - g.hoopX) <= scoringHalfWidth(g, r);
}

export interface ShotPreview {
  points: Point[];
  scored: boolean;
}

/** Simulate a shot without side effects, for the trajectory preview. */
export function previewShot(g: CourtGeometry, from: Point, pull: Point, maxTime = 2.2): ShotPreview {
  const f = launch(from, pull);
  const points: Point[] = [{ x: f.x, y: f.y }];
  let i = 0;
  while (f.outcome === "flying" && !f.settled && f.t < maxTime) {
    stepFlight(g, f);
    i += 1;
    if (i % 3 === 0 || f.outcome !== "flying") points.push({ x: f.x, y: f.y });
  }
  return { points, scored: f.outcome === "scored" };
}

/**
 * Find a pull (relative to `rest`) that scores when launched from rest + pull.
 * Used for the keyboard / assisted shot. Prefers the straightest aim and the
 * middle of the scoring power range, so small errors still go in.
 */
export function solveShot(g: CourtGeometry, rest: Point): Point | null {
  const half = g.ballRadius;
  for (let i = 0; i <= 40; i += 1) {
    const px = (i % 2 === 0 ? 1 : -1) * Math.ceil(i / 2) * 3;
    const hits: number[] = [];
    for (let py = SHOT.minPull; py <= SHOT.maxPull; py += 2) {
      const pull = { x: px, y: py };
      if (Math.hypot(px, py) > SHOT.maxPull || !isAimValid(pull)) continue;
      const from = { x: rest.x + px, y: rest.y + py };
      if (from.x < half || from.x > g.width - half || from.y > g.height - half) continue;
      if (previewShot(g, from, pull, SHOT.maxTime).scored) hits.push(py);
    }
    if (hits.length) return { x: px, y: hits[Math.floor(hits.length / 2)] };
  }
  return null;
}
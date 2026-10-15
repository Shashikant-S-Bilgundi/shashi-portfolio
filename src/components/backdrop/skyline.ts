/*
 * Procedural night skyline for the shared page backdrop.
 *
 * Seeded, so the city is identical on every load (no flicker between visits)
 * and costs no image download. Each layer becomes a handful of SVG paths:
 * one for all building silhouettes and one per window colour, rather than
 * thousands of individual elements.
 */

export const SKYLINE_VIEWBOX = { width: 1600, height: 520 } as const;

export type WindowTone = "warm" | "red" | "cool";

export interface SkylineLayer {
  buildings: string;
  windows: Record<WindowTone, string>;
}

interface LayerOptions {
  seed: number;
  minHeight: number;
  maxHeight: number;
  minWidth: number;
  maxWidth: number;
  /** Chance that any given window is lit, 0–1. */
  lit: number;
}

/** Small, fast, deterministic PRNG. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rect = (x: number, y: number, w: number, h: number) =>
  `M${x.toFixed(1)} ${y.toFixed(1)}h${w.toFixed(1)}v${h.toFixed(1)}h${(-w).toFixed(1)}z`;

export function buildSkyline(o: LayerOptions): SkylineLayer {
  const rand = mulberry32(o.seed);
  const { width: W, height: H } = SKYLINE_VIEWBOX;
  const between = (a: number, b: number) => a + (b - a) * rand();

  let buildings = "";
  const windows: Record<WindowTone, string> = { warm: "", red: "", cool: "" };

  let x = -30;
  while (x < W + 30) {
    const w = Math.round(between(o.minWidth, o.maxWidth));
    // the odd tower breaks up the roofline
    const tall = rand() < 0.12 ? 1.35 : 1;
    const h = Math.min(H, Math.round(between(o.minHeight, o.maxHeight) * tall));
    const top = H - h;
    buildings += rect(x, top, w, h);

    // roof details: a setback block, or a thin mast
    const roof = rand();
    if (roof < 0.28 && w > 44) {
      const sw = w * between(0.35, 0.6);
      const sh = between(14, 34);
      buildings += rect(x + (w - sw) / 2, top - sh, sw, sh);
    } else if (roof < 0.42) {
      const mh = between(18, 48);
      buildings += rect(x + w * between(0.3, 0.7), top - mh, 2, mh);
    }

    // window grid
    const colStep = between(7, 9.5);
    const rowStep = between(9, 12);
    for (let wy = top + 10; wy < H - 6; wy += rowStep) {
      for (let wx = x + 5; wx < x + w - 6; wx += colStep) {
        if (rand() > o.lit) continue;
        const r = rand();
        const tone: WindowTone = r < 0.68 ? "warm" : r < 0.92 ? "red" : "cool";
        windows[tone] += rect(wx, wy, 3, 4);
      }
    }

    x += w + Math.round(between(0, 6));
  }

  return { buildings, windows };
}

/** Distant layer: taller, dimmer, lit sparsely. */
export const FAR = buildSkyline({ seed: 7, minHeight: 170, maxHeight: 430, minWidth: 34, maxWidth: 92, lit: 0.05 });
/** Near layer: lower, darker silhouettes with more lit windows. */
export const NEAR = buildSkyline({ seed: 21, minHeight: 90, maxHeight: 300, minWidth: 46, maxWidth: 130, lit: 0.09 });
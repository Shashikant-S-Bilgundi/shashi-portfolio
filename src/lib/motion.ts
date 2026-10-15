import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/* ScrollTrigger is registered once for the whole app. Calling it again is a
   no-op in GSAP, but keeping it here means every consumer is guaranteed a
   registered plugin without import-order surprises. */
gsap.registerPlugin(ScrollTrigger);

export { gsap, ScrollTrigger };

export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

/**
 * Breakpoints shared by every matchMedia block so the hero and the sections
 * agree on what "mobile" means.
 */
export const MQ = {
  motion: "(prefers-reduced-motion: no-preference)",
  reduced: REDUCED_MOTION_QUERY,
  desktop: "(min-width: 861px)",
  mobile: "(max-width: 860px)",
} as const;

/**
 * Fades + lifts direct children of the returned ref into view as they enter
 * the viewport.
 *
 * Everything runs through `gsap.context`, so React 19's StrictMode double-mount
 * reverts cleanly instead of stacking duplicate ScrollTriggers.
 *
 * Under reduced motion the elements are simply set to their final state — no
 * triggers are created at all.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(
  selector = "[data-reveal]",
  options: { y?: number; stagger?: number; start?: string } = {},
) {
  const ref = useRef<T>(null);
  const { y = 26, stagger = 0.08, start = "top 86%" } = options;

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;

    const ctx = gsap.context(() => {
      const targets = gsap.utils.toArray<HTMLElement>(selector, root);
      if (!targets.length) return;

      if (prefersReducedMotion()) {
        gsap.set(targets, { opacity: 1, y: 0 });
        return;
      }

      gsap.set(targets, { opacity: 0, y });
      ScrollTrigger.batch(targets, {
        start,
        once: true,
        batchMax: 4,
        onEnter: (batch) =>
          gsap.to(batch, {
            opacity: 1,
            y: 0,
            duration: 0.72,
            ease: "power3.out",
            stagger,
            overwrite: true,
          }),
      });
    }, root);

    return () => ctx.revert();
  }, [selector, y, stagger, start]);

  return ref;
}
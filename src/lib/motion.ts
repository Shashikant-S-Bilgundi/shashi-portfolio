// File: src/lib/motion.ts
import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/* Registered once for the whole app. */
gsap.registerPlugin(ScrollTrigger);
/* Mobile URL bars resize the viewport as you scroll. Re-measuring every
   trigger for that makes the pinned hero jump, so ignore those resizes. */
ScrollTrigger.config({ ignoreMobileResize: true });

export { gsap, ScrollTrigger };

export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

/** Shared breakpoints, so the hero, the sections and the 3D stage agree. */
export const MQ = {
  motion: "(prefers-reduced-motion: no-preference)",
  reduced: REDUCED_MOTION_QUERY,
  desktop: "(min-width: 861px)",
  mobile: "(max-width: 860px)",
  hover: "(hover: hover) and (pointer: fine)",
} as const;

export function isCompact(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia(MQ.mobile).matches;
}

/**
 * Fades and lifts `[data-reveal]` elements in as they enter the viewport, and
 * back out if you scroll above them again, so the page reverses naturally.
 *
 * Opacity only, never `visibility`: hidden text would be skipped by screen
 * readers that don't scroll. Under reduced motion nothing is hidden at all.
 */
export function useReveal<T extends HTMLElement = HTMLElement>(selector = "[data-reveal]") {
  const ref = useRef<T>(null);

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;

    const ctx = gsap.context(() => {
      const targets = gsap.utils.toArray<HTMLElement>(selector, root);
      if (!targets.length || prefersReducedMotion()) return;

      gsap.set(targets, { opacity: 0, y: 22 });
      ScrollTrigger.batch(targets, {
        start: "top 90%",
        onEnter: (batch) =>
          gsap.to(batch, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", stagger: 0.08, overwrite: true }),
        onLeaveBack: (batch) =>
          gsap.to(batch, { opacity: 0, y: 22, duration: 0.4, ease: "power2.in", overwrite: true }),
      });
    }, root);

    return () => ctx.revert();
  }, [selector]);

  return ref;
}
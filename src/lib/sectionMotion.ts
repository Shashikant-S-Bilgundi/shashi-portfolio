import { useLayoutEffect } from "react";
import type { RefObject } from "react";
import { MQ, gsap } from "./motion";

/*
 * Scroll-scrubbed effects for the sections below the hero.
 *
 * Every effect is tied to scroll position (scrub), so scrolling back up plays
 * it in reverse. Under reduced motion nothing is built at all: the stylesheet
 * defines each effect's END state as the default (fully lit, fully drawn,
 * nothing clipped), so the page simply shows that.
 *
 * Rule that keeps these from fighting `useReveal`: its tween uses
 * `overwrite: true`, which kills ANY tween on the elements it reveals. So the
 * effects here never target a `[data-reveal]` element. They either animate
 * children of revealed elements, or own elements that no longer carry
 * `data-reveal` (headings marked `data-unmask`, project cards, roles).
 */

type Build = (root: HTMLElement, opts: { mobile: boolean }) => void;

const scrub = 0.6;

/**
 * Runs a section's effect inside gsap.matchMedia, scoped to the section, so it
 * rebuilds across the mobile breakpoint and tears down completely on unmount
 * (StrictMode's double mount included).
 */
export function useSectionMotion(ref: RefObject<HTMLElement | null>, build: Build) {
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;

    const mm = gsap.matchMedia(root);
    mm.add({ motion: MQ.motion, mobile: MQ.mobile }, (ctx) => {
      const { motion, mobile } = ctx.conditions as { motion: boolean; mobile: boolean };
      if (!motion) return;
      unmaskHeadings(root);
      build(root, { mobile });
    });

    return () => mm.revert();
  }, [ref, build]);
}

/* Shared motif: section titles wipe up from behind a mask as they enter. */
function unmaskHeadings(root: HTMLElement) {
  gsap.utils.toArray<HTMLElement>("[data-unmask]", root).forEach((el) => {
    gsap.fromTo(
      el,
      { clipPath: "inset(-12% -4% 100% -4%)", y: 30 },
      {
        clipPath: "inset(-12% -4% -12% -4%)",
        y: 0,
        ease: "power1.out",
        scrollTrigger: { trigger: el, start: "top 92%", end: "top 62%", scrub },
      },
    );
  });
}

/* Who's behind the mask: the story resolves word by word as you read down it,
   then the three stat cells light their crimson edge one after another. */
export const aboutMotion: Build = (root) => {
  const story = root.querySelector<HTMLElement>(".sx-about__story");
  const words = gsap.utils.toArray<HTMLElement>(".sx-about__story .w", root);
  if (story && words.length) {
    gsap.fromTo(
      words,
      { opacity: 0.16 },
      {
        opacity: 1,
        ease: "none",
        stagger: 0.05,
        // lines resolve as they reach the lower quarter of the screen, so
        // everything you can comfortably read is already lit
        scrollTrigger: { trigger: story, start: "top 85%", end: "bottom 78%", scrub },
      },
    );
  }

  const stats = root.querySelector<HTMLElement>(".sx-about__stats");
  const cells = gsap.utils.toArray<HTMLElement>(".sx-about__stats li", root);
  if (stats && cells.length) {
    gsap.fromTo(
      cells,
      { "--lit": 0 },
      {
        "--lit": 1,
        ease: "none",
        stagger: 0.35,
        scrollTrigger: { trigger: stats, start: "top 88%", end: "top 58%", scrub },
      },
    );
  }
};

/* The arsenal: every item "arms" in reading order, card by card, as the grid
   scrolls through: its marker extends and turns crimson, the label brightens. */
export const skillsMotion: Build = (root) => {
  const grid = root.querySelector<HTMLElement>(".sx-skills");
  const items = gsap.utils.toArray<HTMLElement>(".sx-skill__items li", root);
  if (!grid || !items.length) return;

  gsap.fromTo(
    items,
    { "--armed": 0 },
    {
      "--armed": 1,
      ease: "none",
      stagger: 0.12,
      scrollTrigger: { trigger: grid, start: "top 82%", end: "bottom 78%", scrub },
    },
  );
};

/* Case files: each project card lands like a file dropped on a desk, settling
   from a slight alternating tilt. */
export const workMotion: Build = (root, { mobile }) => {
  gsap.utils.toArray<HTMLElement>(".pj-card", root).forEach((card, i) => {
    const tilt = (i % 2 ? 1 : -1) * (mobile ? 1.5 : 3);
    gsap.fromTo(
      card,
      { y: mobile ? 48 : 72, rotate: tilt, opacity: 0.12 },
      {
        y: 0,
        rotate: 0,
        opacity: 1,
        ease: "power2.out",
        scrollTrigger: { trigger: card, start: "top 98%", end: "top 68%", scrub },
      },
    );
  });
};

/* Track record: the rail draws down with your scroll; each role rises in and
   its marker ignites as it arrives. */
export const experienceMotion: Build = (root) => {
  const timeline = root.querySelector<HTMLElement>(".sx-timeline");
  if (!timeline) return;

  gsap.fromTo(
    timeline,
    { "--rail": 0 },
    {
      "--rail": 1,
      ease: "none",
      scrollTrigger: { trigger: timeline, start: "top 78%", end: "bottom 62%", scrub },
    },
  );

  gsap.utils.toArray<HTMLElement>(".sx-role", timeline).forEach((role) => {
    gsap.fromTo(
      role,
      { y: 36, opacity: 0.15, "--lit": 0 },
      {
        y: 0,
        opacity: 1,
        "--lit": 1,
        ease: "power2.out",
        scrollTrigger: { trigger: role, start: "top 88%", end: "top 58%", scrub },
      },
    );
  });
};
// File: src/lib/sectionMotion.ts
import { useLayoutEffect } from "react";
import type { RefObject } from "react";
import { MQ, gsap } from "./motion";

/*
 * The scroll-driven motion language for every section below the hero.
 *
 * One vocabulary, used everywhere:
 *   • depth     panels arrive from behind the page: scaled down and tipped
 *               back, settling flat as they reach reading position
 *   • unmask    section titles wipe up from behind a mask
 *   • stagger   lists and chips light up in reading order
 *   • recede    each section zooms out slightly as it leaves the top
 *
 * Everything is scrubbed to scroll position, so scrolling up plays it in
 * reverse. Under reduced motion nothing is built: the stylesheet's default
 * state is each effect's end state (fully lit, flat, unclipped).
 *
 * Two rules keep this compatible with the glass panels:
 *   1. Never animate opacity, filter or clip-path on an ANCESTOR of a
 *      `.glass` element. Those make the ancestor a "backdrop root", and the
 *      panel would stop blurring the 3D scene behind the page. Transforms are
 *      safe. A panel's own opacity is safe.
 *   2. Never target a `[data-reveal]` element here (useReveal owns those).
 */

type Build = (root: HTMLElement, opts: { mobile: boolean }) => void;

const scrub = 0.6;

export function useSectionMotion(ref: RefObject<HTMLElement | null>, build?: Build) {
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;

    const mm = gsap.matchMedia(root);
    mm.add({ motion: MQ.motion, mobile: MQ.mobile }, (ctx) => {
      const { motion, mobile } = ctx.conditions as { motion: boolean; mobile: boolean };
      if (!motion) return;
      shared(root, mobile);
      build?.(root, { mobile });
    });

    return () => mm.revert();
  }, [ref, build]);
}

function shared(root: HTMLElement, mobile: boolean) {
  gsap.utils.toArray<HTMLElement>("[data-unmask]", root).forEach((el) => {
    gsap.fromTo(
      el,
      { clipPath: "inset(-12% -4% 100% -4%)", y: 40 },
      {
        clipPath: "inset(-12% -4% -12% -4%)",
        y: 0,
        ease: "power1.out",
        scrollTrigger: { trigger: el, start: "top 94%", end: "top 64%", scrub },
      },
    );
  });

  gsap.utils.toArray<HTMLElement>("[data-depth]", root).forEach((el) => {
    gsap.fromTo(
      el,
      {
        scale: mobile ? 0.95 : 0.9,
        rotateX: mobile ? 6 : 12,
        y: mobile ? 40 : 80,
        transformPerspective: 1200,
        transformOrigin: "50% 0%",
      },
      {
        scale: 1,
        rotateX: 0,
        y: 0,
        ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 98%", end: "top 55%", scrub },
      },
    );
  });

  gsap.utils.toArray<HTMLElement>("[data-stagger]", root).forEach((list) => {
    const items = Array.from(list.children) as HTMLElement[];
    if (!items.length) return;
    gsap.fromTo(
      items,
      { opacity: 0.15, y: 14 },
      {
        opacity: 1,
        y: 0,
        stagger: 0.06,
        ease: "none",
        scrollTrigger: { trigger: list, start: "top 94%", end: "top 66%", scrub },
      },
    );
  });

  const frame = root.querySelector<HTMLElement>(":scope > .section__frame");
  if (frame && root.dataset.recede !== "off") {
    gsap.fromTo(
      frame,
      { scale: 1, transformOrigin: "50% 100%" },
      {
        scale: mobile ? 0.975 : 0.95,
        ease: "none",
        immediateRender: false,
        scrollTrigger: { trigger: root, start: "bottom 35%", end: "bottom top", scrub },
      },
    );
  }
}

/* About: the statement resolves word by word as you read it; the focus list
   follows in reading order. */
export const aboutMotion: Build = (root) => {
  const statement = root.querySelector<HTMLElement>(".ab-statement");
  const words = gsap.utils.toArray<HTMLElement>(".ab-statement .w", root);
  if (statement && words.length) {
    gsap.fromTo(
      words,
      { opacity: 0.16 },
      {
        opacity: 1,
        ease: "none",
        stagger: 0.05,
        scrollTrigger: { trigger: statement, start: "top 82%", end: "bottom 52%", scrub },
      },
    );
  }

  gsap.utils.toArray<HTMLElement>(".ab-body p", root).forEach((p) => {
    gsap.fromTo(
      p,
      { opacity: 0.2, y: 28 },
      { opacity: 1, y: 0, ease: "power1.out", scrollTrigger: { trigger: p, start: "top 94%", end: "top 70%", scrub } },
    );
  });

  const focus = gsap.utils.toArray<HTMLElement>(".ab-focus li", root);
  if (focus.length) {
    gsap.fromTo(
      focus,
      { opacity: 0, x: -26 },
      {
        opacity: 1,
        x: 0,
        stagger: 0.1,
        ease: "power1.out",
        scrollTrigger: { trigger: focus[0], start: "top 94%", end: "top 54%", scrub },
      },
    );
  }
};

/* Experience: the rail draws down with your scroll and each responsibility
   lights as it passes. */
export const experienceMotion: Build = (root) => {
  const timeline = root.querySelector<HTMLElement>(".xp-timeline");
  if (timeline) {
    gsap.fromTo(
      timeline,
      { "--rail": 0 },
      {
        "--rail": 1,
        ease: "none",
        scrollTrigger: { trigger: timeline, start: "top 72%", end: "bottom 60%", scrub },
      },
    );
  }

  const list = root.querySelector<HTMLElement>(".xp-points");
  const points = gsap.utils.toArray<HTMLElement>(".xp-point", root);
  if (list && points.length) {
    gsap.fromTo(
      points,
      { "--lit": 0, opacity: 0.4 },
      {
        "--lit": 1,
        opacity: 1,
        ease: "none",
        stagger: 0.3,
        scrollTrigger: { trigger: list, start: "top 82%", end: "bottom 62%", scrub },
      },
    );
  }

  const products = gsap.utils.toArray<HTMLElement>(".xp-products li", root);
  if (products.length) {
    gsap.fromTo(
      products,
      { opacity: 0, x: 34 },
      {
        opacity: 1,
        x: 0,
        stagger: 0.12,
        ease: "power1.out",
        scrollTrigger: { trigger: products[0], start: "top 96%", end: "top 70%", scrub },
      },
    );
  }
};

/* Skills: each layer band tips up from the page and slides in from
   alternating sides, the way the plates separate in the hero. */
export const skillsMotion: Build = (root, { mobile }) => {
  gsap.utils.toArray<HTMLElement>(".sk-band", root).forEach((band, i) => {
    const side = i % 2 ? 1 : -1;
    gsap.fromTo(
      band,
      {
        rotateX: mobile ? 14 : 30,
        y: mobile ? 40 : 70,
        x: side * (mobile ? 12 : 48),
        opacity: 0.2,
        transformPerspective: 1200,
        transformOrigin: "50% 100%",
      },
      {
        rotateX: 0,
        y: 0,
        x: 0,
        opacity: 1,
        ease: "power2.out",
        scrollTrigger: { trigger: band, start: "top 100%", end: "top 66%", scrub },
      },
    );

    const chips = band.querySelectorAll<HTMLElement>(".chip");
    if (chips.length) {
      gsap.fromTo(
        chips,
        { opacity: 0.2, y: 10 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.04,
          ease: "none",
          scrollTrigger: { trigger: band, start: "top 92%", end: "top 58%", scrub },
        },
      );
    }

    const glyph = band.querySelector<HTMLElement>(".fp");
    if (glyph) {
      gsap.fromTo(
        glyph,
        { "--gap": "2px" },
        { "--gap": "8px", ease: "none", scrollTrigger: { trigger: band, start: "top 90%", end: "top 55%", scrub } },
      );
    }
  });
};

/* Projects: cards rise out of the page, column by column. The transform goes
   on the cell's body (the cell itself holds the anchor id and never moves)
   and the fade on the glass card itself (rule 1 above). */
export const projectsMotion: Build = (root, { mobile }) => {
  gsap.utils.toArray<HTMLElement>(".pj-cell", root).forEach((cell) => {
    const column = () => (cell.offsetWidth ? Math.round(cell.offsetLeft / (cell.offsetWidth + 20)) : 0);
    const body = cell.querySelector<HTMLElement>(".pj-cell__body");
    const card = cell.querySelector<HTMLElement>(".glass");
    if (!body) return;
    const trigger = {
      trigger: cell,
      start: () => `top ${100 - column() * 6}%`,
      end: () => `top ${70 - column() * 6}%`,
      scrub,
      invalidateOnRefresh: true,
    };

    gsap.fromTo(
      body,
      { y: mobile ? 50 : 90, rotateX: mobile ? 8 : 16, scale: 0.94, transformPerspective: 1200, transformOrigin: "50% 0%" },
      { y: 0, rotateX: 0, scale: 1, ease: "power2.out", scrollTrigger: trigger },
    );
    if (card) {
      gsap.fromTo(card, { opacity: 0.15 }, { opacity: 1, ease: "none", scrollTrigger: { ...trigger } });
    }
  });
};

/* Contact: the ways to reach you slide in one after another. */
export const contactMotion: Build = (root) => {
  const links = gsap.utils.toArray<HTMLElement>(".ct-links li", root);
  if (!links.length) return;
  gsap.fromTo(
    links,
    { opacity: 0, x: 30 },
    {
      opacity: 1,
      x: 0,
      stagger: 0.1,
      ease: "power1.out",
      scrollTrigger: { trigger: links[0], start: "top 96%", end: "top 68%", scrub },
    },
  );
};
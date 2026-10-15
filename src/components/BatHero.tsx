import { useLayoutEffect, useRef } from "react";
import { MQ, gsap } from "../lib/motion";
import { profile } from "../content/portfolio";
import frontSrc from "../assets/batman/batman-front.webp";
import bustSrc from "../assets/batman/batman-bust.webp";
import turnSrc from "../assets/batman/batman-turn.webp";
import "./BatHero.css";

/**
 * Scroll-driven hero.
 *
 * The whole section is pinned for ~3.2 viewport heights and every layer is
 * driven by one scrubbed timeline, so scrolling back up reverses it exactly.
 *
 * On the "rotation": there is no 3D model here. The turn is a 2D illusion —
 * three stills (wide front → tight bust → turned away in the rain) cross-faded
 * underneath a shared CSS `perspective` + `rotateY` on their common parent.
 * It reads as a turn; it is not a real 360°. The character layers are kept in
 * one transform parent precisely so a Three.js <Canvas> could later replace the
 * <img> stack without the timeline changing.
 *
 * Performance notes:
 *  • No React state is touched during scroll — every frame is GSAP writing to
 *    refs, so the component never re-renders while the user scrolls.
 *  • Images carry intrinsic width/height so late decoding cannot shift layout.
 *  • Offsets that depend on viewport size are function-based and recomputed on
 *    `invalidateOnRefresh`, so resizing re-derives them instead of drifting.
 */
export default function BatHero() {
  const rootRef = useRef<HTMLElement>(null);
  const atmosRef = useRef<HTMLDivElement>(null);
  const rimRef = useRef<HTMLDivElement>(null);
  const blackoutRef = useRef<HTMLDivElement>(null);
  const wordRef = useRef<HTMLDivElement>(null);
  const charRef = useRef<HTMLDivElement>(null);
  const frontRef = useRef<HTMLImageElement>(null);
  const bustRef = useRef<HTMLImageElement>(null);
  const turnRef = useRef<HTMLImageElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const revealRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const char = charRef.current;
    const word = wordRef.current;
    const reveal = revealRef.current;
    if (!root || !char || !word || !reveal) return;

    const revealItems = gsap.utils.toArray<HTMLElement>("[data-reveal-item]", reveal);

    // `matchMedia` owns every tween it creates, so one revert() on unmount
    // tears down the timeline, the pin and the inline styles together.
    const mm = gsap.matchMedia();

    mm.add(
      {
        isDesktop: `${MQ.desktop} and ${MQ.motion}`,
        isMobile: `${MQ.mobile} and ${MQ.motion}`,
        isReduced: MQ.reduced,
      },
      (context) => {
        const { isDesktop, isReduced } = context.conditions as Record<string, boolean>;

        gsap.set(char, { xPercent: -50, transformOrigin: "50% 62%" });
        gsap.set(word, { xPercent: -50, yPercent: -50 });

        /* ---------- reduced motion: compose the end state, no pin ---------- */
        if (isReduced) {
          gsap.set(introRef.current, { autoAlpha: 0 });
          gsap.set(revealItems, { autoAlpha: 1, y: 0 });
          gsap.set(cueRef.current, { autoAlpha: 0 });
          gsap.set(frontRef.current, { autoAlpha: 1 });
          gsap.set([bustRef.current, turnRef.current], { autoAlpha: 0 });
          gsap.set(char, {
            xPercent: -50,
            x: isDesktop ? () => window.innerWidth * 0.17 : 0,
            scale: isDesktop ? 0.92 : 0.66,
            y: isDesktop ? 0 : () => -window.innerHeight * 0.14,
          });
          gsap.set(atmosRef.current, { opacity: 0.35 });
          gsap.set(blackoutRef.current, { opacity: 0.55 });
          gsap.set(word, { opacity: 0.1, scale: 1.2 });
          return;
        }

        /* ---------- responsive end-state targets ---------- */
        const asideX = isDesktop ? () => window.innerWidth * 0.19 : () => 0;
        const asideY = isDesktop ? () => 0 : () => -window.innerHeight * 0.15;
        const asideScale = isDesktop ? 0.94 : 0.58;
        const pushScale = isDesktop ? 1.46 : 1.3;

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: root,
            start: "top top",
            end: "+=320%",
            pin: true,
            pinSpacing: true,
            scrub: 0.6,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        /* 0–1 · the cue leaves as soon as the user commits to scrolling */
        tl.to(cueRef.current, { autoAlpha: 0, y: 16, duration: 0.9 }, 0);

        /* 0–5 · wordmark drifts on its own, slower curve (parallax) */
        tl.to(word, { yPercent: -76, scale: 1.17, opacity: 0.46, duration: 5 }, 0);

        /* 0.4–4.4 · atmosphere swells, rim light sweeps across the figure */
        tl.to(atmosRef.current, { opacity: 1, scale: 1.16, duration: 4 }, 0.4);
        tl.fromTo(
          rimRef.current,
          { opacity: 0, xPercent: -26 },
          { opacity: 0.85, xPercent: 16, duration: 4.2 },
          1.1,
        );

        /* 0.4–3.4 · push in on the wide front view */
        tl.to(char, { scale: 1.22, yPercent: -3, rotateY: -7, duration: 3 }, 0.4);

        /* 2.6–4.2 · cross-fade to the tight bust, keep pushing in */
        tl.to(frontRef.current, { autoAlpha: 0, duration: 1.6 }, 2.6);
        tl.to(bustRef.current, { autoAlpha: 1, duration: 1.6 }, 2.6);
        tl.to(char, { scale: pushScale, rotateY: -15, duration: 2.2 }, 2.9);

        /* 2.8–4.8 · the introduction clears out */
        tl.to(introRef.current, { autoAlpha: 0, y: -34, duration: 2 }, 2.8);

        /* 4.6–6.6 · the turn — cross-fade to the back view as rotateY deepens */
        tl.to(bustRef.current, { autoAlpha: 0, duration: 1.9 }, 4.6);
        tl.to(turnRef.current, { autoAlpha: 1, duration: 1.9 }, 4.6);
        tl.to(char, { rotateY: -27, scale: pushScale * 0.9, duration: 2.1 }, 4.8);

        /* 5.8–9.2 · crimson drains to black */
        tl.to(atmosRef.current, { opacity: 0, scale: 1.42, duration: 3.4 }, 5.8);
        tl.to(rimRef.current, { opacity: 0, duration: 2.2 }, 5.9);
        tl.to(blackoutRef.current, { opacity: 1, duration: 3.4 }, 5.8);

        /* 6.4–9.4 · the character steps aside and settles */
        tl.to(
          char,
          { x: asideX, y: asideY, scale: asideScale, rotateY: -16, duration: 3 },
          6.4,
        );
        tl.to(word, { yPercent: -98, scale: 1.46, opacity: 0.045, duration: 3.6 }, 5.9);

        /* 7–10 · the real headline arrives */
        tl.fromTo(
          revealItems,
          { autoAlpha: 0, y: 46 },
          { autoAlpha: 1, y: 0, duration: 2.1, stagger: 0.4 },
          7,
        );
      },
    );

    return () => mm.revert();
  }, []);

  return (
    <section ref={rootRef} className="bat-hero" aria-label="Introduction">
      {/* ---------- atmosphere ---------- */}
      <div ref={atmosRef} className="bat-hero__atmos" aria-hidden="true" />
      <div ref={rimRef} className="bat-hero__rim" aria-hidden="true" />
      <div className="bat-hero__pool" aria-hidden="true" />

      {/* ---------- oversized wordmark, behind the figure ---------- */}
      <div ref={wordRef} className="bat-hero__word" aria-hidden="true">
        BATMAN
      </div>

      {/* ---------- character stack (one transform parent, three views) ---------- */}
      <div className="bat-hero__stage" aria-hidden="true">
        <div ref={charRef} className="bat-hero__char">
          <img
            ref={frontRef}
            className="bat-hero__view bat-hero__view--front"
            src={frontSrc}
            width={1150}
            height={928}
            alt=""
            decoding="async"
            fetchPriority="high"
          />
          <img
            ref={bustRef}
            className="bat-hero__view bat-hero__view--bust"
            src={bustSrc}
            width={1050}
            height={828}
            alt=""
            decoding="async"
            fetchPriority="low"
          />
          <img
            ref={turnRef}
            className="bat-hero__view bat-hero__view--turn"
            src={turnSrc}
            width={996}
            height={1000}
            alt=""
            decoding="async"
            fetchPriority="low"
          />
        </div>
      </div>

      {/* ---------- grade ---------- */}
      <div ref={blackoutRef} className="bat-hero__blackout" aria-hidden="true" />
      <div className="bat-hero__grain" aria-hidden="true" />
      <div className="bat-hero__vignette" aria-hidden="true" />

      {/* ---------- copy ---------- */}
      <div className="bat-hero__copy sx-shell">
        <div ref={introRef} className="bat-hero__intro">
          <p className="bat-hero__name">{profile.name}</p>
          <p className="bat-hero__role">{profile.role}</p>
        </div>

        <div ref={revealRef} className="bat-hero__reveal">
          <h1 className="bat-hero__headline" data-reveal-item>
            {profile.headline}
          </h1>
          <p className="bat-hero__desc" data-reveal-item>
            {profile.description}
          </p>
          <div className="bat-hero__actions" data-reveal-item>
            <a className="bat-btn bat-btn--solid" href={profile.ctaPrimary.href}>
              {profile.ctaPrimary.label}
            </a>
            <a className="bat-btn bat-btn--ghost" href={profile.ctaSecondary.href}>
              {profile.ctaSecondary.label}
            </a>
          </div>
        </div>
      </div>

      <div ref={cueRef} className="bat-hero__cue" aria-hidden="true">
        <span>Scroll</span>
        <i />
      </div>
    </section>
  );
}
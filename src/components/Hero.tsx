// File: src/components/Hero.tsx
import { useLayoutEffect, useRef } from "react";
import type { Transition } from "motion/react";
import { MQ, gsap } from "../lib/motion";
import { stackStore } from "../lib/stack";
import { profile } from "../content/portfolio";
import { SplittingText } from "../vendor/animate-ui/primitives/texts/splitting";
import { TypingText, TypingTextCursor } from "../vendor/animate-ui/primitives/texts/typing";
import { ShimmeringText } from "../vendor/animate-ui/primitives/texts/shimmering";
import { Button } from "./ui/Button";
import "./Hero.css";

/* Each letter of the name flips up into place (Animate UI SplittingText). */
const CHAR_FROM = { opacity: 0, y: 46, rotateX: -80 };
const CHAR_TO = { opacity: 1, y: 0, rotateX: 0 };
const CHAR_TRANSITION: Transition = { duration: 0.95, ease: [0.23, 1, 0.32, 1] };

/**
 * The hero is pinned for 1.5 viewports (1.1 on phones). Over that distance
 * the copy zooms out and clears, while the 3D stack behind it zooms in,
 * separates into its four layers and names them, then steps back so the page
 * can begin. The stack's half of that is not animated here: this component
 * only reports its scroll progress to the stack store (see lib/stack.ts).
 *
 * Under reduced motion there is no pin and no entrance; the copy is simply
 * there and the stack rests in its default pose.
 */
export default function Hero() {
  const rootRef = useRef<HTMLElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const copy = copyRef.current;
    const cue = cueRef.current;
    if (!root || !copy || !cue) return;

    const items = gsap.utils.toArray<HTMLElement>("[data-hero-item]", copy);
    const mm = gsap.matchMedia();

    mm.add(
      {
        isDesktop: `${MQ.desktop} and ${MQ.motion}`,
        isMobile: `${MQ.mobile} and ${MQ.motion}`,
        isReduced: MQ.reduced,
      },
      (context) => {
        const { isDesktop, isReduced } = context.conditions as Record<string, boolean>;

        if (isReduced) {
          stackStore.set({ hero: 0, heroVisible: true });
          return;
        }

        /* entrance: the name flips in letter by letter, then the rest follows */
        gsap.from(items, { opacity: 0, y: 26, duration: 0.9, ease: "power3.out", stagger: 0.1, delay: 0.55 });
        gsap.from(cue, { opacity: 0, duration: 0.8, delay: 1.6 });

        /* scroll */
        const report = (self: { progress: number }) =>
          stackStore.set({ hero: self.progress, heroVisible: self.progress < 0.999 });

        gsap
          .timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: root,
              start: "top top",
              end: isDesktop ? "+=150%" : "+=110%",
              pin: true,
              scrub: 0.6,
              anticipatePin: 1,
              invalidateOnRefresh: true,
              onUpdate: report,
              onRefresh: report,
            },
          })
          // fromTo: a plain .to() would record the cue's opacity while its
          // entrance still has it at 0, and replay that 0 on every refresh
          .fromTo(cue, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.08, immediateRender: false }, 0)
          // zoom out and clear; autoAlpha so hidden buttons can't be clicked
          .to(copy, { scale: 0.88, yPercent: -8, autoAlpha: 0, duration: 0.4 }, 0.04)
          // hold the rest of the pin for the stack's exploded view
          .to({}, { duration: 0.56 }, 0.44);
      },
    );

    return () => mm.revert();
  }, []);

  return (
    <section ref={rootRef} id="home" className="hero" aria-labelledby="hero-name">
      <div className="hero__frame shell">
        <div ref={copyRef} className="hero__copy">
          <h1 id="hero-name" className="hero__name">
            <SplittingText
              className="hero__name-line"
              text={profile.firstName}
              type="chars"
              initial={CHAR_FROM}
              animate={CHAR_TO}
              transition={CHAR_TRANSITION}
              stagger={0.035}
              delay={150}
            />{" "}
            <SplittingText
              className="hero__name-line"
              text={profile.lastName}
              type="chars"
              initial={CHAR_FROM}
              animate={CHAR_TO}
              transition={CHAR_TRANSITION}
              stagger={0.035}
              delay={420}
            />
          </h1>

          <p className="hero__title" data-hero-item>
            {profile.title}
          </p>

          <p className="hero__typed" data-hero-item>
            I build{" "}
            <TypingText
              className="hero__typed-text"
              text={[...profile.builds]}
              loop
              duration={55}
              holdDelay={1900}
              delay={1400}
            >
              <TypingTextCursor
                className="hero__cursor"
                style={{ height: "0.95em", width: "2px", transform: "translateY(0.14em)", marginLeft: "3px" }}
              />
            </TypingText>
          </p>

          <p className="hero__lede" data-hero-item>
            {profile.intro}
          </p>

          <div className="hero__actions" data-hero-item>
            <Button href={profile.ctaPrimary.href} variant="primary">
              {profile.ctaPrimary.label}
            </Button>
            <Button href={profile.ctaSecondary.href} variant="ghost">
              {profile.ctaSecondary.label}
            </Button>
          </div>
        </div>
      </div>

      <div ref={cueRef} className="hero__cue" aria-hidden="true">
        <ShimmeringText
          text="Scroll to explore"
          duration={1.6}
          color="rgba(238, 235, 218, 0.55)"
          shimmeringColor="#eeebda"
        />
        <span className="hero__cue-line" />
      </div>
    </section>
  );
}
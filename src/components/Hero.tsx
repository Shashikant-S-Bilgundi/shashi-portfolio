import { useLayoutEffect, useRef } from "react";
import { motion } from "motion/react";
import { ArrowDown, ArrowRight } from "lucide-react";
import { MQ, gsap } from "../lib/motion";
import { profile } from "../content/portfolio";
import { RevealText } from "./ui/RevealText";
import "./Hero.css";

const rise = (delay: number) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] as const },
});

/**
 * The hero is taller than the viewport and its frame is sticky, so the
 * camera's dolly toward the structure plays out under the visitor's own
 * scroll: no pin, no hijacking. The copy lifts and fades as the camera
 * closes in. On phones the hero is one screen tall.
 */
export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const copy = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const mm = gsap.matchMedia();
    mm.add(MQ.motion, () => {
      gsap.fromTo(
        copy.current,
        { y: 0, opacity: 1, scale: 1 },
        {
          y: -90,
          opacity: 0,
          scale: 0.96,
          ease: "power1.in",
          scrollTrigger: { trigger: ref.current, start: "top top", end: "65% top", scrub: 0.8 },
        },
      );
    });
    return () => mm.revert();
  }, []);

  return (
    <section ref={ref} id="home" className="hero" aria-labelledby="hero-title">
      <div className="hero__sticky">
        <div ref={copy} className="hero__copy shell">
          <motion.p className="hero__eyebrow mono" {...rise(0.1)}>
            {profile.name} <span aria-hidden="true">/</span> {profile.eyebrow}
          </motion.p>

          <h1 id="hero-title" className="hero__title">
            <RevealText text={profile.headline} inView={false} delay={0.25} stagger={0.06} />
          </h1>

          <motion.p className="hero__tagline" {...rise(0.85)}>
            {profile.tagline}
          </motion.p>

          <motion.div className="hero__actions" {...rise(1)}>
            <a className="btn btn--solid" href={profile.ctaPrimary.href}>
              {profile.ctaPrimary.label}
              <ArrowRight aria-hidden="true" />
            </a>
            <a className="btn btn--line" href={profile.ctaSecondary.href}>
              {profile.ctaSecondary.label}
            </a>
          </motion.div>

          <motion.ul className="hero__meta mono" aria-label="Focus areas" {...rise(1.15)}>
            {profile.meta.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </motion.ul>
        </div>

        <motion.a className="hero__cue mono" href="#about" {...rise(1.6)}>
          Scroll to enter
          <ArrowDown aria-hidden="true" />
        </motion.a>
      </div>
    </section>
  );
}

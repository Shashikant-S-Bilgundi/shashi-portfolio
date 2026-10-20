// File: src/App.tsx
import { useEffect, useLayoutEffect } from "react";
import { MotionConfig } from "motion/react";
import { MQ, ScrollTrigger, gsap } from "./lib/motion";
import { stackStore } from "./lib/stack";
import StackStage from "./components/stack/StackStage";
import SiteNav from "./components/SiteNav";
import Hero from "./components/Hero";
import About from "./components/sections/About";
import Experience from "./components/sections/Experience";
import Skills from "./components/sections/Skills";
import Projects from "./components/projects/Projects";
import Contact from "./components/sections/Contact";
import SiteFooter from "./components/sections/SiteFooter";

export default function App() {
  /* Page-wide ranges for the 3D stack. This effect runs after every child's,
     so the hero's pin already exists; refreshPriority -1 keeps these (and the
     nav's) measured after the pin on every later refresh as well. */
  useLayoutEffect(() => {
    const mm = gsap.matchMedia();
    mm.add(MQ.motion, () => {
      const page = (s: { progress: number }) => stackStore.set({ page: s.progress });
      const contact = (s: { progress: number }) => stackStore.set({ contact: s.progress });
      ScrollTrigger.create({
        trigger: "#about",
        start: "top bottom",
        endTrigger: "#contact",
        end: "top center",
        refreshPriority: -1,
        onUpdate: page,
        onRefresh: page,
      });
      ScrollTrigger.create({
        trigger: "#contact",
        start: "top center",
        end: "bottom bottom",
        refreshPriority: -1,
        onUpdate: contact,
        onRefresh: contact,
      });
    });
    ScrollTrigger.sort();

    return () => {
      mm.revert();
      stackStore.reset();
    };
  }, []);

  /* The display face changes text widths once it loads, which moves every
     trigger a little: re-measure then. If the page was opened on a #section
     link, the browser jumped there before the hero's pin added its scroll
     distance, so jump again to the right place. */
  useEffect(() => {
    let cancelled = false;
    const hash = window.location.hash;

    const settle = () => {
      if (cancelled) return;
      ScrollTrigger.sort();
      ScrollTrigger.refresh();
      if (hash.length > 1) {
        document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView({ behavior: "instant" });
      }
    };

    if (document.fonts?.ready) document.fonts.ready.then(settle).catch(settle);
    else window.addEventListener("load", settle, { once: true });

    return () => {
      cancelled = true;
      window.removeEventListener("load", settle);
    };
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <StackStage />

      <a className="skip-link" href="#about">
        Skip to content
      </a>

      <SiteNav />

      <main id="main">
        <Hero />
        <About />
        <Experience />
        <Skills />
        <Projects />
        <Contact />
      </main>

      <SiteFooter />
    </MotionConfig>
  );
}
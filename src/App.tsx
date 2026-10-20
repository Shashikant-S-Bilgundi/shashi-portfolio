import { useEffect } from "react";
import { MotionConfig } from "motion/react";
import { ScrollTrigger } from "./lib/motion";
import SceneStage from "./components/scene/SceneStage";
import SiteNav from "./components/SiteNav";
import Hero from "./components/Hero";
import About from "./components/sections/About";
import Expertise from "./components/sections/Expertise";
import Projects from "./components/projects/Projects";
import Skills from "./components/sections/Skills";
import Workflow from "./components/sections/Workflow";
import Experience from "./components/sections/Experience";
import Achievements from "./components/sections/Achievements";
import Resume from "./components/sections/Resume";
import Contact from "./components/sections/Contact";
import SiteFooter from "./components/sections/SiteFooter";

export default function App() {
  /* Fonts change text widths, which moves every trigger and camera anchor:
     re-measure once they land. A #section deep link was resolved before
     that, so jump again to the right place. */
  useEffect(() => {
    let cancelled = false;
    const hash = window.location.hash;
    const settle = () => {
      if (cancelled) return;
      ScrollTrigger.refresh();
      if (hash.length > 1) {
        document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView({ behavior: "instant" });
      }
    };
    document.fonts?.ready.then(settle).catch(settle);
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <SceneStage />

      <a className="skip-link" href="#about">
        Skip to content
      </a>

      <SiteNav />

      <main id="main">
        <Hero />
        <About />
        <Expertise />
        <Projects />
        <Skills />
        <Workflow />
        <Experience />
        <Achievements />
        <Resume />
        <Contact />
      </main>

      <SiteFooter />
    </MotionConfig>
  );
}

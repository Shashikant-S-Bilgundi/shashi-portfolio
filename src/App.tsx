import { useEffect } from "react";
import { ScrollTrigger } from "./lib/motion";
import SiteNav from "./components/SiteNav";
import BatHero from "./components/BatHero";
import Projects from "./components/Projects";
import { About, Contact, Experience, SiteFooter, Skills } from "./components/Sections";
import "./App.css";

export default function App() {
  /* The display face is heavier than its fallback, so section heights shift a
     little once it swaps in. Re-measuring after the fonts settle keeps every
     pinned/triggered position honest. */
  useEffect(() => {
    let cancelled = false;

    const refresh = () => !cancelled && ScrollTrigger.refresh();

    if (document.fonts?.ready) {
      document.fonts.ready.then(refresh).catch(refresh);
    } else {
      window.addEventListener("load", refresh, { once: true });
    }

    return () => {
      cancelled = true;
      window.removeEventListener("load", refresh);
    };
  }, []);

  return (
    <>
      <a className="sx-skip" href="#about">
        Skip to content
      </a>

      <SiteNav />

      <main id="top">
        <BatHero />
        <About />
        <Skills />
        <Projects />
        <Experience />
        <Contact />
      </main>

      <SiteFooter />
    </>
  );
}
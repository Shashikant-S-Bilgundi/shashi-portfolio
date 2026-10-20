import { useLayoutEffect, useRef } from "react";
import { MQ, gsap, useReveal } from "../../lib/motion";
import { workflow } from "../../content/portfolio";
import { SectionHead } from "../ui/SectionHead";
import "./Workflow.css";

/**
 * Five stages joined by a path that draws itself as you scroll (horizontal
 * on desktop, vertical on phones). The path is decoration: every step is
 * plain, visible content without it.
 */
export default function Workflow() {
  const ref = useReveal<HTMLElement>();
  const path = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const mm = gsap.matchMedia();
    mm.add(MQ.motion, () => {
      gsap.fromTo(
        path.current,
        { "--draw": 0 },
        {
          "--draw": 1,
          ease: "none",
          scrollTrigger: { trigger: ".wf-steps", start: "top 75%", end: "bottom 55%", scrub: 0.6 },
        },
      );
    });
    return () => mm.revert();
  }, []);

  return (
    <section ref={ref} id="workflow" className="section wf" aria-labelledby="workflow-title">
      <div className="shell">
        <SectionHead num="05" label="Workflow" id="workflow-title" title="From requirements to running software" />

        <div className="wf-track">
          <span ref={path} className="wf-path" aria-hidden="true" />
          <ol className="wf-steps">
            {workflow.map((s, i) => (
              <li key={s.title} className="wf-step" data-reveal>
                <span className="wf-dot mono" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

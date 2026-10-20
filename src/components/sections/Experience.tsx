import { useLayoutEffect, useRef } from "react";
import { ArrowUpRight, MapPin } from "lucide-react";
import { MQ, gsap, useReveal } from "../../lib/motion";
import { experience, projects } from "../../content/portfolio";
import { SectionHead } from "../ui/SectionHead";
import "./Experience.css";

export default function Experience() {
  const ref = useReveal<HTMLElement>();
  const fill = useRef<HTMLSpanElement>(null);

  // the timeline's indicator fills as you read down it
  useLayoutEffect(() => {
    const mm = gsap.matchMedia();
    mm.add(MQ.motion, () => {
      gsap.fromTo(
        fill.current,
        { scaleY: 0 },
        { scaleY: 1, ease: "none", scrollTrigger: { trigger: ".xp-list", start: "top 70%", end: "bottom 60%", scrub: 0.6 } },
      );
    });
    return () => mm.revert();
  }, []);

  return (
    <section ref={ref} id="experience" className="section xp" aria-labelledby="experience-title">
      <div className="shell">
        <SectionHead num="06" label="Experience" id="experience-title" title="Where I've shipped" />

        <div className="xp-timeline">
          <span className="xp-line" aria-hidden="true">
            <span ref={fill} />
          </span>
          <ol className="xp-list">
            {experience.map((role) => {
              const built = role.projects
                .map((slug) => projects.find((p) => p.slug === slug))
                .filter((p) => p !== undefined);
              return (
                <li key={role.company} className="xp-role">
                  <span className="xp-node" aria-hidden="true" />
                  <div className="xp-meta" data-reveal>
                    <h3 className="xp-company">{role.company}</h3>
                    <p className="xp-title">{role.title}</p>
                    {role.period && <p className="xp-period mono">{role.period}</p>}
                    <p className="xp-loc">
                      <MapPin aria-hidden="true" strokeWidth={1.6} />
                      {role.location}
                    </p>
                  </div>

                  <div className="xp-detail glass" data-reveal>
                    <ul className="xp-points">
                      {role.points.map((pt) => (
                        <li key={pt}>{pt}</li>
                      ))}
                    </ul>
                    <h4 className="mono">Stack in production</h4>
                    <ul className="chip-list">
                      {role.stack.map((t) => (
                        <li key={t} className="chip">
                          {t}
                        </li>
                      ))}
                    </ul>
                    {built.length > 0 && (
                      <>
                        <h4 className="mono">Products built here</h4>
                        <ul className="xp-products">
                          {built.map((p) => (
                            <li key={p.slug}>
                              <a href={`#project-${p.slug}`}>
                                {p.name}
                                <ArrowUpRight aria-hidden="true" strokeWidth={1.6} />
                              </a>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}

// File: src/components/sections/Experience.tsx
import { useRef } from "react";
import { ArrowUpRight, MapPin } from "lucide-react";
import { experienceMotion, useSectionMotion } from "../../lib/sectionMotion";
import { experience, projects } from "../../content/portfolio";
import "./Experience.css";

const bySlug = new Map(projects.map((p) => [p.slug, p]));

export default function Experience() {
  const ref = useRef<HTMLElement>(null);
  useSectionMotion(ref, experienceMotion);

  return (
    <section ref={ref} id="experience" className="section xp" aria-labelledby="experience-title">
      <div className="section__frame shell">
        <header className="section__head">
          <h2 id="experience-title" className="h2" data-unmask>
            Experience
          </h2>
        </header>

        <ol className="xp-timeline">
          {experience.map((role) => (
            <li key={`${role.company}-${role.title}`} className="xp-role">
              <span className="xp-node" aria-hidden="true" />
              <article className="xp-card glass" data-depth>
                <header className="xp-card__head">
                  <div>
                    <h3 className="xp-title">{role.title}</h3>
                    <p className="xp-company">{role.company}</p>
                  </div>
                  <p className="xp-meta">
                    {role.period && <span className="xp-period">{role.period}</span>}
                    <span className="xp-location">
                      <MapPin aria-hidden="true" strokeWidth={1.6} />
                      {role.location}
                    </span>
                  </p>
                </header>

                <ul className="xp-points">
                  {role.points.map((point, i) => (
                    <li key={i} className="xp-point">
                      {point}
                    </li>
                  ))}
                </ul>

                <div className="xp-blocks">
                  <div className="xp-block">
                    <h4>Technologies</h4>
                    <ul className="chip-list" data-stagger>
                      {role.stack.map((t) => (
                        <li key={t} className="chip">
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {role.projects.length > 0 && (
                    <div className="xp-block">
                      <h4>Products I built here</h4>
                      <ul className="xp-products">
                        {role.projects.map((slug) => {
                          const p = bySlug.get(slug);
                          if (!p) return null;
                          return (
                            <li key={slug}>
                              <a href={`#project-${slug}`}>
                                <span>
                                  <strong>{p.name}</strong>
                                  <small>{p.tagline}</small>
                                </span>
                                <ArrowUpRight aria-hidden="true" strokeWidth={1.6} className="xp-products__arrow" />
                              </a>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              </article>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
// File: src/components/sections/Skills.tsx
import { skillsMotion, useSectionMotion } from "../../lib/sectionMotion";
import { useReveal } from "../../lib/motion";
import { skills } from "../../content/portfolio";
import { LayerFootprint } from "../ui/LayerFootprint";
import "./Skills.css";

/**
 * Grouped by layer of the stack rather than by arbitrary category, and
 * without proficiency bars: each band is a plate from the hero, laid flat.
 */
export default function Skills() {
  const ref = useReveal<HTMLElement>();
  useSectionMotion(ref, skillsMotion);
  const firstSupport = skills.findIndex((g) => !g.layer);

  return (
    <section ref={ref} id="skills" className="section sk" aria-labelledby="skills-title">
      <div className="section__frame shell">
        <header className="section__head">
          <h2 id="skills-title" className="h2" data-unmask>
            Skills
          </h2>
          <p className="lede" data-reveal>
            Grouped by the layer of the stack they belong to, from what people see down to where it runs.
          </p>
        </header>

        <ul className="sk-bands">
          {skills.map((group, i) => (
            <li
              key={group.title}
              className={[
                "sk-band glass",
                group.layer ? "" : "sk-band--support",
                i === firstSupport ? "sk-band--break" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <div className="sk-band__label">
                {group.layer ? (
                  <LayerFootprint active={[group.layer]} size="sm" />
                ) : (
                  <span className="sk-band__spacer" aria-hidden="true" />
                )}
                <div>
                  <h3>{group.title}</h3>
                  <p>{group.description}</p>
                </div>
              </div>
              <ul className="chip-list sk-band__items" aria-label={`${group.title} skills`}>
                {group.items.map((item) => (
                  <li key={item} className="chip">
                    {item}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
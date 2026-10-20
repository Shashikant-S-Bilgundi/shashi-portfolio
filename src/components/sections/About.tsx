// File: src/components/sections/About.tsx
import { useRef } from "react";
import { Database, Layers, MonitorSmartphone, Server, Workflow } from "lucide-react";
import { aboutMotion, useSectionMotion } from "../../lib/sectionMotion";
import { about } from "../../content/portfolio";
import "./About.css";

const ICONS = {
  server: Server,
  workflow: Workflow,
  database: Database,
  monitor: MonitorSmartphone,
  layers: Layers,
} as const;

export default function About() {
  const ref = useRef<HTMLElement>(null);
  useSectionMotion(ref, aboutMotion);

  return (
    <section ref={ref} id="about" className="section ab" aria-labelledby="about-title">
      <div className="section__frame shell">
        <header className="section__head">
          <h2 id="about-title" className="h2" data-unmask>
            {about.heading}
          </h2>
        </header>

        <div className="ab-grid">
          <div className="ab-story">
            {/* word spans let the scroll effect resolve the statement as you read it */}
            <p className="ab-statement">
              {about.statement.split(" ").map((word, i) => (
                <span key={i} className="w">
                  {word}{" "}
                </span>
              ))}
            </p>
            <div className="ab-body">
              {about.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>

          <aside className="ab-panel glass" data-depth aria-labelledby="focus-title">
            <h3 id="focus-title" className="ab-panel__title">
              {about.focusHeading}
            </h3>
            <ul className="ab-focus">
              {about.focus.map((f) => {
                const Icon = ICONS[f.icon];
                return (
                  <li key={f.label}>
                    <Icon aria-hidden="true" strokeWidth={1.5} />
                    <span>{f.label}</span>
                  </li>
                );
              })}
            </ul>
            <p className="ab-approach">{about.approach}</p>
            <dl className="ab-facts">
              {about.facts.map((f) => (
                <div key={f.label}>
                  <dt>{f.label}</dt>
                  <dd>{f.value}</dd>
                </div>
              ))}
            </dl>
          </aside>
        </div>
      </div>
    </section>
  );
}
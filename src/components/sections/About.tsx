import { useReveal } from "../../lib/motion";
import { setHighlight } from "../../lib/journey";
import { about, layers, profile } from "../../content/portfolio";
import { SectionHead } from "../ui/SectionHead";
import "./About.css";

/**
 * As this section arrives the camera swings around the structure and its
 * plates separate into the four layers listed here. Hovering a layer lights
 * the matching plate in the scene (decorative: the list itself says it all).
 * The right half of the screen is left open for that view.
 */
export default function About() {
  const ref = useReveal<HTMLElement>();

  return (
    <section ref={ref} id="about" className="section ab" aria-labelledby="about-title">
      <div className="shell ab-grid">
        <div className="ab-main">
          <SectionHead num="01" label="About" id="about-title" title={about.heading} />

          <div className="ab-intro">
            <figure className="ab-photo" data-reveal>
              <img src={profile.photo.src} alt={profile.photo.alt} width={646} height={692} loading="lazy" decoding="async" />
            </figure>
            <p className="ab-statement" data-reveal>
              {about.statement}
            </p>
          </div>
          <div className="ab-body">
            {about.paragraphs.map((p, i) => (
              <p key={i} data-reveal>
                {p}
              </p>
            ))}
          </div>

          <figure className="ab-map glass" data-reveal>
            <figcaption className="mono">How I see a system, top to bottom</figcaption>
            <ol>
              {layers.map((l, i) => (
                <li
                  key={l.id}
                  onPointerEnter={() => setHighlight(i)}
                  onPointerLeave={() => setHighlight(-1)}
                >
                  <span className="mono">L{layers.length - i}</span>
                  <strong>{l.name}</strong>
                  <span className="ab-map__ex">{l.examples}</span>
                </li>
              ))}
            </ol>
          </figure>

          <blockquote className="ab-approach" data-reveal>
            <p>{about.approach}</p>
          </blockquote>

          <dl className="ab-facts" data-reveal>
            {about.facts.map((f) => (
              <div key={f.label}>
                <dt className="mono">{f.label}</dt>
                <dd>{f.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

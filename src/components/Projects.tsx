import { useReveal } from "../lib/motion";
import { useSectionMotion, workMotion } from "../lib/sectionMotion";
import { featuredDemo, projects } from "../content/portfolio";
import BasketballUpload from "./BasketballUpload";
import "./Projects.css";

/**
 * The BasketballUpload widget is the one piece of the original project, and it
 * is embedded here untouched — same component, same CSS file, same physics
 * module. It is re-skinned purely by overriding the `--bbu-*` custom properties
 * it already exposes (see Projects.css), so none of its working code changed.
 *
 * No `onUpload` handler is passed, so it falls back to the component's own
 * built-in simulated progress — nothing leaves the browser.
 */
export default function Projects() {
  const ref = useReveal<HTMLElement>();
  useSectionMotion(ref, workMotion);

  return (
    <section ref={ref} id="work" className="sx-section">
      <div className="sx-shell">
        <header className="sx-head">
          <p className="sx-eyebrow" data-reveal>
            Case files
          </p>
          <h2 className="sx-h2" data-unmask>
            Selected work
          </h2>
        </header>

        {/* ---------- live demo ---------- */}
        <div className="pj-demo glass glass--strong" data-reveal>
          <div className="pj-demo__copy">
            <p className="pj-demo__eyebrow">{featuredDemo.eyebrow}</p>
            <h3 className="pj-demo__title">{featuredDemo.name}</h3>
            <p className="pj-demo__blurb">{featuredDemo.blurb}</p>
            <p className="pj-demo__note">{featuredDemo.note}</p>
            <ul className="pj-stack">
              {featuredDemo.stack.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>

          <div className="pj-demo__frame">
            <BasketballUpload accept="image/*,.pdf" maxSizeMB={10} />
            <p className="pj-demo__disclaimer">
              Demo only — progress is simulated and no file leaves your browser.
            </p>
          </div>
        </div>

        {/* ---------- project grid ---------- */}
        <ul className="pj-grid">
          {projects.map((p) => (
            <li key={p.name} className="pj-card glass">
              <div className="pj-card__top">
                <h3 className="pj-card__name">{p.name}</h3>
                <p className="pj-card__tagline">{p.tagline}</p>
              </div>

              <p className="pj-card__blurb">{p.blurb}</p>

              <ul className="pj-stack">
                {p.stack.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>

              {(p.href || p.repo) && (
                <div className="pj-card__links">
                  {p.href && (
                    <a href={p.href} target="_blank" rel="noreferrer noopener">
                      Visit site
                      <span aria-hidden="true">↗</span>
                    </a>
                  )}
                  {p.repo && (
                    <a href={p.repo} target="_blank" rel="noreferrer noopener">
                      Source
                      <span aria-hidden="true">↗</span>
                    </a>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
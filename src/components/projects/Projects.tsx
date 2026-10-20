// File: src/components/projects/Projects.tsx
import type { CSSProperties } from "react";
import { featuredDemo, layers, projects, techLayer } from "../../content/portfolio";
import type { Project } from "../../content/portfolio";
import { projectsMotion, useSectionMotion } from "../../lib/sectionMotion";
import { useReveal } from "../../lib/motion";
import { Tilt, TiltContent } from "../../vendor/animate-ui/primitives/effects/tilt";
import BasketballUpload from "../BasketballUpload";
import { ProjectActions } from "./ProjectActions";
import { ProjectCard } from "./ProjectCard";
import "./Projects.css";

export default function Projects() {
  const ref = useReveal<HTMLElement>();
  useSectionMotion(ref, projectsMotion);

  const featured = projects.find((p) => p.featured);
  const rest = projects.filter((p) => p !== featured);
  const n = rest.length;
  // the demo fills whatever is left of the last row in the 3-column layout
  const demoSpan = 3 - (n % 3) || 3;

  return (
    <section
      ref={ref}
      id="projects"
      className="section pj"
      aria-labelledby="projects-title"
      // no zoom-out on exit: the basketball demo measures its court while you play
      data-recede="off"
    >
      <div className="section__frame shell">
        <header className="section__head">
          <h2 id="projects-title" className="h2" data-unmask>
            Projects
          </h2>
          <p className="lede" data-reveal>
            Systems I've designed and built. Each card shows which layers of the stack a project spans, worked out
            from its own tech list.
          </p>
        </header>

        {featured && <FeaturedProject project={featured} />}

        <ul
          className="pj-grid"
          data-odd={n % 2 === 1 ? "" : undefined}
          style={{ "--demo-span": demoSpan } as CSSProperties}
        >
          {rest.map((p, i) => (
            // The anchor id sits on the cell, which is never transformed. The
            // body inside it moves during the entrance, and an anchor on a
            // moving element makes the browser scroll to the wrong place.
            <li key={p.slug} id={`project-${p.slug}`} className={`pj-cell${i === n - 1 ? " pj-cell--tail" : ""}`}>
              <div className="pj-cell__body">
                <ProjectCard project={p} />
              </div>
            </li>
          ))}
          <li className="pj-cell pj-cell--demo">
            <div className="pj-cell__body">
              <DemoCard />
            </div>
          </li>
        </ul>
      </div>
    </section>
  );
}

function FeaturedProject({ project }: { project: Project }) {
  return (
    <div id={`project-${project.slug}`} className="pj-anchor">
      <article
        className="pj-featured glass glass--strong"
        data-depth
        aria-labelledby={`project-${project.slug}-title`}
      >
        <div className="pj-featured__copy">
          {project.liveUrl && <p className="pj-live">Live in production</p>}
          <h3 id={`project-${project.slug}-title`} className="pj-featured__name">
            {project.name}
          </h3>
          <p className="pj-tagline">{project.tagline}</p>
          <p className="pj-summary">{project.summary}</p>
          <ul className="pj-highlights" aria-label="Key features">
            {project.highlights.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
          <ul className="chip-list pj-featured__chips" aria-label="Technologies">
            {project.stack.map((t) => (
              <li key={t} className="chip">
                {t}
              </li>
            ))}
          </ul>
          <ProjectActions project={project} />
        </div>

        <Tilt className="pj-arch-tilt" maxTilt={7} perspective={900}>
          <TiltContent>
            <ArchDiagram project={project} />
          </TiltContent>
        </Tilt>
      </article>
    </div>
  );
}

/** The project's own stack, sorted onto the four layers. */
function ArchDiagram({ project }: { project: Project }) {
  const rows = layers.map((l) => ({ ...l, tech: project.stack.filter((t) => techLayer[t]?.includes(l.id)) }));
  const extra = project.stack.filter((t) => !techLayer[t]);

  return (
    <figure className="arch">
      <ol className="arch__rows" aria-label={`How ${project.name} is layered`}>
        {rows.map((r) => (
          <li key={r.id} className={`arch__row${r.tech.length ? " is-on" : ""}`}>
            <span className="arch__plate" aria-hidden="true" />
            <span className="arch__label">
              <strong>{r.name}</strong>
              <span>{r.tech.length ? r.tech.join(", ") : "Not used"}</span>
            </span>
          </li>
        ))}
      </ol>
      {extra.length > 0 && <figcaption className="arch__extra">Integrations: {extra.join(", ")}</figcaption>}
    </figure>
  );
}

/**
 * The original BasketballUpload widget, untouched. It is re-themed only
 * through the `--bbu-*` custom properties it already exposes (Projects.css).
 * No `onUpload` handler is passed, so it uses its built-in simulated
 * progress: nothing leaves the browser.
 */
function DemoCard() {
  return (
    <article className="pj-demo glass glass--strong" aria-labelledby="demo-title">
      <div className="pj-demo__copy">
        <h3 id="demo-title" className="pj-card__name">
          {featuredDemo.name}
        </h3>
        <p className="pj-tagline">Interactive component, playable here</p>
        <p className="pj-summary">{featuredDemo.blurb}</p>
        <p className="pj-demo__note">{featuredDemo.note}</p>
        <ul className="chip-list" aria-label="Technologies">
          {featuredDemo.stack.map((t) => (
            <li key={t} className="chip">
              {t}
            </li>
          ))}
        </ul>
      </div>
      <div className="pj-demo__frame">
        <BasketballUpload accept="image/*,.pdf" maxSizeMB={10} />
        <p className="pj-demo__disclaimer">Demo only: progress is simulated and no file leaves your browser.</p>
      </div>
    </article>
  );
}
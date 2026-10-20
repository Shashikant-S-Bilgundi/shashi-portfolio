// File: src/components/projects/ProjectCard.tsx
import { useRef } from "react";
import type { MouseEvent } from "react";
import { layers, layersFor } from "../../content/portfolio";
import type { Project } from "../../content/portfolio";
import { Tilt, TiltContent } from "../../vendor/animate-ui/primitives/effects/tilt";
import { LayerFootprint } from "../ui/LayerFootprint";
import { ProjectActions } from "./ProjectActions";

const shortName = new Map(layers.map((l) => [l.id, l.short]));

/**
 * Animate UI's Tilt gives the card its depth on hover. The card itself is not
 * a link, so the action links inside it are the only click targets: nothing
 * on the card can swallow or redirect their clicks. Tilt listens to mouse
 * events only, so touch scrolling is untouched.
 */
export function ProjectCard({ project }: { project: Project }) {
  const cardRef = useRef<HTMLElement>(null);
  const touched = layersFor(project.stack);

  // a soft light follows the pointer; written to CSS variables, no re-render
  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${(e.clientX - r.left).toFixed(0)}px`);
    el.style.setProperty("--my", `${(e.clientY - r.top).toFixed(0)}px`);
  };

  return (
    // `flat`: a preserve-3d ancestor stops backdrop-filter working in Chromium
    <Tilt className="pj-tilt" maxTilt={5} perspective={1000} style={{ transformStyle: "flat" }} onMouseMove={onMove}>
      <TiltContent className="pj-tilt__content">
        <article
          ref={cardRef}
          className="pj-card glass"
          aria-labelledby={`project-${project.slug}-title`}
        >
          <div className="pj-card__top">
            <LayerFootprint active={touched} />
            <p className="pj-card__layers">
              <span className="sr-only">Stack layers: </span>
              {touched.map((id) => shortName.get(id)).join(", ")}
            </p>
          </div>

          <h3 id={`project-${project.slug}-title`} className="pj-card__name">
            {project.name}
          </h3>
          <p className="pj-tagline">{project.tagline}</p>
          <p className="pj-summary">{project.summary}</p>

          <ul className="pj-highlights" aria-label="Key features">
            {project.highlights.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>

          <div className="pj-card__foot">
            <ul className="chip-list" aria-label="Technologies">
              {project.stack.map((t) => (
                <li key={t} className="chip">
                  {t}
                </li>
              ))}
            </ul>
            <ProjectActions project={project} />
          </div>
        </article>
      </TiltContent>
    </Tilt>
  );
}
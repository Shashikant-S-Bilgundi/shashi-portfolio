import { useLayoutEffect } from "react";
import { ArrowUpRight, Check } from "lucide-react";
import { featuredDemo, layers, layersFor, projects } from "../../content/portfolio";
import type { CaseStudy, Project } from "../../content/portfolio";
import { MQ, gsap, useReveal } from "../../lib/motion";
import { SectionHead } from "../ui/SectionHead";
import BasketballUpload from "../BasketballUpload";
import "./Projects.css";

const EXTERNAL = { target: "_blank", rel: "noreferrer noopener" } as const;

/**
 * Case studies first: as each one scrolls through, its interface mockup
 * approaches from depth, settles at a readable size, then recedes, while
 * the camera travels down a corridor of the scene's modules behind it.
 */
export default function Projects() {
  const ref = useReveal<HTMLElement>();
  const studies = projects.filter((p) => p.caseStudy);
  const rest = projects.filter((p) => !p.caseStudy);

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const mm = gsap.matchMedia();
    mm.add(MQ.motion, () => {
      gsap.utils.toArray<HTMLElement>(".cs", root).forEach((cs) => {
        const device = cs.querySelector<HTMLElement>(".cs__device");
        if (!device) return;
        gsap.fromTo(
          device,
          { rotateX: 22, scale: 0.8, yPercent: 18, opacity: 0.2 },
          {
            rotateX: 0,
            scale: 1,
            yPercent: 0,
            opacity: 1,
            ease: "power2.out",
            scrollTrigger: { trigger: cs, start: "top 92%", end: "top 30%", scrub: 1 },
          },
        );
        gsap.fromTo(
          device,
          { rotateX: 0, scale: 1, yPercent: 0, opacity: 1 },
          {
            rotateX: -12,
            scale: 0.88,
            yPercent: -10,
            opacity: 0.25,
            ease: "power2.in",
            immediateRender: false,
            scrollTrigger: { trigger: cs, start: "bottom 55%", end: "bottom 5%", scrub: 1 },
          },
        );
      });
    });
    return () => mm.revert();
  }, [ref]);

  return (
    <section ref={ref} id="projects" className="section pj" aria-labelledby="projects-title">
      <div className="shell">
        <SectionHead num="03" label="Projects" id="projects-title" title="Case studies in business software">
          <p className="lede" data-reveal>
            Operational systems running real businesses. The problem, my role, the architecture and the decisions
            that mattered.
          </p>
        </SectionHead>

        <div className="cs-list">
          {studies.map((p, i) => (
            <CaseStudyPanel key={p.slug} project={p} study={p.caseStudy!} index={i} />
          ))}
        </div>

        <h3 className="pj-more-title" data-reveal>
          More projects
        </h3>
        <ol className="pj-index">
          {rest.map((p, i) => (
            <li key={p.slug} id={`project-${p.slug}`} data-reveal>
              <ProjectRow project={p} num={studies.length + i + 1} />
            </li>
          ))}
        </ol>

        <Demo />
      </div>
    </section>
  );
}

function CaseStudyPanel({ project, study, index }: { project: Project; study: CaseStudy; index: number }) {
  const blocks: { label: string; items?: string[]; text?: string }[] = [
    { label: "Problem", text: study.problem },
    { label: "My role", text: study.role },
    { label: "Architecture", items: study.architecture },
    { label: "Key decisions", items: study.decisions },
    { label: "Outcome", items: study.outcomes },
  ].filter((b) => b.text || b.items?.length);

  return (
    <article
      id={`project-${project.slug}`}
      className={`cs${index % 2 ? " cs--flip" : ""}`}
      aria-labelledby={`project-${project.slug}-title`}
    >
      <header className="cs__head" data-reveal>
        <p className="mono cs__cat">
          {String(index + 1).padStart(2, "0")} · {project.category}
          {project.liveUrl ? " · Live" : ""}
        </p>
        <h3 id={`project-${project.slug}-title`} className="cs__name">
          {project.name}
        </h3>
        <p className="cs__value">{project.summary}</p>
      </header>

      <div className="cs__body">
        {project.screenshot && (
          <div className="cs__stage">
            <figure className="cs__device">
              <Screenshot project={project} />
            </figure>
          </div>
        )}

        <div className="cs__detail glass glass--strong" data-reveal>
          {blocks.map((b) => (
            <section key={b.label} className="cs__block" aria-label={b.label}>
              <h4 className="mono">{b.label}</h4>
              {b.text && <p>{b.text}</p>}
              {b.items && (
                <ul className="pj-checks">
                  {b.items.map((t) => (
                    <li key={t}>
                      <Check aria-hidden="true" strokeWidth={2} />
                      {t}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
          <ul className="chip-list" aria-label="Technologies">
            {project.stack.map((t) => (
              <li key={t} className="chip">
                {t}
              </li>
            ))}
          </ul>
          <Links project={project} />
        </div>
      </div>
    </article>
  );
}

function ProjectRow({ project, num }: { project: Project; num: number }) {
  const on = layersFor(project.stack);

  return (
    <details name="projects" className="pj-row">
      <summary>
        <span className="pj-row__num mono">{String(num).padStart(2, "0")}</span>
        <span className="pj-row__name">{project.name}</span>
        <span className="pj-row__tag">{project.tagline}</span>
        <span className="pj-row__icon" aria-hidden="true" />
      </summary>
      <div className="pj-row__body">
        {project.screenshot && (
          <figure className="pj-row__shot">
            <Screenshot project={project} />
          </figure>
        )}
        <div>
          <p className="pj-row__summary">{project.summary}</p>
          <p className="pj-row__layers-text mono">
            Layers: {on.length ? on.map((id) => layers.find((l) => l.id === id)?.short).join(", ") : "Integrations"}
          </p>
          <Links project={project} />
        </div>
        <div>
          <ul className="pj-checks">
            {project.highlights.map((h) => (
              <li key={h}>
                <Check aria-hidden="true" strokeWidth={2} />
                {h}
              </li>
            ))}
          </ul>
          <ul className="chip-list" aria-label="Technologies">
            {project.stack.map((t) => (
              <li key={t} className="chip">
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </details>
  );
}

/** The real screenshot in a browser frame labelled with the site's domain. */
function Screenshot({ project }: { project: Project }) {
  const shot = project.screenshot!;
  const domain = project.liveUrl?.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
  return (
    <div className="shot">
      <div className="shot__bar" aria-hidden="true">
        <i />
        <i />
        <i />
        <span>{domain ?? project.name}</span>
      </div>
      <img src={shot.src} alt={shot.alt} width={shot.width} height={shot.height} loading="lazy" decoding="async" />
    </div>
  );
}

/** Only links a project actually has are rendered. */
function Links({ project }: { project: Project }) {
  const links = [
    { href: project.liveUrl, label: "Live site" },
    { href: project.githubUrl, label: "Source code" },
    { href: project.caseStudyUrl, label: "Case study" },
  ].filter((l) => l.href);
  if (!links.length) return null;

  return (
    <div className="pj-links">
      {links.map((l, i) => (
        <a key={l.label} className={`btn ${i ? "btn--line" : "btn--solid"}`} href={l.href} {...EXTERNAL}>
          {l.label}
          <ArrowUpRight aria-hidden="true" />
          <span className="sr-only"> for {project.name} (opens in a new tab)</span>
        </a>
      ))}
    </div>
  );
}

/** The BasketballUpload widget: simulated progress, nothing leaves the browser. */
function Demo() {
  return (
    <article className="pj-demo glass" aria-labelledby="demo-title" data-reveal>
      <div className="pj-demo__copy">
        <p className="mono pj-demo__kicker">Interactive component · try it</p>
        <h3 id="demo-title" className="pj-demo__name">
          {featuredDemo.name}
        </h3>
        <p className="pj-demo__blurb">{featuredDemo.blurb}</p>
        <p className="pj-demo__note mono">{featuredDemo.note}</p>
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
        <p className="pj-demo__disclaimer mono">Demo only: progress is simulated, no file leaves your browser.</p>
      </div>
    </article>
  );
}

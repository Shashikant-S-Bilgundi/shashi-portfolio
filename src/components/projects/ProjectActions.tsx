// File: src/components/projects/ProjectActions.tsx
import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { ArrowUpRight, Code, FileText, Globe } from "lucide-react";
import type { Project } from "../../content/portfolio";
import { useCanHover } from "../../lib/useCanHover";

const LivePreview = lazy(() => import("./LivePreview"));

const EXTERNAL = { target: "_blank", rel: "noreferrer noopener" } as const;

/**
 * Only the links a project actually has are rendered. With none, nothing is
 * rendered: no "coming soon", no "#" placeholders.
 */
export function ProjectActions({ project }: { project: Project }) {
  const { liveUrl, githubUrl, caseStudyUrl, name } = project;
  if (!liveUrl && !githubUrl && !caseStudyUrl) return null;

  return (
    <div className="pj-actions">
      {liveUrl && <LiveLink href={liveUrl} name={name} preview={project.previewImage} />}
      {githubUrl && (
        <a className="pj-action" href={githubUrl} {...EXTERNAL}>
          <Code aria-hidden="true" strokeWidth={1.7} />
          Source code
          <span className="sr-only"> for {name} (opens in a new tab)</span>
        </a>
      )}
      {caseStudyUrl && (
        <a className="pj-action" href={caseStudyUrl} {...EXTERNAL}>
          <FileText aria-hidden="true" strokeWidth={1.7} />
          Case study
          <span className="sr-only"> for {name} (opens in a new tab)</span>
        </a>
      )}
    </div>
  );
}

/**
 * "Live site", with Animate UI's Preview Link Card on hover or focus.
 *
 * The preview card fetches a screenshot as soon as it mounts, so it is only
 * mounted (a) on devices that can hover, since touch can't open it anyway,
 * and (b) once the link is within ~600px of the viewport. Until then, and
 * everywhere else, this is an ordinary link. Pass `previewImage` in the
 * project data to use your own screenshot instead of the remote one.
 */
function LiveLink({ href, name, preview }: { href: string; name: string; preview?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const canHover = useCanHover();
  const [near, setNear] = useState(false);

  useEffect(() => {
    if (!canHover || near) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: "600px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [canHover, near]);

  const label = (
    <>
      <Globe aria-hidden="true" strokeWidth={1.7} />
      Live site
      <ArrowUpRight aria-hidden="true" strokeWidth={1.7} className="pj-action__arrow" />
      <span className="sr-only"> for {name} (opens in a new tab)</span>
    </>
  );

  const plain = (
    <a className="pj-action pj-action--primary" href={href} {...EXTERNAL}>
      {label}
    </a>
  );

  return (
    <span ref={ref} className="pj-live-wrap">
      {canHover && near ? (
        <Suspense fallback={plain}>
          <LivePreview href={href} name={name} preview={preview}>
            {label}
          </LivePreview>
        </Suspense>
      ) : (
        plain
      )}
    </span>
  );
}
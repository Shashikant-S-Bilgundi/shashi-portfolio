// File: src/components/stack/StackStage.tsx
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { layers } from "../../content/portfolio";
import { isCompact, prefersReducedMotion } from "../../lib/motion";
import { stackStore, stackTargets } from "../../lib/stack";
import "./StackStage.css";

/*
 * The fixed layer behind the whole page: the page light, the 3D stack and
 * its layer labels. Decorative, so it is hidden from assistive tech; every
 * fact it shows is also written out in the Skills section.
 *
 * three.js is loaded with a dynamic import after first render, so the 3D
 * code (its own chunk) never delays the text. Without WebGL, or if the GPU
 * context is lost, a CSS version of the same stack takes over and follows
 * the same scroll choreography.
 */

function supportsWebGL(): boolean {
  if (typeof window === "undefined" || typeof window.WebGLRenderingContext === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const gl = (canvas.getContext("webgl2") ?? canvas.getContext("webgl")) as WebGLRenderingContext | null;
    if (!gl) return false;
    gl.getExtension("WEBGL_lose_context")?.loseContext(); // release the probe
    return true;
  } catch {
    return false;
  }
}

/** Phones, low core counts, low memory and Save-Data get the light version. */
function isLiteDevice(): boolean {
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  return (
    isCompact() ||
    (nav.hardwareConcurrency ?? 8) <= 4 ||
    (nav.deviceMemory ?? 8) <= 4 ||
    Boolean(nav.connection?.saveData)
  );
}

export default function StackStage() {
  const [mode, setMode] = useState<"webgl" | "fallback">(() => (supportsWebGL() ? "webgl" : "fallback"));
  const hostRef = useRef<HTMLDivElement>(null);
  const labelsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mode !== "webgl") return;
    const host = hostRef.current;
    const labelBox = labelsRef.current;
    if (!host || !labelBox) return;

    let cancelled = false;
    let scene: { destroy(): void } | null = null;

    import("./StackScene")
      .then(({ StackScene }) => {
        if (cancelled) return;
        scene = new StackScene(host, Array.from(labelBox.children) as HTMLElement[], {
          lite: isLiteDevice(),
          reduced: prefersReducedMotion(),
          isCompact,
          onContextLost: () => setMode("fallback"),
        });
      })
      .catch(() => {
        if (!cancelled) setMode("fallback");
      });

    return () => {
      cancelled = true;
      scene?.destroy();
    };
  }, [mode]);

  return (
    <div className="stage" aria-hidden="true" data-mode={mode}>
      {mode === "webgl" ? (
        <>
          <div ref={hostRef} className="stage__canvas" />
          <div ref={labelsRef} className="stage__labels">
            {layers.map((l) => (
              <div key={l.id} className="stage__label">
                <strong>{l.name}</strong>
                <span>{l.examples}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <StackFallback />
      )}
    </div>
  );
}

/** The same four plates in CSS 3D, driven by the same targets. */
function StackFallback() {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const apply = () => {
      const t = stackTargets(stackStore.get(), { compact: isCompact(), reduced: prefersReducedMotion() });
      el.style.setProperty("--explode", t.explode.toFixed(3));
      el.style.setProperty("--shift-x", `${(t.shiftX * 100).toFixed(2)}vw`);
      el.style.setProperty("--shift-y", `${(t.shiftY * 100).toFixed(2)}vh`);
      el.style.setProperty("--zoom", (1 / t.zoom).toFixed(3));
      el.style.setProperty("--spin", `${((t.spin * 180) / Math.PI).toFixed(1)}deg`);
      el.style.opacity = t.presence.toFixed(3);
    };
    apply();
    const unsubscribe = stackStore.subscribe(apply);
    window.addEventListener("resize", apply);
    return () => {
      unsubscribe();
      window.removeEventListener("resize", apply);
    };
  }, []);

  return (
    <div ref={ref} className="sf">
      <div className="sf__pose">
        <div className="sf__iso">
          {layers.map((l, i) => (
            <div key={l.id} className="sf__plate" style={{ "--i": i } as CSSProperties}>
              <span />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
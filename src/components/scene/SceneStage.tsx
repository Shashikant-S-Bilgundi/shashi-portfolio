import { Suspense, lazy, useEffect, useLayoutEffect, useState } from "react";
import { MQ, ScrollTrigger, gsap } from "../../lib/motion";
import { journey, measureAnchors } from "../../lib/journey";
import type { Quality } from "./JourneyScene";
import "./SceneStage.css";

const JourneyScene = lazy(() => import("./JourneyScene"));

function hasWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

type Mode = { kind: "pending" } | { kind: "fallback" } | { kind: "3d"; quality: Quality };

/**
 * The fixed stage behind every section. It owns the scroll → camera link:
 * GSAP scrubs `journey.y` toward the scroll position (scrub lag = cinematic
 * ease) and re-measures section anchors on every ScrollTrigger refresh.
 *
 * Without WebGL a static drawing of the same structure stands in. Under
 * reduced motion the scene renders but holds its opening pose.
 */
export default function SceneStage() {
  const [mode, setMode] = useState<Mode>(() => (hasWebGL() ? { kind: "pending" } : { kind: "fallback" }));
  const [still, setStill] = useState(false);

  // pick quality after first paint so the text never waits on WebGL
  useEffect(() => {
    if (mode.kind !== "pending") return;
    const lite = window.matchMedia("(max-width: 1024px)").matches || (navigator.hardwareConcurrency ?? 8) <= 4;
    const id = window.setTimeout(() => setMode({ kind: "3d", quality: lite ? "lite" : "high" }), 120);
    return () => window.clearTimeout(id);
  }, [mode.kind]);

  useLayoutEffect(() => {
    const compact = window.matchMedia(MQ.mobile);
    const onRefresh = () => {
      journey.compact = compact.matches;
      measureAnchors();
    };
    ScrollTrigger.addEventListener("refresh", onRefresh);
    onRefresh();

    const mm = gsap.matchMedia();
    mm.add(MQ.motion, () => {
      setStill(false);
      gsap.fromTo(
        journey,
        { y: 0 },
        {
          y: () => ScrollTrigger.maxScroll(window),
          ease: "none",
          onUpdate: () => journey.invalidate(),
          scrollTrigger: { start: 0, end: "max", scrub: 1.2, invalidateOnRefresh: true },
        },
      );
    });
    mm.add(MQ.reduced, () => {
      setStill(true);
      journey.y = 0;
      journey.invalidate();
    });

    // content that changes height (open project rows, fonts) moves every anchor
    let t = 0;
    const ro = new ResizeObserver(() => {
      window.clearTimeout(t);
      t = window.setTimeout(() => ScrollTrigger.refresh(), 200);
    });
    const main = document.getElementById("main");
    if (main) ro.observe(main);

    return () => {
      mm.revert();
      ro.disconnect();
      window.clearTimeout(t);
      ScrollTrigger.removeEventListener("refresh", onRefresh);
      journey.y = 0;
    };
  }, []);

  // restrained pointer parallax, real pointers only
  useEffect(() => {
    const fine = window.matchMedia(`${MQ.hover} and ${MQ.motion}`);
    if (!fine.matches) return;
    const onMove = (e: PointerEvent) => {
      journey.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      journey.pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
      journey.invalidate();
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <div className="stage" aria-hidden="true" data-mode={mode.kind}>
      {mode.kind === "3d" && (
        <Suspense fallback={null}>
          <JourneyScene quality={mode.quality} still={still} />
        </Suspense>
      )}
      {mode.kind === "fallback" && <StaticStructure />}
      <div className="stage__scrim" />
    </div>
  );
}

/** Four plates and a portal, drawn flat: the no-WebGL stand-in. */
function StaticStructure() {
  return (
    <svg className="stage__static" viewBox="0 0 400 400" role="presentation">
      <g fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round">
        <path d="M200 40 360 200 200 360 40 200Z" opacity="0.25" />
        {[0, 1, 2, 3].map((i) => (
          <path
            key={i}
            className="sf__plate"
            d={`M200 ${110 + i * 46} 300 ${160 + i * 46} 200 ${210 + i * 46} 100 ${160 + i * 46}Z`}
            opacity={1 - i * 0.18}
          />
        ))}
      </g>
    </svg>
  );
}

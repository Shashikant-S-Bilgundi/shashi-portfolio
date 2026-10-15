import { FAR, NEAR, SKYLINE_VIEWBOX } from "./skyline";
import type { SkylineLayer } from "./skyline";
import "./SiteBackdrop.css";

const { width: W, height: H } = SKYLINE_VIEWBOX;

function City({ layer, className }: { layer: SkylineLayer; className: string }) {
  return (
    <svg className={`bd__city ${className}`} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice" focusable="false">
      <path className="bd__blocks" d={layer.buildings} />
      <path className="bd__win bd__win--warm" d={layer.windows.warm} />
      <path className="bd__win bd__win--red" d={layer.windows.red} />
      <path className="bd__win bd__win--cool" d={layer.windows.cool} />
    </svg>
  );
}

/**
 * One fixed, decorative backdrop for the whole page: a night skyline under a
 * crimson sky. It sits at z-index -1 behind the hero, the nav and every
 * section, so the glass surfaces have a real scene to blur. The hero is opaque
 * and covers it completely; it shows from the first section onward.
 */
export default function SiteBackdrop() {
  return (
    <div className="bd" aria-hidden="true">
      <div className="bd__sky" />
      <div className="bd__beams" />
      <City layer={FAR} className="bd__city--far" />
      <div className="bd__fog" />
      <City layer={NEAR} className="bd__city--near" />
      <div className="bd__grain" />
      <div className="bd__shade" />
    </div>
  );
}
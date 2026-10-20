// File: src/components/ui/LayerFootprint.tsx
import type { CSSProperties } from "react";
import { layers } from "../../content/portfolio";
import type { LayerId } from "../../content/portfolio";
import "./LayerFootprint.css";

/**
 * A miniature of the hero's stack: four plates, with the ones a project (or
 * skill group) touches filled in. Decorative; callers print the same layer
 * names as text next to it.
 */
export function LayerFootprint({ active, size = "md" }: { active: LayerId[]; size?: "sm" | "md" }) {
  return (
    <span className={`fp fp--${size}`} aria-hidden="true">
      <span className="fp__iso">
        {layers.map((l, i) => (
          <span
            key={l.id}
            className={`fp__plate${active.includes(l.id) ? " is-on" : ""}`}
            style={{ "--i": i } as CSSProperties}
          />
        ))}
      </span>
    </span>
  );
}
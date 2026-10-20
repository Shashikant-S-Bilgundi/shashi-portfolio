import { useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { skills } from "../../content/portfolio";
import { SectionHead } from "../ui/SectionHead";
import "./Skills.css";

/**
 * The technology ecosystem: category tabs (arrow keys move between them)
 * over a grid of labelled tiles. Behind it the scene's modules regroup and
 * connect, seen from above.
 */
export default function Skills() {
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const group = skills[active];

  const onKey = (e: KeyboardEvent) => {
    const step = ({ ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 } as Record<string, number>)[e.key];
    if (!step) return;
    e.preventDefault();
    const next = (active + step + skills.length) % skills.length;
    setActive(next);
    tabs.current[next]?.focus();
  };

  return (
    <section id="skills" className="section sk" aria-labelledby="skills-title">
      <div className="shell">
        <SectionHead num="04" label="Technical stack" id="skills-title" title="A connected ecosystem, not a wall of logos" />

        <div className="sk-tabs" role="tablist" aria-label="Technology categories" onKeyDown={onKey}>
          {skills.map((g, i) => (
            <button
              key={g.title}
              ref={(el) => {
                tabs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`sk-tab-${i}`}
              aria-selected={i === active}
              aria-controls="sk-panel"
              tabIndex={i === active ? 0 : -1}
              className="sk-tab"
              onClick={() => setActive(i)}
            >
              {i === active && <motion.span layoutId="sk-pill" className="sk-tab__pill" transition={{ type: "spring", stiffness: 400, damping: 36 }} />}
              <span className="sk-tab__label">{g.title}</span>
              <span className="mono sk-tab__count">{g.items.length}</span>
            </button>
          ))}
        </div>

        <div id="sk-panel" className="sk-panel" role="tabpanel" aria-labelledby={`sk-tab-${active}`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="sk-desc">{group.description}</p>
              <ul className="sk-tiles">
                {group.items.map((t, i) => (
                  <motion.li
                    key={t}
                    className="sk-tile glass"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <span className="mono">{String(i + 1).padStart(2, "0")}</span>
                    {t}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

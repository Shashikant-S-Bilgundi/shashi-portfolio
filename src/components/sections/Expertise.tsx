import { Briefcase, Database, LayoutTemplate, Plug } from "lucide-react";
import { motion } from "motion/react";
import { expertise } from "../../content/portfolio";
import { SectionHead } from "../ui/SectionHead";
import { TiltCard } from "../ui/TiltCard";
import "./Expertise.css";

const ICONS = { layout: LayoutTemplate, briefcase: Briefcase, database: Database, plug: Plug } as const;

/** Behind these four modules the scene's layers stand up as four modules too. */
export default function Expertise() {
  return (
    <section id="expertise" className="section ex" aria-labelledby="expertise-title">
      <div className="shell">
        <SectionHead num="02" label="Expertise" id="expertise-title" title="What I build, end to end" />

        <ul className="ex-grid">
          {expertise.map((e, i) => {
            const Icon = ICONS[e.icon];
            return (
              <motion.li
                key={e.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "0px 0px -10% 0px" }}
                transition={{ duration: 0.9, delay: (i % 2) * 0.12, ease: [0.22, 1, 0.36, 1] }}
              >
                <TiltCard className="ex-card">
                  <div className="ex-card__top">
                    <span className="ex-card__icon">
                      <Icon aria-hidden="true" strokeWidth={1.5} />
                    </span>
                    <span className="mono">{String(i + 1).padStart(2, "0")}</span>
                  </div>
                  <h3 className="ex-card__title">{e.title}</h3>
                  <ul className="ex-card__items">
                    {e.items.map((it) => (
                      <li key={it}>{it}</li>
                    ))}
                  </ul>
                </TiltCard>
              </motion.li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

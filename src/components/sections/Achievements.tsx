import { ArrowUpRight } from "lucide-react";
import { motion } from "motion/react";
import { achievements, projects } from "../../content/portfolio";
import { SectionHead } from "../ui/SectionHead";
import { TiltCard } from "../ui/TiltCard";
import "./Achievements.css";

/** Specific accomplishments, each linked to the project that backs it. No counters. */
export default function Achievements() {
  return (
    <section id="achievements" className="section ac" aria-labelledby="achievements-title">
      <div className="shell">
        <SectionHead num="07" label="Engineering impact" id="achievements-title" title="Proof, not percentages">
          <p className="lede" data-reveal>
            Specific things I've built and fixed, each traceable to a project above.
          </p>
        </SectionHead>

        <ul className="ac-grid">
          {achievements.map((a, i) => {
            const p = projects.find((x) => x.slug === a.project);
            return (
              <motion.li
                key={a.title}
                initial={{ opacity: 0, y: 36 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "0px 0px -8% 0px" }}
                transition={{ duration: 0.8, delay: (i % 3) * 0.1, ease: [0.22, 1, 0.36, 1] }}
              >
                <TiltCard className="ac-card">
                  <h3>{a.title}</h3>
                  <p>{a.basis}</p>
                  {p && (
                    <a className="ac-link mono" href={`#project-${p.slug}`}>
                      {p.name}
                      <ArrowUpRight aria-hidden="true" />
                    </a>
                  )}
                </TiltCard>
              </motion.li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

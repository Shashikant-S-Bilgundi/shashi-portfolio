import { Fragment } from "react";
import { motion } from "motion/react";

/**
 * Words rise into place from behind a mask, staggered. The full sentence
 * stays real text (screen readers and selection see it normally).
 */
export function RevealText({
  text,
  delay = 0,
  stagger = 0.05,
  inView = true,
}: {
  text: string;
  delay?: number;
  stagger?: number;
  /** false = play on mount (hero) instead of on scroll into view */
  inView?: boolean;
}) {
  const words = text.split(" ");
  const trigger = inView
    ? { whileInView: "shown", viewport: { once: true, margin: "0px 0px -12% 0px" } }
    : { animate: "shown" };

  return (
    <motion.span initial="hidden" {...trigger} transition={{ staggerChildren: stagger, delayChildren: delay }}>
      {words.map((w, i) => (
        <Fragment key={i}>
          <span className="reveal-word">
            <motion.span
              variants={{ hidden: { y: "105%" }, shown: { y: "0%" } }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            >
              {w}
            </motion.span>
          </span>
          {i < words.length - 1 ? " " : ""}
        </Fragment>
      ))}
    </motion.span>
  );
}

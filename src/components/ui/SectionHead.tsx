import type { ReactNode } from "react";
import { RevealText } from "./RevealText";

/** "01  About" kicker over a masked, word-by-word heading. */
export function SectionHead({
  num,
  label,
  id,
  title,
  children,
}: {
  num: string;
  label: string;
  id: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <header className="sec-head">
      <p className="kicker" data-reveal>
        <span className="kicker__num">{num}</span>
        <span>{label}</span>
      </p>
      <h2 id={id} className="h2">
        <RevealText text={title} />
      </h2>
      {children}
    </header>
  );
}

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ScrollTrigger, gsap } from "../lib/motion";
import { nav, profile } from "../content/portfolio";
import "./SiteNav.css";

/**
 * The scrolled state and the active-section highlight are both driven by
 * ScrollTrigger writing classes straight onto the DOM — deliberately not React
 * state, so scrolling never triggers a re-render. The only state here is the
 * mobile drawer, which changes on tap.
 */
export default function SiteNav() {
  const [open, setOpen] = useState(false);
  const barRef = useRef<HTMLElement>(null);
  const linksRef = useRef<HTMLUListElement>(null);

  useLayoutEffect(() => {
    const bar = barRef.current;
    const list = linksRef.current;
    if (!bar || !list) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        start: "top -80",
        end: 99999,
        onToggle: (self) => bar.classList.toggle("is-scrolled", self.isActive),
      });

      const links = Array.from(list.querySelectorAll<HTMLAnchorElement>("a[href^='#']"));
      links.forEach((link) => {
        const id = link.getAttribute("href");
        if (!id || id.length < 2) return;
        const section = document.querySelector(id);
        if (!section) return;

        ScrollTrigger.create({
          trigger: section,
          start: "top 45%",
          end: "bottom 45%",
          onToggle: (self) => link.classList.toggle("is-active", self.isActive),
        });
      });
    });

    return () => ctx.revert();
  }, []);

  // Close the drawer on Escape, and lock the page behind it while it's open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const initials = profile.name
    .split(" ")
    .map((w) => w[0])
    .join("");

  return (
    <header ref={barRef} className={`sn${open ? " is-open" : ""}`}>
      <div className="sn__inner sx-shell">
        <a className="sn__mark" href="#top" onClick={() => setOpen(false)}>
          <span className="sn__mark-glyph" aria-hidden="true">
            {initials}
          </span>
          <span className="sn__mark-name">{profile.name}</span>
        </a>

        <nav aria-label="Primary">
          <ul ref={linksRef} className="sn__links">
            {nav.map((item) => (
              <li key={item.href}>
                <a href={item.href} onClick={() => setOpen(false)}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <button
          type="button"
          className="sn__toggle"
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
// File: src/components/SiteNav.tsx
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Menu, X } from "lucide-react";
import { ScrollTrigger, gsap } from "../lib/motion";
import { nav, profile } from "../content/portfolio";
import { BrandMark } from "./ui/BrandMark";
import "./SiteNav.css";

type Href = (typeof nav)[number]["href"];

/**
 * Links are plain in-page anchors, so the browser handles history, the hash,
 * middle-click and "copy link". `scroll-margin-top` on each section keeps
 * headings clear of this bar.
 *
 * The active item is tracked with ScrollTriggers and only changes state when
 * the reader crosses into a new section, so scrolling never re-renders the
 * nav on every frame. The highlight pill glides between items (Motion
 * `layoutId`).
 */
export default function SiteNav() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<Href>("#home");
  const barRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        start: "top -40",
        end: "max",
        refreshPriority: -1,
        onToggle: (self) => bar.classList.toggle("is-scrolled", self.isActive),
      });

      nav.forEach((item, i) => {
        if (item.href === "#home") return;
        const section = document.querySelector(item.href);
        if (!section) return;
        ScrollTrigger.create({
          trigger: section,
          start: "top 45%",
          end: "bottom 45%",
          // measured after the hero's pin, which shifts everything below it
          refreshPriority: -1,
          onToggle: (self) => {
            if (self.isActive) setActive(item.href);
          },
          onLeaveBack: i === 1 ? () => setActive("#home") : undefined,
        });
      });
    });

    return () => ctx.revert();
  }, []);

  const close = useCallback((returnFocus = false) => {
    setOpen(false);
    if (returnFocus) toggleRef.current?.focus();
  }, []);

  // While the mobile menu is open: Escape closes it, the page behind is
  // locked and inert, and it closes itself if the window grows to desktop.
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(true);
    };
    document.addEventListener("keydown", onKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const behind = [document.getElementById("main"), document.querySelector<HTMLElement>(".footer")];
    behind.forEach((el) => el?.setAttribute("inert", ""));

    menuRef.current?.querySelector<HTMLAnchorElement>("a")?.focus();

    const wide = window.matchMedia("(min-width: 961px)");
    const onWide = () => wide.matches && setOpen(false);
    wide.addEventListener("change", onWide);

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      behind.forEach((el) => el?.removeAttribute("inert"));
      wide.removeEventListener("change", onWide);
    };
  }, [open, close]);

  return (
    <header ref={barRef} className={`nav${open ? " is-open" : ""}`}>
      <div className="nav__inner shell">
        <a className="nav__brand" href="#home" onClick={() => setOpen(false)}>
          <BrandMark className="nav__mark" />
          <span className="nav__brand-name">{profile.name}</span>
        </a>

        <nav className="nav__bar" aria-label="Primary">
          <ul className="nav__links">
            {nav.map((item) => {
              const isActive = active === item.href;
              return (
                <li key={item.href}>
                  <a href={item.href} className="nav__link" aria-current={isActive ? "location" : undefined}>
                    {isActive && (
                      <motion.span
                        layoutId="nav-pill"
                        className="nav__pill"
                        transition={{ type: "spring", stiffness: 500, damping: 40 }}
                      />
                    )}
                    <span className="nav__label">{item.label}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        <button
          ref={toggleRef}
          type="button"
          className="nav__toggle"
          aria-expanded={open}
          aria-controls="nav-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            id="nav-menu"
            ref={menuRef}
            className="nav__menu"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8, transition: { duration: 0.16 } }}
            transition={{ duration: 0.26, ease: [0.23, 1, 0.32, 1] }}
          >
            <nav aria-label="Primary">
              <ul>
                {nav.map((item, i) => (
                  <motion.li
                    key={item.href}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.03 + i * 0.04, duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                  >
                    <a
                      href={item.href}
                      className="nav__menu-link"
                      aria-current={active === item.href ? "location" : undefined}
                      onClick={() => setOpen(false)}
                    >
                      {item.label}
                    </a>
                  </motion.li>
                ))}
              </ul>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
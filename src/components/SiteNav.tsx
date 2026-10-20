import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Download, Menu, X } from "lucide-react";
import { nav, profile } from "../content/portfolio";
import { BrandMark } from "./ui/BrandMark";
import "./SiteNav.css";

type Href = (typeof nav)[number]["href"] | "";

/**
 * Transparent over the hero, a glass bar once the page scrolls. The active
 * item follows the section crossing the middle of the viewport.
 */
export default function SiteNav() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<Href>("");
  const [scrolled, setScrolled] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(`#${e.target.id}` as Href);
      },
      { rootMargin: "-50% 0px -50% 0px" },
    );
    // every section, so ones outside the nav (Skills, Workflow…) clear the highlight
    document.querySelectorAll("main section[id]").forEach((el) => io.observe(el));
    return () => io.disconnect();
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
    <header className={`nav${scrolled ? " is-scrolled" : ""}${open ? " is-open" : ""}`}>
      <div className="nav__bar">
        <a className="nav__brand" href="#home" onClick={() => setOpen(false)}>
          <BrandMark className="nav__mark" />
          <span className="nav__brand-name">{profile.name}</span>
        </a>

        <nav className="nav__primary" aria-label="Primary">
          <ul className="nav__links">
            {nav.map((item) => (
              <li key={item.href}>
                <a href={item.href} className="nav__link" aria-current={active === item.href ? "location" : undefined}>
                  {active === item.href && (
                    <motion.span layoutId="nav-pill" className="nav__pill" transition={{ type: "spring", stiffness: 420, damping: 38 }} />
                  )}
                  <span className="nav__label">{item.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="nav__end">
          {profile.availability && (
            <span className="nav__status mono">
              <span className="nav__dot" aria-hidden="true" />
              {profile.availability}
            </span>
          )}
          {profile.resumeUrl && (
            <a className="nav__resume" href={profile.resumeUrl} download>
              Resume
              <Download aria-hidden="true" />
            </a>
          )}
        </div>

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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.18 } }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <nav aria-label="Primary">
              <ul>
                {nav.map((item, i) => (
                  <motion.li
                    key={item.href}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 + i * 0.05, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <a
                      href={item.href}
                      className="nav__menu-link"
                      aria-current={active === item.href ? "location" : undefined}
                      onClick={() => setOpen(false)}
                    >
                      <span className="mono">0{i + 1}</span>
                      {item.label}
                    </a>
                  </motion.li>
                ))}
              </ul>
              {profile.resumeUrl && (
                <a className="btn btn--solid nav__menu-resume" href={profile.resumeUrl} download onClick={() => setOpen(false)}>
                  Download resume
                  <Download aria-hidden="true" />
                </a>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

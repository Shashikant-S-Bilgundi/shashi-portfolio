import { useState } from "react";
import type { FormEvent } from "react";
import { useReveal } from "../lib/motion";
import { about, contact, experience, profile, skills } from "../content/portfolio";
import gothamBand from "../assets/batman/gotham-band.webp";
import "./Sections.css";

/* -------------------------------------------------------------------------- */
/* About                                                                       */
/* -------------------------------------------------------------------------- */

export function About() {
  const ref = useReveal<HTMLElement>();

  return (
    <section ref={ref} id="about" className="sx-section sx-section--about">
      <div className="sx-shell sx-about">
        <header className="sx-about__head">
          <p className="sx-eyebrow" data-reveal>
            {about.eyebrow}
          </p>
          <h2 className="sx-h2" data-reveal>
            {about.heading}
          </h2>
        </header>

        <div className="sx-about__body">
          {about.paragraphs.map((p, i) => (
            <p key={i} className="sx-lede" data-reveal>
              {p}
            </p>
          ))}

          <ul className="sx-about__stats" data-reveal>
            {about.stats.map((s) => (
              <li key={s.label}>
                <span className="sx-about__stat-value">{s.value}</span>
                <span className="sx-about__stat-label">{s.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Skills                                                                      */
/* -------------------------------------------------------------------------- */

export function Skills() {
  const ref = useReveal<HTMLElement>();

  return (
    <section ref={ref} id="skills" className="sx-section">
      <div className="sx-shell">
        <header className="sx-head">
          <p className="sx-eyebrow" data-reveal>
            The arsenal
          </p>
          <h2 className="sx-h2" data-reveal>
            Tools of the trade
          </h2>
        </header>

        <ul className="sx-skills">
          {skills.map((group) => (
            <li key={group.title} className="sx-skill" data-reveal>
              <h3 className="sx-skill__title">{group.title}</h3>
              <ul className="sx-skill__items">
                {group.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Experience                                                                  */
/* -------------------------------------------------------------------------- */

export function Experience() {
  const ref = useReveal<HTMLElement>();

  return (
    <section ref={ref} id="experience" className="sx-section">
      <div className="sx-shell">
        <header className="sx-head">
          <p className="sx-eyebrow" data-reveal>
            Track record
          </p>
          <h2 className="sx-h2" data-reveal>
            Experience
          </h2>
        </header>

        <ol className="sx-timeline">
          {experience.map((role) => (
            <li key={`${role.company}-${role.title}`} className="sx-role" data-reveal>
              <div className="sx-role__meta">
                <p className="sx-role__period">{role.period}</p>
                <p className="sx-role__location">{role.location}</p>
              </div>
              <div className="sx-role__body">
                <h3 className="sx-role__title">{role.title}</h3>
                <p className="sx-role__company">{role.company}</p>
                <ul className="sx-role__points">
                  {role.points.map((point, i) => (
                    <li key={i}>{point}</li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Contact                                                                     */
/* -------------------------------------------------------------------------- */

type FormState = { name: string; email: string; message: string };
type Status = { kind: "idle" | "error" | "sent"; text?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function Contact() {
  const ref = useReveal<HTMLElement>();
  const [form, setForm] = useState<FormState>({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const set = (key: keyof FormState) => (e: { target: { value: string } }) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    if (status.kind !== "idle") setStatus({ kind: "idle" });
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!form.name.trim()) return setStatus({ kind: "error", text: "Please add your name." });
    if (!EMAIL_RE.test(form.email))
      return setStatus({ kind: "error", text: "That email address doesn't look right." });
    if (form.message.trim().length < 10)
      return setStatus({ kind: "error", text: "Tell me a little more — at least a sentence." });

    if (!contact.email) {
      return setStatus({
        kind: "error",
        text: "This form isn't wired up yet — set `contact.email` in src/content/portfolio.ts.",
      });
    }

    /* Hands off to the visitor's mail client so the site needs no backend.
       To POST to a real endpoint instead, replace this block with a fetch()
       and keep the same validation and status handling above. */
    const subject = encodeURIComponent(`Portfolio enquiry from ${form.name}`);
    const body = encodeURIComponent(`${form.message}\n\n— ${form.name}\n${form.email}`);
    window.location.href = `mailto:${contact.email}?subject=${subject}&body=${body}`;

    setStatus({ kind: "sent", text: "Opening your mail app with the message ready to send." });
  };

  const socials = contact.socials.filter((s) => s.href);

  return (
    <section ref={ref} id="contact" className="sx-section sx-contact">
      <div className="sx-contact__plate" aria-hidden="true">
        <img src={gothamBand} alt="" width={1600} height={675} loading="lazy" decoding="async" />
      </div>

      <div className="sx-shell sx-contact__grid">
        <div className="sx-contact__intro">
          <p className="sx-eyebrow" data-reveal>
            {contact.eyebrow}
          </p>
          <h2 className="sx-h2" data-reveal>
            {contact.heading}
          </h2>
          <p className="sx-lede" data-reveal>
            {contact.blurb}
          </p>

          <ul className="sx-contact__direct" data-reveal>
            {contact.email && (
              <li>
                <span>Email</span>
                <a href={`mailto:${contact.email}`}>{contact.email}</a>
              </li>
            )}
            {contact.phone && (
              <li>
                <span>Phone</span>
                <a href={`tel:${contact.phone.replace(/\s+/g, "")}`}>{contact.phone}</a>
              </li>
            )}
            <li>
              <span>Based in</span>
              <p>{profile.location}</p>
            </li>
          </ul>

          {socials.length > 0 && (
            <ul className="sx-contact__socials" data-reveal>
              {socials.map((s) => (
                <li key={s.label}>
                  <a href={s.href} target="_blank" rel="noreferrer noopener">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <form className="sx-form" onSubmit={onSubmit} noValidate data-reveal>
          <div className="sx-field">
            <label htmlFor="cf-name">Name</label>
            <input
              id="cf-name"
              name="name"
              type="text"
              autoComplete="name"
              value={form.name}
              onChange={set("name")}
            />
          </div>

          <div className="sx-field">
            <label htmlFor="cf-email">Email</label>
            <input
              id="cf-email"
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={set("email")}
            />
          </div>

          <div className="sx-field">
            <label htmlFor="cf-message">Message</label>
            <textarea
              id="cf-message"
              name="message"
              rows={5}
              value={form.message}
              onChange={set("message")}
            />
          </div>

          <div className="sx-form__foot">
            <button type="submit" className="bat-btn bat-btn--solid">
              Send message
            </button>
            <p
              className={`sx-form__status${status.kind === "error" ? " is-error" : ""}`}
              role="status"
              aria-live="polite"
            >
              {status.text ?? ""}
            </p>
          </div>
        </form>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Footer                                                                      */
/* -------------------------------------------------------------------------- */

export function SiteFooter() {
  return (
    <footer className="sx-footer">
      <div className="sx-shell sx-footer__inner">
        <p>
          © {new Date().getFullYear()} {profile.name}
        </p>
        <p className="sx-footer__note">Built with React, TypeScript and GSAP.</p>
        <a className="sx-footer__top" href="#top">
          Back to top
        </a>
      </div>
    </footer>
  );
}
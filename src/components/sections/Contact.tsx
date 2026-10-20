// File: src/components/sections/Contact.tsx
import { useState } from "react";
import type { ComponentType, FormEvent, SVGProps } from "react";
import { ArrowUpRight, AtSign, Briefcase, Code, Mail, MapPin, Phone } from "lucide-react";
import { contactMotion, useSectionMotion } from "../../lib/sectionMotion";
import { useReveal } from "../../lib/motion";
import { contact, profile } from "../../content/portfolio";
import type { SocialLink } from "../../content/portfolio";
import { SplittingText } from "../../vendor/animate-ui/primitives/texts/splitting";
import { Button } from "../ui/Button";
import "./Contact.css";

type Icon = ComponentType<SVGProps<SVGSVGElement> & { strokeWidth?: number }>;

/* Generic icons with visible text labels, rather than reproducing brand logos. */
const SOCIAL_ICON: Record<SocialLink["label"], Icon> = {
  LinkedIn: Briefcase,
  GitHub: Code,
  X: AtSign,
};

interface Channel {
  key: string;
  icon: Icon;
  label: string;
  value: string;
  href?: string;
  external?: boolean;
}

const prettyUrl = (href: string) => href.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

type FormState = { name: string; email: string; message: string };
type Status = { kind: "idle" | "error" | "sent"; text?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function Contact() {
  const ref = useReveal<HTMLElement>();
  useSectionMotion(ref, contactMotion);

  const channels: Channel[] = [
    ...(contact.email
      ? [{ key: "email", icon: Mail, label: "Email", value: contact.email, href: `mailto:${contact.email}` }]
      : []),
    ...(contact.phone
      ? [
          {
            key: "phone",
            icon: Phone,
            label: "Phone",
            value: contact.phone,
            href: `tel:${contact.phone.replace(/[^\d+]/g, "")}`,
          },
        ]
      : []),
    ...contact.socials
      .filter((s) => s.href)
      .map((s) => ({
        key: s.label,
        icon: SOCIAL_ICON[s.label],
        label: s.label,
        value: prettyUrl(s.href),
        href: s.href,
        external: true,
      })),
    { key: "location", icon: MapPin, label: "Based in", value: profile.location },
  ];

  const hasForm = Boolean(contact.email);

  return (
    <section ref={ref} id="contact" className="section ct" aria-labelledby="contact-title" data-recede="off">
      <div className={`section__frame shell ct-grid${hasForm ? "" : " ct-grid--solo"}`}>
        <div className="ct-intro">
          <h2 id="contact-title" className="h2 ct-heading">
            <SplittingText
              text={contact.heading}
              type="words"
              inView
              inViewMargin="0px 0px -15% 0px"
              initial={{ opacity: 0, y: 36, rotateX: -55 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
              stagger={0.09}
            />
          </h2>
          <p className="lede ct-blurb" data-reveal>
            {contact.blurb}
          </p>

          <ul className="ct-links">
            {channels.map((c) => {
              const Icon = c.icon;
              const body = (
                <>
                  <Icon aria-hidden="true" strokeWidth={1.6} className="ct-links__icon" />
                  <span className="ct-links__text">
                    <small>{c.label}</small>
                    <strong>{c.value}</strong>
                  </span>
                  {c.href && <ArrowUpRight aria-hidden="true" strokeWidth={1.6} className="ct-links__arrow" />}
                </>
              );
              return (
                <li key={c.key}>
                  {c.href ? (
                    <a
                      className="ct-links__row"
                      href={c.href}
                      {...(c.external ? { target: "_blank", rel: "noreferrer noopener" } : {})}
                    >
                      {body}
                      {c.external && <span className="sr-only"> (opens in a new tab)</span>}
                    </a>
                  ) : (
                    <div className="ct-links__row">{body}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {hasForm ? (
          <ContactForm />
        ) : (
          import.meta.env.DEV && (
            <p className="ct-setup">
              The contact form and email link appear once <code>contact.email</code> is set in{" "}
              <code>src/content/portfolio.ts</code>. This note only shows in development.
            </p>
          )
        )}
      </div>
    </section>
  );
}

/**
 * Hands the message to the visitor's mail app, so the site needs no backend.
 * To send through a real endpoint instead, replace the mailto block with a
 * fetch() and keep the validation and status handling.
 */
function ContactForm() {
  const [form, setForm] = useState<FormState>({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const set = (key: keyof FormState) => (e: { target: { value: string } }) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    if (status.kind !== "idle") setStatus({ kind: "idle" });
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.name.trim()) return setStatus({ kind: "error", text: "Add your name so I know who's writing." });
    if (!EMAIL_RE.test(form.email))
      return setStatus({ kind: "error", text: "Check your email address: it should look like name@example.com." });
    if (form.message.trim().length < 10)
      return setStatus({ kind: "error", text: "Add a little more to your message, at least a sentence." });

    const subject = encodeURIComponent(`Portfolio enquiry from ${form.name}`);
    const body = encodeURIComponent(`${form.message}\n\n${form.name}\n${form.email}`);
    window.location.href = `mailto:${contact.email}?subject=${subject}&body=${body}`;
    setStatus({ kind: "sent", text: "Your mail app should open with the message ready to send." });
  };

  return (
    <form className="ct-form glass glass--strong" onSubmit={onSubmit} noValidate data-depth aria-label="Contact form">
      <div className="ct-field">
        <label htmlFor="cf-name">Name</label>
        <input id="cf-name" name="name" type="text" autoComplete="name" value={form.name} onChange={set("name")} />
      </div>
      <div className="ct-field">
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
      <div className="ct-field">
        <label htmlFor="cf-message">Message</label>
        <textarea id="cf-message" name="message" rows={5} value={form.message} onChange={set("message")} />
      </div>
      <div className="ct-form__foot">
        <Button type="submit" variant="primary">
          Write email
        </Button>
        <p className={`ct-status${status.kind === "error" ? " is-error" : ""}`} role="status" aria-live="polite">
          {status.text ?? ""}
        </p>
      </div>
    </form>
  );
}
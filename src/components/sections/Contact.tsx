import { useState } from "react";
import type { FormEvent } from "react";
import { ArrowUpRight, Loader2 } from "lucide-react";
import { useReveal } from "../../lib/motion";
import { contact, profile } from "../../content/portfolio";
import { RevealText } from "../ui/RevealText";
import "./Contact.css";

const prettyUrl = (href: string) => href.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type FormState = { name: string; email: string; type: string; message: string; company: string };
type Status = { kind: "idle" | "sending" | "error" | "sent"; text?: string };

/**
 * The final scene: the camera settles and the structure reassembles beside
 * this section. The form sends to `contact.formEndpoint` when one is set;
 * otherwise, with an email set, it opens the visitor's mail app; with
 * neither, it isn't shown at all.
 */
export default function Contact() {
  const ref = useReveal<HTMLElement>();
  const channels = [
    ...(contact.email ? [{ label: "Email", value: contact.email, href: `mailto:${contact.email}` }] : []),
    ...(contact.phone ? [{ label: "Phone", value: contact.phone, href: `tel:${contact.phone.replace(/[^\d+]/g, "")}` }] : []),
    ...contact.socials.filter((s) => s.href).map((s) => ({ label: s.label, value: prettyUrl(s.href), href: s.href })),
    { label: "Based in", value: profile.location, href: "" },
  ];
  const hasForm = Boolean(contact.formEndpoint || contact.email);

  return (
    <section ref={ref} id="contact" className="section ct" aria-labelledby="contact-title">
      <div className="shell ct-grid">
        <div className="ct-intro">
          <p className="kicker" data-reveal>
            <span className="kicker__num">09</span>
            <span>Contact</span>
          </p>
          <h2 id="contact-title" className="ct-heading">
            <RevealText text={contact.heading} />
          </h2>
          <p className="lede" data-reveal>
            {contact.blurb}
          </p>

          <ul className="ct-links">
            {channels.map((c) => {
              const external = /^https?:/.test(c.href);
              const body = (
                <>
                  <span className="mono">{c.label}</span>
                  <strong>{c.value}</strong>
                  {c.href && <ArrowUpRight aria-hidden="true" strokeWidth={1.6} />}
                </>
              );
              return (
                <li key={c.label} data-reveal>
                  {c.href ? (
                    <a
                      className="ct-links__row"
                      href={c.href}
                      {...(external ? { target: "_blank", rel: "noreferrer noopener" } : {})}
                    >
                      {body}
                      {external && <span className="sr-only"> (opens in a new tab)</span>}
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
            <p className="ct-setup mono">
              Development note: the contact form appears once <code>contact.formEndpoint</code> (sends for real) or{" "}
              <code>contact.email</code> (opens the mail app) is set in <code>src/content/portfolio.ts</code>.
            </p>
          )
        )}
      </div>
    </section>
  );
}

function ContactForm() {
  const [form, setForm] = useState<FormState>({ name: "", email: "", type: "", message: "", company: "" });
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const set = (key: keyof FormState) => (e: { target: { value: string } }) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    if (status.kind === "error") setStatus({ kind: "idle" });
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status.kind === "sending") return;
    if (!form.name.trim()) return setStatus({ kind: "error", text: "Add your name so I know who's writing." });
    if (!EMAIL_RE.test(form.email))
      return setStatus({ kind: "error", text: "Check your email address: it should look like name@example.com." });
    if (form.message.trim().length < 10)
      return setStatus({ kind: "error", text: "Add a little more to your message, at least a sentence." });
    // honeypot: people never see this field, bots fill it in
    if (form.company) return setStatus({ kind: "sent", text: "Thanks, your message is on its way." });

    const payload = { name: form.name.trim(), email: form.email.trim(), projectType: form.type, message: form.message.trim() };

    if (!contact.formEndpoint) {
      const subject = encodeURIComponent(`Portfolio enquiry from ${payload.name}`);
      const body = encodeURIComponent(
        `${payload.message}\n\n${payload.projectType ? `Project type: ${payload.projectType}\n` : ""}${payload.name}\n${payload.email}`,
      );
      window.location.href = `mailto:${contact.email}?subject=${subject}&body=${body}`;
      return setStatus({ kind: "sent", text: "Your mail app should open with the message ready to send." });
    }

    setStatus({ kind: "sending" });
    try {
      const res = await fetch(contact.formEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(String(res.status));
      setForm({ name: "", email: "", type: "", message: "", company: "" });
      setStatus({ kind: "sent", text: "Thanks, your message was sent. I'll reply by email." });
    } catch {
      setStatus({
        kind: "error",
        text: contact.email
          ? `The message couldn't be sent. Please try again, or email ${contact.email}.`
          : "The message couldn't be sent. Please try again in a moment.",
      });
    }
  };

  const sending = status.kind === "sending";

  return (
    <form className="ct-form glass glass--strong" onSubmit={onSubmit} noValidate aria-label="Contact form" data-reveal>
      <div className="ct-row">
        <div className="ct-field">
          <label htmlFor="cf-name">Name</label>
          <input id="cf-name" name="name" type="text" autoComplete="name" required value={form.name} onChange={set("name")} />
        </div>
        <div className="ct-field">
          <label htmlFor="cf-email">Email</label>
          <input id="cf-email" name="email" type="email" autoComplete="email" required value={form.email} onChange={set("email")} />
        </div>
      </div>
      <div className="ct-field">
        <label htmlFor="cf-type">
          Project type <span className="ct-opt">(optional)</span>
        </label>
        <select id="cf-type" name="projectType" value={form.type} onChange={set("type")}>
          <option value="">Choose one</option>
          {contact.projectTypes.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>
      <div className="ct-field">
        <label htmlFor="cf-message">What are we building?</label>
        <textarea id="cf-message" name="message" rows={5} required value={form.message} onChange={set("message")} />
      </div>
      <div className="ct-hp" aria-hidden="true">
        <label htmlFor="cf-company">Company</label>
        <input id="cf-company" name="company" tabIndex={-1} autoComplete="off" value={form.company} onChange={set("company")} />
      </div>
      <div className="ct-foot">
        <button type="submit" className="btn btn--solid" disabled={sending}>
          {sending ? (
            <>
              Sending
              <Loader2 aria-hidden="true" className="ct-spin" />
            </>
          ) : (
            <>
              Send message
              <ArrowUpRight aria-hidden="true" />
            </>
          )}
        </button>
        <p className={`ct-status${status.kind === "error" ? " is-error" : ""}`} role="status" aria-live="polite">
          {status.text ?? ""}
        </p>
      </div>
    </form>
  );
}

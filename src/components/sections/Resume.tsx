import { ArrowUpRight, Download } from "lucide-react";
import { contact, profile } from "../../content/portfolio";
import "./Resume.css";

/**
 * Resume and profiles. Each action appears only once its URL is set in
 * content/portfolio.ts; in development a note lists what's missing.
 */
export default function Resume() {
  const social = (label: string) => contact.socials.find((s) => s.label === label)?.href ?? "";
  const actions = [
    { label: "Download resume", href: profile.resumeUrl, key: "profile.resumeUrl", download: true },
    { label: "View GitHub", href: social("GitHub"), key: 'contact.socials "GitHub"' },
    { label: "Connect on LinkedIn", href: social("LinkedIn"), key: 'contact.socials "LinkedIn"' },
    { label: "Email me", href: contact.email ? `mailto:${contact.email}` : "", key: "contact.email" },
  ];
  const ready = actions.filter((a) => a.href);
  const missing = actions.filter((a) => !a.href);
  // nothing to offer yet: leave the section out of the live site entirely
  if (!ready.length && !import.meta.env.DEV) return null;

  return (
    <section id="resume" className="section rs" aria-labelledby="resume-title">
      <div className="shell">
        <div className="rs-panel glass glass--strong">
          <div>
            <p className="kicker">
              <span className="kicker__num">08</span>
              <span>Resume & profiles</span>
            </p>
            <h2 id="resume-title" className="rs-title">
              The full record, in one place.
            </h2>
          </div>

          {ready.length > 0 && (
            <ul className="rs-actions">
              {ready.map((a, i) => {
                const external = /^https?:/.test(a.href);
                return (
                  <li key={a.label}>
                    <a
                      className={`btn ${i === 0 ? "btn--solid" : "btn--line"}`}
                      href={a.href}
                      {...(a.download ? { download: "" } : {})}
                      {...(external ? { target: "_blank", rel: "noreferrer noopener" } : {})}
                    >
                      {a.label}
                      {a.download ? <Download aria-hidden="true" /> : <ArrowUpRight aria-hidden="true" />}
                      {external && <span className="sr-only"> (opens in a new tab)</span>}
                    </a>
                  </li>
                );
              })}
            </ul>
          )}

          {import.meta.env.DEV && missing.length > 0 && (
            <p className="rs-setup mono">
              Development note: set {missing.map((m) => m.key).join(", ")} in src/content/portfolio.ts to show{" "}
              {missing.map((m) => `"${m.label}"`).join(", ")}.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

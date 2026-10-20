import { ArrowUp } from "lucide-react";
import { contact, nav, profile } from "../../content/portfolio";
import { BrandMark } from "../ui/BrandMark";
import "./SiteFooter.css";

export default function SiteFooter() {
  const socials = contact.socials.filter((s) => s.href);

  return (
    <footer className="footer">
      <div className="shell">
        <div className="footer__top">
          <a className="footer__brand" href="#home">
            <BrandMark className="footer__mark" />
            {profile.name}
          </a>
          <nav aria-label="Footer">
            <ul className="footer__nav">
              {nav.map((n) => (
                <li key={n.href}>
                  <a href={n.href}>{n.label}</a>
                </li>
              ))}
              {socials.map((s) => (
                <li key={s.label}>
                  <a href={s.href} target="_blank" rel="noreferrer noopener">
                    {s.label}
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="footer__bottom mono">
          <p>
            © {new Date().getFullYear()} {profile.name} · {profile.location}
          </p>
          <a href="#home" className="footer__top-link">
            Back to top
            <ArrowUp aria-hidden="true" />
          </a>
        </div>
      </div>
    </footer>
  );
}

// File: src/components/sections/SiteFooter.tsx
import { profile } from "../../content/portfolio";

export default function SiteFooter() {
  return (
    <footer className="footer">
      <div className="shell footer__inner">
        <p>
          © {new Date().getFullYear()} {profile.name}
        </p>
        <p>Built with React, Three.js, GSAP and Animate UI.</p>
        <a href="#home">Back to top</a>
      </div>
    </footer>
  );
}
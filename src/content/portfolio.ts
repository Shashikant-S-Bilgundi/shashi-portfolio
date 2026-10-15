/**
 * Every word on the page lives here so copy edits never touch a component.
 *
 * ⚠ ITEMS MARKED `TODO` ARE PLACEHOLDERS — I did not have your real values, and
 *   I deliberately did not invent any. Fill these in before you deploy:
 *     • contact.email, contact.phone
 *     • contact.socials[].href
 *     • projects[].href / projects[].repo  (left empty = the link is not rendered)
 *     • experience[] dates and company names
 */

export interface ProjectLink {
  label: string;
  href: string;
}

export interface Project {
  /** Short display name. */
  name: string;
  /** One line that says what it is. */
  tagline: string;
  /** 1–2 sentences on what you actually built. */
  blurb: string;
  /** Tech badges, most distinctive first. */
  stack: string[];
  /** Leave empty to hide the link. */
  href?: string;
  repo?: string;
  /** `true` renders the live interactive demo slot instead of a static card. */
  featured?: boolean;
}

export interface SkillGroup {
  title: string;
  items: string[];
}

export interface Role {
  company: string;
  title: string;
  period: string;
  location: string;
  points: string[];
}

/* -------------------------------------------------------------------------- */
/* Identity                                                                    */
/* -------------------------------------------------------------------------- */

export const profile = {
  name: "Shashikant Bilgundi",
  role: "MERN Stack Developer | Full Stack Software Developer",
  headline: "BUILDING THE WEB. THINKING BEYOND THE ORDINARY.",
  description:
    "I build scalable web applications, CRM platforms, management systems, and modern digital experiences.",
  location: "Bengaluru, India",
  ctaPrimary: { label: "EXPLORE MY WORK", href: "#work" },
  ctaSecondary: { label: "CONTACT ME", href: "#contact" },
} as const;

export const about = {
  eyebrow: "Who's behind the mask",
  heading: "Full stack, end to end",
  paragraphs: [
    "I'm a full stack developer based in Bengaluru, working across the whole lifecycle of a product — schema design and API architecture through to the interface people actually touch, and the infrastructure it runs on.",
    "Most of what I ship is operational software: CRMs, project management and attendance systems, booking engines, desktop time trackers, and the marketing sites that sell them. I tend to be the person who owns a product from empty repository to production deployment.",
    "I care about the parts users never see — idempotent booking flows, tenant isolation, cache keys that don't collide, fare engines that don't quietly undercharge — because that's usually where the real work is.",
  ],
  stats: [
    { value: "Full stack", label: "Frontend, backend, DevOps" },
    { value: "MERN", label: "Primary stack" },
    { value: "Bengaluru", label: "Based in India" },
  ],
};

/* -------------------------------------------------------------------------- */
/* Skills                                                                      */
/* -------------------------------------------------------------------------- */

export const skills: SkillGroup[] = [
  {
    title: "Frontend",
    items: ["React", "TypeScript", "Vike / SSG", "React Native · Expo", "Tailwind CSS", "GSAP", "Fabric.js", "Three.js"],
  },
  {
    title: "Backend",
    items: ["Node.js", "Express", "REST APIs", "Prisma", "Mongoose", "JWT & RBAC", "WebSockets"],
  },
  {
    title: "Data",
    items: ["MongoDB · Atlas", "PostgreSQL", "Redis · Upstash", "Schema design", "Query optimisation"],
  },
  {
    title: "Platform & DevOps",
    items: ["Hetzner VPS", "PM2", "Cloudflare Pages & Workers", "Render", "Railway", "GitHub Actions", "Cloudinary"],
  },
  {
    title: "Desktop & Integrations",
    items: ["Electron", "Auto-update pipelines", "MSG91 / WhatsApp", "Brevo SMTP + IMAP", "Telegram bots", "Biometric ADMS"],
  },
];

/* -------------------------------------------------------------------------- */
/* Work                                                                        */
/* -------------------------------------------------------------------------- */

export const projects: Project[] = [
  {
    name: "SkyUp Project Management",
    tagline: "ERP-grade project, attendance and productivity platform",
    blurb:
      "Biometric attendance via ADMS push integration, WFH-gated clock-in/out, break and leave tracking, phase-gated task templates with CSV import, in-app webmail and team chat. Productivity summaries are generated per employee and broadcast as digests.",
    stack: ["React", "Node.js", "MongoDB", "Cloudflare Pages", "Render", "Telegram"],
    href: "https://skyupprojectmanagement.com",
  },
  {
    name: "SkyUp CRM",
    tagline: "Multi-tenant CRM with a hardened security model",
    blurb:
      "Server-side lead masking with audited reveal endpoints, AES-256-GCM encryption at rest, JWT hardening and strict tenant isolation. Profiling traced slow paths to an unindexed duplicate-guard scan and serial outbound sends, both since reworked.",
    stack: ["React", "Node.js", "MongoDB", "AES-256-GCM", "JWT"],
  },
  {
    name: "SkyUp Tracker",
    tagline: "Cross-platform desktop time tracker",
    blurb:
      "Electron app with wall-clock accrual for drift-free timing, periodic screenshot capture, an idle-reason prompt system, a custom protocol handler and auto-update shipped through GitHub Releases across versions 0.4 to 0.7.",
    stack: ["Electron", "Node.js", "Cloudinary", "GitHub Releases"],
  },
  {
    name: "ABHICABS",
    tagline: "Cab booking platform — rider app and backend",
    blurb:
      "A 21-table PostgreSQL schema behind a fare engine, a booking engine with idempotency guarantees and a lifecycle state machine, plus Redis-backed OTP, caching and RBAC. Rider app covers auth and the full booking flow.",
    stack: ["React Native · Expo", "Node.js", "PostgreSQL", "Prisma", "Redis"],
  },
  {
    name: "Gruhakalpa",
    tagline: "Housing co-operative management system",
    blurb:
      "Membership lifecycle, FD/RD deposit modules with compounding interest and certificate generation, waterfall payment allocation across site-booking receipts, an inward/outward correspondence register, and WhatsApp payment reminders.",
    stack: ["MERN", "MongoDB Atlas", "Cloudinary", "MSG91"],
  },
  {
    name: "Print Design Editor",
    tagline: "In-browser editor for print e-commerce",
    blurb:
      "A canvas editor for visiting cards and letterheads with a multi-product template registry, 18 product geometry definitions, zoom/pan viewport controls and an API-driven catalogue.",
    stack: ["Vike", "React", "Fabric.js"],
  },
  {
    name: "LauncherDesk Bot",
    tagline: "Low-latency WhatsApp automation",
    blurb:
      "Conversational WhatsApp bot tuned hard for response time: keep-alive HTTP agents, in-memory session cache, concurrent save-and-send, pooled database connections and a latency tracking endpoint.",
    stack: ["Node.js", "MSG91", "MongoDB", "Hetzner"],
  },
  {
    name: "Salary Payslip",
    tagline: "Pre-rendered payroll document app",
    blurb:
      "Statically pre-rendered frontend served from the edge, talking to a separately hosted API. Migrated off a suspended host onto Cloudflare Workers with no downtime for the backend.",
    stack: ["Vike SSG", "Cloudflare Workers", "Railway"],
  },
];

/** Rendered as the live, playable demo inside the Work section. */
export const featuredDemo = {
  eyebrow: "Interactive",
  name: "Basketball Upload",
  blurb:
    "A file uploader built as a physics toy. Drag the ball back, aim at the hoop and release — a real trajectory solver decides whether the shot is on target, and sinking it kicks off the upload. Fully keyboard operable: arrow keys aim, Enter shoots.",
  stack: ["React", "TypeScript", "Custom physics", "Pointer Events", "a11y"],
  note: "Hand-written 2D projectile solver — no animation library involved.",
};

/* -------------------------------------------------------------------------- */
/* Experience                                                                  */
/* -------------------------------------------------------------------------- */

export const experience: Role[] = [
  {
    company: "SkyUp Digital Solutions",
    title: "Full Stack Developer",
    period: "TODO — add your start date", // TODO
    location: "Bengaluru, India",
    points: [
      "Sole or primary developer across several concurrent products — CRM, project management, desktop tracker and client sites.",
      "Own the full stack per product: schema and API design, React frontends, deployment and ongoing operations.",
      "Run infrastructure on Hetzner VPS with PM2, with frontends on Cloudflare Pages/Workers and managed Postgres/Mongo.",
      "Deliver integration work across biometric devices, WhatsApp messaging, transactional email and object storage.",
    ],
  },
];

/* -------------------------------------------------------------------------- */
/* Contact                                                                     */
/* -------------------------------------------------------------------------- */

export const contact = {
  eyebrow: "Light the signal",
  heading: "Let's build something",
  blurb:
    "Open to full stack roles, product work and freelance builds. The quickest way to reach me is email — the form below composes one for you.",
  /** TODO — your real address. The form falls back to a plain prompt while this is empty. */
  email: "",
  /** TODO — optional; omit the line entirely by leaving it empty. */
  phone: "",
  socials: [
    { label: "GitHub", href: "" }, // TODO
    { label: "LinkedIn", href: "" }, // TODO
    { label: "X", href: "" }, // TODO
  ] as ProjectLink[],
};

export const nav = [
  { label: "About", href: "#about" },
  { label: "Skills", href: "#skills" },
  { label: "Work", href: "#work" },
  { label: "Experience", href: "#experience" },
  { label: "Contact", href: "#contact" },
];
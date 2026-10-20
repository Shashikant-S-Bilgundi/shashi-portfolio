// File: src/content/portfolio.ts
import pmShot from "../assets/projects/skyup-pm.webp";
import crmShot from "../assets/projects/skyup-crm.webp";
import cabsShot from "../assets/projects/abhicabs.webp";
import trackerShot from "../assets/projects/skyup-tracker.webp";
import gruhakalpaShot from "../assets/projects/gruhakalpa.webp";
import portrait from "../assets/profile.webp";

/**
 * Every word on the page lives here, so copy edits never touch a component.
 *
 * ⚠ EMPTY STRINGS ARE DELIBERATE. I did not have these values and did not
 *   invent them. Anything left empty is simply not rendered, so there are no
 *   placeholder or broken links on the live site. Fill these in when you can:
 *     • contact.email          (also switches the contact form on)
 *     • contact.phone          (optional)
 *     • contact.socials[].href (LinkedIn, GitHub, X)
 *     • experience[].period    (e.g. "Jan 2023 – Present")
 *     • projects[].liveUrl / githubUrl / caseStudyUrl
 *     • contact.formEndpoint   (form service URL; see Contact below)
 *
 * Case-study fields are optional. Fill only what is true; empty fields are
 * not shown. Never add metrics you can't back up.
 *
 * Screenshots must not show real people's names, contact details or
 * personal activity: blur or crop before adding one.
 */

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

/** The four layers of the stack. They drive the hero model, the skills
 *  section and the "layers touched" diagram on every project card. */
export type LayerId = "interface" | "api" | "data" | "infra";

export interface Layer {
  id: LayerId;
  name: string;
  /** Compact name for small labels on project cards. */
  short: string;
  /** Shown beside the plate in the hero's exploded view. */
  examples: string;
}

export interface ProjectLinks {
  /** Public deployment. Leave empty to hide the "Live site" action. */
  liveUrl?: string;
  /** Public repository. Leave empty to hide the "Source code" action. */
  githubUrl?: string;
  /** Write-up or case study. Leave empty to hide the "Case study" action. */
  caseStudyUrl?: string;
}

export interface Project extends ProjectLinks {
  /** Stable id, used for the card's anchor (#project-<slug>). */
  slug: string;
  name: string;
  /** One line that says what it is. */
  tagline: string;
  /** One sentence on what it does. */
  summary: string;
  /** Key features and engineering problems solved. */
  highlights: string[];
  /** Tech badges, most distinctive first. Also decides which layers light up. */
  stack: string[];
  /** Optional screenshot (import it above). Projects without one show no image. */
  screenshot?: { src: string; alt: string; width: number; height: number };
  /** Renders as the large architecture panel at the top of the section. */
  featured?: boolean;
  /** Short category label, e.g. "CRM platform". */
  category?: string;
  /** Present for projects told as full case studies. */
  caseStudy?: CaseStudy;
}

export interface CaseStudy {
  problem?: string;
  role?: string;
  architecture?: string[];
  decisions?: string[];
  /** Verified, qualitative outcomes only. */
  outcomes?: string[];
}

export interface SkillGroup {
  /** Set for the four stack layers; absent for the supporting groups. */
  layer?: LayerId;
  title: string;
  description: string;
  items: string[];
}

export interface Role {
  company: string;
  title: string;
  /** Leave empty to hide. */
  period: string;
  location: string;
  points: string[];
  stack: string[];
  /** Slugs of projects built in this role; rendered as links to their cards. */
  projects: string[];
}

export interface SocialLink {
  label: "LinkedIn" | "GitHub" | "X";
  href: string;
}

/* -------------------------------------------------------------------------- */
/* Identity                                                                    */
/* -------------------------------------------------------------------------- */

export const profile = {
  name: "Shashikant Bilgundi",
  firstName: "Shashikant",
  lastName: "Bilgundi",
  initials: "SB",
  title: "Full stack developer in Bengaluru, India",
  eyebrow: "Full-stack developer · Bengaluru",
  headline: "I engineer digital products that move businesses forward.",
  tagline:
    "Full-stack web applications, business platforms and integrations that turn complex requirements into practical software, from schema to deployment.",
  meta: ["MERN stack development", "SaaS & business applications", "APIs & integrations"],
  /** TODO: put your resume in public/ and set "/resume.pdf". Empty hides every resume link. */
  resumeUrl: "/resume.pdf",
  photo: { src: portrait, alt: "Shashikant Bilgundi" },
  /** Shown in the nav. Set to "" when you're not taking work. */
  availability: "Open to roles & freelance",
  /** The rotating end of the "I build …" line in the hero. */
  builds: [
    "CRM platforms",
    "project management systems",
    "attendance systems",
    "booking engines",
    "desktop time trackers",
  ],
  intro:
    "I work across the whole stack, from database schema and APIs to the interface and the servers it runs on, building scalable web applications, CRM systems, project management platforms and modern web experiences.",
  location: "Bengaluru, India",
  ctaPrimary: { label: "Explore my work", href: "#projects" },
  ctaSecondary: { label: "Let's build something", href: "#contact" },
} as const;

export const layers: Layer[] = [
  { id: "interface", name: "Interface", short: "Interface", examples: "React, TypeScript, React Native" },
  { id: "api", name: "APIs and services", short: "APIs", examples: "Node.js, Express, REST, JWT" },
  { id: "data", name: "Data", short: "Data", examples: "MongoDB, PostgreSQL, Redis" },
  { id: "infra", name: "Infrastructure", short: "Infrastructure", examples: "Cloudflare, Hetzner, Render" },
];

/* -------------------------------------------------------------------------- */
/* About                                                                       */
/* -------------------------------------------------------------------------- */

export const about = {
  heading: "Beyond writing code. Building complete systems.",
  /** Rendered large, and lit word by word as you scroll. */
  statement:
    "I'm a full stack developer based in Bengaluru, working across the whole life of a product: schema design and API architecture, the interface people actually touch, and the infrastructure it runs on.",
  paragraphs: [
    "Most of what I ship is operational software: CRMs, project management and attendance systems, booking engines, desktop time trackers, and the marketing sites that sell them. I'm usually the person who owns a product from an empty repository to production.",
    "I care about the parts users never see, like idempotent booking flows, tenant isolation, cache keys that don't collide and fare engines that don't quietly undercharge, because that's usually where the real work is.",
  ],
  focusHeading: "What I focus on",
  focus: [
    { icon: "server", label: "Scalable backend systems" },
    { icon: "workflow", label: "API design and development" },
    { icon: "database", label: "Database design and query optimisation" },
    { icon: "monitor", label: "Responsive, accessible interfaces" },
    { icon: "layers", label: "Application architecture" },
  ] as const,
  /** Your approach, in your words. Edit freely. */
  approach:
    "I write code for the next person who has to change it: clear module boundaries, explicit data contracts, and trade-offs written down where they're made. I start from the business process the software has to serve, then work back to the schema.",
  facts: [
    { label: "Based in", value: "Bengaluru, India" },
    { label: "Primary stack", value: "MERN" },
    { label: "Works across", value: "Frontend, backend and DevOps" },
  ],
};

/* -------------------------------------------------------------------------- */
/* Experience                                                                  */
/* -------------------------------------------------------------------------- */

export const experience: Role[] = [
  {
    company: "SkyUp Digital Solutions",
    title: "Full Stack Developer",
    period: "", // TODO: add your dates, e.g. "Mar 2023 – Present"
    location: "Bengaluru, India",
    points: [
      "Sole or primary developer across several concurrent products: CRM, project management, desktop tracker and client sites.",
      "Own the full stack per product: schema and API design, React frontends, deployment and ongoing operations.",
      "Run infrastructure on Hetzner VPS with PM2, with frontends on Cloudflare Pages and Workers and managed Postgres and MongoDB.",
      "Deliver integration work across biometric devices, WhatsApp messaging, transactional email and object storage.",
    ],
    stack: ["React", "Node.js", "MongoDB", "PostgreSQL", "Electron", "Cloudflare Pages & Workers", "Hetzner VPS", "PM2"],
    projects: ["skyup-project-management", "skyup-crm", "skyup-tracker"],
  },
];

/* -------------------------------------------------------------------------- */
/* Skills                                                                      */
/* -------------------------------------------------------------------------- */

export const skills: SkillGroup[] = [
  {
    layer: "interface",
    title: "Interface",
    description: "What people see and touch, on the web and on phones.",
    items: [
      "React",
      "TypeScript",
      "JavaScript (ES6+)",
      "HTML5",
      "CSS3",
      "Tailwind CSS",
      "Bootstrap",
      "React Native (Expo)",
      "Vike / SSG",
      "GSAP",
      "Three.js",
      "Fabric.js",
    ],
  },
  {
    layer: "api",
    title: "APIs and services",
    description: "Business logic, authentication and the contracts between services.",
    items: ["Node.js", "Express.js", "REST APIs", "JWT authentication", "RBAC", "MVC architecture", "WebSockets", "Prisma", "Mongoose"],
  },
  {
    layer: "data",
    title: "Data",
    description: "Schemas, queries and caches that hold up as data grows.",
    items: ["MongoDB Atlas", "MySQL", "PostgreSQL", "Redis (Upstash)", "Schema design", "Query optimisation"],
  },
  {
    layer: "infra",
    title: "Infrastructure",
    description: "Where it runs, and how it gets there.",
    items: ["Hetzner VPS", "PM2", "Cloudflare Pages & Workers", "Vercel", "Render", "Railway", "GitHub Actions", "Cloudinary"],
  },
  {
    title: "Integrations and desktop",
    description: "Devices, messaging and apps outside the browser.",
    items: ["Electron", "Auto-update pipelines", "MSG91 / WhatsApp", "Brevo SMTP + IMAP", "Telegram bots", "Biometric ADMS"],
  },
  {
    title: "Everyday tools",
    description: "What I work in every day.",
    items: ["Git & GitHub", "Postman", "VS Code"],
  },
];

/* -------------------------------------------------------------------------- */
/* Projects                                                                    */
/* -------------------------------------------------------------------------- */

export const projects: Project[] = [
  {
    slug: "skyup-project-management",
    name: "SkyUp Project Management",
    tagline: "ERP-grade project, attendance and productivity platform",
    summary: "Runs a team's projects, attendance and day-to-day productivity in one place.",
    highlights: [
      "Biometric attendance through ADMS push integration",
      "WFH-gated clock-in and clock-out, with break and leave tracking",
      "Phase-gated task templates with CSV import",
      "In-app webmail and team chat",
      "Per-employee productivity summaries broadcast as digests",
    ],
    stack: ["React", "Node.js", "MongoDB", "Cloudflare Pages", "Render", "Telegram"],
    liveUrl: "https://skyupprojectmanagement.com",
    screenshot: { src: pmShot, alt: "SkyUp Project Management productivity dashboard: team totals and per-employee productivity split, names blurred", width: 1600, height: 720 },
    featured: true,
    category: "Project management platform",
    caseStudy: {
      problem:
        "A team's projects, attendance, communication and productivity lived in separate places, with no single view of who was working on what.",
      role: "Sole or primary developer: schema and API design, the React frontend, deployment and operations.",
      architecture: [
        "React frontend on Cloudflare Pages, Node.js API on Render, MongoDB",
        "Biometric attendance devices push records to the API over ADMS",
        "Per-employee productivity digests broadcast to Telegram",
      ],
      decisions: [
        "Attendance comes from the devices themselves, with clock-in gated on work-from-home days",
        "Task templates are phase-gated so work follows the team's real process, with CSV import",
        "Mail and chat live inside the app, next to the work they're about",
      ],
      outcomes: ["Live in production"],
    },
  },
  {
    slug: "skyup-crm",
    name: "SkyUp CRM",
    tagline: "Multi-tenant CRM with a hardened security model",
    summary: "A CRM built around protecting the customer data it holds.",
    highlights: [
      "Server-side lead masking with audited reveal endpoints",
      "AES-256-GCM encryption at rest",
      "JWT hardening and strict tenant isolation",
      "Traced slow paths to an unindexed duplicate-guard scan and serial outbound sends, both since reworked",
    ],
    stack: ["React", "Node.js", "MongoDB", "AES-256-GCM", "JWT"],
    liveUrl: "https://skyupcrm.com",
    screenshot: { src: crmShot, alt: "SkyUp CRM dashboard: lead totals, hot and warm leads, phone and email reveal counts, and pipeline status", width: 1600, height: 727 },
    category: "CRM platform",
    caseStudy: {
      problem:
        "A multi-tenant CRM holds other businesses' customer data, so tenants must stay apart and lead details stay protected, even from the CRM's own users.",
      role: "Sole or primary developer across schema, API, frontend and deployment.",
      architecture: ["React frontend, Node.js API, MongoDB", "JWT authentication with strict per-tenant isolation"],
      decisions: [
        "Lead details are masked on the server; revealing one goes through an audited endpoint",
        "Sensitive fields are encrypted at rest with AES-256-GCM",
      ],
      outcomes: ["Traced slow paths to an unindexed duplicate-guard scan and serial outbound sends, both since reworked"],
    },
  },
  {
    slug: "skyup-tracker",
    name: "SkyUp Tracker",
    tagline: "Cross-platform desktop time tracker",
    summary: "An Electron app that records working time accurately and keeps itself up to date.",
    highlights: [
      "Wall-clock accrual for drift-free timing",
      "Periodic screenshot capture and an idle-reason prompt system",
      "Custom protocol handler",
      "Auto-update through GitHub Releases, shipped across versions 0.4 to 0.7",
    ],
    stack: ["Electron", "Node.js", "Cloudinary", "GitHub Releases"],
    screenshot: { src: trackerShot, alt: "Tracked-day summary from SkyUp Tracker: first and last activity, total and idle time, and productivity split", width: 1600, height: 617 },
  },
  {
    slug: "abhicabs",
    name: "ABHICABS",
    tagline: "Cab booking platform: rider app and backend",
    summary: "The backend and rider app for a cab service, built so bookings and fares stay correct.",
    highlights: [
      "21-table PostgreSQL schema behind the fare engine",
      "Booking engine with idempotency guarantees and a lifecycle state machine",
      "Redis-backed OTP, caching and RBAC",
      "Rider app covering auth and the full booking flow",
    ],
    stack: ["React Native (Expo)", "Node.js", "PostgreSQL", "Prisma", "Redis"],
    liveUrl: "https://abhicabs24x7.com",
    screenshot: { src: cabsShot, alt: "ABHICABS booking site: one-way, round-trip, local and airport booking form", width: 1600, height: 895 },
    category: "Booking & transport system",
    caseStudy: {
      problem: "A cab service needs bookings and fares that stay correct under retries, cancellations and concurrent requests.",
      role: "Built the backend and the rider app.",
      architecture: [
        "React Native (Expo) rider app",
        "Node.js API with Prisma over a 21-table PostgreSQL schema",
        "Redis for OTPs, caching and role checks",
      ],
      decisions: [
        "Booking requests are idempotent, so a retry never creates a second ride",
        "Every booking moves through an explicit lifecycle state machine",
        "Fares come from a dedicated engine on the server, never the device",
      ],
    },
  },
  {
    slug: "gruhakalpa",
    name: "Gruhakalpa",
    tagline: "Housing co-operative management system",
    summary: "Manages a housing co-operative's members, deposits and payments end to end.",
    highlights: [
      "Membership lifecycle management",
      "FD and RD deposit modules with compounding interest and certificate generation",
      "Waterfall payment allocation across site-booking receipts",
      "Inward and outward correspondence register",
      "WhatsApp payment reminders",
    ],
    stack: ["MERN stack", "MongoDB Atlas", "Cloudinary", "MSG91"],
    liveUrl: "https://gruhakalpa-frontend.pages.dev",
    screenshot: { src: gruhakalpaShot, alt: "Gruhakalpa admin dashboard: member, booking and receipt totals and upcoming payments, member names blurred", width: 1600, height: 911 },
  },
  {
    slug: "print-design-editor",
    name: "Print Design Editor",
    tagline: "In-browser editor for print e-commerce",
    summary: "A canvas editor for designing visiting cards and letterheads in the browser.",
    highlights: [
      "Multi-product template registry",
      "18 product geometry definitions",
      "Zoom and pan viewport controls",
      "API-driven catalogue",
    ],
    stack: ["Vike", "React", "Fabric.js"],
  },
  {
    slug: "launcherdesk-bot",
    name: "LauncherDesk Bot",
    tagline: "Low-latency WhatsApp automation",
    summary: "A conversational WhatsApp bot tuned hard for response time.",
    highlights: [
      "Keep-alive HTTP agents and pooled database connections",
      "In-memory session cache",
      "Concurrent save-and-send",
      "Latency tracking endpoint",
    ],
    stack: ["Node.js", "MSG91", "MongoDB", "Hetzner"],
  },
  {
    slug: "salary-payslip",
    name: "Salary Payslip",
    tagline: "Pre-rendered payroll document app",
    summary: "A statically pre-rendered frontend served from the edge, talking to a separately hosted API.",
    highlights: [
      "Static pre-rendering with Vike",
      "Served from Cloudflare Workers",
      "Migrated off a suspended host with no downtime for the backend",
    ],
    stack: ["Vike SSG", "Cloudflare Workers", "Railway"],
  },
];

/**
 * Which stack layer each technology belongs to. A project's "layers touched"
 * diagram is computed from its `stack` through this table, so it only ever
 * reflects what the project actually lists. Tags not listed here (MSG91,
 * Telegram, JWT…) simply don't light a layer.
 */
export const techLayer: Record<string, LayerId[]> = {
  React: ["interface"],
  "React Native (Expo)": ["interface"],
  Vike: ["interface"],
  "Vike SSG": ["interface"],
  "Fabric.js": ["interface"],
  Electron: ["interface"],
  "MERN stack": ["interface", "api", "data"],
  "Node.js": ["api"],
  Express: ["api"],
  Prisma: ["api"],
  MongoDB: ["data"],
  "MongoDB Atlas": ["data"],
  PostgreSQL: ["data"],
  Redis: ["data"],
  "Cloudflare Pages": ["infra"],
  "Cloudflare Workers": ["infra"],
  Render: ["infra"],
  Railway: ["infra"],
  Hetzner: ["infra"],
  "GitHub Releases": ["infra"],
  Cloudinary: ["infra"],
};

export function layersFor(stack: string[]): LayerId[] {
  const hit = new Set(stack.flatMap((t) => techLayer[t] ?? []));
  return layers.map((l) => l.id).filter((id) => hit.has(id));
}

/* -------------------------------------------------------------------------- */
/* Expertise                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Only work the projects show. Left out until done for real: subscription
 * and payment workflows, payment gateways, AI features.
 */
export const expertise = [
  {
    icon: "layout",
    title: "Full-stack web applications",
    items: ["React interfaces", "Node.js and Express APIs", "JWT auth and role-based access", "Responsive, reusable components"],
  },
  {
    icon: "briefcase",
    title: "SaaS & business platforms",
    items: ["CRM systems", "Project management and attendance", "Admin and employee dashboards", "Booking engines"],
  },
  {
    icon: "database",
    title: "Backend & data engineering",
    items: ["REST API design", "MongoDB, PostgreSQL, MySQL", "Modelling and query optimisation", "Redis caching", "Encryption and tenant isolation"],
  },
  {
    icon: "plug",
    title: "Integrations & deployment",
    items: ["WhatsApp, Telegram and email", "Biometric devices (ADMS)", "Cloudinary storage", "Hetzner, Cloudflare, Render", "Electron auto-updates"],
  },
] as const;

/* -------------------------------------------------------------------------- */
/* Workflow                                                                    */
/* -------------------------------------------------------------------------- */

export const workflow = [
  { title: "Understand", text: "Clarify requirements, users, constraints and business goals." },
  { title: "Architect", text: "Design component boundaries, APIs, data models and authorization." },
  { title: "Build", text: "Implement interfaces, backend logic, integrations and validation." },
  { title: "Verify", text: "Test critical flows, permissions, error handling and performance." },
  { title: "Deliver", text: "Deploy, document, monitor and improve the application." },
];

/* -------------------------------------------------------------------------- */
/* Achievements                                                                */
/* -------------------------------------------------------------------------- */

/** Specific accomplishments, each tied to the project that backs it. No counters. */
export const achievements = [
  { title: "Biometric attendance in production", basis: "ADMS push integration from attendance devices into a live platform.", project: "skyup-project-management" },
  { title: "Customer data protected by design", basis: "Server-side masking, audited reveal endpoints and AES-256-GCM at rest.", project: "skyup-crm" },
  { title: "Bookings that can't duplicate", basis: "Idempotent requests and a lifecycle state machine over a 21-table schema.", project: "abhicabs" },
  { title: "A desktop app that updates itself", basis: "Electron auto-updates through GitHub Releases, shipped from v0.4 to v0.7.", project: "skyup-tracker" },
  { title: "Host migration, backend untouched", basis: "Moved a frontend off a suspended host to Cloudflare Workers with no backend downtime.", project: "salary-payslip" },
  { title: "Real performance problems, diagnosed", basis: "Traced CRM slow paths to an unindexed scan and serial outbound sends.", project: "skyup-crm" },
];

/** Rendered as the live, playable demo inside the Projects section. */
export const featuredDemo = {
  name: "Basketball Upload",
  blurb:
    "A file uploader built as a physics toy. Drag the ball back, aim at the hoop and release: a real trajectory solver decides whether the shot is on target, and sinking it starts the upload. Fully keyboard operable, with arrow keys to aim and Enter to shoot.",
  stack: ["React", "TypeScript", "Custom physics", "Pointer Events", "Accessible"],
  note: "Hand-written 2D projectile solver, no animation library involved.",
};

/* -------------------------------------------------------------------------- */
/* Contact                                                                     */
/* -------------------------------------------------------------------------- */

export const contact = {
  heading: "Have a complex idea? Let's engineer it.",
  blurb:
    "Building a product, improving an existing platform, or looking for a developer who turns requirements into reliable software? Let's talk.",
  /**
   * TODO: a form service URL that accepts a JSON POST and answers 2xx on
   * success (e.g. https://formspree.io/f/xxxx). With it the form really
   * sends; without it, but with an email, it opens the visitor's mail app.
   * No secrets here: this file ships to the browser.
   */
  formEndpoint: "",
  projectTypes: ["New product / MVP", "Business platform", "Improve an existing app", "API or integration", "Full-time role", "Something else"],
  /** TODO: your real address. The contact form only appears once this is set. */
  email: "",
  /** TODO: optional. Leave empty to hide. */
  phone: "",
  socials: [
    { label: "LinkedIn", href: "" }, // TODO
    { label: "GitHub", href: "" }, // TODO
    { label: "X", href: "" }, // TODO
  ] as SocialLink[],
};

/* -------------------------------------------------------------------------- */
/* Navigation                                                                  */
/* -------------------------------------------------------------------------- */

/** Order matches the order of the sections on the page. */
export const nav = [
  { label: "About", href: "#about" },
  { label: "Expertise", href: "#expertise" },
  { label: "Projects", href: "#projects" },
  { label: "Experience", href: "#experience" },
  { label: "Contact", href: "#contact" },
] as const;

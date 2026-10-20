// File: scripts/smoke.mjs
/**
 * jsdom smoke test for the portfolio.
 *
 *   npm i --no-save jsdom esbuild     # dev-only, deliberately not in package.json
 *   npm run smoke
 *
 * Bundles the real app with esbuild and mounts it in jsdom. It checks that
 * the app boots without errors, that every section and the nav are wired,
 * that the camera journey is a pure, reversible function of scroll, that
 * the stage falls back without WebGL (jsdom has none), that links, resume
 * and contact form only appear once configured, that the form validates and
 * never claims success it didn't get, that reduced motion leaves nothing
 * hidden, and that every ScrollTrigger is torn down on unmount.
 *
 * It is not a visual test: jsdom has no layout engine or GPU.
 */
import { build } from "esbuild";
import { JSDOM } from "jsdom";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");

let pass = 0;
let fail = 0;
const check = (label, cond, detail = "") => {
  if (cond) {
    pass++;
    console.log(`  ✓ ${label}`);
  } else {
    fail++;
    console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ""}`);
  }
};

/* ---------- 1. bundle ----------
   One bundle on purpose: React, ReactDOM, GSAP and the app must share
   a single React instance. A second bundle swaps in a test email address so
   the contact form can be exercised without editing your content file. */
async function bundle({ withEmail = false } = {}) {
  const swapEmail = {
    name: "test-email",
    setup(b) {
      b.onLoad({ filter: /content[\\/]portfolio\.ts$/ }, (args) => ({
        contents: readFileSync(args.path, "utf8").replace(/email: "",/, 'email: "hello@example.test",'),
        loader: "ts",
      }));
    },
  };
  const out = await build({
    stdin: {
      contents: `
        import * as React from "react";
        import * as ReactDOM from "react-dom/client";
        import { ScrollTrigger } from "./src/lib/motion";
        import * as content from "./src/content/portfolio";
        import { KEYFRAMES, poseAt } from "./src/lib/journey";
        import App from "./src/App";
        export { React, ReactDOM, ScrollTrigger, content, KEYFRAMES, poseAt, App };
      `,
      resolveDir: root,
      loader: "ts",
    },
    bundle: true,
    write: false,
    format: "iife",
    globalName: "HARNESS",
    platform: "browser",
    target: "es2022",
    jsx: "automatic",
    plugins: withEmail ? [swapEmail] : [],
    // the 3D scene is never reached in jsdom (no WebGL); keep three out of the bundle
    external: ["./JourneyScene"],
    loader: { ".css": "empty", ".webp": "dataurl", ".svg": "dataurl", ".png": "dataurl", ".woff2": "empty" },
    define: {
      "process.env.NODE_ENV": '"development"',
      "import.meta.env.DEV": "true",
      "import.meta.env": '{"DEV":true}',
    },
    logLevel: "silent",
  });
  return out.outputFiles[0].text;
}

const appCode = await bundle();
const appCodeWithEmail = await bundle({ withEmail: true });

/* ---------- 2. jsdom environment ---------- */
const STYLES = [
  "src/index.css",
  "src/components/Hero.css",
  "src/components/SiteNav.css",
  "src/components/scene/SceneStage.css",
  "src/components/sections/About.css",
  "src/components/sections/Expertise.css",
  "src/components/projects/Projects.css",
  "src/components/sections/Skills.css",
  "src/components/sections/Workflow.css",
  "src/components/sections/Experience.css",
  "src/components/sections/Achievements.css",
  "src/components/sections/Resume.css",
  "src/components/sections/Contact.css",
  "src/components/sections/SiteFooter.css",
];

function makeDom({ reducedMotion = false, width = 1440 } = {}) {
  const dom = new JSDOM(`<!doctype html><html><body><div id="root"></div></body></html>`, {
    pretendToBeVisual: true,
    runScripts: "outside-only",
    url: "http://localhost/",
  });
  const { window } = dom;

  for (const file of STYLES) {
    const style = window.document.createElement("style");
    style.textContent = readFileSync(resolve(root, file), "utf8");
    window.document.head.appendChild(style);
  }

  window.matchMedia = (query) => {
    const q = String(query);
    let matches = false;
    if (q.includes("prefers-reduced-motion: reduce")) matches = reducedMotion;
    else if (q.includes("prefers-reduced-motion: no-preference")) matches = !reducedMotion;
    else if (q.includes("min-width: 861px")) matches = width >= 861;
    else if (q.includes("max-width: 860px")) matches = width <= 860;
    else if (q.includes("min-width: 961px")) matches = width >= 961;
    else if (q.includes("max-width: 1024px")) matches = width <= 1024;
    if (q.includes(" and ") && !q.includes("hover")) {
      matches = q
        .split(" and ")
        .map((part) => part.trim().replace(/^\(|\)$/g, ""))
        .every((part) => window.matchMedia(`(${part})`).matches);
    }
    return {
      matches,
      media: q,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      onchange: null,
      dispatchEvent: () => false,
    };
  };

  class Obs {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }
  window.ResizeObserver = Obs;
  window.IntersectionObserver = Obs;
  window.scrollTo = () => {};
  window.HTMLElement.prototype.scrollIntoView = () => {};
  Object.defineProperty(window.document, "fonts", { value: { ready: Promise.resolve() }, configurable: true });
  Object.defineProperty(window, "innerWidth", { value: width, configurable: true });
  Object.defineProperty(window, "innerHeight", { value: 900, configurable: true });
  window.MessageChannel = MessageChannel;
  window.queueMicrotask = queueMicrotask;
  window.IS_REACT_ACT_ENVIRONMENT = true;
  return dom;
}

async function mount({ reducedMotion = false, width = 1440, code = appCode } = {}) {
  const dom = makeDom({ reducedMotion, width });
  const { window } = dom;
  const errors = [];
  window.console.error = (...a) => errors.push(a.join(" "));
  window.console.warn = () => {};

  vm.runInContext(code, dom.getInternalVMContext(), { filename: "app.js" });
  const H = window.HARNESS;
  const reactRoot = H.ReactDOM.createRoot(window.document.getElementById("root"));
  await H.React.act(async () => reactRoot.render(H.React.createElement(H.App)));
  return { dom, window, errors, reactRoot, ...H };
}

const click = (window, React, el) =>
  React.act(async () => el.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true })));

/* ---------- 3. tests ---------- */
console.log("\nDESKTOP, MOTION ALLOWED");
{
  const { window, errors, reactRoot, React, ScrollTrigger, content, KEYFRAMES, poseAt } = await mount();
  const d = window.document;

  check("mounts without console errors", errors.length === 0, errors[0]);

  const ids = [...d.querySelectorAll("main section[id]")].map((s) => s.id);
  check(
    "every section renders, in order",
    ids.join(",") === "home,about,expertise,projects,skills,workflow,experience,achievements,resume,contact",
    ids.join(","),
  );
  const navLabels = [...d.querySelectorAll(".nav__primary .nav__link")].map((a) => a.textContent.trim());
  check("nav items match the brief", navLabels.join("|") === "About|Expertise|Projects|Experience|Contact", navLabels.join("|"));
  const anchors = [...d.querySelectorAll("a[href^='#']")].map((a) => a.getAttribute("href"));
  const unresolved = anchors.filter((h) => h.length > 1 && !d.getElementById(h.slice(1)));
  check("every in-page link resolves to an element", unresolved.length === 0, unresolved.join(", "));

  const h1 = d.querySelector("h1");
  check("h1 is the headline, as real text", h1.textContent.replace(/\s+/g, " ").trim() === content.profile.headline, h1.textContent);
  check("the name is on the page", /Shashikant Bilgundi/.test(d.querySelector(".hero__eyebrow").textContent));
  const ctas = [...d.querySelectorAll(".hero__actions a")].map((a) => a.getAttribute("href"));
  check("hero CTAs point at Projects and Contact", ctas.join(" ") === "#projects #contact", ctas.join(" "));

  /* the stage: jsdom has no WebGL */
  const stage = d.querySelector(".stage");
  check("stage falls back without WebGL", stage?.dataset.mode === "fallback");
  check("fallback draws the four layers", d.querySelectorAll(".sf__plate").length === 4);
  check("no canvas without WebGL", !d.querySelector("canvas"));
  check("stage is hidden from assistive tech", stage?.getAttribute("aria-hidden") === "true");

  /* the journey is a pure function of scroll position */
  const anchorsAt = KEYFRAMES.map((k, i) => ({ y: i * 1000, pose: k.pose }));
  const a = poseAt(2500, anchorsAt);
  const b = poseAt(2500, anchorsAt);
  check("same scroll position, same pose (reversible)", JSON.stringify(a) === JSON.stringify(b));
  const at3 = poseAt(3000, anchorsAt);
  check("poses hit each keyframe exactly", Object.keys(at3).every((k) => Math.abs(at3[k] - KEYFRAMES[3].pose[k]) < 1e-9));
  check("before the first anchor holds the opening shot", JSON.stringify(poseAt(-50, anchorsAt)) === JSON.stringify(KEYFRAMES[0].pose));
  const mid = poseAt(500, anchorsAt);
  check("between anchors the camera is between keyframes", mid.cz < KEYFRAMES[0].pose.cz && mid.cz > KEYFRAMES[1].pose.cz);
  check("opening shot is wide, then the camera dollies in", KEYFRAMES[0].pose.cz > KEYFRAMES[1].pose.cz + 8);

  /* projects */
  const projects = content.projects;
  check("every project has an anchor", projects.every((p) => d.getElementById(`project-${p.slug}`)));
  const studies = projects.filter((p) => p.caseStudy);
  check("CRM, project management and booking are case studies", ["skyup-crm", "skyup-project-management", "abhicabs"].every((s) => studies.some((p) => p.slug === s)));
  check("each case study renders its panel", d.querySelectorAll("article.cs").length === studies.length);
  const shots = [...d.querySelectorAll("#projects .shot img")];
  check("a screenshot for every project that has one", shots.length === projects.filter((p) => p.screenshot).length, `${shots.length}`);
  check("every screenshot has alt text, size and lazy loading", shots.every((i) => i.alt.length > 20 && i.getAttribute("width") && i.getAttribute("height") && i.getAttribute("loading") === "lazy"));
  check("remaining projects are expandable rows", d.querySelectorAll("details.pj-row").length === projects.length - studies.length);
  const live = [...d.querySelectorAll("#projects a")].filter((a) => /Live site/.test(a.textContent));
  check("a Live site link only where a liveUrl exists", live.length === projects.filter((p) => p.liveUrl).length);
  const badLinks = [...d.querySelectorAll("a")].filter((a) => {
    const h = a.getAttribute("href");
    return h === null || h === "" || h === "#";
  });
  check("no empty or placeholder links anywhere", badLinks.length === 0, badLinks.map((a) => a.outerHTML.slice(0, 60)).join(" | "));
  const unsafe = [...d.querySelectorAll("a[target='_blank']")].filter((a) => !/noopener/.test(a.rel));
  check("external links use rel=noopener", unsafe.length === 0);
  check("BasketballUpload widget mounted", !!d.querySelector(".bbu .bbu__ball-btn"));
  check("no invented metrics: no percentages in projects or achievements", !/\d+\s?%/.test(d.getElementById("projects").textContent + d.getElementById("achievements").textContent));

  /* expertise, stack, workflow, experience, achievements */
  check("four expertise modules", d.querySelectorAll(".ex-card").length === 4);
  const skTabs = [...d.querySelectorAll(".sk-tab")];
  check("stack has a tab per category", skTabs.length === content.skills.length);
  await click(window, React, skTabs[2]);
  await React.act(() => new Promise((r) => setTimeout(r, 800))); // let the exit transition finish
  check("choosing a category shows its tools", skTabs[2].getAttribute("aria-selected") === "true" && /PostgreSQL/.test(d.getElementById("sk-panel").textContent));
  await React.act(async () => skTabs[2].dispatchEvent(new window.KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true })));
  check("arrow keys move between categories", skTabs[3].getAttribute("aria-selected") === "true");
  check("five workflow steps", d.querySelectorAll(".wf-step").length === 5);
  const productLinks = [...d.querySelectorAll(".xp-products a")].map((a) => a.getAttribute("href"));
  check("experience links to its products", productLinks.length === 3 && productLinks.every((h) => d.querySelector(h)));
  check("empty period is not rendered", !d.querySelector(".xp-period"));
  check("every achievement links to a real project", [...d.querySelectorAll(".ac-link")].every((a) => d.querySelector(a.getAttribute("href"))));

  /* resume and contact with nothing configured */
  check("resume downloads from the nav and the Resume section", d.querySelectorAll("a[download][href='/resume.pdf']").length >= 2);
  check("dev note lists the profiles still missing", /contact\.socials/.test(d.querySelector(".rs-setup")?.textContent ?? ""));
  check("profile photo has alt text", !!d.querySelector(".ab-photo img[alt]"));
  check("no contact form without an endpoint or email", !d.querySelector("form"));
  check("dev note explains how to enable the form", /formEndpoint/.test(d.querySelector(".ct-setup")?.textContent ?? ""));

  /* mobile menu */
  const toggle = d.querySelector(".nav__toggle");
  await click(window, React, toggle);
  check("menu opens", d.querySelector(".nav").classList.contains("is-open") && !!d.getElementById("nav-menu"));
  check("toggle reports expanded", toggle.getAttribute("aria-expanded") === "true");
  check("page behind the menu is inert", d.getElementById("main").hasAttribute("inert"));
  check("page scroll locked while open", d.body.style.overflow === "hidden");
  await React.act(async () => d.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true })));
  check("Escape closes the menu", !d.querySelector(".nav").classList.contains("is-open"));
  await click(window, React, toggle);
  await click(window, React, d.querySelector("#nav-menu a[href='#projects']"));
  check("choosing a menu item closes the menu", !d.querySelector(".nav").classList.contains("is-open"));
  check("scroll lock and inert released", d.body.style.overflow !== "hidden" && !d.getElementById("main").hasAttribute("inert"));

  await React.act(async () => reactRoot.unmount());
  check("all ScrollTriggers killed on unmount", ScrollTrigger.getAll().length === 0, `${ScrollTrigger.getAll().length} left`);
  check("no errors accumulated", errors.length === 0, errors.join(" | "));
}

console.log("\nCONTACT FORM (email configured, no endpoint)");
{
  const { window, errors, reactRoot, React } = await mount({ code: appCodeWithEmail });
  const d = window.document;
  const form = d.querySelector(".ct-form");
  check("form appears once contact.email is set", !!form);
  check("email link appears too", d.querySelector("a[href='mailto:hello@example.test']") !== null);
  check("every field has a label", [...form.querySelectorAll("input:not(#cf-company), select, textarea")].every((el) => form.querySelector(`label[for='${el.id}']`)));
  check("honeypot is hidden from people", form.querySelector(".ct-hp")?.getAttribute("aria-hidden") === "true");

  const status = () => d.querySelector(".ct-status").textContent;
  const submit = () =>
    React.act(async () => form.dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true })));
  const setVal = async (sel, value) => {
    const el = d.querySelector(sel);
    const proto = el.tagName === "TEXTAREA" ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
    await React.act(async () => {
      Object.getOwnPropertyDescriptor(proto, "value").set.call(el, value);
      el.dispatchEvent(new window.Event("input", { bubbles: true }));
    });
  };

  await submit();
  check("empty form is rejected", /name/i.test(status()), status());
  await setVal("#cf-name", "Asha");
  await setVal("#cf-email", "not-an-email");
  await setVal("#cf-message", "Hi");
  await submit();
  check("bad email is rejected", /email/i.test(status()), status());
  await setVal("#cf-email", "asha@example.test");
  await submit();
  check("short message is rejected", /sentence/i.test(status()), status());
  await setVal("#cf-message", "I'd like to talk about a CRM project.");
  await submit();
  check("without an endpoint it hands off to the mail app, and says so", /mail app/i.test(status()), status());

  await React.act(async () => reactRoot.unmount());
  check("clean teardown", errors.length === 0, errors.join(" | "));
}

console.log("\nREDUCED MOTION");
{
  const { window, errors, reactRoot, React, ScrollTrigger } = await mount({ reducedMotion: true });
  const d = window.document;
  check("mounts without console errors", errors.length === 0, errors[0]);
  check("nothing is pinned", ScrollTrigger.getAll().every((t) => !t.pin));
  const hidden = [...d.querySelectorAll("[data-reveal]")].filter((el) => el.style.opacity === "0");
  check("nothing is left hidden waiting for an animation", hidden.length === 0, `${hidden.length} hidden`);
  check("no scroll-scrubbed effects", ScrollTrigger.getAll().length === 0, `count=${ScrollTrigger.getAll().length}`);
  await React.act(async () => reactRoot.unmount());
  check("clean teardown", ScrollTrigger.getAll().length === 0);
}

console.log("\nMOBILE WIDTH, MOTION ALLOWED");
{
  const { window, errors, reactRoot, React, ScrollTrigger } = await mount({ width: 390 });
  check("mounts without console errors", errors.length === 0, errors[0]);
  check("nothing is pinned (no scroll hijacking)", ScrollTrigger.getAll().every((t) => !t.pin));
  const d = window.document;
  const toggle = d.querySelector(".nav__toggle");
  check("mobile menu toggle present", !!toggle);
  await click(window, React, toggle);
  check("opening the menu moves focus into it", d.activeElement?.classList.contains("nav__menu-link"));
  // Escape → focus back on the toggle needs real media queries (jsdom keeps the
  // toggle display:none), so that one is checked in a browser, not here.
  await React.act(async () => reactRoot.unmount());
  check("clean teardown", ScrollTrigger.getAll().length === 0);
}

/* ---------- 4. static CSS audit ---------- */
console.log("\nSTATIC CSS AUDIT");
{
  const read = (f) => readFileSync(resolve(root, f), "utf8");
  const index = read("src/index.css");
  check("html and body clip horizontal overflow", /html\s*\{[^}]*overflow-x:\s*clip/s.test(index) && /body\s*\{[^}]*overflow-x:\s*clip/s.test(index));
  check("sections clear the fixed nav on anchor jump", /\.section\s*\{[^}]*scroll-margin-top:\s*var\(--nav-h\)/s.test(index));
  check("reduced-motion block in base styles", /prefers-reduced-motion:\s*reduce/.test(index));
  check("glass has a solid fallback without backdrop-filter", /@supports not \(\(backdrop-filter/.test(index));
  check("button hover fills are limited to real hover", /@media \(hover: hover\) and \(pointer: fine\)\s*\{[^@]*\.btn--solid:hover/s.test(index));
  check("brand colours are the brief's", /--ink:\s*#282b4a/.test(index) && /--paper:\s*#eeebda/.test(index));
  const hex = STYLES.flatMap((f) => read(f).match(/#[0-9a-f]{6}\b/gi) ?? []);
  check("no third colour in the site's styles", hex.every((h) => /^#(282b4a|eeebda)$/i.test(h)), hex.join(" "));
  check("form inputs are 16px (no iOS zoom)", /font-size:\s*1rem/.test(read("src/components/sections/Contact.css")));
}

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);

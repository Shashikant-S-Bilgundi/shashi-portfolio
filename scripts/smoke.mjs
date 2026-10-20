// File: scripts/smoke.mjs
/**
 * jsdom smoke test for the portfolio.
 *
 *   npm i --no-save jsdom esbuild     # dev-only, deliberately not in package.json
 *   npm run smoke
 *
 * Bundles the real app with esbuild and mounts it in jsdom. It checks that
 * the app boots without errors, that the sections and nav are wired, that
 * project links only render when a URL exists, that the contact form only
 * appears once an email is configured, that the 3D stack falls back cleanly
 * without WebGL (jsdom has none), that reduced motion composes a static page,
 * and that every ScrollTrigger is torn down on unmount.
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
   One bundle on purpose: React, ReactDOM, GSAP, Motion and the app must share
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
        import { stackStore, stackTargets } from "./src/lib/stack";
        import * as content from "./src/content/portfolio";
        import App from "./src/App";
        export { React, ReactDOM, ScrollTrigger, stackStore, stackTargets, content, App };
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
  "src/components/sections/About.css",
  "src/components/sections/Experience.css",
  "src/components/sections/Skills.css",
  "src/components/sections/Contact.css",
  "src/components/projects/Projects.css",
  "src/components/BasketballUpload.css",
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
  const { window, errors, reactRoot, React, ScrollTrigger, stackStore, stackTargets, content } = await mount();
  const d = window.document;
  const text = d.body.textContent;

  check("mounts without console errors", errors.length === 0, errors[0]);
  check("no Batman theme left in the page", !/batman|gotham|bruce|wayne|behind the mask/i.test(text));

  const ids = [...d.querySelectorAll("main section[id]")].map((s) => s.id);
  check(
    "sections render in nav order",
    ids.join(",") === "home,about,experience,skills,projects,contact",
    ids.join(","),
  );

  const navLabels = [...d.querySelectorAll(".nav__bar .nav__link")].map((a) => a.textContent.trim());
  check(
    "nav items match the brief",
    navLabels.join("|") === "Home|About Me|Experience|Skills|Projects|Contact",
    navLabels.join("|"),
  );
  const anchors = [...d.querySelectorAll("a[href^='#']")].map((a) => a.getAttribute("href"));
  const unresolved = anchors.filter((h) => h.length > 1 && !d.getElementById(h.slice(1)));
  check("every in-page link resolves to an element", unresolved.length === 0, unresolved.join(", "));
  check("Home is the active nav item at the top", d.querySelector(".nav__link[aria-current]")?.textContent === "Home");

  const h1 = d.querySelector("h1");
  const spoken = [...h1.querySelectorAll(".sr-only")].map((s) => s.textContent).join(" ");
  check("h1 announces the full name", spoken === "Shashikant Bilgundi", spoken);
  const ctas = [...d.querySelectorAll(".hero__actions a")].map((a) => `${a.textContent}→${a.getAttribute("href")}`);
  check(
    "hero CTAs point at Projects and Contact",
    ctas.join(" ") === "View My Projects→#projects Let's Connect→#contact",
    ctas.join(" "),
  );
  check("typing line has screen-reader text", /CRM platforms/.test(d.querySelector(".hero__typed .sr-only")?.textContent ?? ""));

  /* 3D stage: jsdom has no WebGL, so this is the fallback path */
  check("stage falls back to CSS without WebGL", d.querySelector(".stage")?.dataset.mode === "fallback");
  check("fallback renders four plates", d.querySelectorAll(".sf__plate").length === 4);
  check("no canvas created without WebGL", !d.querySelector("canvas"));
  check("stage is hidden from assistive tech", d.querySelector(".stage")?.getAttribute("aria-hidden") === "true");

  /* choreography is a pure function of scroll progress */
  const L = { compact: false, reduced: false };
  const at = (s) => stackTargets({ hero: 0, page: 0, contact: 0, heroVisible: true, ...s }, L);
  const t0 = at({});
  const tMid = at({ hero: 0.55 });
  check("stack explodes and zooms in during the hero", tMid.explode > t0.explode && tMid.zoom < t0.zoom);
  check("layer labels show mid-hero only", t0.labels === 0 && tMid.labels > 0.9 && at({ hero: 1 }).labels === 0);
  check("stack dims behind reading text", at({ hero: 1, page: 0.5 }).presence < 0.5);
  check("stack reassembles at contact", at({ hero: 1, page: 1, contact: 1 }).explode < 0.1);
  check("scrolling back up returns the exact start pose", JSON.stringify(at({})) === JSON.stringify(t0));
  check("reduced motion ignores scroll", JSON.stringify(stackTargets({ hero: 0.7, page: 0.4, contact: 0, heroVisible: true }, { compact: false, reduced: true })) === JSON.stringify(stackTargets({ hero: 0, page: 0, contact: 0, heroVisible: true }, { compact: false, reduced: true })));

  /* ScrollTriggers */
  const triggers = ScrollTrigger.getAll();
  check("ScrollTriggers created", triggers.length > 20, `count=${triggers.length}`);
  const pinned = triggers.find((t) => !!t.pin);
  check("hero is pinned", !!pinned);
  if (pinned?.animation) {
    const copy = d.querySelector(".hero__copy");
    const cue = d.querySelector(".hero__cue");
    pinned.animation.progress(0).pause();
    const startCopy = copy.style.opacity;
    const startCue = cue.style.opacity;
    pinned.animation.progress(1).pause();
    check("hero copy clears by the end of the pin", copy.style.visibility === "hidden", copy.style.opacity);
    pinned.animation.progress(0).pause();
    check("hero copy rewinds to fully visible", copy.style.opacity === startCopy && copy.style.visibility !== "hidden");
    check("scroll cue is visible at the top", startCue === "" || Number(startCue) === 1, `opacity=${startCue}`);
  }
  check("stack store reports the hero as visible at the top", stackStore.get().heroVisible === true);

  /* projects */
  const projects = content.projects;
  for (const p of projects) {
    if (!d.getElementById(`project-${p.slug}`)) check(`project anchor #project-${p.slug}`, false);
  }
  check("every project has an anchor", projects.every((p) => d.getElementById(`project-${p.slug}`)));
  const anchorTransformed = [...d.querySelectorAll(".pj-cell[id], .pj-anchor")].some((el) => el.style.transform);
  check("project anchors are never transformed", !anchorTransformed);

  const live = [...d.querySelectorAll("#projects a")].filter((a) => /Live site/.test(a.textContent));
  const expectedLive = projects.filter((p) => p.liveUrl);
  check(
    "a Live site link for each project with a liveUrl, and no others",
    live.length === expectedLive.length && live.every((a, i) => a.href.startsWith(expectedLive[i].liveUrl)),
    live.map((a) => a.href).join(", "),
  );
  check("no source links rendered without a githubUrl", projects.filter((p) => p.githubUrl).length === [...d.querySelectorAll("#projects a")].filter((a) => /Source code/.test(a.textContent)).length);
  const badLinks = [...d.querySelectorAll("a")].filter((a) => {
    const h = a.getAttribute("href");
    return h === null || h === "" || h === "#";
  });
  check("no empty or placeholder links anywhere", badLinks.length === 0, badLinks.map((a) => a.outerHTML.slice(0, 60)).join(" | "));
  const unsafe = [...d.querySelectorAll("a[target='_blank']")].filter((a) => !/noopener/.test(a.rel));
  check("external links use rel=noopener", unsafe.length === 0);

  const footprints = [...d.querySelectorAll(".pj-card .pj-card__layers")].map((p) => p.textContent);
  check("layer footprints come from each tech list", footprints.some((t) => /Interface, Infrastructure/.test(t)), footprints.join(" / "));

  check("BasketballUpload widget mounted", !!d.querySelector(".bbu .bbu__ball-btn"));

  /* experience */
  const productLinks = [...d.querySelectorAll(".xp-products a")].map((a) => a.getAttribute("href"));
  check("experience links to its products' cards", productLinks.length === 3 && productLinks.every((h) => d.querySelector(h)));
  check("empty period is not rendered", !d.querySelector(".xp-period"));

  /* skills: no proficiency bars */
  check("skills render as six groups", d.querySelectorAll(".sk-band").length === 6);
  check("no progress bars or percentages in skills", !/\d+%/.test(d.getElementById("skills").textContent) && !d.querySelector("#skills progress"));

  /* contact without an email */
  check("no contact form without contact.email", !d.querySelector("form"));
  check("dev-only setup note explains how to enable it", /contact\.email/.test(d.querySelector(".ct-setup")?.textContent ?? ""));
  check("no mailto link without an email", !d.querySelector("a[href^='mailto:']"));

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
  const menuLink = d.querySelector("#nav-menu a[href='#projects']");
  await click(window, React, menuLink);
  check("choosing a menu item closes the menu", !d.querySelector(".nav").classList.contains("is-open"));
  check("scroll lock and inert released", d.body.style.overflow !== "hidden" && !d.getElementById("main").hasAttribute("inert"));

  await React.act(async () => reactRoot.unmount());
  check("all ScrollTriggers killed on unmount", ScrollTrigger.getAll().length === 0, `${ScrollTrigger.getAll().length} left`);
  check("no errors accumulated", errors.length === 0, errors.join(" | "));
}

console.log("\nCONTACT FORM (with an email configured)");
{
  const { window, errors, reactRoot, React } = await mount({ code: appCodeWithEmail });
  const d = window.document;
  const form = d.querySelector(".ct-form");
  check("form appears once contact.email is set", !!form);
  check("email link appears too", d.querySelector("a[href='mailto:hello@example.test']") !== null);
  check("dev setup note disappears", !d.querySelector(".ct-setup"));

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
  check("valid input hands off to the mail app", /mail app/i.test(status()), status());

  await React.act(async () => reactRoot.unmount());
  check("clean teardown", errors.length === 0, errors.join(" | "));
}

console.log("\nREDUCED MOTION");
{
  const { window, errors, reactRoot, React, ScrollTrigger } = await mount({ reducedMotion: true });
  const d = window.document;
  check("mounts without console errors", errors.length === 0, errors[0]);
  check("hero is NOT pinned", ScrollTrigger.getAll().filter((t) => !!t.pin).length === 0);
  const copy = d.querySelector(".hero__copy");
  check("hero copy is composed visible", copy.style.opacity !== "0" && copy.style.visibility !== "hidden");
  const items = [...d.querySelectorAll("[data-hero-item], [data-reveal]")].filter((el) => el.style.opacity === "0");
  check("nothing is left hidden waiting for an animation", items.length === 0, `${items.length} hidden`);
  check("no scroll-scrubbed section effects", ScrollTrigger.getAll().length <= 8, `count=${ScrollTrigger.getAll().length}`);
  await React.act(async () => reactRoot.unmount());
  check("clean teardown", ScrollTrigger.getAll().length === 0);
}

console.log("\nMOBILE WIDTH, MOTION ALLOWED");
{
  const { window, errors, reactRoot, React, ScrollTrigger } = await mount({ width: 390 });
  check("mounts without console errors", errors.length === 0, errors[0]);
  check("hero is pinned", ScrollTrigger.getAll().some((t) => !!t.pin));
  check("mobile menu toggle present", !!window.document.querySelector(".nav__toggle"));
  await React.act(async () => reactRoot.unmount());
  check("clean teardown", ScrollTrigger.getAll().length === 0);
}

/* ---------- 4. static CSS audit ----------
   jsdom has no layout engine, so these are read from source. They guard rules
   that are easy to regress: sideways scroll, anchors under the fixed nav,
   sticky hover on touch, and reduced motion. */
console.log("\nSTATIC CSS AUDIT");
{
  const read = (p) => readFileSync(resolve(root, p), "utf8");
  const index = read("src/index.css");
  const hero = read("src/components/Hero.css");
  const button = read("src/components/ui/Button.css");
  check("html clips horizontal overflow", /html\s*\{[^}]*overflow-x:\s*clip/s.test(index));
  check("body clips horizontal overflow", /body\s*\{[^}]*overflow-x:\s*clip/s.test(index));
  check("sections clear the fixed nav on anchor jump", /\.section\s*\{[^}]*scroll-margin-top:\s*var\(--nav-h\)/s.test(index));
  check("project anchors clear the fixed nav", /\.pj-cell\s*\{[^}]*scroll-margin-top/s.test(read("src/components/projects/Projects.css")));
  check("reduced-motion block in base styles", /prefers-reduced-motion:\s*reduce/.test(index));
  check("hero uses svh so mobile URL bars don't jump it", /100svh/.test(hero));
  check("button hover colours are limited to real hover", /@media \(hover: hover\) and \(pointer: fine\)\s*\{[^@]*\.btn--primary:hover/s.test(button));
  check("brand colours are the brief's", /--indigo:\s*#282b4a/.test(index) && /--vanilla:\s*#eeebda/.test(index));
}

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);

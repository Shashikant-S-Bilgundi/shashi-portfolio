/**
 * jsdom smoke test for the portfolio.
 *
 *   npm i --no-save jsdom esbuild     # dev-only, deliberately not in package.json
 *   node scripts/smoke.mjs
 *
 * Bundles the real app with esbuild and mounts it in jsdom to verify that it
 * boots, that GSAP/ScrollTrigger wire up and tear down cleanly, that the nav
 * anchors resolve, and that the contact form validates. It is not a visual
 * test — jsdom has no layout engine, so scroll positions and paint are out of
 * scope. Run it before handoff to catch crashes, bad imports and leaked
 * ScrollTriggers.
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
   Everything goes into ONE bundle on purpose: React, ReactDOM, GSAP and the
   app must share a single React instance or the hooks dispatcher is null. */
const bundled = await build({
  stdin: {
    contents: `
      import * as React from "react";
      import * as ReactDOM from "react-dom/client";
      import { ScrollTrigger } from "./src/lib/motion";
      import App from "./src/App";
      export { React, ReactDOM, ScrollTrigger, App };
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
  loader: { ".css": "empty", ".webp": "dataurl", ".svg": "dataurl", ".png": "dataurl" },
  define: { "process.env.NODE_ENV": '"development"' },
  logLevel: "silent",
});
const appCode = bundled.outputFiles[0].text;

/* ---------- 2. jsdom environment ---------- */
/* The bundle strips CSS, but GSAP reads an element's *computed* start value
   when a tween first renders. Without the real stylesheets jsdom reports
   defaults (opacity 1) and the hero's initially-hidden views look visible.
   Injecting the source CSS gives GSAP honest starting values. */
const STYLES = [
  "src/index.css",
  "src/App.css",
  "src/components/BatHero.css",
  "src/components/SiteNav.css",
  "src/components/Sections.css",
  "src/components/Projects.css",
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
    // GSAP joins conditions with " and "
    if (q.includes(" and ")) {
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
  Object.defineProperty(window.document, "fonts", {
    value: { ready: Promise.resolve() },
    configurable: true,
  });
  Object.defineProperty(window, "innerWidth", { value: width, configurable: true });
  Object.defineProperty(window, "innerHeight", { value: 900, configurable: true });

  // React's scheduler reaches for MessageChannel; jsdom doesn't provide it.
  window.MessageChannel = MessageChannel;
  window.queueMicrotask = queueMicrotask;

  window.IS_REACT_ACT_ENVIRONMENT = true;
  return dom;
}

function run(dom, code, name) {
  const ctx = dom.getInternalVMContext();
  vm.runInContext(code, ctx, { filename: name });
}

async function mount({ reducedMotion = false, width = 1440 } = {}) {
  const dom = makeDom({ reducedMotion, width });
  const { window } = dom;

  const errors = [];
  window.console.error = (...a) => errors.push(a.join(" "));
  window.console.warn = () => {};

  run(dom, appCode, "app.js");

  const { React, ReactDOM, ScrollTrigger, App } = window.HARNESS;

  const rootEl = window.document.getElementById("root");
  const reactRoot = ReactDOM.createRoot(rootEl);

  await React.act(async () => {
    reactRoot.render(React.createElement(App));
  });

  return { dom, window, errors, reactRoot, React, ScrollTrigger };
}

/* ---------- 3. tests ---------- */
console.log("\nDESKTOP, MOTION ALLOWED");
{
  const { window, errors, reactRoot, React, ScrollTrigger } = await mount({ width: 1440 });
  const d = window.document;

  check("mounts without console errors", errors.length === 0, errors[0]);
  check("renders the hero", !!d.querySelector(".bat-hero"));
  check("renders the BATMAN wordmark", d.querySelector(".bat-hero__word")?.textContent === "BATMAN");
  check("renders 3 character views", d.querySelectorAll(".bat-hero__view").length === 3);

  const h1 = d.querySelector("h1");
  check(
    "headline uses the supplied copy",
    h1?.textContent === "BUILDING THE WEB. THINKING BEYOND THE ORDINARY.",
    h1?.textContent,
  );

  const ctas = [...d.querySelectorAll(".bat-hero__actions a")].map((a) => a.textContent);
  check(
    "both CTAs present",
    ctas.includes("EXPLORE MY WORK") && ctas.includes("CONTACT ME"),
    ctas.join(" / "),
  );

  const triggers = ScrollTrigger.getAll();
  check("ScrollTriggers created", triggers.length > 0, `count=${triggers.length}`);
  check("hero is pinned", triggers.some((t) => !!t.pin), "no pinned trigger found");

  // every nav anchor must resolve to a real section
  const anchors = [...d.querySelectorAll(".sn__links a")].map((a) => a.getAttribute("href"));
  const unresolved = anchors.filter((h) => h && h.startsWith("#") && !d.querySelector(h));
  check("every nav anchor resolves", unresolved.length === 0, unresolved.join(", "));

  // the preserved widget is present
  check("BasketballUpload widget mounted", !!d.querySelector(".bbu"));
  check("widget court rendered", !!d.querySelector(".bbu__stage"));
  check("widget ball button rendered", !!d.querySelector(".bbu__ball-btn"));

  // sections
  for (const id of ["about", "skills", "work", "experience", "contact"]) {
    check(`#${id} section exists`, !!d.getElementById(id));
  }

  /* ---------- drive the hero timeline directly ----------
     jsdom cannot scroll, but the scrubbed timeline is a plain GSAP timeline,
     so setting progress by hand proves the choreography is wired, lands on
     different states, and rewinds cleanly. */
  const heroTl = triggers.find((t) => !!t.pin)?.animation;
  check("pinned trigger owns a timeline", !!heroTl);

  if (heroTl) {
    const char = d.querySelector(".bat-hero__char");
    const headline = d.querySelector(".bat-hero__headline");
    const front = d.querySelector(".bat-hero__view--front");
    const turn = d.querySelector(".bat-hero__view--turn");

    const snap = () => ({
      char: char.style.transform,
      headlineOpacity: headline.style.opacity,
      frontOpacity: front.style.opacity,
      turnOpacity: turn.style.opacity,
    });

    heroTl.progress(0).pause();
    const start = snap();
    heroTl.progress(0.5).pause();
    const middle = snap();
    heroTl.progress(1).pause();
    const end = snap();

    check("character transform changes across the scrub", start.char !== middle.char, start.char);
    check("character keeps moving to the end", middle.char !== end.char);
    check(
      "front view fades out by the end",
      Number(end.frontOpacity) < Number(start.frontOpacity || 1),
      `${start.frontOpacity} -> ${end.frontOpacity}`,
    );
    check(
      "turn view fades in by the end",
      Number(end.turnOpacity) > Number(start.turnOpacity || 0),
      `${start.turnOpacity} -> ${end.turnOpacity}`,
    );
    check(
      "headline is hidden at the start and shown at the end",
      Number(start.headlineOpacity || 0) === 0 && Number(end.headlineOpacity) === 1,
      `${start.headlineOpacity} -> ${end.headlineOpacity}`,
    );

    heroTl.progress(0).pause();
    const rewound = snap();
    check(
      "timeline rewinds to its exact start state",
      rewound.char === start.char && rewound.headlineOpacity === start.headlineOpacity,
      `${rewound.char} vs ${start.char}`,
    );
  }

  /* ---------- contact form validation ---------- */
  const form = d.querySelector(".sx-form");
  const status = d.querySelector(".sx-form__status");
  const submit = () =>
    React.act(async () => {
      form.dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
    });

  await submit();
  check("empty form is rejected", /name/i.test(status.textContent), status.textContent);

  const setVal = async (sel, value) => {
    const el = d.querySelector(sel);
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype === Object.getPrototypeOf(el)
        ? window.HTMLInputElement.prototype
        : window.HTMLTextAreaElement.prototype,
      "value",
    ).set;
    await React.act(async () => {
      setter.call(el, value);
      el.dispatchEvent(new window.Event("input", { bubbles: true }));
    });
  };

  await setVal("#cf-name", "Bruce Wayne");
  await setVal("#cf-email", "not-an-email");
  await setVal("#cf-message", "Short");
  await submit();
  check("bad email is rejected", /email/i.test(status.textContent), status.textContent);

  await setVal("#cf-email", "bruce@wayne.test");
  await submit();
  check("short message is rejected", /sentence|more/i.test(status.textContent), status.textContent);

  await setVal("#cf-message", "I would like to discuss a project with you.");
  await submit();
  check(
    "valid input reaches the send path",
    /portfolio\.ts|mail app/i.test(status.textContent),
    status.textContent,
  );

  /* ---------- nav drawer ---------- */
  const toggle = d.querySelector(".sn__toggle");
  await React.act(async () => toggle.dispatchEvent(new window.MouseEvent("click", { bubbles: true })));
  check("nav drawer opens", d.querySelector(".sn").classList.contains("is-open"));
  check("toggle reports expanded", toggle.getAttribute("aria-expanded") === "true");
  await React.act(async () => toggle.dispatchEvent(new window.MouseEvent("click", { bubbles: true })));
  check("nav drawer closes", !d.querySelector(".sn").classList.contains("is-open"));
  check("body scroll lock released", window.document.body.style.overflow !== "hidden");

  /* ---------- cleanup ---------- */
  await React.act(async () => reactRoot.unmount());
  check(
    "all ScrollTriggers killed on unmount",
    ScrollTrigger.getAll().length === 0,
    `${ScrollTrigger.getAll().length} left behind`,
  );
  check("no errors accumulated", errors.length === 0, errors.join(" | "));
}

console.log("\nREDUCED MOTION");
{
  const { window, errors, reactRoot, React, ScrollTrigger } = await mount({
    reducedMotion: true,
    width: 1440,
  });
  const d = window.document;

  check("mounts without console errors", errors.length === 0, errors[0]);
  check("hero still renders", !!d.querySelector(".bat-hero"));
  check("headline still in the DOM", !!d.querySelector(".bat-hero__headline"));

  const pinned = ScrollTrigger.getAll().filter((t) => !!t.pin);
  check("hero is NOT pinned under reduced motion", pinned.length === 0, `${pinned.length} pinned`);

  const headline = d.querySelector(".bat-hero__headline");
  const vis = headline.style.visibility;
  const op = headline.style.opacity;
  check(
    "headline is composed visible, not hidden",
    vis !== "hidden" && op !== "0",
    `visibility=${vis || "(unset)"} opacity=${op || "(unset)"}`,
  );

  await React.act(async () => reactRoot.unmount());
  check("clean teardown", ScrollTrigger.getAll().length === 0);
}

console.log("\nMOBILE WIDTH, MOTION ALLOWED");
{
  const { window, errors, reactRoot, React, ScrollTrigger } = await mount({ width: 420 });
  const d = window.document;
  check("mounts without console errors", errors.length === 0, errors[0]);
  check("hero renders at mobile width", !!d.querySelector(".bat-hero"));
  check("ScrollTriggers created", ScrollTrigger.getAll().length > 0);
  check("hero is pinned", ScrollTrigger.getAll().some((t) => !!t.pin));
  await React.act(async () => reactRoot.unmount());
  check("clean teardown", ScrollTrigger.getAll().length === 0);
}

/* ---------- 4. static CSS audit ----------
   jsdom has no layout engine, so these are asserted by reading the source
   rather than measuring. They cover the rules that prevent sideways scroll
   and anchor-under-nav, which are easy to regress by accident. */
console.log("\nSTATIC CSS AUDIT");
{
  const read = (p) => readFileSync(resolve(root, p), "utf8");
  const index = read("src/index.css");
  const hero = read("src/components/BatHero.css");
  const sections = read("src/components/Sections.css");

  check("html clips horizontal overflow", /html\s*\{[^}]*overflow-x:\s*clip/s.test(index));
  check("body clips horizontal overflow", /body\s*\{[^}]*overflow-x:\s*clip/s.test(index));
  check("hero hides overflow", /\.bat-hero\s*\{[^}]*overflow:\s*hidden/s.test(hero));
  check(
    "sections clear the fixed nav on anchor jump",
    /\.sx-section\s*\{[^}]*scroll-margin-top:\s*var\(--nav-h\)/s.test(sections),
  );
  check("reduced-motion block present in base styles", /prefers-reduced-motion:\s*reduce/.test(index));
  check("hero honours reduced motion for the scroll cue", /prefers-reduced-motion:\s*reduce/.test(hero));
  check("hero uses svh so mobile URL bars don't jump it", /100svh/.test(hero));
  check(
    "animated hero layers declare will-change",
    (hero.match(/will-change:/g) || []).length >= 3,
  );
  check(
    "character images are given intrinsic size (no CLS)",
    /width=\{1150\}[\s\S]*height=\{928\}/.test(read("src/components/BatHero.tsx")),
  );
}

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);

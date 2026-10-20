<!-- File: README.md -->
# Shashikant Bilgundi, Full Stack Developer

Personal portfolio, "Digital Architect": one continuous camera journey through a 3D architectural scene.
React 19, TypeScript, Vite, Three.js with React Three Fiber, GSAP ScrollTrigger for scroll choreography, Motion for
interface transitions. Two colours: Midnight Indigo `#282b4a` and Vanilla `#eeebda`.

```bash
npm install
npm run dev       # local dev server
npm run build     # type-check + production build into dist/
npm run preview   # serve the production build
npm run lint
npm i --no-save jsdom esbuild && npm run smoke   # jsdom smoke test (74 checks)
```

## Editing content

Every word on the page lives in **`src/content/portfolio.ts`**. Empty values are simply not rendered, so the live
site never shows a placeholder or a dead link. Still to fill in:

| Field                     | What appears when you fill it in                                         |
| ------------------------- | ------------------------------------------------------------------------ |
| `profile.resumeUrl`       | Resume download in the nav, menu and Resume section (put the PDF in `public/`) |
| `contact.socials[].href`  | GitHub / LinkedIn / X in Resume, Contact and the footer                  |
| `contact.email`           | Email links, and the contact form (opens the visitor's mail app)        |
| `contact.formEndpoint`    | The form sends for real (any service accepting a JSON POST, e.g. Formspree) |
| `experience[].period`     | Dates on the role                                                        |
| `projects[].githubUrl` …  | Source / case-study buttons on that project                              |

Case studies (`projects[].caseStudy`) take only what is true: problem, role, architecture, decisions, outcomes.
Missing fields are skipped. Add a real-estate or any other case study the same way.

## How it is put together

```
src/
  content/portfolio.ts        all copy and data
  lib/journey.ts              camera keyframes per section, poseAt(scroll): the whole choreography
  lib/motion.ts               GSAP registration, breakpoints, useReveal
  components/
    scene/SceneStage.tsx      fixed stage: WebGL check, lazy scene, scroll scrub, fallback drawing
    scene/JourneyScene.tsx    the R3F scene: layer plates, portals, columns, floor (lazy chunk)
    SiteNav.tsx, Hero.tsx
    sections/…                About, Expertise, Skills, Workflow, Experience, Achievements, Resume, Contact, footer
    projects/…                case studies with approaching mockups, project index, playable demo
    ui/…                      RevealText (masked words), TiltCard (glass hover), SectionHead
```

**One camera, driven by scroll.** Each section has a keyframe in `lib/journey.ts` (camera, target, layout of the four
layer plates, spin, presence). GSAP scrubs a smoothed copy of the scroll position; the scene computes its pose from
it every frame. Nothing accumulates, so scrolling back, resizing, refreshing or deep-linking always gives the right
pose. Anchors are re-measured on every ScrollTrigger refresh and when content changes height.

**Performance.** three.js and R3F are a separate chunk loaded after first paint. The scene renders on demand (only
while scroll, pointer or the intro is moving), caps pixel ratio, uses instanced columns and one shared plate
geometry, and drops antialiasing and half the columns on tablets, phones and low-core devices.

**Fallbacks.** No WebGL: a static drawing of the structure. Reduced motion: the scene holds its opening pose, the hero
is one screen tall, and every animation is off. Phones: the hero is one screen, nothing is pinned anywhere.

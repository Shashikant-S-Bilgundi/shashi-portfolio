<!-- File: README.md -->
# Shashikant Bilgundi, Full Stack Developer

Personal portfolio. React 19, TypeScript and Vite, with a Three.js hero, GSAP ScrollTrigger for scroll-driven
motion, Motion for UI transitions and a handful of Animate UI primitives.

```bash
npm install
npm run dev       # local dev server
npm run build     # type-check + production build into dist/
npm run preview   # serve the production build
npm run lint
npm i --no-save jsdom esbuild && npm run smoke   # jsdom smoke test (75 checks)
```

## Editing content

Every word on the page lives in **`src/content/portfolio.ts`**. Components never hold copy.

Fields left as empty strings are not rendered, so the live site never shows a placeholder or a broken link:

| Field                                  | What happens when you fill it in                                  |
| -------------------------------------- | ----------------------------------------------------------------- |
| `contact.email`                        | Email row appears and the contact form switches on                |
| `contact.phone`                        | Phone row appears                                                 |
| `contact.socials[].href`               | LinkedIn / GitHub / X rows appear                                 |
| `experience[].period`                  | Dates appear on the role                                          |
| `projects[].liveUrl`                   | "Live site" action, with a hover preview on desktop               |
| `projects[].githubUrl`                 | "Source code" action                                              |
| `projects[].caseStudyUrl`              | "Case study" action                                               |
| `projects[].previewImage`              | Your own screenshot for the hover preview instead of a remote one |

Each project card shows which layers of the stack it touches. That is computed from the project's own `stack`
array through the `techLayer` table, so adding a technology there is all it takes to light a layer.

## How it is put together

```
src/
  content/portfolio.ts      all copy and data
  lib/
    motion.ts               GSAP registration, breakpoints, useReveal
    sectionMotion.ts        the shared scroll vocabulary (depth, unmask, stagger, recede)
    stack.ts                the 3D stack's choreography as a pure function of scroll
  components/
    Hero.tsx                pinned hero; reports scroll progress to the stack
    SiteNav.tsx             fixed nav, active-section pill, mobile menu
    stack/StackScene.ts     the Three.js scene (lazy chunk)
    stack/StackStage.tsx    fixed stage, WebGL detection, CSS fallback
    sections/…              About, Experience, Skills, Contact, footer
    projects/…              featured panel, cards, actions, preview card
    BasketballUpload.tsx    the original physics uploader, kept as an interactive demo
  vendor/animate-ui/        vendored Animate UI primitives (see its README)
```

**Scroll choreography.** ScrollTrigger never tweens the 3D scene. It records three progress values (through the
hero, through the page, through Contact) and `stackTargets()` turns them into the scene's pose. Because the pose
is a function of scroll position, scrolling up reverses it exactly. The scene eases toward that pose every frame.

**Glass and motion.** Glass panels blur the 3D scene behind the page. Opacity, filter or clip-path on any
*ancestor* of a glass panel would stop that, so section motion only ever transforms ancestors and fades panels
themselves. The rule is written at the top of `sectionMotion.ts`.

**Performance.** three.js is a separate chunk loaded after first paint. The scene renders on demand and stops
when nothing is moving, caps the pixel ratio, and drops the idle float and particles on phones, low-core and
Save-Data devices. It disposes every GPU resource on unmount. The preview card (Radix, Floating UI) is its own
chunk, loaded only on hover-capable devices near the Projects section.

**Accessibility and fallbacks.** Reduced motion gives a static page: no pin, no scrubbing, everything visible.
Without WebGL a CSS version of the stack follows the same choreography. Keyboard focus is always visible, the
mobile menu closes on Escape and makes the page behind it inert, and hover-only effects are limited to devices
that can hover.

## Animate UI

Liquid Button, Splitting Text, Typing Text, Shimmering Text, Tilt and Preview Link Card are copied from Animate
UI's source into `src/vendor/animate-ui/` rather than installed, because `@animate-ui/react` was first published
the day before this build. Their APIs are identical to the package, and the folder's README explains how to switch.
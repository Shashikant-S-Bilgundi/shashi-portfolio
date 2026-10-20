<!-- File: src/vendor/animate-ui/README.md -->
# Vendored Animate UI primitives

Source: <https://github.com/imskyleen/animate-ui>, commit
`ff2a8a609a43515d77a2f1cdc8c3f8d7579e563f` (main, 19 Oct 2026), which is the
source of `@animate-ui/react@2.0.0`. Licence: MIT + Commons Clause (see
`LICENSE.md`). The Commons Clause only forbids selling the library itself; using
it inside a portfolio site is fine.

## Why these files are copied in rather than installed

`@animate-ui/react` was first published to npm on 18 Oct 2026, one day before
this work. A package that new has not had time for anyone to notice a bad
release, so instead of depending on it, the handful of primitives this site uses
were copied from the tagged GitHub source and read through. The only network
call in them is the documented screenshot service in `internal/preview-link.ts`
(`api.microlink.io`), used by Preview Link Card.

The files are the upstream source unchanged, apart from a one-line `// File: …` path comment added at the top of each, and one exception:
`primitives/buttons/liquid/index.tsx` comes from the shadcn registry
(`apps/v2/registry/buttons/liquid`), whose imports point at the npm package and
whose default look is a string of Tailwind classes. Its imports were rewritten
to the relative paths below and the Tailwind string was replaced by the
`liquid-button` class (styled in `src/components/ui/Button.css`). Props, motion
and CSS variables are unchanged.

| Component                   | Docs                                                                  | File                                          |
| --------------------------- | --------------------------------------------------------------------- | --------------------------------------------- |
| `LiquidButton`              | https://animate-ui.com/docs/primitives/animate-ui/liquid-button       | `primitives/buttons/liquid/index.tsx`         |
| `SplittingText`             | https://animate-ui.com/docs/primitives/animate-ui/splitting-text      | `primitives/texts/splitting/index.tsx`        |
| `TypingText`, `…Cursor`     | https://animate-ui.com/docs/primitives/animate-ui/typing-text         | `primitives/texts/typing/index.tsx`           |
| `ShimmeringText`            | https://animate-ui.com/docs/primitives/animate-ui/shimmering-text     | `primitives/texts/shimmering/index.tsx`       |
| `Tilt`, `TiltContent`       | https://animate-ui.com/docs/primitives/animate-ui/tilt                | `primitives/effects/tilt/index.tsx`           |
| `PreviewLinkCard` (+ parts) | https://animate-ui.com/docs/primitives/radix-ui/preview-link-card     | `primitives/radix-ui/preview-link-card/…`     |

Everything else here is the internal support code those files import.

## Switching to the npm package later

Once `@animate-ui/react` has a release history you trust, the APIs are
identical, so the move is mechanical:

```bash
npm install --save-exact @animate-ui/react@<version>
```

then change each import, for example

```ts
import { SplittingText } from "../vendor/animate-ui/primitives/texts/splitting";
// becomes
import { SplittingText } from "@animate-ui/react/primitives/texts/splitting";
```

and delete this folder. Liquid Button stays a local file either way, since it is
a registry component rather than a package export.

This folder is excluded from ESLint (it is third-party code) but is still
type-checked by `tsc -b`.
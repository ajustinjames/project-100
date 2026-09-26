# Design and Assets

## ajj-design

Every app uses [`ajj-design`](https://github.com/ajustinjames/ajj-design) as its design-system foundation. It currently publishes two systems as framework-agnostic Lit Web Components plus CSS-variable tokens:

| System | Packages | Element prefix | Character |
|---|---|---|---|
| `hardline` | `@ajustinjames/hardline-tokens`, `@ajustinjames/hardline-components` | `hl-*` | Industrial and material: 0px radii, hard shadows, no gradients |
| `glassline` | `@ajustinjames/glassline-tokens`, `@ajustinjames/glassline-components` | `gl-*` | Liquid glass: translucent, rounded, blurred |

Record the system in `app.json` (`design.system`). CI checks that the app depends on it.

Usage (see `templates/app`):

```css
/* style.css */
@import "@ajustinjames/hardline-tokens/css";
```

```ts
// main.ts
import "@ajustinjames/hardline-components";
```

### Different apps, different aesthetics

Apps don't have to look alike. Build on the tokens and components, then create each app's identity through typography, layout, spacing, composition, color (by overriding token CSS variables), CSS, animation, and interaction. Where the components allow it, override them through their CSS custom properties rather than forking them.

### Improving ajj-design

When an app needs a **reusable** design capability that `ajj-design` lacks (a component, token, pattern, or accessibility fix):

1. Decide whether it belongs there. Would other apps plausibly use it, and does it fit the system's constraints?
2. If so, implement it in the `ajj-design` repo first, following its `AGENTS.md` (tests, stories, and a release through its PR-driven release process).
3. Consume the released version from the app.

App-specific components stay in the app. Don't force them into `ajj-design`. If an upstream release would block progress, build the piece locally in the app, note it in `APP.md` as an upstream candidate, and move it upstream later.

Project 100 is expected to stress-test `ajj-design`. File issues there for bugs and gaps you find.

## Media asset policy

**AI must not generate original media.** That includes images, illustrations, video, audio, icons, logos, custom or decorative SVG artwork, and any other synthetic media.

Allowed:

- Established, permissively licensed icon libraries (one project-wide; see [DEPENDENCIES.md](DEPENDENCIES.md#icons-and-fonts))
- Appropriately licensed public or free assets (e.g. public domain, CC0, or CC BY with attribution) from reputable sources
- Self-hosted, permissively licensed fonts
- Visual creativity through typography, layout, spacing, composition, CSS, color, animation, and interaction
- Functional graphics drawn from data at runtime, such as charts, plots, or diagrams of the user's own content. These are software output, not artwork.

For every third-party asset, record in the app's `APP.md` ("Assets and licenses") its source URL, license, required attribution, and where it is used. Include attribution in the app if the license requires it.

### When an app needs original media

If an app genuinely needs original branding, artwork, illustration, photography, video, audio, icons, or other media, **ask the project owner** to create or provide them. Describe what is needed and why. Until then, use a typographic or CSS-only treatment.

Favicons follow the same rule. Until the owner provides one, apps use an empty icon (`<link rel="icon" href="data:,">`).

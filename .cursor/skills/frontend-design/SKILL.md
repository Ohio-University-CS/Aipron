---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces with high design quality. Use when building web components, pages, or apps (HTML/CSS/JS, React, Vue, etc.) and when the user wants polished UI/UX, strong visual direction, motion, and non-generic aesthetics.
license: Complete terms in LICENSE.txt
---

# Frontend Design (Distinctive, Production-Grade)

Build real, working frontend UI with a **clear point-of-view**. Avoid generic “AI template” aesthetics by committing to a bold conceptual direction and executing it with precision.

## Quick Start (Do this every time)

1. **Extract requirements**
   - What are we building (component/page/app)? What’s the user goal?
   - Target users/audience, brand/tone constraints, accessibility needs.
   - Tech constraints: framework, CSS approach, bundler, routing, state, data.

2. **Commit to a bold aesthetic direction**
   - Pick a specific “world”: brutalist/raw, editorial/magazine, luxury/refined, retro-futuristic, playful/toy-like, industrial/utilitarian, art-deco geometry, organic/natural, maximalist chaos, etc.
   - Define 1–2 memorable “signature moves” (the thing users will remember).

3. **Design system in miniature (before layout)**
   - Typography pair (display + body) with a reason.
   - Palette with dominant + sharp accent (CSS variables).
   - Spacing rhythm + corner/outline/shadow language.
   - Motion language (one orchestrated entrance + a few meaningful interactions).

4. **Implement production-grade code**
   - Responsive layout, accessible semantics, keyboard states, reduced-motion support.
   - Clean structure and reuse. No “demo-only” shortcuts that break in real use.

5. **Polish pass**
   - Visual balance at multiple breakpoints, hover/focus details, empty/loading states.
   - Align microcopy, spacing, and animation timing into a cohesive feel.

## Non-Negotiables (Quality Bar)

- **No generic fonts**: do not default to Arial, Inter, Roboto, system fonts, or other overused “AI UI” staples. Prefer characterful fonts; pair thoughtfully.
- **No clichéd palettes**: avoid predictable purple gradients on white and other “template SaaS” defaults unless explicitly requested.
- **No cookie-cutter layouts**: avoid centered-card-stack sameness. Use composition intentionally (asymmetry, overlap, diagonal flow, controlled density or generous negative space).
- **One strong concept**: every UI should have an identifiable art direction, not a pile of trendy effects.
- **Functional first**: code must work (state, validation, async, routing) if those are part of the requirements.

## Aesthetic Toolkit (Use Intentionally)

### Typography
- Choose fonts that add character (display) and clarity (body).
- Ensure readability: line length, line height, weight contrast, and real text scaling.
- Prefer variable fonts when appropriate; avoid overly decorative body fonts.

### Color & theme
- Use CSS variables for palette and semantic tokens (bg/surface/text/accent/border).
- Use contrast deliberately. Don’t spread colors evenly; pick a dominant base.

### Motion
- Prioritize 1 high-impact moment: page-load / section entrance with staggered reveals.
- Add a small number of meaningful interactions: hover, focus, toggles, scroll effects.
- Respect `prefers-reduced-motion` and never make motion required for understanding.

### Composition
- Break the grid on purpose: overlap layers, offset columns, diagonal separators, typographic “anchors”.
- Use negative space or controlled density—avoid the timid middle.

### Atmosphere & detail
- Build depth: gradient meshes, grain/noise overlays, subtle patterns, crisp borders.
- Add delightful details: custom cursor, micro-ornaments, iconography with a consistent style.
- Keep details cohesive with the chosen direction (no random effect shopping).

## Accessibility & UX Requirements

- **Semantics**: correct landmarks (`header`, `main`, `nav`), labels, form associations.
- **Keyboard**: all interactive elements reachable and usable; visible focus states.
- **Contrast**: meet at least WCAG AA unless the user explicitly accepts otherwise.
- **Motion**: `prefers-reduced-motion` supported; avoid parallax nausea.
- **Performance**: avoid heavy libraries and huge images. Prefer CSS/HTML over canvas/video unless justified.
- **States**: loading, error, empty, disabled, and validation states exist when applicable.

## Implementation Defaults (Choose a path, don’t waffle)

- **If no framework specified**: deliver plain HTML/CSS/JS that runs as-is.
- **If React specified**: deliver a small component set with clear boundaries and minimal dependencies; prefer CSS Modules/Tailwind/vanilla-extract based on repo conventions.
- **Styling**: use tokens via CSS variables; keep layout logic in CSS (grid/flex) rather than JS.
- **Animations**: CSS first; if React and animation is core, consider a motion library only if it materially improves results.

## Output Expectations

When writing code, include:
- A short **design rationale** (fonts, palette, signature moves, motion approach).
- A clear **file list** and how to run/view it.
- Realistic placeholder content (not lorem ipsum) that matches context.
- No giant boilerplate; keep it tight, readable, and shippable.

## Examples

See [examples.md](examples.md) for example prompts and the expected approach/structure.


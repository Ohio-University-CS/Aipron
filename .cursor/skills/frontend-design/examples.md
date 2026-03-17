# Examples (Frontend Design)

These examples show the kind of direction-setting and execution this skill should produce. They are intentionally opinionated: **pick a concept and ship it**.

## Example 1 — Landing page hero (no framework)

**User prompt**

“Build a landing page hero for a privacy-focused email service. Include a headline, subcopy, email capture, and 3 feature bullets.”

**Expected approach**
- Commit to a direction (e.g., **editorial + monochrome** with a single acid accent).
- Pick a typography pair that supports the story (a sharp display serif + quiet grotesk).
- Use 1 signature move (e.g., oversized headline with clipped underline rule + grain).
- Implement:
  - Semantic HTML (`main`, `form`, `label`)
  - Input validation + disabled/loading state
  - Staggered entrance animation + reduced-motion fallback
  - Responsive layout with a grid that breaks intentionally at large screens

## Example 2 — React settings panel

**User prompt**

“Create a React settings panel for a music app. Needs toggles, a volume slider, and a theme picker. Make it feel like hardware.”

**Expected approach**
- Direction: **industrial/utilitarian hardware UI** (knurled textures, crisp borders, LED accent).
- Signature move: “physical” controls (slider track, toggle switch, tiny status LED).
- Implement:
  - Components: `SettingsPanel`, `Toggle`, `Slider`, `ThemeSwatches`
  - Keyboard + screen reader labels
  - Focus styling that fits the aesthetic (not default blue outline)
  - Subtle motion for control affordances (press, snap, glow)


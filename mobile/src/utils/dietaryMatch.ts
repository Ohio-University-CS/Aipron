import type { Recipe } from "@aipron/shared";

/**
 * Does the given recipe fully satisfy every active dietary preference?
 *
 * Rules:
 * - Empty `activePrefs` means "no filter" → always true.
 * - The recipe must carry every active preference as a `dietaryTags` entry.
 *   Comparison is case-insensitive and ignores whitespace.
 * - A recipe without any `dietaryTags` is treated as non-matching when there
 *   are active prefs, since we have no evidence it complies.
 */
export function recipeMatchesPreferences(
  recipe: Pick<Recipe, "dietaryTags">,
  activePrefs: readonly string[]
): boolean {
  if (!activePrefs || activePrefs.length === 0) return true;
  const tags = Array.isArray(recipe.dietaryTags)
    ? recipe.dietaryTags.map((t) => (t || "").trim().toLowerCase())
    : [];
  if (tags.length === 0) return false;
  return activePrefs.every((pref) =>
    tags.includes((pref || "").trim().toLowerCase())
  );
}

/**
 * From a list, return the first recipe that satisfies every active
 * preference. Falls back to the first element if none match, so callers can
 * always show *something* rather than an empty tile.
 */
export function pickPreferredRecipe<T extends Pick<Recipe, "dietaryTags">>(
  recipes: readonly T[],
  activePrefs: readonly string[]
): T | null {
  if (!recipes || recipes.length === 0) return null;
  const match = recipes.find((r) => recipeMatchesPreferences(r, activePrefs));
  return match ?? recipes[0];
}

/**
 * Keep only the recipes that satisfy every active preference. When no
 * preferences are active this returns the input list unchanged.
 */
export function filterByPreferences<T extends Pick<Recipe, "dietaryTags">>(
  recipes: readonly T[],
  activePrefs: readonly string[]
): T[] {
  if (!activePrefs || activePrefs.length === 0) return [...recipes];
  return recipes.filter((r) => recipeMatchesPreferences(r, activePrefs));
}

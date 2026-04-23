import type { Recipe } from "@aipron/shared";
import { localRecipeHeroUris } from "../constants/localRecipeHeroImages";
import { LOCAL_CATALOG_RECIPES as _generatedLocalCatalog } from "./generatedLocalCatalog";

/** Bundled hero art for catalog rows that ship with the app (overrides remote URLs from generated catalog). */
const LOCAL_HERO_BY_RECIPE_ID: Partial<
  Record<string, (typeof localRecipeHeroUris)[keyof typeof localRecipeHeroUris]>
> = {
  "local-one-pot-lemon-herb-chicken-thighs-with-rice-45-minutes":
    localRecipeHeroUris.chickenMain,
  "local-beef-and-broccoli-stir-fry-with-garlic-ginger-sauce-25-m":
    localRecipeHeroUris.beefBroccoli,
  "local-thai-red-coconut-curry-with-crispy-tofu-and-vegetables-3":
    localRecipeHeroUris.thaiRedCurry,
  "local-creamy-mushroom-risotto-with-parmesan-and-thyme-50-minut":
    localRecipeHeroUris.mushroomRisotto,
};

export const LOCAL_CATALOG_RECIPES: Recipe[] = _generatedLocalCatalog.map((r) => {
  const id = r.id;
  const hero = id ? LOCAL_HERO_BY_RECIPE_ID[id] : undefined;
  return hero ? { ...r, heroImage: hero } : r;
});

export function filterLocalCatalogRecipes(recipes: Recipe[], q: string): Recipe[] {
  const t = q.trim().toLowerCase();
  if (!t) return [...recipes];

  const tokens = t.split(/\s+/).filter(Boolean);
  return recipes.filter((r) => {
    const hay = [
      r.title,
      r.description ?? "",
      r.cuisine ?? "",
      ...(r.dietaryTags ?? []),
      ...(r.ingredients ?? []).map((i) => `${i.name} ${i.notes ?? ""}`),
    ]
      .join(" ")
      .toLowerCase();
    return tokens.every((tok) => hay.includes(tok));
  });
}

export function findLocalCatalogRecipeById(id: string): Recipe | undefined {
  return LOCAL_CATALOG_RECIPES.find((r) => r.id === id);
}

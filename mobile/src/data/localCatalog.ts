import type { Recipe } from "@aipron/shared";
import { localRecipeHeroUris } from "../constants/localRecipeHeroImages";
import { LOCAL_CATALOG_RECIPES as _generatedLocalCatalog } from "./generatedLocalCatalog";

const ONE_POT_CHICKEN_ID = "local-one-pot-lemon-herb-chicken-thighs-with-rice-45-minutes";

export const LOCAL_CATALOG_RECIPES: Recipe[] = _generatedLocalCatalog.map((r) =>
  r.id === ONE_POT_CHICKEN_ID
    ? { ...r, heroImage: localRecipeHeroUris.chickenMain }
    : r
);

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

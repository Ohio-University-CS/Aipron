import type { Recipe } from "@aipron/shared";
import { LOCAL_CATALOG_RECIPES } from "./generatedLocalCatalog";

export { LOCAL_CATALOG_RECIPES };

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

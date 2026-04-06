/**
 * Idempotent public catalog seed for Supabase `recipes`.
 *
 * Verification (backend running, Bearer token required for GET /recipes/:id):
 *   curl "http://localhost:3001/api/recipes/search?q=chick"
 *   curl -H "Authorization: Bearer <token>" "http://localhost:3001/api/recipes/<id>"
 */
import dotenv from "dotenv";
import { supabaseAdmin } from "./supabase.js";
import { PUBLIC_CATALOG_RECIPES } from "./catalog/publicRecipes.js";

dotenv.config();

export async function runSeedCatalog() {
  let inserted = 0;
  let skipped = 0;

  for (const recipe of PUBLIC_CATALOG_RECIPES) {
    const { data: existing, error: selectError } = await supabaseAdmin
      .from("recipes")
      .select("id")
      .eq("is_public", true)
      .eq("title", recipe.title)
      .maybeSingle();

    if (selectError) {
      throw new Error(`Lookup failed for "${recipe.title}": ${selectError.message}`);
    }

    if (existing?.id) {
      console.log("Skip (exists):", recipe.title);
      skipped += 1;
      continue;
    }

    const { data, error } = await supabaseAdmin
      .from("recipes")
      .insert(recipe)
      .select("id, title, is_public")
      .single();

    if (error) {
      throw new Error(`Insert failed for "${recipe.title}": ${error.message}`);
    }

    console.log("Inserted:", data);
    inserted += 1;
  }

  console.log(`Catalog seed complete: ${inserted} inserted, ${skipped} skipped (already present).`);
}

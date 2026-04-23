import { supabaseAdmin } from "../db/supabase.js";

/**
 * Fetch just the user's dietary preferences (lightweight — single row lookup)
 * for the recipe generation system prompt. Returns an array of string tags,
 * or [] if the user has none / is unauthenticated / an error occurs.
 */
export async function fetchDietaryContext(userId) {
  if (!userId) return [];
  try {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("dietary_preferences")
      .eq("id", userId)
      .single();
    if (error) return [];
    const prefs = data?.dietary_preferences;
    return Array.isArray(prefs) ? prefs.filter((p) => typeof p === "string" && p) : [];
  } catch (error) {
    console.error("Failed to fetch dietary context:", error);
    return [];
  }
}

/**
 * Fetch personalized context for a user (profile, pantry, saved recipes)
 * to inject into AI system prompts. Returns an empty string if nothing is found.
 */
export async function fetchUserContext(userId) {
  if (!userId) return "";

  try {
    const [profileResult, savedResult, pantryResult] = await Promise.all([
      supabaseAdmin.from("profiles").select("name, dietary_preferences").eq("id", userId).single(),
      supabaseAdmin
        .from("saved_recipes")
        .select("recipe_id")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20),
      supabaseAdmin
        .from("pantry_items")
        .select("name, quantity, unit, expires_at")
        .eq("user_id", userId)
        .order("name"),
    ]);

    const parts = [];

    const profile = profileResult.data;
    if (profile?.name) {
      parts.push(`The user's name is ${profile.name}. Address them by name occasionally.`);
    }
    if (profile?.dietary_preferences?.length) {
      const prefsList = profile.dietary_preferences
        .filter((p) => typeof p === "string" && p.trim())
        .join(", ");
      parts.push(
        `DIETARY PREFERENCES (STRICT, non-negotiable): ${prefsList}. ` +
          `Treat these like allergies — never describe, summarize, suggest, recommend, or generate a recipe (or parts of one, including ingredient lists, step overviews, or "typical" versions) that violates any of them. ` +
          `If the user asks about a non-compliant dish (for example asking about a beef recipe when they are vegan), do NOT summarize the non-compliant dish. Briefly acknowledge the conflict in one sentence and immediately offer one compliant alternative that respects every preference above. ` +
          `Only change this behavior if the user explicitly says, in the current turn, to ignore their preferences.`
      );
    }

    if (pantryResult.data?.length) {
      const items = pantryResult.data.map((i) => {
        let s = i.name;
        if (i.quantity != null) s += ` (${i.quantity}${i.unit ? " " + i.unit : ""})`;
        if (i.expires_at) {
          const daysLeft = Math.ceil((new Date(i.expires_at) - Date.now()) / 86400000);
          if (daysLeft <= 3 && daysLeft >= 0) s += " [expiring soon!]";
        }
        return s;
      });
      parts.push(`The user currently has these items in their pantry: ${items.join(", ")}. Use this knowledge to suggest what they can cook and warn about items expiring soon.`);
    }

    if (savedResult.data?.length) {
      const recipeIds = savedResult.data.map((r) => r.recipe_id);
      const { data: recipes } = await supabaseAdmin
        .from("recipes")
        .select("title, cuisine, dietary_tags")
        .in("id", recipeIds);
      if (recipes?.length) {
        const titles = recipes.map((r) => r.title).join(", ");
        parts.push(`The user has saved these favorite recipes: ${titles}. You can reference these when relevant.`);
        const cuisines = [...new Set(recipes.map((r) => r.cuisine).filter(Boolean))];
        if (cuisines.length) {
          parts.push(`They seem to enjoy: ${cuisines.join(", ")} cuisine.`);
        }
      }
    }

    return parts.length ? "\n\n--- User Context ---\n" + parts.join("\n") : "";
  } catch (error) {
    console.error("Failed to fetch user context:", error);
    return "";
  }
}

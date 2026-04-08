import { supabaseAdmin } from "../db/supabase.js";

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
      parts.push(`Dietary preferences: ${JSON.stringify(profile.dietary_preferences)}. Keep these in mind when suggesting recipes or substitutions.`);
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

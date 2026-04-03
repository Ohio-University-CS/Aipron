import express from "express";
import { body, validationResult } from "express-validator";
import { authenticateToken } from "../middleware/auth.js";
import { generateRecipe, getSubstitutions } from "../services/openai.js";
import { supabaseAdmin } from "../db/supabase.js";

export const recipesRouter = express.Router();

function buildPrefixTsQuery(input) {
  return input
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => token.replace(/[^a-z0-9]/g, ""))
    .filter(Boolean)
    .map((token) => `${token}:*`)
    .join(" & ");
}

// Public search endpoint (public catalog only).
// Note: favorites/saved endpoints remain authenticated.
recipesRouter.get("/search", async (req, res, next) => {
  try {
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const dietaryTag = typeof req.query.dietaryTag === "string" ? req.query.dietaryTag.trim() : "";
    const cuisine = typeof req.query.cuisine === "string" ? req.query.cuisine.trim() : "";

    const limitRaw = typeof req.query.limit === "string" ? Number(req.query.limit) : 20;
    const offsetRaw = typeof req.query.offset === "string" ? Number(req.query.offset) : 0;
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 50) : 20;
    const offset = Number.isFinite(offsetRaw) ? Math.max(offsetRaw, 0) : 0;

    let query = supabaseAdmin
      .from("recipes")
      .select("id, title, description, ingredients, steps, prep_time, cook_time, total_time, servings, nutrition, dietary_tags, cuisine, difficulty, is_public, created_at")
      .eq("is_public", true);

    if (dietaryTag) {
      query = query.contains("dietary_tags", [dietaryTag]);
    }

    if (cuisine) {
      query = query.ilike("cuisine", `%${cuisine}%`);
    }

    if (q) {
      const tsPrefixQuery = buildPrefixTsQuery(q);

      // Predictive search:
      // 1) Prefix full-text search (e.g., "salm" -> matches "salmon")
      // 2) Fallback ILIKE matching for short/incomplete tokens
      if (tsPrefixQuery) {
        query = query.filter("search_vector", "fts", tsPrefixQuery);
      } else {
        const escaped = q.replace(/[^a-z0-9 '-]/gi, "").trim();
        query = query.or(
          `title.ilike.%${escaped}%,description.ilike.%${escaped}%,cuisine.ilike.%${escaped}%`
        );
      }
    }

    const { data, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return res.status(500).json({ error: "Failed to search recipes" });
    }

    res.json(Array.isArray(data) ? data : []);
  } catch (error) {
    next(error);
  }
});

recipesRouter.post(
  "/generate",
  authenticateToken,
  [
    body("prompt").notEmpty().trim(),
    body("dietaryFilters").optional().isArray(),
    body("servings").optional().isInt({ min: 1, max: 12 }),
    body("skillLevel").optional().isIn(["beginner", "intermediate", "advanced"]),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { prompt, dietaryFilters = [], servings = 4, skillLevel = "intermediate" } = req.body;

      const recipe = await generateRecipe(prompt, {
        dietaryFilters,
        servings,
        skillLevel,
      });

      const { data, error } = await req.supabase
        .from("recipes")
        .insert({
          user_id: req.user.id,
          title: recipe.title,
          description: recipe.description,
          ingredients: recipe.ingredients,
          steps: recipe.steps,
          prep_time: recipe.prepTime,
          cook_time: recipe.cookTime,
          total_time: recipe.totalTime,
          servings: recipe.servings,
          nutrition: recipe.nutrition,
          dietary_tags: recipe.dietaryTags,
          cuisine: recipe.cuisine,
          difficulty: recipe.difficulty,
        })
        .select("id, created_at")
        .single();

      if (error) {
        return res.status(500).json({ error: "Failed to save recipe" });
      }

      res.json({
        ...recipe,
        id: data.id,
        createdAt: data.created_at,
      });
    } catch (error) {
      next(error);
    }
  }
);

recipesRouter.get("/saved", authenticateToken, async (req, res, next) => {
  try {
    const { data: savedRows, error: savedError } = await req.supabase
      .from("saved_recipes")
      .select("recipe_id")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false });

    if (savedError) {
      return res.status(500).json({ error: "Failed to fetch saved recipes" });
    }

    if (savedRows.length === 0) {
      return res.json([]);
    }

    const recipeIds = savedRows.map((r) => r.recipe_id);
    const { data: recipes, error: recipesError } = await req.supabase
      .from("recipes")
      .select("*")
      .in("id", recipeIds)
      .order("created_at", { ascending: false });

    if (recipesError) {
      return res.status(500).json({ error: "Failed to fetch saved recipes" });
    }

    res.json(recipes);
  } catch (error) {
    next(error);
  }
});

recipesRouter.get("/saved/ids", authenticateToken, async (req, res, next) => {
  try {
    const { data, error } = await req.supabase
      .from("saved_recipes")
      .select("recipe_id")
      .eq("user_id", req.user.id);

    if (error) {
      return res.status(500).json({ error: "Failed to fetch saved recipe IDs" });
    }

    res.json(data.map((r) => r.recipe_id));
  } catch (error) {
    next(error);
  }
});

recipesRouter.get("/:id", authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await req.supabase
      .from("recipes")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: "Recipe not found" });
    }

    res.json(data);
  } catch (error) {
    next(error);
  }
});

recipesRouter.get("/", authenticateToken, async (req, res, next) => {
  try {
    const { data, error } = await req.supabase
      .from("recipes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({ error: "Failed to fetch recipes" });
    }

    res.json(data);
  } catch (error) {
    next(error);
  }
});

recipesRouter.post(
  "/:id/scale",
  authenticateToken,
  [body("servings").isInt({ min: 1, max: 12 })],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { servings } = req.body;

      const { data: recipe, error } = await req.supabase
        .from("recipes")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !recipe) {
        return res.status(404).json({ error: "Recipe not found" });
      }

      const originalServings = recipe.servings;
      const scaleFactor = servings / originalServings;

      const scaledIngredients = recipe.ingredients.map((ing) => ({
        ...ing,
        quantity: Math.round(ing.quantity * scaleFactor * 100) / 100,
      }));

      const scaledNutrition = recipe.nutrition
        ? Object.fromEntries(
            Object.entries(recipe.nutrition).map(([key, value]) => [
              key,
              value ? Math.round(value * scaleFactor) : null,
            ])
          )
        : null;

      res.json({
        ...recipe,
        servings,
        ingredients: scaledIngredients,
        nutrition: scaledNutrition,
      });
    } catch (error) {
      next(error);
    }
  }
);

recipesRouter.post(
  "/substitutions",
  authenticateToken,
  [body("ingredient").notEmpty()],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { ingredient, dietaryFilters = [] } = req.body;
      const substitutions = await getSubstitutions(ingredient, dietaryFilters);

      res.json({ ingredient, substitutions });
    } catch (error) {
      next(error);
    }
  }
);

recipesRouter.post("/:id/save", authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: recipe, error: recipeError } = await req.supabase
      .from("recipes")
      .select("id")
      .eq("id", id)
      .single();

    if (recipeError || !recipe) {
      return res.status(404).json({ error: "Recipe not found" });
    }

    const { error } = await req.supabase
      .from("saved_recipes")
      .upsert(
        { user_id: req.user.id, recipe_id: id },
        { onConflict: "user_id,recipe_id" }
      );

    if (error) {
      return res.status(500).json({ error: "Failed to save recipe" });
    }

    res.status(201).json({ saved: true, recipeId: id });
  } catch (error) {
    next(error);
  }
});

recipesRouter.delete("/:id/save", authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    const { error } = await req.supabase
      .from("saved_recipes")
      .delete()
      .eq("recipe_id", id)
      .eq("user_id", req.user.id);

    if (error) {
      return res.status(500).json({ error: "Failed to unsave recipe" });
    }

    res.json({ saved: false, recipeId: id });
  } catch (error) {
    next(error);
  }
});

import express from "express";
import { body, validationResult } from "express-validator";
import { authenticateToken } from "../middleware/auth.js";
import { generateRecipe, getSubstitutions } from "../services/openai.js";

export const recipesRouter = express.Router();

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

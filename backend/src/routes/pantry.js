import express from "express";
import { body, validationResult } from "express-validator";
import { authenticateToken } from "../middleware/auth.js";
import { findPantryRecipes } from "../services/openai.js";

export const pantryRouter = express.Router();

pantryRouter.get("/", authenticateToken, async (req, res, next) => {
  try {
    const { data, error } = await req.supabase
      .from("pantry_items")
      .select("*")
      .order("name");

    if (error) {
      return res.status(500).json({ error: "Failed to fetch pantry items" });
    }

    res.json(data);
  } catch (error) {
    next(error);
  }
});

pantryRouter.post(
  "/",
  authenticateToken,
  [
    body("name").notEmpty().trim(),
    body("quantity").optional().isFloat({ min: 0 }),
    body("unit").optional().trim(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, quantity, unit, expiresAt } = req.body;

      const { data, error } = await req.supabase
        .from("pantry_items")
        .upsert(
          {
            user_id: req.user.id,
            name,
            quantity,
            unit,
            expires_at: expiresAt,
          },
          { onConflict: "user_id,name" }
        )
        .select("*")
        .single();

      if (error) {
        return res.status(500).json({ error: "Failed to add pantry item" });
      }

      res.status(201).json(data);
    } catch (error) {
      next(error);
    }
  }
);

pantryRouter.delete("/:id", authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    const { error } = await req.supabase
      .from("pantry_items")
      .delete()
      .eq("id", id);

    if (error) {
      return res.status(500).json({ error: "Failed to delete pantry item" });
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

pantryRouter.post(
  "/recipes",
  authenticateToken,
  [body("dietaryFilters").optional().isArray()],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { data: pantryItems, error } = await req.supabase
        .from("pantry_items")
        .select("name");

      if (error) {
        return res.status(500).json({ error: "Failed to fetch pantry" });
      }

      const ingredients = pantryItems.map((r) => r.name);
      const { dietaryFilters = [] } = req.body;

      if (ingredients.length === 0) {
        return res.json([]);
      }

      const recipes = await findPantryRecipes(ingredients, dietaryFilters, 5);

      res.json(recipes);
    } catch (error) {
      next(error);
    }
  }
);

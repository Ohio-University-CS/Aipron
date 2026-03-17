import express from "express";
import { body, validationResult } from "express-validator";
import { authenticateToken } from "../middleware/auth.js";

export const cookingRouter = express.Router();

cookingRouter.post(
  "/sessions",
  authenticateToken,
  [body("recipeId").isUUID()],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { recipeId } = req.body;

      const { data: recipe, error: recipeError } = await req.supabase
        .from("recipes")
        .select("id")
        .eq("id", recipeId)
        .single();

      if (recipeError || !recipe) {
        return res.status(404).json({ error: "Recipe not found" });
      }

      const { data, error } = await req.supabase
        .from("cooking_sessions")
        .insert({
          user_id: req.user.id,
          recipe_id: recipeId,
          current_step: 1,
        })
        .select("*")
        .single();

      if (error) {
        return res.status(500).json({ error: "Failed to create session" });
      }

      res.status(201).json(data);
    } catch (error) {
      next(error);
    }
  }
);

cookingRouter.get("/sessions/active", authenticateToken, async (req, res, next) => {
  try {
    const { data, error } = await req.supabase
      .from("cooking_sessions")
      .select("*, recipes(title, steps, ingredients)")
      .is("completed_at", null)
      .order("started_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: "No active session" });
    }

    res.json({
      ...data,
      title: data.recipes?.title,
      steps: data.recipes?.steps,
      ingredients: data.recipes?.ingredients,
      recipes: undefined,
    });
  } catch (error) {
    next(error);
  }
});

cookingRouter.patch(
  "/sessions/:id/step",
  authenticateToken,
  [body("stepNumber").isInt({ min: 1 })],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { stepNumber } = req.body;

      const { data, error } = await req.supabase
        .from("cooking_sessions")
        .update({ current_step: stepNumber })
        .eq("id", id)
        .select("*")
        .single();

      if (error || !data) {
        return res.status(404).json({ error: "Session not found" });
      }

      res.json(data);
    } catch (error) {
      next(error);
    }
  }
);

cookingRouter.post("/sessions/:id/complete", authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await req.supabase
      .from("cooking_sessions")
      .update({ completed_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .single();

    if (error || !data) {
      return res.status(404).json({ error: "Session not found" });
    }

    res.json(data);
  } catch (error) {
    next(error);
  }
});

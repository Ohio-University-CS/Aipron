import express from "express";
import { body, validationResult } from "express-validator";
import { supabaseAdmin } from "../db/supabase.js";
import { authenticateToken } from "../middleware/auth.js";

export const authRouter = express.Router();

authRouter.post(
  "/register",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 8 }),
    body("name").optional().trim(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, name } = req.body;

      const { data: createData, error: createError } =
        await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { name: name || null },
        });

      if (createError) {
        if (createError.message.includes("already been registered")) {
          return res.status(409).json({ error: "User already exists" });
        }
        return res.status(400).json({ error: createError.message });
      }

      const { data: signInData, error: signInError } =
        await supabaseAdmin.auth.signInWithPassword({ email, password });

      if (signInError) {
        return res.status(500).json({ error: "Account created but login failed" });
      }

      res.status(201).json({
        user: {
          id: createData.user.id,
          email: createData.user.email,
          name: createData.user.user_metadata?.name,
        },
        token: signInData.session.access_token,
      });
    } catch (error) {
      next(error);
    }
  }
);

authRouter.post(
  "/login",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").notEmpty(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      const { data, error } = await supabaseAdmin.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      res.json({
        user: {
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.name,
        },
        token: data.session.access_token,
      });
    } catch (error) {
      next(error);
    }
  }
);

authRouter.get("/me", authenticateToken, async (req, res, next) => {
  try {
    const { data, error } = await req.supabase
      .from("profiles")
      .select("*")
      .eq("id", req.user.id)
      .single();

    if (error) {
      return res.status(404).json({ error: "Profile not found" });
    }

    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        name: data.name,
        dietary_preferences: data.dietary_preferences,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Persist the signed-in user's dietary preferences chosen in Settings. We
 * upsert the row so brand-new accounts without a populated profile still end
 * up with a valid record.
 */
authRouter.put(
  "/preferences",
  authenticateToken,
  [body("dietaryPreferences").isArray()],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const prefs = (req.body.dietaryPreferences || [])
        .filter((p) => typeof p === "string" && p.trim())
        .map((p) => p.trim());

      // Use the admin client here: the user-scoped client hits RLS on INSERT
      // for accounts that don't yet have a `profiles` row, which would cause
      // every preference toggle to fail and revert client-side. We've already
      // authenticated the user via `authenticateToken`, and we always write
      // with their own `id`, so bypassing RLS is safe for this operation.
      const { data, error } = await supabaseAdmin
        .from("profiles")
        .upsert(
          {
            id: req.user.id,
            dietary_preferences: prefs,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        )
        .select("dietary_preferences")
        .single();

      if (error) {
        console.error("[auth/preferences] upsert failed:", error);
        return res.status(500).json({ error: "Failed to save preferences" });
      }

      res.json({ dietary_preferences: data?.dietary_preferences ?? prefs });
    } catch (error) {
      next(error);
    }
  }
);

import express from "express";
import { chatWithAssistant, generateRecipe } from "../services/openai.js";
import { authenticateToken } from "../middleware/auth.js";
import { fetchUserContext } from "../services/userContext.js";
import { supabaseAdmin } from "../db/supabase.js";
import { ensureLegacyUserRow } from "../services/legacyUsers.js";

export const chatRouter = express.Router();

/**
 * Factory for the create_recipe tool handler used by chatWithAssistant.
 * Generates a full recipe, inserts it into `recipes` for the authed user
 * (is_ai_generated=true) and upserts it into `saved_recipes` so it shows up
 * in the Saved tab by default. Returns { id, title } for the model.
 *
 * Uses `req.supabase` (the per-request JWT-authenticated Supabase client)
 * to exactly match the working POST /api/recipes/generate path.
 */
function buildOnCreateRecipe(req) {
  const userId = req.user.id;
  const db = req.supabase;
  return async ({ description, dietaryFilters = [], servings = 4, skillLevel = "intermediate" }) => {
    console.log(
      `[chat.create_recipe] user=${userId} description=${JSON.stringify(description).slice(0, 120)}`
    );

    // Self-heal: this project's recipes.user_id FK still points at the
    // legacy public.users table. Supabase-Auth users don't live there, so
    // we shim a row before inserting. No-op once the FK is repointed to
    // auth.users(id). See 2026-04-21_repoint_user_fk.sql migration.
    await ensureLegacyUserRow(req.user);

    // Pass userId so generateRecipe auto-merges the caller's saved dietary
    // preferences. Without this, chef-initiated recipe generation (via the
    // create_recipe tool) would ignore the profile preferences even though
    // direct /recipes/generate calls respect them.
    const recipe = await generateRecipe(description, {
      dietaryFilters,
      servings,
      skillLevel,
      userId,
    });

    const { data: inserted, error: insErr } = await db
      .from("recipes")
      .insert({
        user_id: userId,
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
        is_ai_generated: true,
      })
      .select("id, title")
      .single();

    if (insErr) {
      console.error("[chat.create_recipe] recipes insert failed:", insErr);
      throw insErr;
    }

    const { error: saveErr } = await db
      .from("saved_recipes")
      .upsert(
        { user_id: userId, recipe_id: inserted.id },
        { onConflict: "user_id,recipe_id" }
      );

    if (saveErr) {
      console.error("[chat.create_recipe] saved_recipes upsert failed:", saveErr);
    }

    console.log(`[chat.create_recipe] saved id=${inserted.id} title=${inserted.title}`);
    return { id: inserted.id, title: inserted.title };
  };
}

// Legacy stateless chat (no persistence, auth optional for user context)
chatRouter.post("/", async (req, res, next) => {
  try {
    const { messages, language } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res
        .status(400)
        .json({ error: "messages must be a non-empty array" });
    }

    let userContext = "";
    const token = req.headers["authorization"]?.split(" ")[1];
    if (token) {
      try {
        const { data: { user } } = await supabaseAdmin.auth.getUser(token);
        if (user) userContext = await fetchUserContext(user.id);
      } catch { /* proceed without context */ }
    }

    const content = await chatWithAssistant(messages, userContext, language);
    res.json({ content });
  } catch (error) {
    next(error);
  }
});

// List conversations for the authenticated user
chatRouter.get("/conversations", authenticateToken, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("conversations")
      .select("id, title, created_at, updated_at")
      .eq("user_id", req.user.id)
      .order("updated_at", { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    next(error);
  }
});

// Create a new conversation
chatRouter.post("/conversations", authenticateToken, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("conversations")
      .insert({ user_id: req.user.id, title: "New Chat" })
      .select("id, title, created_at, updated_at")
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

// Get messages for a conversation
chatRouter.get("/conversations/:id/messages", authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: convo, error: convoErr } = await supabaseAdmin
      .from("conversations")
      .select("id")
      .eq("id", id)
      .eq("user_id", req.user.id)
      .single();

    if (convoErr || !convo) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    const { data, error } = await supabaseAdmin
      .from("conversation_messages")
      .select("id, role, content, created_at")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    next(error);
  }
});

// Send a message in a conversation (saves user msg, gets AI reply, saves reply)
chatRouter.post("/conversations/:id/messages", authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content, language } = req.body;

    if (!content || typeof content !== "string") {
      return res.status(400).json({ error: "content is required" });
    }

    const { data: convo, error: convoErr } = await supabaseAdmin
      .from("conversations")
      .select("id, title")
      .eq("id", id)
      .eq("user_id", req.user.id)
      .single();

    if (convoErr || !convo) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    // Save user message
    await supabaseAdmin
      .from("conversation_messages")
      .insert({ conversation_id: id, role: "user", content });

    // Load full history and user context in parallel
    const [{ data: history }, userContext] = await Promise.all([
      supabaseAdmin
        .from("conversation_messages")
        .select("role, content")
        .eq("conversation_id", id)
        .order("created_at", { ascending: true }),
      fetchUserContext(req.user.id),
    ]);

    const reply = await chatWithAssistant(history || [], userContext, language, {
      onCreateRecipe: buildOnCreateRecipe(req),
    });

    // Save assistant reply
    const { data: assistantMsg, error: insertErr } = await supabaseAdmin
      .from("conversation_messages")
      .insert({ conversation_id: id, role: "assistant", content: reply })
      .select("id, role, content, created_at")
      .single();

    if (insertErr) throw insertErr;

    // Update conversation title from first user message and bump updated_at
    const updates = { updated_at: new Date().toISOString() };
    if (convo.title === "New Chat") {
      updates.title = content.length > 50 ? content.slice(0, 47) + "..." : content;
    }
    await supabaseAdmin
      .from("conversations")
      .update(updates)
      .eq("id", id);

    res.status(201).json(assistantMsg);
  } catch (error) {
    next(error);
  }
});

// Delete a conversation
chatRouter.delete("/conversations/:id", authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from("conversations")
      .delete()
      .eq("id", id)
      .eq("user_id", req.user.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

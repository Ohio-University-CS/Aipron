import express from "express";
import { chatWithAssistant } from "../services/openai.js";
import { authenticateToken } from "../middleware/auth.js";
import { supabaseAdmin } from "../db/supabase.js";

export const chatRouter = express.Router();

// Legacy stateless chat (no persistence)
chatRouter.post("/", async (req, res, next) => {
  try {
    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res
        .status(400)
        .json({ error: "messages must be a non-empty array" });
    }

    const content = await chatWithAssistant(messages);
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
    const { content } = req.body;

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

    // Load full history for context
    const { data: history } = await supabaseAdmin
      .from("conversation_messages")
      .select("role, content")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true });

    const reply = await chatWithAssistant(history || []);

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

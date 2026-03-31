import { v4 as uuidv4 } from "uuid";
import { supabaseAdmin } from "../db/supabase.js";
import dotenv from "dotenv";

dotenv.config();

const REALTIME_MODEL = "gpt-4o-realtime-preview-2024-12-17";

const DEFAULT_INSTRUCTIONS = `You are Chef Aipron, a warm and friendly cooking companion.
Talk like a real person — encouraging, casual, and passionate about food.
Help with recipes, cooking tips, ingredient swaps, meal planning, and techniques.
Keep answers concise but personable.`;

const COOKING_TOOLS = [
  {
    type: "function",
    name: "next_step",
    description: "Move to the next cooking step",
    parameters: {
      type: "object",
      properties: { stepNumber: { type: "number" } },
      required: ["stepNumber"],
    },
  },
  {
    type: "function",
    name: "repeat_step",
    description: "Repeat the current step instructions",
    parameters: {
      type: "object",
      properties: { stepNumber: { type: "number" } },
      required: ["stepNumber"],
    },
  },
  {
    type: "function",
    name: "start_timer",
    description: "Start a timer for a cooking step",
    parameters: {
      type: "object",
      properties: {
        duration: { type: "number", description: "Duration in seconds" },
        label: { type: "string" },
      },
      required: ["duration"],
    },
  },
  {
    type: "function",
    name: "ingredient_substitution",
    description: "Get substitution suggestions for an ingredient",
    parameters: {
      type: "object",
      properties: { ingredient: { type: "string" } },
      required: ["ingredient"],
    },
  },
];

/**
 * Create a Realtime API session by requesting an ephemeral token from OpenAI.
 * The client uses this short-lived token to open a direct WebRTC connection.
 *
 * @param {string} userId
 * @param {{ instructions?: string, tools?: object[] }} options
 */
export async function createRealtimeSession(userId, options = {}) {
  const instructions = options.instructions || DEFAULT_INSTRUCTIONS;
  const tools = options.tools || COOKING_TOOLS;

  const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: REALTIME_MODEL,
      voice: "alloy",
      instructions,
      tools,
      input_audio_transcription: { model: "whisper-1" },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error("OpenAI Realtime session error:", response.status, body);
    throw new Error("Failed to create OpenAI realtime session");
  }

  const session = await response.json();

  const sessionId = uuidv4();
  const expiresAt = new Date(Date.now() + 60 * 1000).toISOString();

  await supabaseAdmin
    .from("realtime_sessions")
    .insert({ user_id: userId, session_id: sessionId, expires_at: expiresAt })
    .then(({ error }) => {
      if (error) console.warn("Failed to persist session metadata:", error.message);
    });

  return {
    sessionId,
    clientSecret: session.client_secret.value,
    expiresAt,
    model: REALTIME_MODEL,
  };
}

/**
 * Clean up expired sessions
 */
export async function cleanupExpiredSessions() {
  try {
    await supabaseAdmin
      .from("realtime_sessions")
      .delete()
      .lt("expires_at", new Date().toISOString());
  } catch (error) {
    console.error("Session cleanup error:", error);
  }
}

import { v4 as uuidv4 } from "uuid";
import { supabaseAdmin } from "../db/supabase.js";
import { fetchUserContext } from "./userContext.js";
import dotenv from "dotenv";

dotenv.config();

const REALTIME_MODEL = "gpt-4o-realtime-preview-2024-12-17";

const BASE_INSTRUCTIONS = `You are a helpful cooking assistant for Aipron. Guide users through recipes step-by-step.
You can:
- Answer cooking questions
- Explain techniques
- Provide timing guidance
- Suggest substitutions
- Repeat steps when asked

Be concise, clear, and encouraging.`;

const SESSION_TOOLS = [
  {
    type: "function",
    name: "next_step",
    description: "Move to the next cooking step",
    parameters: {
      type: "object",
      properties: {
        stepNumber: { type: "number" },
      },
      required: ["stepNumber"],
    },
  },
  {
    type: "function",
    name: "repeat_step",
    description: "Repeat the current step instructions",
    parameters: {
      type: "object",
      properties: {
        stepNumber: { type: "number" },
      },
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
      properties: {
        ingredient: { type: "string" },
      },
      required: ["ingredient"],
    },
  },
];

function buildSessionConfig(instructions) {
  return {
    model: REALTIME_MODEL,
    voice: "shimmer",
    modalities: ["audio", "text"],
    instructions,
    input_audio_format: "pcm16",
    output_audio_format: "pcm16",
    input_audio_transcription: { model: "whisper-1" },
    turn_detection: {
      type: "server_vad",
      threshold: 0.5,
      prefix_padding_ms: 300,
      silence_duration_ms: 1500,
      create_response: true,
    },
    tools: SESSION_TOOLS,
  };
}

/**
 * Create a Realtime API session by requesting an ephemeral key from OpenAI.
 * Returns the client_secret + model so the client can authenticate its WebRTC connection.
 */
export async function createRealtimeSession(userId) {
  try {
    const userContext = await fetchUserContext(userId);
    const config = buildSessionConfig(BASE_INSTRUCTIONS + userContext);

    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error("OpenAI Realtime session error:", response.status, body);
      throw new Error("OpenAI refused to create realtime session");
    }

    const session = await response.json();

    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    const { error } = await supabaseAdmin
      .from("realtime_sessions")
      .insert({ user_id: userId, session_id: sessionId, expires_at: expiresAt });

    if (error) {
      console.error("Failed to store session metadata:", error);
    }

    return {
      sessionId,
      expiresAt,
      model: REALTIME_MODEL,
      clientSecret: session.client_secret?.value ?? session.client_secret,
    };
  } catch (error) {
    console.error("Realtime session creation error:", error);
    throw new Error("Failed to create realtime session");
  }
}

/**
 * Proxy WebRTC SDP exchange for browser clients (avoids CORS calling OpenAI directly).
 * The ephemeral clientSecret must come from createRealtimeSession for the same user.
 */
export async function negotiateRealtimeSdp({ sdp, clientSecret, model }) {
  if (typeof sdp !== "string" || !sdp.trim()) {
    throw new Error("Invalid SDP");
  }
  if (model !== REALTIME_MODEL) {
    throw new Error("Invalid realtime model");
  }
  if (typeof clientSecret !== "string" || !clientSecret.trim()) {
    throw new Error("Invalid client secret");
  }

  const url = `https://api.openai.com/v1/realtime?model=${encodeURIComponent(model)}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${clientSecret}`,
      "Content-Type": "application/sdp",
    },
    body: sdp,
  });

  if (!response.ok) {
    const body = await response.text();
    console.error("OpenAI Realtime negotiate error:", response.status, body);
    throw new Error("Realtime WebRTC negotiation failed");
  }

  return response.text();
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

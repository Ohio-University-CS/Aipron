import axios from "axios";
import { Platform } from "react-native";
import { supabase } from "./supabase";
import { Ingredient, Recipe } from "@aipron/shared";

/**
 * Expo Web: localhost is fine. Android emulator: localhost is the emulator itself — use 10.0.2.2.
 * Physical device: set EXPO_PUBLIC_API_URL to http://<your-lan-ip>:3001 (not localhost).
 */
function resolveApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();
  const base = fromEnv || "http://localhost:3001";

  try {
    const url = new URL(base);

    if (
      Platform.OS === "android" &&
      (url.hostname === "localhost" || url.hostname === "127.0.0.1")
    ) {
      url.hostname = "10.0.2.2";
    }

    return url.toString().replace(/\/$/, "");
  } catch {
    return base.replace(/\/$/, "");
  }
}

const API_BASE_URL = resolveApiBaseUrl();

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401, try refreshing the Supabase session once and replay the request.
// We intentionally do NOT sign the user out here — stale access tokens are a
// normal part of Supabase's refresh lifecycle, and `onAuthStateChange` in
// useAuthStore will handle real signouts. Signing out on every 401 produced a
// kick-loop whenever a request raced ahead of a token refresh.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retriedAfterRefresh
    ) {
      originalRequest._retriedAfterRefresh = true;
      try {
        const { data, error: refreshError } =
          await supabase.auth.refreshSession();
        const newToken = data.session?.access_token;
        if (!refreshError && newToken) {
          originalRequest.headers = originalRequest.headers ?? {};
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api.request(originalRequest);
        }
      } catch {
        // Fall through and surface the original 401.
      }
    }
    return Promise.reject(error);
  },
);

function normalizeIngredients(raw: unknown): Ingredient[] {
  if (!Array.isArray(raw)) return [];
  const out: Ingredient[] = [];
  for (const item of raw) {
    if (typeof item === "string") {
      const name = item.trim();
      if (name) out.push({ name, quantity: 0, unit: "" });
      continue;
    }
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const nameRaw = o.name ?? o.ingredient ?? o.item ?? o.Name ?? o.Ingredient;
    const name = typeof nameRaw === "string" ? nameRaw.trim() : "";
    if (!name) continue;
    const q = o.quantity;
    const quantity = typeof q === "number" ? q : Number(q);
    const unitRaw = o.unit;
    const unit = typeof unitRaw === "string" ? unitRaw : "";
    out.push({
      name,
      quantity: Number.isFinite(quantity) ? quantity : 0,
      unit,
    });
  }
  return out;
}

const normalizeRecipe = (recipe: Record<string, unknown>): Recipe => {
  const prepTime = recipe.prepTime ?? recipe.prep_time;
  const cookTime = recipe.cookTime ?? recipe.cook_time;
  const totalTime = recipe.totalTime ?? recipe.total_time;
  const dietaryTags = recipe.dietaryTags ?? recipe.dietary_tags;
  const createdAt = recipe.createdAt ?? recipe.created_at;
  const updatedAt = recipe.updatedAt ?? recipe.updated_at;
  const isAiGenerated = recipe.isAiGenerated ?? recipe.is_ai_generated;

  return {
    ...recipe,
    ingredients: normalizeIngredients(recipe.ingredients),
    prepTime: typeof prepTime === "number" ? prepTime : 0,
    cookTime: typeof cookTime === "number" ? cookTime : 0,
    totalTime: typeof totalTime === "number" ? totalTime : 0,
    dietaryTags: Array.isArray(dietaryTags) ? dietaryTags : [],
    isAiGenerated: typeof isAiGenerated === "boolean" ? isAiGenerated : false,
    createdAt: createdAt ? new Date(String(createdAt)) : undefined,
    updatedAt: updatedAt ? new Date(String(updatedAt)) : undefined,
  } as Recipe;
};

export const authApi = {
  register: async (email: string, password: string, name?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name: name || undefined } },
    });
    if (error) throw error;
    return {
      user: {
        id: data.user?.id,
        email: data.user?.email,
        name: data.user?.user_metadata?.name,
      },
      token: data.session?.access_token,
    };
  },
  login: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return {
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name,
      },
      token: data.session.access_token,
    };
  },
  getSession: async () => {
    return supabase.auth.getSession();
  },
  getMe: async () => {
    const { data } = await api.get("/auth/me");
    return data;
  },
};

export const recipeApi = {
  generate: async (prompt: string, options?: {
    dietaryFilters?: string[];
    servings?: number;
    skillLevel?: "beginner" | "intermediate" | "advanced";
    /** When true, backend loads your pantry and steers the recipe to use those ingredients. */
    usePantry?: boolean;
  }) => {
    const { data } = await api.post("/recipes/generate", { prompt, ...options });
    return data;
  },
  search: async (q: string, options?: {
    dietaryTag?: string;
    cuisine?: string;
    limit?: number;
    offset?: number;
  }) => {
    const { data } = await api.get("/recipes/search", {
      params: {
        q,
        dietaryTag: options?.dietaryTag,
        cuisine: options?.cuisine,
        limit: options?.limit,
        offset: options?.offset,
      },
    });
    return Array.isArray(data) ? data.map(normalizeRecipe) : [];
  },
  getById: async (id: string) => {
    const { data } = await api.get(`/recipes/${id}`);
    return normalizeRecipe(data);
  },
  getAll: async () => {
    const { data } = await api.get("/recipes");
    return Array.isArray(data) ? data.map(normalizeRecipe) : [];
  },
  scale: async (id: string, servings: number) => {
    const { data } = await api.post(`/recipes/${id}/scale`, { servings });
    return data;
  },
  getSubstitutions: async (ingredient: string, dietaryFilters?: string[]) => {
    const { data } = await api.post("/recipes/substitutions", {
      ingredient,
      dietaryFilters,
    });
    return data;
  },
  save: async (id: string) => {
    const { data } = await api.post(`/recipes/${id}/save`);
    return data;
  },
  unsave: async (id: string) => {
    const { data } = await api.delete(`/recipes/${id}/save`);
    return data;
  },
  getSaved: async () => {
    const { data } = await api.get("/recipes/saved");
    return Array.isArray(data) ? data.map(normalizeRecipe) : [];
  },
  getSavedIds: async (): Promise<string[]> => {
    const { data } = await api.get("/recipes/saved/ids");
    // Normalize response to a string array to avoid non-string entries.
    if (Array.isArray(data)) {
      return data.filter((id): id is string => typeof id === "string");
    }
    if (data && Array.isArray((data as any).ids)) {
      return (data as any).ids.filter((id: unknown): id is string => typeof id === "string");
    }
    return [];
  },
};

export const pantryApi = {
  getAll: async () => {
    const { data } = await api.get("/pantry");
    return data;
  },
  add: async (item: { name: string; quantity?: number; unit?: string; expiresAt?: Date }) => {
    const { data } = await api.post("/pantry", item);
    return data;
  },
  delete: async (id: string) => {
    const { data } = await api.delete(`/pantry/${id}`);
    return data;
  },
  findRecipes: async (dietaryFilters?: string[]) => {
    const { data } = await api.post("/pantry/recipes", { dietaryFilters });
    return data;
  },
};

export const cookingApi = {
  startSession: async (recipeId: string) => {
    const { data } = await api.post("/cooking/sessions", { recipeId });
    return data;
  },
  getActiveSession: async () => {
    const { data } = await api.get("/cooking/sessions/active");
    return data;
  },
  updateStep: async (sessionId: string, stepNumber: number) => {
    const { data } = await api.patch(`/cooking/sessions/${sessionId}/step`, { stepNumber });
    return data;
  },
  completeSession: async (sessionId: string) => {
    const { data } = await api.post(`/cooking/sessions/${sessionId}/complete`);
    return data;
  },
};

export interface RealtimeSession {
  sessionId: string;
  expiresAt: string;
  model: string;
  clientSecret: string;
}

export const realtimeApi = {
  createSession: async (): Promise<RealtimeSession> => {
    const { data } = await api.post<RealtimeSession>("/realtime/session");
    return data;
  },
  /** Web browser WebRTC: exchange SDP via backend (CORS-safe). */
  negotiateSdp: async (sdp: string, clientSecret: string, model: string): Promise<string> => {
    const { data } = await api.post<{ sdp: string }>("/realtime/negotiate", {
      sdp,
      clientSecret,
      model,
    });
    return data.sdp;
  },
};

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ConversationMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export const chatApi = {
  send: async (messages: { role: "user" | "assistant"; content: string }[], language?: string) => {
    const { data } = await api.post("/chat", { messages, language });
    return data.content as string;
  },
  getConversations: async (): Promise<Conversation[]> => {
    const { data } = await api.get("/chat/conversations");
    return data;
  },
  createConversation: async (): Promise<Conversation> => {
    const { data } = await api.post("/chat/conversations");
    return data;
  },
  getMessages: async (id: string): Promise<ConversationMessage[]> => {
    const { data } = await api.get(`/chat/conversations/${id}/messages`);
    return data;
  },
  sendMessage: async (id: string, content: string, language?: string): Promise<ConversationMessage> => {
    const { data } = await api.post(`/chat/conversations/${id}/messages`, { content, language });
    return data;
  },
  deleteConversation: async (id: string): Promise<void> => {
    await api.delete(`/chat/conversations/${id}`);
  },
};

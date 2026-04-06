import axios from "axios";
import { Platform } from "react-native";
import { supabase } from "./supabase";
import { useAuthStore } from "../store/useAuthStore";
import { Recipe } from "@aipron/shared";

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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const reqUrl = String(error.config?.url ?? "");
      // Public catalog search does not require auth; avoid logging the user out if something else failed.
      if (!reqUrl.includes("recipes/search")) {
        useAuthStore.getState().logout();
      }
    }
    return Promise.reject(error);
  }
);

const normalizeRecipe = (recipe: Record<string, unknown>): Recipe => {
  const prepTime = recipe.prepTime ?? recipe.prep_time;
  const cookTime = recipe.cookTime ?? recipe.cook_time;
  const totalTime = recipe.totalTime ?? recipe.total_time;
  const dietaryTags = recipe.dietaryTags ?? recipe.dietary_tags;
  const createdAt = recipe.createdAt ?? recipe.created_at;
  const updatedAt = recipe.updatedAt ?? recipe.updated_at;

  return {
    ...recipe,
    prepTime: typeof prepTime === "number" ? prepTime : 0,
    cookTime: typeof cookTime === "number" ? cookTime : 0,
    totalTime: typeof totalTime === "number" ? totalTime : 0,
    dietaryTags: Array.isArray(dietaryTags) ? dietaryTags : [],
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

export const realtimeApi = {
  createSession: async () => {
    const { data } = await api.post("/realtime/session");
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
  send: async (messages: { role: "user" | "assistant"; content: string }[]) => {
    const { data } = await api.post("/chat", { messages });
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
  sendMessage: async (id: string, content: string): Promise<ConversationMessage> => {
    const { data } = await api.post(`/chat/conversations/${id}/messages`, { content });
    return data;
  },
  deleteConversation: async (id: string): Promise<void> => {
    await api.delete(`/chat/conversations/${id}`);
  },
};

import axios from "axios";
import { supabase } from "./supabase";
import { useAuthStore } from "../store/useAuthStore";
import { Recipe } from "@aipron/shared";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3001";

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
      useAuthStore.getState().logout();
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
  const estimatedCostBand = recipe.estimatedCostBand ?? recipe.estimated_cost_band;
  const budgetNotes = recipe.budgetNotes ?? recipe.budget_notes;

  return {
    ...recipe,
    prepTime: typeof prepTime === "number" ? prepTime : 0,
    cookTime: typeof cookTime === "number" ? cookTime : 0,
    totalTime: typeof totalTime === "number" ? totalTime : 0,
    dietaryTags: Array.isArray(dietaryTags) ? dietaryTags : [],
    estimatedCostBand:
      estimatedCostBand === "low" || estimatedCostBand === "medium" || estimatedCostBand === "high"
        ? estimatedCostBand
        : undefined,
    budgetNotes: typeof budgetNotes === "string" ? budgetNotes : undefined,
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
    budgetMode?: boolean;
  }) => {
    const { data } = await api.post("/recipes/generate", { prompt, ...options });
    return normalizeRecipe(data as Record<string, unknown>);
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
  getSubstitutions: async (
    ingredient: string,
    dietaryFilters?: string[],
    options?: { budgetMode?: boolean }
  ) => {
    const { data } = await api.post("/recipes/substitutions", {
      ingredient,
      dietaryFilters,
      ...options,
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
  findRecipes: async (dietaryFilters?: string[], options?: { budgetMode?: boolean }) => {
    const { data } = await api.post("/pantry/recipes", { dietaryFilters, ...options });
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

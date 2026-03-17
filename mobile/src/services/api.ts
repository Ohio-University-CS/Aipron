import axios from "axios";
import { supabase } from "./supabase";
import { useAuthStore } from "../store/useAuthStore";

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
  getById: async (id: string) => {
    const { data } = await api.get(`/recipes/${id}`);
    return data;
  },
  getAll: async () => {
    const { data } = await api.get("/recipes");
    return data;
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
};

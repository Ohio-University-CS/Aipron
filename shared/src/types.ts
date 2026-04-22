/**
 * Shared types for Aipron
 */

export interface Profile {
  id: string;
  name?: string;
  dietary_preferences: DietaryFilter[];
  created_at: string;
  updated_at: string;
}

export type DietaryFilter =
  | "vegetarian"
  | "vegan"
  | "gluten-free"
  | "dairy-free"
  | "nut-free"
  | "keto"
  | "paleo"
  | "low-carb"
  | "low-sodium"
  | "halal"
  | "kosher";

export interface Ingredient {
  id?: string;
  name: string;
  quantity: number;
  unit: string;
  notes?: string;
}

export interface IngredientSubstitution {
  original: string;
  alternatives: Array<{
    name: string;
    ratio: string; // e.g., "1:1", "2:1"
    notes?: string;
  }>;
}

export interface RecipeStep {
  stepNumber: number;
  instruction: string;
  /** mise / chopping / measuring vs heat / finishing */
  phase?: "prep" | "cook";
  duration?: number; // seconds
  timerRequired?: boolean;
}

export interface Recipe {
  id?: string;
  title: string;
  description?: string;
  ingredients: Ingredient[];
  steps: RecipeStep[];
  prepTime: number; // minutes
  cookTime: number; // minutes
  totalTime: number; // minutes
  servings: number;
  nutrition?: {
    calories?: number;
    protein?: number; // grams
    carbs?: number; // grams
    fat?: number; // grams
  };
  dietaryTags: DietaryFilter[];
  cuisine?: string;
  difficulty?: "beginner" | "intermediate" | "advanced";
  /** Primary protein/ingredient this recipe centers on (e.g. "chicken", "tofu", "salmon"). */
  mainIngredient?: string;
  /** High-level dish category for image matching and grouping (e.g. "soup", "pasta", "stir-fry"). */
  dishType?: string;
  heroImage?: string;
  // True when this recipe was produced by the AI generation endpoint.
  // Used to render the "AI generated" badge and to distinguish user-generated
  // recipes from system/catalog recipes.
  isAiGenerated?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PantryItem {
  id?: string;
  name: string;
  quantity?: number;
  unit?: string;
  expiresAt?: Date;
}

export interface RecipeMatch {
  recipe: Recipe;
  matchPercentage: number;
  missingIngredients: string[];
  availableIngredients: string[];
}

export interface CookingSession {
  id: string;
  recipeId: string;
  userId: string;
  currentStep: number;
  startedAt: Date;
  pausedAt?: Date;
  completedAt?: Date;
}

export interface RealtimeSession {
  sessionId: string;
  userId: string;
  expiresAt: Date;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

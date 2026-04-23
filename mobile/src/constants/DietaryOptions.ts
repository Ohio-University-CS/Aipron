/**
 * Canonical dietary preference tags shown across Settings and Profile.
 *
 * `tag` is the exact string stored in `profiles.dietary_preferences` and
 * forwarded into the recipe-generation system prompt, so it must stay in sync
 * with backend expectations. `label` is the human-facing name, `icon` is a
 * MaterialIcons name.
 */
export interface DietaryOption {
  tag: string;
  label: string;
  icon: string;
}

export const DIETARY_OPTIONS: readonly DietaryOption[] = [
  { tag: "vegetarian", label: "Vegetarian", icon: "eco" },
  { tag: "vegan", label: "Vegan", icon: "spa" },
  { tag: "gluten-free", label: "Gluten-Free", icon: "grain" },
  { tag: "dairy-free", label: "Dairy-Free", icon: "water-drop" },
  { tag: "nut-free", label: "Nut-Free", icon: "block" },
  { tag: "halal", label: "Halal", icon: "check-circle" },
  { tag: "keto", label: "Keto", icon: "local-fire-department" },
  { tag: "low-carb", label: "Low Carb", icon: "trending-down" },
] as const;

/**
 * Design Tokens for AIpron
 * Following PRD requirements: spacing (4, 8, 12, 16, 24, 32), semantic colors
 */

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const lightColors = {
  primary: "#FF6B35",
  primaryDark: "#E55A2B",
  primaryLight: "#FF8C5A",

  success: "#4CAF50",
  warning: "#FF9800",
  error: "#F44336",
  info: "#2196F3",

  background: "#FFFFFF",
  surface: "#F5F5F5",
  text: "#212121",
  textSecondary: "#757575",
  textDisabled: "#BDBDBD",
  border: "#E0E0E0",

  card: "#FFFFFF",
  surfaceWarm: "#FFFBEB",
  surfaceWarmAlt: "#FFF7ED",
  ingredientBorder: "#FEE2E2",
  headerAccent: "#FED7AA",

  cookingBackground: "#1A1A1A",
  cookingText: "#FFFFFF",
  cookingTextSecondary: "#B0B0B0",
} as const;

export const darkColors: typeof lightColors = {
  primary: "#FF8C5A",
  primaryDark: "#FF6B35",
  primaryLight: "#FFAB85",

  success: "#66BB6A",
  warning: "#FFB74D",
  error: "#EF5350",
  info: "#42A5F5",

  background: "#121212",
  surface: "#1E1E1E",
  text: "#E0E0E0",
  textSecondary: "#9E9E9E",
  textDisabled: "#616161",
  border: "#333333",

  card: "#1E1E1E",
  surfaceWarm: "#2A2118",
  surfaceWarmAlt: "#261E15",
  ingredientBorder: "#3D2020",
  headerAccent: "#B0855A",

  cookingBackground: "#000000",
  cookingText: "#FFFFFF",
  cookingTextSecondary: "#B0B0B0",
} as const;

export type ThemeColors = typeof lightColors;

/** Default (light) colors export for backward compatibility */
export const colors = lightColors;

export const typography = {
  // Cooking Mode: max 3 text sizes, minimum 24px for active step
  cooking: {
    step: {
      fontSize: 28,
      lineHeight: 36,
      fontWeight: "600" as const,
    },
    instruction: {
      fontSize: 24,
      lineHeight: 32,
      fontWeight: "400" as const,
    },
    timer: {
      fontSize: 48,
      lineHeight: 56,
      fontWeight: "700" as const,
    },
  },
  // Regular app typography
  h1: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "700" as const,
  },
  h2: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400" as const,
  },
  caption: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400" as const,
  },
} as const;

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

export const shadows = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
} as const;

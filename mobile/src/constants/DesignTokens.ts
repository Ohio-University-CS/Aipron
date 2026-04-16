/**
 * Design Tokens for AIpron — "Sun-Filled Brunch" Editorial Theme
 * Extracted from Google Stitch designs. Material 3 semantic color system
 * with Noto Serif + Plus Jakarta Sans typography.
 */

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  screenPadding: 24,
  sectionGap: 48,
} as const;

export const lightColors = {
  primary: "#755b00",
  onPrimary: "#ffffff",
  primaryContainer: "#f4c430",
  onPrimaryContainer: "#695200",

  secondary: "#77574d",
  onSecondary: "#ffffff",
  secondaryContainer: "#fed3c7",
  onSecondaryContainer: "#795950",

  tertiary: "#944a00",
  onTertiary: "#ffffff",
  tertiaryContainer: "#ffbc8d",
  onTertiaryContainer: "#864300",

  error: "#ba1a1a",
  onError: "#ffffff",
  errorContainer: "#ffdad6",

  background: "#fbf9f5",
  onBackground: "#1b1c1a",
  surface: "#fbf9f5",
  onSurface: "#1b1c1a",
  onSurfaceVariant: "#4e4634",

  surfaceContainerLowest: "#ffffff",
  surfaceContainerLow: "#f5f3ef",
  surfaceContainer: "#efeeea",
  surfaceContainerHigh: "#eae8e4",
  surfaceContainerHighest: "#e4e2de",
  surfaceBright: "#fbf9f5",
  surfaceVariant: "#e4e2de",

  outline: "#807661",
  outlineVariant: "#d1c5ad",

  inverseSurface: "#30312e",
  inverseOnSurface: "#f2f0eb",
  inversePrimary: "#f4c430",

  // Cooking mode
  cookingBackground: "#1A1A1A",
  cookingText: "#FFFFFF",
  cookingTextSecondary: "#B0B0B0",

  // Semantic aliases for backward compatibility
  text: "#1b1c1a",
  textSecondary: "#4e4634",
  textDisabled: "#807661",
  border: "#d1c5ad",
  card: "#ffffff",
  surfaceWarm: "#f5f3ef",
  surfaceWarmAlt: "#efeeea",
  success: "#4CAF50",
  warning: "#FF9800",
  info: "#2196F3",
} as const;

export const darkColors: typeof lightColors = {
  primary: "#f4c430",
  onPrimary: "#3d2e00",
  primaryContainer: "#755b00",
  onPrimaryContainer: "#ffd79b",

  secondary: "#e6bdb2",
  onSecondary: "#442a22",
  secondaryContainer: "#5d4037",
  onSecondaryContainer: "#fed3c7",

  tertiary: "#ffb77c",
  onTertiary: "#502400",
  tertiaryContainer: "#723600",
  onTertiaryContainer: "#ffddbe",

  error: "#ffb4ab",
  onError: "#690005",
  errorContainer: "#93000a",

  background: "#1b1c1a",
  onBackground: "#e4e2de",
  surface: "#1b1c1a",
  onSurface: "#e4e2de",
  onSurfaceVariant: "#d1c5ad",

  surfaceContainerLowest: "#111210",
  surfaceContainerLow: "#1e1f1c",
  surfaceContainer: "#232420",
  surfaceContainerHigh: "#2d2e2a",
  surfaceContainerHighest: "#383935",
  surfaceBright: "#3b3c38",
  surfaceVariant: "#4e4634",

  outline: "#9a8e78",
  outlineVariant: "#4e4634",

  inverseSurface: "#e4e2de",
  inverseOnSurface: "#30312e",
  inversePrimary: "#755b00",

  cookingBackground: "#000000",
  cookingText: "#FFFFFF",
  cookingTextSecondary: "#B0B0B0",

  text: "#e4e2de",
  textSecondary: "#d1c5ad",
  textDisabled: "#9a8e78",
  border: "#4e4634",
  card: "#232420",
  surfaceWarm: "#2d2e2a",
  surfaceWarmAlt: "#383935",
  success: "#66BB6A",
  warning: "#FFB74D",
  info: "#42A5F5",
} as const;

export type ThemeColors = typeof lightColors;

/** Default (light) colors export for backward compatibility */
export const colors = lightColors;

export const fonts = {
  serif: "NotoSerif",
  serifItalic: "NotoSerif-Italic",
  serifBold: "NotoSerif-Bold",
  serifBoldItalic: "NotoSerif-BoldItalic",
  sans: "PlusJakartaSans",
  sansLight: "PlusJakartaSans-Light",
  sansMedium: "PlusJakartaSans-Medium",
  sansSemiBold: "PlusJakartaSans-SemiBold",
  sansBold: "PlusJakartaSans-Bold",
} as const;

export const typography = {
  displayXL: {
    fontSize: 48,
    lineHeight: 56,
    fontWeight: "700" as const,
    fontFamily: fonts.serifBold,
  },
  displayL: {
    fontSize: 36,
    lineHeight: 44,
    fontWeight: "700" as const,
    fontFamily: fonts.serifBold,
  },
  h1: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "700" as const,
    fontFamily: fonts.serifBold,
  },
  h2: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "600" as const,
    fontFamily: fonts.serif,
  },
  title: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "600" as const,
    fontFamily: fonts.serif,
  },
  bodyLg: {
    fontSize: 18,
    lineHeight: 28,
    fontWeight: "400" as const,
    fontFamily: fonts.sans,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400" as const,
    fontFamily: fonts.sans,
  },
  label: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "600" as const,
    fontFamily: fonts.sansSemiBold,
    textTransform: "uppercase" as const,
    letterSpacing: 2,
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "400" as const,
    fontFamily: fonts.sans,
  },
  captionSm: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "500" as const,
    fontFamily: fonts.sansMedium,
  },
  cooking: {
    step: {
      fontSize: 28,
      lineHeight: 36,
      fontWeight: "600" as const,
      fontFamily: fonts.serifBold,
    },
    instruction: {
      fontSize: 32,
      lineHeight: 42,
      fontWeight: "400" as const,
      fontFamily: fonts.serif,
    },
    timer: {
      fontSize: 48,
      lineHeight: 56,
      fontWeight: "700" as const,
      fontFamily: fonts.serifBold,
    },
  },
} as const;

export const borderRadius = {
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  xxxl: 32,
  full: 9999,
  editorialTL: 48,
  editorialBR: 12,
} as const;

export const shadows = {
  sm: {
    shadowColor: "#1b1c1a",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: "#1b1c1a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: "#1b1c1a",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  nav: {
    shadowColor: "#1b1c1a",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 6,
  },
} as const;

export const gradients = {
  ctaPrimary: {
    colors: ["#755b00", "#f4c430"] as const,
    start: { x: 0.1, y: 0.9 },
    end: { x: 0.9, y: 0.1 },
  },
  heroFade: {
    colors: ["transparent", "#fbf9f5"] as const,
    start: { x: 0.5, y: 0 },
    end: { x: 0.5, y: 1 },
  },
} as const;

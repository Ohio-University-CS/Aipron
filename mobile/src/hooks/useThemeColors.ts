import { lightColors, type ThemeColors } from "../constants/DesignTokens";

/** Always returns the light theme; dark mode is not supported. */
export function useThemeColors(): ThemeColors {
  return lightColors;
}

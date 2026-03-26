import { useThemeStore } from "../store/useThemeStore";
import { lightColors, darkColors, type ThemeColors } from "../constants/DesignTokens";

export function useThemeColors(): ThemeColors {
  const mode = useThemeStore((s) => s.mode);
  return mode === "dark" ? darkColors : lightColors;
}

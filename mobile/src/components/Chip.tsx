import React from "react";
import { Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { borderRadius, fonts, spacing } from "../constants/DesignTokens";
import { useThemeColors } from "../hooks/useThemeColors";
import type { ThemeColors } from "../constants/DesignTokens";

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  variant?: "filled" | "outlined" | "tonal";
  icon?: string;
  size?: "sm" | "md";
}

const SIZE_CONFIG = {
  sm: { height: 28, paddingHorizontal: 12, fontSize: 11 },
  md: { height: 34, paddingHorizontal: 16, fontSize: 13 },
} as const;

function getVariantStyles(
  variant: "filled" | "outlined" | "tonal",
  selected: boolean,
  theme: ThemeColors,
): { container: ViewStyle; text: TextStyle } {
  switch (variant) {
    case "filled":
      return {
        container: {
          backgroundColor: theme.primaryContainer,
        },
        text: { color: theme.onPrimaryContainer },
      };
    case "outlined":
      return selected
        ? {
            container: {
              backgroundColor: theme.primaryContainer,
              borderWidth: 1,
              borderColor: theme.primaryContainer,
            },
            text: { color: theme.onPrimaryContainer },
          }
        : {
            container: {
              backgroundColor: "transparent",
              borderWidth: 1,
              borderColor: theme.outlineVariant,
            },
            text: { color: theme.onSurface },
          };
    case "tonal":
    default:
      return {
        container: { backgroundColor: theme.surfaceContainerHigh },
        text: { color: theme.onSurface },
      };
  }
}

export const Chip: React.FC<ChipProps> = ({
  label,
  selected = false,
  onPress,
  variant = "tonal",
  icon,
  size = "md",
}) => {
  const theme = useThemeColors();
  const config = SIZE_CONFIG[size];
  const variantStyles = getVariantStyles(variant, selected, theme);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
      style={[
        styles.container,
        {
          height: config.height,
          paddingHorizontal: config.paddingHorizontal,
        },
        variantStyles.container,
      ]}
    >
      {icon && (
        <MaterialIcons
          name={icon as any}
          size={16}
          color={variantStyles.text.color as string}
          style={styles.icon}
        />
      )}
      <Text
        style={[
          styles.label,
          { fontSize: config.fontSize },
          variantStyles.text,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: borderRadius.full,
  },
  icon: {
    marginRight: spacing.xs,
  },
  label: {
    fontFamily: fonts.sansMedium,
  },
});

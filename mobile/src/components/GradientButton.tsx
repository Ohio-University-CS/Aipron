import React, { useCallback, useRef } from "react";
import {
  Text,
  Pressable,
  StyleSheet,
  Animated,
  ViewStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { gradients, borderRadius, fonts, spacing } from "../constants/DesignTokens";
import { useThemeColors } from "../hooks/useThemeColors";

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
  disabled?: boolean;
  icon?: string;
  size?: "sm" | "md" | "lg";
}

const SIZE_CONFIG = {
  sm: { height: 40, fontSize: 13, iconSize: 16, gap: spacing.xs },
  md: { height: 48, fontSize: 14, iconSize: 18, gap: spacing.sm },
  lg: { height: 56, fontSize: 15, iconSize: 20, gap: spacing.sm },
} as const;

export const GradientButton: React.FC<GradientButtonProps> = ({
  title,
  onPress,
  style,
  disabled = false,
  icon,
  size = "lg",
}) => {
  const theme = useThemeColors();
  const scale = useRef(new Animated.Value(1)).current;
  const config = SIZE_CONFIG[size];

  const handlePressIn = useCallback(() => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  }, [scale]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();
  }, [scale]);

  return (
    <Animated.View
      style={[
        { transform: [{ scale }], opacity: disabled ? 0.5 : 1 },
        style,
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
      >
        <LinearGradient
          colors={[...gradients.ctaPrimary.colors]}
          start={gradients.ctaPrimary.start}
          end={gradients.ctaPrimary.end}
          style={[styles.gradient, { height: config.height }]}
        >
          {icon && (
            <MaterialIcons
              name={icon as any}
              size={config.iconSize}
              color={theme.onPrimaryContainer}
              style={{ marginRight: config.gap }}
            />
          )}
          <Text
            style={[
              styles.label,
              { fontSize: config.fontSize, color: theme.onPrimaryContainer },
            ]}
          >
            {title}
          </Text>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  gradient: {
    borderRadius: borderRadius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  label: {
    fontFamily: fonts.sansSemiBold,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
});

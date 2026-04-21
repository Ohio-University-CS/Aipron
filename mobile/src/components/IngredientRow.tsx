import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Ingredient } from "@aipron/shared";
import { spacing, fonts, type ThemeColors } from "../constants/DesignTokens";
import { useThemeColors } from "../hooks/useThemeColors";

interface IngredientRowProps {
  ingredient: Ingredient;
  onPress?: () => void;
  /** When `showSubstitution` is true, called when the user taps "Find substitution". */
  onSubstitutionPress?: () => void;
  loading?: boolean;
  error?: boolean;
  disabled?: boolean;
  showSubstitution?: boolean;
}

export const IngredientRow: React.FC<IngredientRowProps> = (props) => {
  const {
    ingredient,
    onPress,
    loading = false,
    error = false,
    disabled = false,
    showSubstitution = false,
  } = props;
  const c = useThemeColors();
  const styles = useMemo(() => getStyles(c), [c]);

  const content = (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={[styles.indicator, disabled && styles.indicatorDisabled]} />
        <Text
          style={[
            styles.name,
            disabled && styles.nameDisabled,
            error && styles.nameError,
          ]}
        >
          {ingredient.name}
        </Text>
        <Text style={styles.quantity}>
          {ingredient.quantity} {ingredient.unit}
        </Text>
      </View>
      {ingredient.notes && (
        <Text style={styles.notes}>{ingredient.notes}</Text>
      )}
      {showSubstitution && (
        <TouchableOpacity
          style={styles.substitutionButton}
          onPress={() => props.onSubstitutionPress?.()}
          activeOpacity={0.7}
          disabled={loading || !props.onSubstitutionPress}
        >
          <MaterialIcons name="swap-horiz" size={14} color={c.primary} />
          <Text style={styles.substitutionText}>Find substitution</Text>
        </TouchableOpacity>
      )}
      {loading && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.7}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const getStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: c.outlineVariant + "26",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: c.outline,
    marginRight: spacing.md,
  },
  indicatorDisabled: {
    borderColor: c.outlineVariant,
  },
  name: {
    fontFamily: fonts.sans,
    fontSize: 16,
    lineHeight: 24,
    color: c.onSurface,
    flex: 1,
  },
  nameDisabled: {
    opacity: 0.5,
  },
  nameError: {
    color: c.error,
  },
  quantity: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 16,
    lineHeight: 24,
    color: c.onSurface,
    marginLeft: spacing.md,
  },
  notes: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 18,
    color: c.onSurfaceVariant,
    fontStyle: "italic",
    marginTop: spacing.xs,
    marginLeft: spacing.md + 8,
  },
  substitutionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.xs,
    marginLeft: spacing.md + 8,
    paddingVertical: spacing.xs,
  },
  substitutionText: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: c.primary,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: c.surfaceContainerLowest + "CC",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: c.onSurfaceVariant,
  },
});

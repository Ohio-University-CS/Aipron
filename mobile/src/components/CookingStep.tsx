import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Recipe, RecipeStep } from "@aipron/shared";
import { spacing, typography, borderRadius, fonts, type ThemeColors } from "../constants/DesignTokens";
import { useThemeColors } from "../hooks/useThemeColors";
import { TimerChip } from "./TimerChip";
import { IngredientRow } from "./IngredientRow";

interface CookingStepProps {
  step: RecipeStep;
  isActive: boolean;
  loading?: boolean;
  error?: boolean;
  disabled?: boolean;
  recipe?: Recipe;
}

export const CookingStep: React.FC<CookingStepProps> = ({
  step,
  isActive,
  loading = false,
  error = false,
  disabled = false,
  recipe,
}) => {
  const c = useThemeColors();
  const styles = useMemo(() => getStyles(c), [c]);

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Failed to load step</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, isActive && styles.activeContainer]}
      contentContainerStyle={styles.content}
    >
      {recipe && (
        <View style={styles.recipeCard}>
          <Text style={styles.recipeLabel}>Featured recipe</Text>
          <Text style={styles.recipeTitle} numberOfLines={2}>
            {recipe.title}
          </Text>
          <View style={styles.recipeMetaRow}>
            <View style={styles.recipeMetaItem}>
              <View style={styles.metaIconBadge}>
                <MaterialIcons name="schedule" size={16} color={c.primary} />
              </View>
              <Text style={styles.metaLabel}>Prep</Text>
              <Text style={styles.metaValue}>{recipe.prepTime} min</Text>
            </View>
            <View style={styles.recipeMetaItem}>
              <View style={styles.metaIconBadge}>
                <MaterialIcons name="local-fire-department" size={16} color={c.primary} />
              </View>
              <Text style={styles.metaLabel}>Cook</Text>
              <Text style={styles.metaValue}>{recipe.cookTime} min</Text>
            </View>
            <View style={styles.recipeMetaItem}>
              <View style={styles.metaIconBadge}>
                <MaterialIcons name="people-outline" size={16} color={c.primary} />
              </View>
              <Text style={styles.metaLabel}>Serves</Text>
              <Text style={styles.metaValue}>{recipe.servings}</Text>
            </View>
          </View>
        </View>
      )}

      {recipe && recipe.ingredients.length > 0 && (
        <View style={styles.ingredientsCard}>
          <View style={styles.ingredientsHeaderRow}>
            <View style={styles.ingredientsAccent} />
            <Text style={styles.ingredientsTitle}>Ingredients</Text>
          </View>
          <View style={styles.ingredientsList}>
            {recipe.ingredients.map((ingredient) => (
              <IngredientRow
                key={ingredient.id || ingredient.name}
                ingredient={ingredient}
              />
            ))}
          </View>
        </View>
      )}

      <View style={styles.header}>
        <Text style={[styles.stepLabel, isActive && styles.stepLabelActive]}>
          Step {step.stepNumber}
        </Text>
        {step.timerRequired && step.duration && (
          <TimerChip duration={step.duration} isActive={isActive} />
        )}
      </View>
      <Text
        style={[
          styles.instruction,
          isActive && styles.instructionActive,
          disabled && styles.instructionDisabled,
        ]}
      >
        {step.instruction}
      </Text>

      {step.timerRequired && step.duration && (
        <View style={styles.timerSection}>
          <Text style={styles.timerDisplay}>
            {Math.floor(step.duration / 60)}:{String(step.duration % 60).padStart(2, "0")}
          </Text>
        </View>
      )}

      <View style={styles.chefTip}>
        <MaterialIcons name="lightbulb" size={20} color={c.tertiary} />
        <Text style={styles.chefTipText}>
          Keep an eye on temperature and adjust as needed.
        </Text>
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      )}
    </ScrollView>
  );
};

const getStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.cookingBackground,
  },
  activeContainer: {
    backgroundColor: c.cookingBackground,
  },
  content: {
    padding: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  recipeCard: {
    backgroundColor: c.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  recipeLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 2,
    color: c.secondary,
    marginBottom: spacing.xs,
  },
  recipeTitle: {
    ...typography.h2,
    color: c.onSurface,
    marginBottom: spacing.md,
  },
  recipeMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  recipeMetaItem: {
    flex: 1,
    alignItems: "center",
  },
  metaIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: c.surfaceContainerLow,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs / 2,
  },
  metaLabel: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: c.onSurfaceVariant,
  },
  metaValue: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    color: c.onSurface,
  },
  ingredientsCard: {
    backgroundColor: c.surfaceContainerLow,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.sm,
    marginBottom: spacing.xl,
  },
  ingredientsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  ingredientsAccent: {
    width: 3,
    height: 24,
    borderRadius: 999,
    backgroundColor: c.primary,
  },
  ingredientsTitle: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 16,
    color: c.onSurface,
  },
  ingredientsList: {
    borderTopWidth: 1,
    borderTopColor: c.outlineVariant + "26",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  stepLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 2,
    color: c.cookingTextSecondary,
  },
  stepLabelActive: {
    color: c.secondary,
  },
  instruction: {
    fontFamily: fonts.serif,
    fontSize: 32,
    lineHeight: 42,
    color: c.cookingTextSecondary,
  },
  instructionActive: {
    color: c.cookingText,
  },
  instructionDisabled: {
    opacity: 0.5,
  },
  timerSection: {
    marginTop: spacing.xl,
    alignItems: "center",
  },
  timerDisplay: {
    ...typography.cooking.timer,
    color: c.cookingText,
  },
  chefTip: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    backgroundColor: c.surfaceContainerLow,
    borderRadius: 16,
    padding: spacing.lg,
    marginTop: spacing.xl,
  },
  chefTipText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 20,
    color: c.onSurfaceVariant,
    flex: 1,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: c.cookingBackground + "CC",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    ...typography.body,
    color: c.cookingText,
  },
  errorText: {
    ...typography.body,
    color: c.error,
    textAlign: "center",
    padding: spacing.xl,
  },
});

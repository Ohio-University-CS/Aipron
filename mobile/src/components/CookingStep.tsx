import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Recipe, RecipeStep } from "@aipron/shared";
import { colors, spacing, typography, borderRadius } from "../constants/DesignTokens";
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
                <Ionicons name="time-outline" size={16} color={colors.primary} />
              </View>
              <Text style={styles.metaLabel}>Prep</Text>
              <Text style={styles.metaValue}>{recipe.prepTime} min</Text>
            </View>
            <View style={styles.recipeMetaItem}>
              <View style={styles.metaIconBadge}>
                <Ionicons name="flame-outline" size={16} color={colors.primary} />
              </View>
              <Text style={styles.metaLabel}>Cook</Text>
              <Text style={styles.metaValue}>{recipe.cookTime} min</Text>
            </View>
            <View style={styles.recipeMetaItem}>
              <View style={styles.metaIconBadge}>
                <Ionicons name="people-outline" size={16} color={colors.primary} />
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
        <Text style={[styles.stepNumber, isActive && styles.stepNumberActive]}>
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
      {loading && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cookingBackground,
  },
  activeContainer: {
    backgroundColor: colors.cookingBackground,
  },
  content: {
    padding: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  recipeCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  recipeLabel: {
    ...typography.caption,
    color: colors.primary,
    marginBottom: spacing.xs,
    textTransform: "uppercase",
  },
  recipeTitle: {
    ...typography.h2,
    color: colors.text,
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
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs / 2,
  },
  metaLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
  },
  metaValue: {
    ...typography.caption,
    color: colors.text,
    fontWeight: "600",
    fontSize: 12,
  },
  ingredientsCard: {
    backgroundColor: colors.surface,
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
    backgroundColor: colors.primary,
  },
  ingredientsTitle: {
    ...typography.body,
    fontWeight: "600",
    color: colors.text,
  },
  ingredientsList: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  stepNumber: {
    ...typography.cooking.step,
    color: colors.cookingTextSecondary,
  },
  stepNumberActive: {
    color: colors.cookingText,
  },
  instruction: {
    ...typography.cooking.instruction,
    color: colors.cookingTextSecondary,
    lineHeight: 32,
  },
  instructionActive: {
    color: colors.cookingText,
  },
  instructionDisabled: {
    opacity: 0.5,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(26, 26, 26, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    ...typography.body,
    color: colors.cookingText,
  },
  errorText: {
    ...typography.body,
    color: colors.error,
    textAlign: "center",
    padding: spacing.xl,
  },
});

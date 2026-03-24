import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Recipe } from "@aipron/shared";
import { colors, spacing, borderRadius, typography, shadows } from "../constants/DesignTokens";

interface RecipeCardProps {
  recipe: Recipe;
  onPress: () => void;
  isSaved?: boolean;
  onToggleSave?: (recipeId: string) => void;
  loading?: boolean;
  error?: boolean;
  disabled?: boolean;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  onPress,
  isSaved = false,
  onToggleSave,
  loading = false,
  error = false,
  disabled = false,
}) => {
  if (error) {
    return (
      <View style={[styles.card, styles.errorCard]}>
        <Text style={styles.errorText}>Failed to load recipe</Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.card, disabled && styles.cardDisabled]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        <View style={styles.imagePlaceholder}>
          <Ionicons name="restaurant" size={32} color={colors.textSecondary} />
        </View>
        {onToggleSave && (
          <TouchableOpacity
            style={styles.saveBadge}
            onPress={(e) => {
              e.stopPropagation?.();
              if (!recipe.id) {
                return;
              }
              onToggleSave(recipe.id);
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isSaved ? "heart" : "heart-outline"}
              size={22}
              color={isSaved ? colors.error : colors.background}
            />
          </TouchableOpacity>
        )}
        <View style={styles.timeBadge}>
          <Ionicons name="time-outline" size={14} color={colors.background} />
          <Text style={styles.timeBadgeText}>{recipe.totalTime}m</Text>
        </View>
      </View>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {recipe.title}
        </Text>
        {recipe.description && (
          <Text style={styles.description} numberOfLines={2}>
            {recipe.description}
          </Text>
        )}
        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <Ionicons name="people-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.metaText}>{recipe.servings} servings</Text>
          </View>
          {recipe.difficulty && (
            <View style={styles.metaItem}>
              <Ionicons name="star-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.metaText}>{recipe.difficulty}</Text>
            </View>
          )}
        </View>
        {recipe.dietaryTags.length > 0 && (
          <View style={styles.tags}>
            {recipe.dietaryTags.slice(0, 3).map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
      {loading && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    overflow: "hidden",
    ...shadows.md,
  },
  cardDisabled: {
    opacity: 0.5,
  },
  errorCard: {
    borderWidth: 1,
    borderColor: colors.error,
  },
  imageContainer: {
    width: "100%",
    height: 180,
    backgroundColor: colors.surface,
    position: "relative",
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.surface,
  },
  saveBadge: {
    position: "absolute",
    top: spacing.md,
    left: spacing.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.cookingBackground + "99",
    justifyContent: "center",
    alignItems: "center",
  },
  timeBadge: {
    position: "absolute",
    top: spacing.md,
    right: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.cookingBackground + "E6",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: spacing.xs / 2,
  },
  timeBadgeText: {
    ...typography.caption,
    color: colors.background,
    fontWeight: "600",
  },
  content: {
    padding: spacing.lg,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs / 2,
  },
  metaText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  tag: {
    backgroundColor: colors.primaryLight + "20",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.sm,
  },
  tagText: {
    ...typography.caption,
    color: colors.primary,
    fontSize: 12,
    fontWeight: "500",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: borderRadius.lg,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  errorText: {
    ...typography.body,
    color: colors.error,
  },
});

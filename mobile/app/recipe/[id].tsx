import React, { useCallback, useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Recipe } from "@aipron/shared";
import { recipeApi } from "../../src/services/api";
import { findLocalCatalogRecipeById } from "../../src/data/localCatalog";
import { useLocalCatalogSavedIds } from "../../src/hooks/useLocalCatalogSavedIds";
import { IngredientRow } from "../../src/components/IngredientRow";
import {
  colors,
  spacing,
  typography,
  borderRadius,
  shadows,
} from "../../src/constants/DesignTokens";

function isLocalId(id: string | undefined): boolean {
  return !!id && id.startsWith("local-");
}

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);

  const [serverSaved, setServerSaved] = useState(false);
  const { savedIds: localSavedIds, toggleSave: toggleLocalSave } =
    useLocalCatalogSavedIds();

  const isLocal = isLocalId(id);
  const isSaved = isLocal
    ? !!id && localSavedIds.has(id)
    : serverSaved;

  useEffect(() => {
    loadRecipe();
  }, [id]);

  const loadRecipe = async () => {
    if (!id) return;
    setLoading(true);

    const local = findLocalCatalogRecipeById(id);
    if (local) {
      setRecipe(local);
      setLoading(false);
      return;
    }

    try {
      const data = await recipeApi.getById(id);
      setRecipe(data);

      const savedIds = await recipeApi.getSavedIds().catch(() => [] as string[]);
      setServerSaved(savedIds.includes(id));
    } catch (error) {
      console.error("Failed to load recipe:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSave = useCallback(async () => {
    if (!id) return;

    if (isLocal) {
      toggleLocalSave(id);
      return;
    }

    const wasSaved = serverSaved;
    setServerSaved(!wasSaved);
    try {
      if (wasSaved) {
        await recipeApi.unsave(id);
      } else {
        await recipeApi.save(id);
      }
    } catch (error) {
      console.error("Failed to toggle save:", error);
      setServerSaved(wasSaved);
    }
  }, [id, isLocal, serverSaved, toggleLocalSave]);

  if (loading || !recipe) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.loadingText}>
          {loading ? "Loading recipe..." : "Recipe not found"}
        </Text>
      </View>
    );
  }

  const difficultyLabel =
    recipe.difficulty
      ? recipe.difficulty.charAt(0).toUpperCase() + recipe.difficulty.slice(1)
      : null;

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleToggleSave}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name={isSaved ? "heart" : "heart-outline"}
            size={24}
            color={isSaved ? colors.error : colors.text}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero placeholder */}
        <View style={styles.hero}>
          <Ionicons name="restaurant" size={48} color={colors.textSecondary} />
        </View>

        {/* Title & description */}
        <View style={styles.section}>
          <Text style={styles.title}>{recipe.title}</Text>
          {recipe.cuisine && (
            <Text style={styles.cuisine}>{recipe.cuisine}</Text>
          )}
          {recipe.description && (
            <Text style={styles.description}>{recipe.description}</Text>
          )}
        </View>

        {/* Time / servings / difficulty row */}
        <View style={styles.metaRow}>
          <View style={styles.metaCard}>
            <Ionicons name="time-outline" size={20} color={colors.primary} />
            <Text style={styles.metaValue}>{recipe.prepTime}m</Text>
            <Text style={styles.metaLabel}>Prep</Text>
          </View>
          <View style={styles.metaCard}>
            <Ionicons name="flame-outline" size={20} color={colors.primary} />
            <Text style={styles.metaValue}>{recipe.cookTime}m</Text>
            <Text style={styles.metaLabel}>Cook</Text>
          </View>
          <View style={styles.metaCard}>
            <Ionicons name="people-outline" size={20} color={colors.primary} />
            <Text style={styles.metaValue}>{recipe.servings}</Text>
            <Text style={styles.metaLabel}>Servings</Text>
          </View>
          {difficultyLabel && (
            <View style={styles.metaCard}>
              <Ionicons name="star-outline" size={20} color={colors.primary} />
              <Text style={styles.metaValue}>{difficultyLabel}</Text>
              <Text style={styles.metaLabel}>Level</Text>
            </View>
          )}
        </View>

        {/* Dietary tags */}
        {recipe.dietaryTags.length > 0 && (
          <View style={styles.tagsRow}>
            {recipe.dietaryTags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Nutrition */}
        {recipe.nutrition && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nutrition per serving</Text>
            <View style={styles.nutritionRow}>
              {recipe.nutrition.calories != null && (
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>
                    {recipe.nutrition.calories}
                  </Text>
                  <Text style={styles.nutritionLabel}>kcal</Text>
                </View>
              )}
              {recipe.nutrition.protein != null && (
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>
                    {recipe.nutrition.protein}g
                  </Text>
                  <Text style={styles.nutritionLabel}>Protein</Text>
                </View>
              )}
              {recipe.nutrition.carbs != null && (
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>
                    {recipe.nutrition.carbs}g
                  </Text>
                  <Text style={styles.nutritionLabel}>Carbs</Text>
                </View>
              )}
              {recipe.nutrition.fat != null && (
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>
                    {recipe.nutrition.fat}g
                  </Text>
                  <Text style={styles.nutritionLabel}>Fat</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Ingredients */}
        {recipe.ingredients.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Ingredients ({recipe.ingredients.length})
            </Text>
            <View style={styles.ingredientsCard}>
              {recipe.ingredients.map((ingredient) => (
                <IngredientRow
                  key={ingredient.id || ingredient.name}
                  ingredient={ingredient}
                />
              ))}
            </View>
          </View>
        )}

        {/* Steps */}
        {recipe.steps.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Steps ({recipe.steps.length})
            </Text>
            {recipe.steps.map((step) => (
              <View key={step.stepNumber} style={styles.stepCard}>
                <View style={styles.stepNumberBadge}>
                  <Text style={styles.stepNumberText}>{step.stepNumber}</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepInstruction}>
                    {step.instruction}
                  </Text>
                  {step.duration && (
                    <View style={styles.stepTimerRow}>
                      <Ionicons
                        name="time-outline"
                        size={14}
                        color={colors.primary}
                      />
                      <Text style={styles.stepTimerText}>
                        {step.duration >= 60
                          ? `${Math.floor(step.duration / 60)}m ${step.duration % 60 ? `${step.duration % 60}s` : ""}`
                          : `${step.duration}s`}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Floating Start Cooking button */}
      <View
        style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.md }]}
      >
        <TouchableOpacity
          style={styles.cookButton}
          onPress={() => router.push(`/cooking/${id}`)}
          activeOpacity={0.8}
        >
          <Ionicons name="flame" size={22} color={colors.background} />
          <Text style={styles.cookButtonText}>Start Cooking</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  saveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing.sm,
  },
  hero: {
    height: 200,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.lg,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  cuisine: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: spacing.sm,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: "row",
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  metaCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    gap: spacing.xs / 2,
  },
  metaValue: {
    ...typography.caption,
    color: colors.text,
    fontWeight: "700",
  },
  metaLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  tag: {
    backgroundColor: colors.primaryLight + "20",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  tagText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: "500",
  },
  sectionTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.md,
  },
  nutritionRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  nutritionItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
  },
  nutritionValue: {
    ...typography.body,
    color: colors.text,
    fontWeight: "700",
  },
  nutritionLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: spacing.xs / 2,
  },
  ingredientsCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    overflow: "hidden",
  },
  stepCard: {
    flexDirection: "row",
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  stepNumberBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  stepNumberText: {
    ...typography.caption,
    color: colors.background,
    fontWeight: "700",
  },
  stepContent: {
    flex: 1,
  },
  stepInstruction: {
    ...typography.body,
    color: colors.text,
    lineHeight: 24,
  },
  stepTimerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  stepTimerText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: "500",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...shadows.lg,
  },
  cookButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  cookButtonText: {
    ...typography.body,
    color: colors.background,
    fontWeight: "700",
    fontSize: 18,
  },
});

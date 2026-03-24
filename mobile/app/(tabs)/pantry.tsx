import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { pantryApi, recipeApi } from "../../src/services/api";
import { colors, spacing, borderRadius, typography, shadows } from "../../src/constants/DesignTokens";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface PantryItem {
  id: string;
  name: string;
  quantity?: number;
  unit?: string;
  expiresAt?: Date;
}

interface PantryRecipeSuggestion {
  title: string;
  description?: string;
  servings?: number;
  totalTime?: number;
  difficulty?: "beginner" | "intermediate" | "advanced";
  matchPercentage?: number;
  availableIngredients?: string[];
  missingIngredients?: string[];
}

export default function PantryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<PantryItem[]>([]);
  const [suggestions, setSuggestions] = useState<PantryRecipeSuggestion[]>([]);
  const [newItem, setNewItem] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFindingRecipes, setIsFindingRecipes] = useState(false);
  const [activeSuggestionKey, setActiveSuggestionKey] = useState<string | null>(null);

  useEffect(() => {
    loadPantry();
  }, []);

  const loadPantry = async () => {
    try {
      const data = await pantryApi.getAll();
      setItems(data);
    } catch (error) {
      console.error("Failed to load pantry:", error);
    }
  };

  const handleAddItem = async () => {
    if (!newItem.trim()) return;

    setIsLoading(true);
    try {
      const item = await pantryApi.add({ name: newItem.trim() });
      setItems((prev) => [...prev, item]);
      setNewItem("");
      setSuggestions([]);
    } catch (error) {
      console.error("Failed to add item:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await pantryApi.delete(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
      setSuggestions([]);
    } catch (error) {
      console.error("Failed to delete item:", error);
    }
  };

  const handleFindRecipes = async () => {
    if (items.length === 0) return;

    setIsFindingRecipes(true);
    try {
      const recipes = await pantryApi.findRecipes();
      setSuggestions(Array.isArray(recipes) ? recipes : []);
    } catch (error) {
      console.error("Failed to find pantry recipes:", error);
      setSuggestions([]);
    } finally {
      setIsFindingRecipes(false);
    }
  };

  const handleOpenSuggestedRecipe = async (recipe: PantryRecipeSuggestion, index: number) => {
    if (activeSuggestionKey) return;

    const key = `${recipe.title}-${index}`;
    setActiveSuggestionKey(key);

    try {
      const pantryNames = items.map((item) => item.name).join(", ");
      const prompt = `Create a complete recipe for "${recipe.title}" using these pantry ingredients where possible: ${pantryNames}. Keep it practical for home cooking.`;
      const generated = await recipeApi.generate(prompt);

      if (generated?.id) {
        router.push(`/cooking/${generated.id}`);
      } else {
        Alert.alert("Could not open recipe", "Recipe was generated without an ID. Please try again.");
      }
    } catch (error) {
      console.error("Failed to open suggested recipe:", error);
      Alert.alert("Unable to open recipe", "Please try again in a moment.");
    } finally {
      setActiveSuggestionKey(null);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Text style={styles.title}>My Pantry</Text>
        <Text style={styles.subtitle}>Manage your ingredients</Text>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Add ingredient..."
          placeholderTextColor={colors.textSecondary}
          value={newItem}
          onChangeText={setNewItem}
          onSubmitEditing={handleAddItem}
          returnKeyType="done"
        />
        <TouchableOpacity
          style={[styles.addButton, !newItem.trim() && styles.addButtonDisabled]}
          onPress={handleAddItem}
          disabled={!newItem.trim() || isLoading}
        >
          <Ionicons name="add" size={24} color={colors.background} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.modeCard}>
            <View style={styles.modeHeader}>
              <View>
                <Text style={styles.modeTitle}>Pantry Mode</Text>
                <Text style={styles.modeSubtitle}>Find meals from what you already have</Text>
              </View>
              <TouchableOpacity
                style={[styles.modeButton, (items.length === 0 || isFindingRecipes) && styles.modeButtonDisabled]}
                onPress={handleFindRecipes}
                disabled={items.length === 0 || isFindingRecipes}
              >
                <Text style={styles.modeButtonText}>
                  {isFindingRecipes ? "Finding..." : "Find Recipes"}
                </Text>
              </TouchableOpacity>
            </View>

            {suggestions.length > 0 && (
              <View style={styles.suggestionsSection}>
                <Text style={styles.suggestionsTitle}>Suggested for your pantry</Text>
                {suggestions.map((recipe, index) => {
                  const suggestionKey = `${recipe.title}-${index}`;
                  const isOpening = activeSuggestionKey === suggestionKey;

                  return (
                  <TouchableOpacity
                    key={suggestionKey}
                    style={styles.suggestionCard}
                    activeOpacity={0.85}
                    onPress={() => handleOpenSuggestedRecipe(recipe, index)}
                    disabled={Boolean(activeSuggestionKey)}
                  >
                    <View style={styles.suggestionTopRow}>
                      <Text style={styles.suggestionName}>{recipe.title}</Text>
                      {typeof recipe.matchPercentage === "number" && (
                        <View style={styles.matchBadge}>
                          <Text style={styles.matchBadgeText}>{recipe.matchPercentage}% match</Text>
                        </View>
                      )}
                    </View>
                    {recipe.description ? (
                      <Text style={styles.suggestionDescription}>{recipe.description}</Text>
                    ) : null}
                    <View style={styles.suggestionMeta}>
                      {recipe.totalTime ? (
                        <Text style={styles.suggestionMetaText}>⏱ {recipe.totalTime} min</Text>
                      ) : null}
                      {recipe.servings ? (
                        <Text style={styles.suggestionMetaText}>🍽 {recipe.servings} servings</Text>
                      ) : null}
                      {recipe.difficulty ? (
                        <Text style={styles.suggestionMetaText}>{recipe.difficulty}</Text>
                      ) : null}
                    </View>
                    {Array.isArray(recipe.missingIngredients) && recipe.missingIngredients.length > 0 && (
                      <Text style={styles.missingText}>
                        Missing: {recipe.missingIngredients.join(", ")}
                      </Text>
                    )}
                    {isOpening && <Text style={styles.openingText}>Opening recipe...</Text>}
                  </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="basket-outline" size={64} color={colors.textDisabled} />
            <Text style={styles.emptyText}>Your pantry is empty</Text>
            <Text style={styles.emptySubtext}>Add ingredients to get recipe suggestions</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <View style={styles.itemContent}>
              <Text style={styles.itemName}>{item.name}</Text>
              {item.quantity && item.unit && (
                <Text style={styles.itemQuantity}>
                  {item.quantity} {item.unit}
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteItem(item.id)}
            >
              <Ionicons name="trash-outline" size={20} color={colors.error} />
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.xs / 2,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  inputContainer: {
    flexDirection: "row",
    padding: spacing.lg,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    ...typography.body,
    color: colors.text,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonDisabled: {
    backgroundColor: colors.textDisabled,
  },
  listContent: {
    padding: spacing.lg,
  },
  modeCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  modeHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  modeTitle: {
    ...typography.h2,
    color: colors.text,
    fontSize: 20,
    lineHeight: 26,
  },
  modeSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs / 2,
  },
  modeButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  modeButtonDisabled: {
    backgroundColor: colors.textDisabled,
  },
  modeButtonText: {
    ...typography.caption,
    color: colors.background,
    fontWeight: "600",
  },
  suggestionsSection: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  suggestionsTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: "600",
  },
  suggestionCard: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  suggestionTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  suggestionName: {
    ...typography.body,
    color: colors.text,
    fontWeight: "600",
    flex: 1,
  },
  matchBadge: {
    backgroundColor: colors.primaryLight + "26",
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
  },
  matchBadgeText: {
    ...typography.caption,
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: "600",
  },
  suggestionDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  suggestionMeta: {
    marginTop: spacing.xs,
    flexDirection: "row",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  suggestionMetaText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  missingText: {
    ...typography.caption,
    color: colors.warning,
    marginTop: spacing.xs,
  },
  openingText: {
    ...typography.caption,
    color: colors.primary,
    marginTop: spacing.xs,
    fontWeight: "600",
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    ...typography.body,
    color: colors.text,
    fontWeight: "500",
    marginBottom: spacing.xs / 2,
  },
  itemQuantity: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  deleteButton: {
    padding: spacing.xs,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl * 2,
  },
  emptyText: {
    ...typography.h2,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
});

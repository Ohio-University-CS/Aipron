import React, { useState, useCallback, useRef } from "react";
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { pantryApi, recipeApi } from "../../src/services/api";
import { colors, spacing, borderRadius, typography, shadows } from "../../src/constants/DesignTokens";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "../../src/store/useAuthStore";

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

function normalizePantryRow(row: Record<string, unknown>): PantryItem {
  return {
    id: String(row.id),
    name: String(row.name),
    quantity: row.quantity != null ? Number(row.quantity) : undefined,
    unit: row.unit != null ? String(row.unit) : undefined,
    expiresAt: row.expires_at ? new Date(String(row.expires_at)) : undefined,
  };
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "response" in error) {
    const data = (error as { response?: { data?: { error?: string } } }).response?.data;
    if (data?.error && typeof data.error === "string") return data.error;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export default function PantryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();

  const [items, setItems] = useState<PantryItem[]>([]);
  const [suggestions, setSuggestions] = useState<PantryRecipeSuggestion[]>([]);
  const [newItem, setNewItem] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFindingRecipes, setIsFindingRecipes] = useState(false);
  const [activeSuggestionKey, setActiveSuggestionKey] = useState<string | null>(null);
  const [showEmptySuggestHint, setShowEmptySuggestHint] = useState(false);
  const isFirstPantryLoad = useRef(true);

  const loadPantry = useCallback(async () => {
    if (!isAuthenticated) {
      setItems([]);
      setInitialLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const data = await pantryApi.getAll();
      const rows = Array.isArray(data) ? data : [];
      setItems(rows.map((row) => normalizePantryRow(row as Record<string, unknown>)));
    } catch (error) {
      console.error("Failed to load pantry:", error);
      Alert.alert("Could not load pantry", getErrorMessage(error, "Check your connection and try again."));
    } finally {
      setInitialLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated]);

  useFocusEffect(
    useCallback(() => {
      if (authLoading) return;
      if (isFirstPantryLoad.current) {
        setInitialLoading(true);
        isFirstPantryLoad.current = false;
      }
      void loadPantry();
    }, [authLoading, loadPantry])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void loadPantry();
  }, [loadPantry]);

  const handleAddItem = async () => {
    if (!newItem.trim()) return;

    setIsLoading(true);
    try {
      const raw = await pantryApi.add({ name: newItem.trim() });
      const item = normalizePantryRow(raw as Record<string, unknown>);
      setItems((prev) => {
        const withoutDup = prev.filter((p) => p.name.toLowerCase() !== item.name.toLowerCase());
        return [...withoutDup, item];
      });
      setNewItem("");
      setSuggestions([]);
      setShowEmptySuggestHint(false);
    } catch (error) {
      console.error("Failed to add item:", error);
      Alert.alert("Could not add item", getErrorMessage(error, "Please try again."));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteItem = (id: string, name: string) => {
    Alert.alert("Remove ingredient", `Remove "${name}" from your pantry?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            await pantryApi.delete(id);
            setItems((prev) => prev.filter((item) => item.id !== id));
            setSuggestions([]);
            setShowEmptySuggestHint(false);
          } catch (error) {
            console.error("Failed to delete item:", error);
            Alert.alert("Could not remove item", getErrorMessage(error, "Please try again."));
          }
        },
      },
    ]);
  };

  const handleFindRecipes = async () => {
    if (items.length === 0) return;

    setIsFindingRecipes(true);
    try {
      const recipes = await pantryApi.findRecipes();
      const list = Array.isArray(recipes) ? recipes : [];
      setSuggestions(list);
      setShowEmptySuggestHint(list.length === 0);
    } catch (error) {
      console.error("Failed to find pantry recipes:", error);
      setSuggestions([]);
      setShowEmptySuggestHint(false);
      Alert.alert(
        "Could not suggest recipes",
        getErrorMessage(error, "Is the backend running with OPENAI_API_KEY set?")
      );
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
      Alert.alert("Unable to open recipe", getErrorMessage(error, "Please try again."));
    } finally {
      setActiveSuggestionKey(null);
    }
  };

  if (!authLoading && !isAuthenticated) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top + spacing.lg }]}>
        <Ionicons name="lock-closed-outline" size={48} color={colors.textSecondary} />
        <Text style={styles.gateTitle}>Sign in to use Pantry</Text>
        <Text style={styles.gateText}>Save ingredients and get AI recipe ideas from what you already have.</Text>
        <TouchableOpacity style={styles.gateButton} onPress={() => router.push("/login")}>
          <Text style={styles.gateButtonText}>Go to login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (initialLoading && items.length === 0) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingHint}>Loading pantry…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Text style={styles.title}>My Pantry</Text>
        <Text style={styles.subtitle}>Manage your ingredients — find recipes from what you have</Text>
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
          {isLoading ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Ionicons name="add" size={24} color={colors.background} />
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        ListHeaderComponent={
          <View style={styles.modeCard}>
            <View style={styles.modeHeader}>
              <View style={styles.modeHeaderText}>
                <Text style={styles.modeTitle}>Pantry Mode</Text>
                <Text style={styles.modeSubtitle}>Ranked ideas from your ingredients (via AI)</Text>
              </View>
              <TouchableOpacity
                style={[styles.modeButton, (items.length === 0 || isFindingRecipes) && styles.modeButtonDisabled]}
                onPress={handleFindRecipes}
                disabled={items.length === 0 || isFindingRecipes}
              >
                {isFindingRecipes ? (
                  <ActivityIndicator color={colors.background} />
                ) : (
                  <Text style={styles.modeButtonText}>Suggest recipes</Text>
                )}
              </TouchableOpacity>
            </View>

            {showEmptySuggestHint && suggestions.length === 0 && (
              <Text style={styles.emptySuggestHint}>
                No suggestions returned — try a few more ingredients or tap again.
              </Text>
            )}

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
                      {recipe.description ? <Text style={styles.suggestionDescription}>{recipe.description}</Text> : null}
                      <View style={styles.suggestionMeta}>
                        {recipe.totalTime ? <Text style={styles.suggestionMetaText}>⏱ {recipe.totalTime} min</Text> : null}
                        {recipe.servings ? <Text style={styles.suggestionMetaText}>🍽 {recipe.servings} servings</Text> : null}
                        {recipe.difficulty ? <Text style={styles.suggestionMetaText}>{recipe.difficulty}</Text> : null}
                      </View>
                      {Array.isArray(recipe.missingIngredients) && recipe.missingIngredients.length > 0 && (
                        <Text style={styles.missingText}>Missing: {recipe.missingIngredients.join(", ")}</Text>
                      )}
                      {isOpening && <Text style={styles.openingText}>Opening recipe…</Text>}
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
            <Text style={styles.emptySubtext}>Add ingredients above, then tap Suggest recipes</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <View style={styles.itemContent}>
              <Text style={styles.itemName}>{item.name}</Text>
              {item.quantity != null && item.unit && (
                <Text style={styles.itemQuantity}>
                  {item.quantity} {item.unit}
                </Text>
              )}
            </View>
            <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteItem(item.id, item.name)}>
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
  centered: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
  },
  loadingHint: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  gateTitle: {
    ...typography.h2,
    color: colors.text,
    marginTop: spacing.md,
    textAlign: "center",
  },
  gateText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  gateButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  gateButtonText: {
    ...typography.body,
    color: colors.background,
    fontWeight: "600",
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
    flexGrow: 1,
  },
  modeCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  modeHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  modeHeaderText: {
    flex: 1,
    minWidth: 0,
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
    minWidth: 132,
    minHeight: 40,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  modeButtonDisabled: {
    backgroundColor: colors.textDisabled,
  },
  modeButtonText: {
    ...typography.caption,
    color: colors.background,
    fontWeight: "600",
  },
  emptySuggestHint: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
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

import React, { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { pantryApi, recipeApi } from "../src/services/api";
import { borderRadius, colors, shadows, spacing, typography } from "../src/constants/DesignTokens";
import { useRouter } from "expo-router";
import axios from "axios";

interface PantryItem {
  id: string;
  name: string;
  quantity?: number;
  unit?: string;
  expiresAt?: Date;
}

type PantrySuggestion = {
  title?: string;
  description?: string;
  matchPercentage?: number;
  match_percent?: number;
  // allow extra fields from backend/LLM
  [key: string]: unknown;
};

export default function PantryScreen(props: { onOpenCookingId?: (id: string) => void } = {}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<PantryItem[]>([]);
  const [newItem, setNewItem] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<PantrySuggestion[]>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const [generatingKey, setGeneratingKey] = useState<string | null>(null);

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
    } catch (error) {
      console.error("Failed to delete item:", error);
    }
  };

  const handleSuggestRecipes = async () => {
    setSuggestError(null);
    setSuggestLoading(true);
    try {
      try {
        const data = await pantryApi.findRecipes();
        setSuggestions(Array.isArray(data) ? data : []);
      } catch (error) {
        // First request after app launch can occasionally race network readiness on device.
        // Retry once if this looks like a transient network failure.
        if (axios.isAxiosError(error) && error.message.toLowerCase().includes("network")) {
          await new Promise((r) => setTimeout(r, 600));
          const data = await pantryApi.findRecipes();
          setSuggestions(Array.isArray(data) ? data : []);
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error("Failed to suggest recipes:", error);
      setSuggestError("Could not fetch suggestions. Make sure you’re logged in and the backend is running.");
      setSuggestions([]);
    } finally {
      setSuggestLoading(false);
    }
  };

  const handleGenerateFromSuggestion = async (s: PantrySuggestion, idx: number) => {
    const title = typeof s.title === "string" && s.title.trim() ? s.title.trim() : null;
    const desc = typeof s.description === "string" && s.description.trim() ? s.description.trim() : null;
    const prompt = title || desc;
    if (!prompt) return;

    const key = `${prompt}-${idx}`;
    setGeneratingKey(key);
    try {
      const recipe = await recipeApi.generate(prompt, { usePantry: true });
      if (recipe?.id) {
        if (props.onOpenCookingId) {
          props.onOpenCookingId(String(recipe.id));
        } else {
          router.push(`/cooking/${recipe.id}`);
        }
      }
    } catch (error) {
      console.error("Failed to generate recipe from suggestion:", error);
      setSuggestError("Could not generate that recipe. Try again (and make sure the backend is running).");
    } finally {
      setGeneratingKey(null);
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
          <View style={styles.suggestWrap}>
            <TouchableOpacity
              style={[styles.suggestButton, (items.length === 0 || suggestLoading) && styles.suggestButtonDisabled]}
              onPress={handleSuggestRecipes}
              disabled={items.length === 0 || suggestLoading}
              activeOpacity={0.85}
            >
              <Ionicons name="sparkles" size={18} color={colors.background} />
              <Text style={styles.suggestButtonText}>
                {suggestLoading ? "Finding recipes..." : "Suggest recipes from my pantry"}
              </Text>
            </TouchableOpacity>
            {suggestError ? <Text style={styles.suggestError}>{suggestError}</Text> : null}
            {suggestions.length > 0 ? (
              <View style={styles.suggestionList}>
                <Text style={styles.suggestionTitle}>Suggestions</Text>
                {suggestions.slice(0, 5).map((r, idx) => {
                  const title =
                    typeof r.title === "string" && r.title.trim().length > 0
                      ? r.title
                      : typeof r.description === "string" && r.description.trim().length > 0
                        ? r.description
                        : `Suggestion ${idx + 1}`;
                  const desc = typeof r.description === "string" ? r.description : "";
                  const pctRaw = typeof r.matchPercentage === "number" ? r.matchPercentage : r.match_percent;
                  const pct = typeof pctRaw === "number" ? Math.round(pctRaw) : null;
                  const key = `${title}-${idx}`;
                  const canGenerate =
                    (typeof r.title === "string" && r.title.trim().length > 0) ||
                    (typeof r.description === "string" && r.description.trim().length > 0);
                  const isGenerating = generatingKey === key;
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[styles.suggestionCard, canGenerate && styles.suggestionCardPressable]}
                      activeOpacity={0.85}
                      disabled={!canGenerate || isGenerating}
                      onPress={() => handleGenerateFromSuggestion(r, idx)}
                    >
                      <View style={styles.suggestionCardHeader}>
                        <Text style={styles.suggestionCardTitle}>{title}</Text>
                        {pct != null ? <Text style={styles.suggestionCardPct}>{pct}%</Text> : null}
                      </View>
                      {desc ? <Text style={styles.suggestionCardDesc}>{desc}</Text> : null}
                      {canGenerate ? (
                        <Text style={styles.suggestionCardHint}>
                          {isGenerating ? "Generating recipe…" : "Tap to generate full recipe"}
                        </Text>
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : null}
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
            <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteItem(item.id)}>
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
    paddingBottom: spacing.lg + 96,
  },
  suggestWrap: {
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  suggestButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  suggestButtonDisabled: {
    backgroundColor: colors.textDisabled,
  },
  suggestButtonText: {
    ...typography.body,
    color: colors.background,
    fontWeight: "600",
  },
  suggestError: {
    ...typography.caption,
    color: colors.error,
  },
  suggestionList: {
    gap: spacing.sm,
  },
  suggestionTitle: {
    ...typography.h2,
    color: colors.text,
  },
  suggestionCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  suggestionCardPressable: {
    borderColor: colors.primary,
  },
  suggestionCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  suggestionCardTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: "600",
    flex: 1,
  },
  suggestionCardPct: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: "700",
  },
  suggestionCardDesc: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  suggestionCardHint: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    fontStyle: "italic",
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


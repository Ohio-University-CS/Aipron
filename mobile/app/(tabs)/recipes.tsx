import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, Text, FlatList, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { recipeApi } from "../../src/services/api";
import { RecipeCard } from "../../src/components/RecipeCard";
import { colors, spacing, typography, borderRadius } from "../../src/constants/DesignTokens";
import { Recipe } from "@aipron/shared";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type FilterMode = "all" | "saved";

export default function RecipesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<FilterMode>("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRecipes();
  }, []);

  const loadRecipes = async () => {
    setIsLoading(true);
    try {
      const [allRecipes, savedIdsList] = await Promise.all([
        recipeApi.getAll(),
        recipeApi.getSavedIds().catch(() => []),
      ]);
      setRecipes(allRecipes);
      setSavedIds(new Set(savedIdsList));
    } catch (error) {
      console.error("Failed to load recipes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSave = useCallback(async (recipeId: string) => {
    setSavedIds((prev) => {
      const wasSaved = prev.has(recipeId);
      const next = new Set(prev);

      if (wasSaved) {
        next.delete(recipeId);
      } else {
        next.add(recipeId);
      }

      (async () => {
        try {
          if (wasSaved) {
            await recipeApi.unsave(recipeId);
          } else {
            await recipeApi.save(recipeId);
          }
        } catch (error) {
          console.error("Failed to toggle save:", error);
          setSavedIds((current) => {
            const reverted = new Set(current);
            if (wasSaved) {
              reverted.add(recipeId);
            } else {
              reverted.delete(recipeId);
            }
            return reverted;
          });
        }
      })();

      return next;
    });
  }, []);

  const displayedRecipes = filter === "saved"
    ? recipes.filter((r) => r.id && savedIds.has(r.id))
    : recipes;

  const subtitleText = filter === "saved"
    ? `${displayedRecipes.length} favorite${displayedRecipes.length !== 1 ? "s" : ""}`
    : `${recipes.length} recipe${recipes.length !== 1 ? "s" : ""}`;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Text style={styles.title}>My Recipes</Text>
        <Text style={styles.subtitle}>{subtitleText}</Text>
      </View>

      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterTab, filter === "all" && styles.filterTabActive]}
          onPress={() => setFilter("all")}
          activeOpacity={0.7}
        >
          <Ionicons
            name="grid-outline"
            size={16}
            color={filter === "all" ? colors.background : colors.textSecondary}
          />
          <Text style={[styles.filterTabText, filter === "all" && styles.filterTabTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === "saved" && styles.filterTabActive]}
          onPress={() => setFilter("saved")}
          activeOpacity={0.7}
        >
          <Ionicons
            name={filter === "saved" ? "heart" : "heart-outline"}
            size={16}
            color={filter === "saved" ? colors.background : colors.textSecondary}
          />
          <Text style={[styles.filterTabText, filter === "saved" && styles.filterTabTextActive]}>
            Favorites
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={displayedRecipes}
        keyExtractor={(item, index) => item.id || `recipe-${index}`}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name={filter === "saved" ? "heart-outline" : "book-outline"}
              size={64}
              color={colors.textDisabled}
            />
            <Text style={styles.emptyText}>
              {filter === "saved" ? "No favorites yet" : "No recipes yet"}
            </Text>
            <Text style={styles.emptySubtext}>
              {filter === "saved"
                ? "Tap the heart on any recipe to save it here"
                : "Generate recipes in the Chat tab to see them here"}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <RecipeCard
            recipe={item}
            isSaved={!!item.id && savedIds.has(item.id)}
            onToggleSave={handleToggleSave}
            onPress={() => {
              if (item.id) {
                router.push(`/cooking/${item.id}`);
              }
            }}
          />
        )}
        refreshing={isLoading}
        onRefresh={loadRecipes}
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
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
  },
  filterTabActive: {
    backgroundColor: colors.primary,
  },
  filterTabText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  filterTabTextActive: {
    color: colors.background,
    fontWeight: "600",
  },
  listContent: {
    padding: spacing.lg,
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

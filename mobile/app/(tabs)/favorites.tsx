import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Recipe } from "@aipron/shared";
import { RecipeCard } from "../../src/components/RecipeCard";
import { recipeApi } from "../../src/services/api";
import { useLocalCatalogSavedIds } from "../../src/hooks/useLocalCatalogSavedIds";
import { findLocalCatalogRecipeById } from "../../src/data/localCatalog";
import { colors, spacing, typography } from "../../src/constants/DesignTokens";

function isLocalId(id: string | undefined): boolean {
  return !!id && id.startsWith("local-");
}

export default function FavoritesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [serverRecipes, setServerRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { savedIds: localSavedIds, toggleSave: toggleLocalSave, reloadSavedIds } =
    useLocalCatalogSavedIds();

  const loadServerFavorites = useCallback(async () => {
    setIsLoading(true);
    try {
      const saved = await recipeApi.getSaved();
      setServerRecipes(saved);
    } catch (error) {
      console.error("Failed to load favorites:", error);
      setServerRecipes([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadServerFavorites();
  }, [loadServerFavorites]);

  const localRecipes = useMemo(() => {
    const recipes: Recipe[] = [];
    for (const id of localSavedIds) {
      const recipe = findLocalCatalogRecipeById(id);
      if (recipe) recipes.push(recipe);
    }
    return recipes;
  }, [localSavedIds]);

  const allRecipes = useMemo(() => {
    const serverIds = new Set(serverRecipes.map((r) => r.id));
    const deduped = localRecipes.filter((r) => !serverIds.has(r.id));
    return [...serverRecipes, ...deduped];
  }, [serverRecipes, localRecipes]);

  const handleUnsave = useCallback(
    async (recipeId: string) => {
      if (isLocalId(recipeId)) {
        toggleLocalSave(recipeId);
        return;
      }

      const previous = serverRecipes;
      setServerRecipes((prev) => prev.filter((r) => r.id !== recipeId));
      try {
        await recipeApi.unsave(recipeId);
      } catch (error) {
        console.error("Failed to unsave recipe:", error);
        setServerRecipes(previous);
      }
    },
    [serverRecipes, toggleLocalSave],
  );

  const handleRefresh = useCallback(async () => {
    await Promise.all([loadServerFavorites(), reloadSavedIds()]);
  }, [loadServerFavorites, reloadSavedIds]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Text style={styles.title}>Favorites</Text>
        <Text style={styles.subtitle}>
          {allRecipes.length} recipe{allRecipes.length === 1 ? "" : "s"} saved
        </Text>
      </View>

      <FlatList
        data={allRecipes}
        keyExtractor={(item) => item.id || `favorite-${item.title}`}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="heart-outline" size={64} color={colors.textDisabled} />
            <Text style={styles.emptyText}>you have no recipes saved</Text>
            <Text style={styles.emptySubtext}>
              Save a recipe with the heart icon and it will appear here.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <RecipeCard
            recipe={item}
            isSaved
            onToggleSave={handleUnsave}
            onPress={() => {
              if (item.id) {
                router.push(`/recipe/${item.id}`);
              }
            }}
          />
        )}
        refreshing={isLoading}
        onRefresh={handleRefresh}
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
  listContent: {
    padding: spacing.lg,
    flexGrow: 1,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl * 2,
    paddingHorizontal: spacing.lg,
  },
  emptyText: {
    ...typography.h2,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    textAlign: "center",
  },
  emptySubtext: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
});

import React, { useCallback, useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Recipe } from "@aipron/shared";
import { RecipeCard } from "../../src/components/RecipeCard";
import { recipeApi } from "../../src/services/api";
import { colors, spacing, typography } from "../../src/constants/DesignTokens";

export default function FavoritesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadFavorites = useCallback(async () => {
    setIsLoading(true);
    try {
      const savedRecipes = await recipeApi.getSaved();
      setRecipes(savedRecipes);
    } catch (error) {
      console.error("Failed to load favorites:", error);
      setRecipes([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const handleUnsave = useCallback(async (recipeId: string) => {
    const previousRecipes = recipes;
    setRecipes((prev) => prev.filter((recipe) => recipe.id !== recipeId));

    try {
      await recipeApi.unsave(recipeId);
    } catch (error) {
      console.error("Failed to unsave recipe:", error);
      setRecipes(previousRecipes);
    }
  }, [recipes]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Text style={styles.title}>Favorites</Text>
        <Text style={styles.subtitle}>
          {recipes.length} recipe{recipes.length === 1 ? "" : "s"} saved
        </Text>
      </View>

      <FlatList
        data={recipes}
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
                router.push(`/cooking/${item.id}`);
              }
            }}
          />
        )}
        refreshing={isLoading}
        onRefresh={loadFavorites}
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

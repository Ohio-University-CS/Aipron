import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, Text, FlatList, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { recipeApi } from "../../src/services/api";
import { RecipeCard } from "../../src/components/RecipeCard";
import { TopBar } from "../../src/components/TopBar";
import { Chip } from "../../src/components/Chip";
import { spacing, typography, borderRadius, shadows, fonts } from "../../src/constants/DesignTokens";
import { useThemeColors } from "../../src/hooks/useThemeColors";
import { Recipe } from "@aipron/shared";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type FilterMode = "all" | "saved";

export default function RecipesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useThemeColors();
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

  const displayedRecipes =
    filter === "saved"
      ? recipes.filter((r) => r.id && savedIds.has(r.id))
      : recipes;

  const subtitleText =
    filter === "saved"
      ? `${displayedRecipes.length} favorite${displayedRecipes.length !== 1 ? "s" : ""}`
      : `${recipes.length} recipe${recipes.length !== 1 ? "s" : ""}`;

  const styles = getStyles(theme);

  return (
    <View style={styles.container}>
      <TopBar />

      <FlatList
        data={displayedRecipes}
        keyExtractor={(item, index) => item.id || `recipe-${index}`}
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: insets.top + 56 + spacing.lg },
        ]}
        ListHeaderComponent={
          <View style={styles.headerSection}>
            <Text style={styles.eyebrow}>COLLECTION</Text>
            <Text style={styles.title}>
              My{" "}
              <Text style={styles.titleAccent}>Recipes</Text>
            </Text>
            <Text style={styles.subtitle}>{subtitleText}</Text>

            <View style={styles.filterRow}>
              <Chip
                label="All"
                icon="grid-view"
                selected={filter === "all"}
                onPress={() => setFilter("all")}
                variant="tonal"
              />
              <Chip
                label="Favorites"
                icon="favorite"
                selected={filter === "saved"}
                onPress={() => setFilter("saved")}
                variant="tonal"
              />
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <MaterialIcons
                name={filter === "saved" ? "favorite-border" : "restaurant"}
                size={32}
                color={theme.onSurfaceVariant}
              />
            </View>
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

const getStyles = (theme: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    listContent: {
      paddingHorizontal: spacing.screenPadding,
      paddingBottom: 100,
    },
    headerSection: {
      marginBottom: spacing.xl,
    },
    eyebrow: {
      fontFamily: fonts.sansSemiBold,
      fontSize: 11,
      letterSpacing: 2,
      color: theme.tertiary,
      textTransform: "uppercase",
      marginBottom: spacing.sm,
    },
    title: {
      fontFamily: fonts.serifBold,
      fontSize: 36,
      lineHeight: 44,
      color: theme.onSurface,
    },
    titleAccent: {
      fontFamily: fonts.serifBoldItalic,
      color: theme.primary,
    },
    subtitle: {
      fontFamily: fonts.sans,
      fontSize: 15,
      color: theme.onSurfaceVariant,
      marginTop: spacing.xs,
      marginBottom: spacing.xl,
    },
    filterRow: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    emptyContainer: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: spacing.sectionGap,
    },
    emptyIconCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: theme.surfaceContainer,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.lg,
    },
    emptyText: {
      fontFamily: fonts.serif,
      fontSize: 22,
      color: theme.onSurface,
      marginBottom: spacing.sm,
    },
    emptySubtext: {
      fontFamily: fonts.sans,
      fontSize: 15,
      color: theme.onSurfaceVariant,
      textAlign: "center",
      paddingHorizontal: spacing.xxl,
    },
  });

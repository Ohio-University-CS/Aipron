import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "../../src/components/LinearGradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Recipe } from "@aipron/shared";
import { RecipeCard } from "../../src/components/RecipeCard";
import { Chip } from "../../src/components/Chip";
import { TopBar } from "../../src/components/TopBar";
import { GradientButton } from "../../src/components/GradientButton";
import { recipeApi } from "../../src/services/api";
import { useThemeColors } from "../../src/hooks/useThemeColors";
import {
  borderRadius,
  fonts,
  shadows,
  spacing,
  typography,
} from "../../src/constants/DesignTokens";
import { StitchImages, pickFallbackPhoto } from "../../src/constants/StitchImages";

type Tab = "all" | "recent" | "chef";

const TABS: { key: Tab; label: string }[] = [
  { key: "all", label: "All Saved" },
  { key: "recent", label: "Recent" },
  { key: "chef", label: "By Chef" },
];

const SECONDARY_FILTERS = [
  "Mediterranean",
  "Quick Meals",
  "Desserts",
  "Plant-Based",
  "Weeknight",
  "Baking",
];

export default function FavoritesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useThemeColors();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const loadFavorites = useCallback(async () => {
    setIsLoading(true);
    try {
      const saved = await recipeApi.getSaved();
      setRecipes(saved);
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

  const handleUnsave = useCallback(
    async (recipeId: string) => {
      const previous = recipes;
      setRecipes((prev) => prev.filter((r) => r.id !== recipeId));
      try {
        await recipeApi.unsave(recipeId);
      } catch (error) {
        console.error("Failed to unsave recipe:", error);
        setRecipes(previous);
      }
    },
    [recipes],
  );

  const visibleRecipes = useMemo(() => {
    let list = recipes;
    if (activeTab === "recent") {
      list = [...list].sort((a, b) => {
        const ad = a.updatedAt ? new Date(a.updatedAt as any).getTime() : 0;
        const bd = b.updatedAt ? new Date(b.updatedAt as any).getTime() : 0;
        return bd - ad;
      });
    } else if (activeTab === "chef") {
      list = [...list].sort((a, b) =>
        (a.cuisine ?? "").localeCompare(b.cuisine ?? ""),
      );
    }
    if (activeFilter) {
      const f = activeFilter.toLowerCase();
      list = list.filter((r) => {
        const tagMatch = r.dietaryTags?.some((t) =>
          String(t).toLowerCase().includes(f),
        );
        const cuisineMatch = r.cuisine?.toLowerCase().includes(f);
        const titleMatch = r.title?.toLowerCase().includes(f);
        return tagMatch || cuisineMatch || titleMatch;
      });
    }
    return list;
  }, [recipes, activeTab, activeFilter]);

  const topBarHeight = insets.top + spacing.sm + 56;
  const featured = visibleRecipes[0];
  const sideFeature = visibleRecipes[1];
  const rest = visibleRecipes.slice(2);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <TopBar />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: topBarHeight + spacing.lg,
            paddingBottom: 120,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.innerWrap}>
          {/* Editorial header */}
          <View style={styles.headerSection}>
            <Text style={[styles.eyebrow, { color: theme.tertiary }]}>
              YOUR LIBRARY
            </Text>
            <Text style={[styles.headline, { color: theme.onSurface }]}>
              Your{"\n"}
              <Text style={[styles.headlineAccent, { color: theme.primary }]}>
                Collection
              </Text>
            </Text>
            <Text style={[styles.subhead, { color: theme.onSurfaceVariant }]}>
              Every recipe you've pinned, saved, or loved — curated in one place.
            </Text>
          </View>

          {/* Segmented control */}
          <View style={styles.tabsRow}>
            {TABS.map((tab) => (
              <View key={tab.key} style={styles.tabItem}>
                <Chip
                  label={tab.label}
                  variant={activeTab === tab.key ? "filled" : "tonal"}
                  selected={activeTab === tab.key}
                  onPress={() => setActiveTab(tab.key)}
                />
              </View>
            ))}
          </View>

          {/* Secondary filter chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            <Chip
              label="All"
              size="sm"
              variant="outlined"
              selected={activeFilter === null}
              onPress={() => setActiveFilter(null)}
            />
            {SECONDARY_FILTERS.map((f) => (
              <Chip
                key={f}
                label={f}
                size="sm"
                variant="outlined"
                selected={activeFilter === f}
                onPress={() =>
                  setActiveFilter((prev) => (prev === f ? null : f))
                }
              />
            ))}
          </ScrollView>

          {/* Content */}
          {isLoading && recipes.length === 0 ? (
            <View style={styles.loaderCard}>
              <Text style={[styles.loaderText, { color: theme.onSurfaceVariant }]}>
                Gathering your saved recipes…
              </Text>
            </View>
          ) : visibleRecipes.length === 0 ? (
            <EmptyState theme={theme} onDiscover={() => router.push("/(tabs)/search")} />
          ) : (
            <View style={styles.grid}>
              {/* Editorial hero */}
              {featured && (
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => {
                    if (featured.id) router.push(`/cooking/${featured.id}`);
                  }}
                  style={styles.heroCard}
                >
                  <Image
                    source={{
                      uri:
                        featured.heroImage ||
                        StitchImages.favoritesCitrusSalad ||
                        pickFallbackPhoto(featured.id ?? featured.title),
                    }}
                    style={styles.heroImage}
                    resizeMode="cover"
                  />
                  <LinearGradient
                    colors={[
                      "transparent",
                      "rgba(27,28,26,0.15)",
                      "rgba(27,28,26,0.72)",
                    ]}
                    style={styles.heroOverlay}
                  />
                  <View style={styles.heroContent}>
                    <View
                      style={[
                        styles.heroBadge,
                        { backgroundColor: theme.primaryContainer },
                      ]}
                    >
                      <Text
                        style={[
                          styles.heroBadgeText,
                          { color: theme.onPrimaryContainer },
                        ]}
                      >
                        FAVORITE
                      </Text>
                    </View>
                    <Text style={styles.heroTitle} numberOfLines={2}>
                      {featured.title}
                    </Text>
                    <Text style={styles.heroMeta}>
                      {featured.totalTime ? `${featured.totalTime} min` : "Quick"}
                      {featured.difficulty ? ` • ${featured.difficulty}` : ""}
                    </Text>
                  </View>
                  {featured.id && (
                    <TouchableOpacity
                      style={styles.heroHeart}
                      onPress={(e) => {
                        e.stopPropagation?.();
                        handleUnsave(featured.id!);
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <MaterialIcons name="favorite" size={20} color="#fff" />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              )}

              {/* Tall side feature */}
              {sideFeature && (
                <View style={styles.sideFeatureWrap}>
                  <RecipeCard
                    recipe={sideFeature}
                    variant="editorial"
                    isSaved
                    onToggleSave={handleUnsave}
                    badge={(sideFeature.dietaryTags?.[0] as string) || "SAVED"}
                    onPress={() => {
                      if (sideFeature.id)
                        router.push(`/cooking/${sideFeature.id}`);
                    }}
                  />
                </View>
              )}

              {/* Remaining cards — two-column grid */}
              {rest.length > 0 && (
                <View style={styles.restGrid}>
                  {rest.map((recipe, idx) => (
                    <View
                      key={recipe.id || `rest-${idx}`}
                      style={styles.restItem}
                    >
                      <RecipeCard
                        recipe={recipe}
                        isSaved
                        onToggleSave={handleUnsave}
                        variant="standard"
                        onPress={() => {
                          if (recipe.id) router.push(`/cooking/${recipe.id}`);
                        }}
                      />
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Tonal footer prompt */}
          {visibleRecipes.length > 0 && (
            <View
              style={[
                styles.footerPrompt,
                {
                  backgroundColor: theme.surfaceContainerLow,
                  borderColor: theme.outlineVariant + "33",
                },
              ]}
            >
              <MaterialIcons
                name="add-circle-outline"
                size={28}
                color={theme.primary + "99"}
              />
              <Text style={[styles.footerPromptTitle, { color: theme.onSurfaceVariant }]}>
                Save more to your collection
              </Text>
              <Text style={[styles.footerPromptBody, { color: theme.outline }]}>
                Found a recipe you love? Tap the heart to keep it in your apron.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function EmptyState({
  theme,
  onDiscover,
}: {
  theme: ReturnType<typeof useThemeColors>;
  onDiscover: () => void;
}) {
  return (
    <View
      style={[
        styles.emptyCard,
        {
          backgroundColor: theme.surfaceContainerLow,
          borderColor: theme.outlineVariant + "33",
        },
      ]}
    >
      <View
        style={[
          styles.emptyIconCircle,
          { backgroundColor: theme.primaryContainer + "55" },
        ]}
      >
        <MaterialIcons name="favorite-border" size={36} color={theme.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: theme.onSurface }]}>
        Start Saving{"\n"}
        <Text style={{ color: theme.primary, fontFamily: fonts.serifItalic }}>
          Recipes
        </Text>
      </Text>
      <Text style={[styles.emptyBody, { color: theme.onSurfaceVariant }]}>
        Tap the heart on any recipe to pin it here. Your collection builds a
        kitchen that feels like your own.
      </Text>
      <GradientButton
        title="Discover Recipes"
        icon="restaurant"
        onPress={onDiscover}
        style={styles.emptyCta}
        size="md"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.screenPadding,
  },
  innerWrap: {
    width: "100%",
    maxWidth: 680,
    alignSelf: "center",
  },
  headerSection: {
    marginBottom: spacing.xl,
  },
  eyebrow: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 10,
    letterSpacing: 4,
    textTransform: "uppercase",
    marginBottom: spacing.md,
  },
  headline: {
    fontFamily: fonts.serifBold,
    fontSize: 54,
    lineHeight: 58,
    letterSpacing: -1.2,
    marginBottom: spacing.md,
  },
  headlineAccent: {
    fontFamily: fonts.serifItalic,
  },
  subhead: {
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 420,
  },
  tabsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.lg,
    flexWrap: "wrap",
  },
  tabItem: {
    // let chip size itself
  },
  filterRow: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
    paddingRight: spacing.xl,
  },
  grid: {
    marginTop: spacing.md,
    gap: spacing.xl,
  },
  heroCard: {
    width: "100%",
    aspectRatio: 16 / 10,
    borderTopLeftRadius: borderRadius.xxxl,
    borderTopRightRadius: borderRadius.xxl,
    borderBottomLeftRadius: borderRadius.xxl,
    borderBottomRightRadius: borderRadius.md,
    overflow: "hidden",
    position: "relative",
    ...shadows.md,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
  },
  heroContent: {
    position: "absolute",
    left: spacing.xl,
    right: spacing.xl,
    bottom: spacing.xl,
  },
  heroBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  heroBadgeText: {
    fontFamily: fonts.sansBold,
    fontSize: 10,
    letterSpacing: 3,
  },
  heroTitle: {
    fontFamily: fonts.serifBold,
    color: "#fff",
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  heroMeta: {
    fontFamily: fonts.sans,
    color: "rgba(255,255,255,0.82)",
    fontSize: 13,
    marginTop: 6,
  },
  heroHeart: {
    position: "absolute",
    top: spacing.lg,
    right: spacing.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  sideFeatureWrap: {
    width: "100%",
  },
  restGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: spacing.md,
  },
  restItem: {
    width: "48%",
  },
  loaderCard: {
    paddingVertical: spacing.sectionGap,
    alignItems: "center",
  },
  loaderText: {
    fontFamily: fonts.sans,
    fontSize: 14,
  },
  emptyCard: {
    alignItems: "center",
    paddingVertical: spacing.sectionGap,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xl,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: borderRadius.xxxl,
    gap: spacing.md,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyTitle: {
    fontFamily: fonts.serifBold,
    fontSize: 32,
    lineHeight: 36,
    textAlign: "center",
    letterSpacing: -0.5,
    marginTop: spacing.sm,
  },
  emptyBody: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
    maxWidth: 320,
  },
  emptyCta: {
    marginTop: spacing.md,
    minWidth: 220,
  },
  footerPrompt: {
    marginTop: spacing.sectionGap,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.xxxl,
    borderWidth: 2,
    borderStyle: "dashed",
    alignItems: "center",
    gap: spacing.sm,
  },
  footerPromptTitle: {
    fontFamily: fonts.serif,
    fontSize: 18,
    textAlign: "center",
  },
  footerPromptBody: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    maxWidth: 300,
  },
});

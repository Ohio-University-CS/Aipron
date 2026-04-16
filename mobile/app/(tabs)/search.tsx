import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Recipe } from "@aipron/shared";
import { TopBar } from "../../src/components/TopBar";
import { Chip } from "../../src/components/Chip";
import { RecipeCard } from "../../src/components/RecipeCard";
import {
  filterLocalCatalogRecipes,
  LOCAL_CATALOG_RECIPES,
} from "../../src/data/localCatalog";
import { useLocalCatalogSavedIds } from "../../src/hooks/useLocalCatalogSavedIds";
import { useThemeColors } from "../../src/hooks/useThemeColors";
import {
  borderRadius,
  fonts,
  spacing,
  typography,
} from "../../src/constants/DesignTokens";

const FILTER_CATEGORIES = [
  "All Cuisines",
  "Mediterranean",
  "Plant-Based",
  "Chef's Pick",
  "Quick Dinner",
  "Nordic",
  "Artisan Baking",
] as const;

type Category = (typeof FILTER_CATEGORIES)[number];

const EDITORIAL_BADGES = ["SEASONAL", "EDITOR'S CHOICE", "CHEF'S PICK"] as const;

// Every 4th card (0, 4, 8…) is an editorial hero. The rest are standard.
function cardVariantFor(index: number): {
  variant: "editorial" | "standard";
  badge?: string;
} {
  if (index % 4 === 0) {
    const badge =
      EDITORIAL_BADGES[Math.floor(index / 4) % EDITORIAL_BADGES.length];
    return { variant: "editorial", badge };
  }
  return { variant: "standard" };
}

// Rough client-side category filter. "All Cuisines" returns everything;
// other labels match against cuisine or dietaryTags (case-insensitive, token match).
function applyCategoryFilter(recipes: Recipe[], category: Category): Recipe[] {
  if (category === "All Cuisines") return recipes;
  const needle = category.toLowerCase();
  return recipes.filter((r) => {
    const hay = [
      r.cuisine ?? "",
      ...(r.dietaryTags ?? []),
      r.title ?? "",
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(needle) || hay.includes(needle.split(" ")[0]);
  });
}

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useThemeColors();

  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<Category>("All Cuisines");
  const [results, setResults] = useState<Recipe[]>(LOCAL_CATALOG_RECIPES);
  const { savedIds, toggleSave, reloadSavedIds } = useLocalCatalogSavedIds();

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchSeqRef = useRef(0);

  const runFilter = useCallback(
    (q: string, cat: Category) => {
      const seq = ++searchSeqRef.current;
      const bySearch = filterLocalCatalogRecipes(LOCAL_CATALOG_RECIPES, q);
      const byCat = applyCategoryFilter(bySearch, cat);
      if (seq !== searchSeqRef.current) return;
      setResults(byCat);
    },
    [],
  );

  useEffect(() => {
    const q = query.trim();

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      runFilter(q, activeFilter);
    }, 250);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, activeFilter, runFilter]);

  const subtitle = useMemo(() => {
    const q = query.trim();
    if (!q && activeFilter === "All Cuisines") {
      return `Built-in catalog — ${LOCAL_CATALOG_RECIPES.length} recipes`;
    }
    return `${results.length} result${results.length === 1 ? "" : "s"}`;
  }, [query, activeFilter, results.length]);

  const topBarHeight = insets.top + spacing.sm + 56;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <TopBar />

      <FlatList
        data={results}
        keyExtractor={(item, index) => item.id || `search-${index}`}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingTop: topBarHeight + spacing.lg,
            paddingBottom: insets.bottom + 120,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.headerSection}>
            <Text style={[styles.heroTitle, { color: theme.onBackground }]}>
              {"What are we\n"}
              <Text style={[styles.heroTitleItalic, { color: theme.primary }]}>
                creating
              </Text>
              {" today?"}
            </Text>

            <View
              style={[
                styles.searchField,
                { backgroundColor: theme.surfaceContainerLow },
              ]}
            >
              <MaterialIcons
                name="search"
                size={22}
                color={theme.outline}
                style={styles.searchIcon}
              />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Ingredients, dishes, or chefs..."
                placeholderTextColor={theme.outline}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                style={[styles.searchInput, { color: theme.onSurface }]}
              />
              {!!query && (
                <TouchableOpacity
                  onPress={() => setQuery("")}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  activeOpacity={0.7}
                >
                  <MaterialIcons
                    name="close"
                    size={20}
                    color={theme.outline}
                  />
                </TouchableOpacity>
              )}
            </View>

            <Text style={[styles.subtitle, { color: theme.onSurfaceVariant }]}>
              {subtitle}
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsRow}
              style={styles.chipsScroll}
            >
              {FILTER_CATEGORIES.map((cat) => {
                const isActive = activeFilter === cat;
                return (
                  <Chip
                    key={cat}
                    label={cat}
                    selected={isActive}
                    variant={isActive ? "filled" : "tonal"}
                    onPress={() => setActiveFilter(cat)}
                  />
                );
              })}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons
              name="search-off"
              size={64}
              color={theme.outlineVariant}
            />
            <Text style={[styles.emptyText, { color: theme.onSurface }]}>
              No matches
            </Text>
            <Text
              style={[styles.emptySubtext, { color: theme.onSurfaceVariant }]}
            >
              Try different keywords like ingredients, cuisine, or dietary tags.
            </Text>
          </View>
        }
        renderItem={({ item, index }) => {
          const { variant, badge } = cardVariantFor(index);
          return (
            <RecipeCard
              recipe={item}
              variant={variant}
              badge={badge}
              isSaved={!!item.id && savedIds.has(item.id)}
              onToggleSave={toggleSave}
              onPress={() => {
                if (item.id) {
                  router.push(`/recipe/${item.id}` as any);
                }
              }}
              disabled={!item.id}
              loading={false}
            />
          );
        }}
        refreshing={false}
        onRefresh={async () => {
          await reloadSavedIds();
          runFilter(query.trim(), activeFilter);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerSection: {
    marginBottom: spacing.xl,
  },
  heroTitle: {
    fontFamily: fonts.serifBold,
    fontSize: 54,
    lineHeight: 60,
    letterSpacing: -1,
    marginBottom: spacing.xl,
  },
  heroTitleItalic: {
    fontFamily: fonts.serifItalic,
    fontWeight: "400",
  },
  searchField: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: borderRadius.xl,
    height: 60,
    paddingRight: spacing.lg,
    marginBottom: spacing.md,
  },
  searchIcon: {
    position: "absolute",
    left: 16,
    zIndex: 1,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 17,
    paddingLeft: 48,
    height: "100%",
  },
  subtitle: {
    ...typography.caption,
    marginBottom: spacing.lg,
  },
  chipsScroll: {
    marginHorizontal: -spacing.screenPadding,
  },
  chipsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.xs,
  },
  listContent: {
    paddingHorizontal: spacing.screenPadding,
    flexGrow: 1,
    maxWidth: 680,
    width: "100%",
    alignSelf: "center",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sectionGap,
    paddingHorizontal: spacing.lg,
  },
  emptyText: {
    ...typography.h2,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    textAlign: "center",
  },
  emptySubtext: {
    ...typography.body,
    textAlign: "center",
  },
});

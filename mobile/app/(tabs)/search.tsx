import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Recipe } from "@aipron/shared";
import { RecipeCard } from "../../src/components/RecipeCard";
import { filterLocalCatalogRecipes, LOCAL_CATALOG_RECIPES } from "../../src/data/localCatalog";
import { useLocalCatalogSavedIds } from "../../src/hooks/useLocalCatalogSavedIds";
import { borderRadius, colors, spacing, typography } from "../../src/constants/DesignTokens";

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Recipe[]>(LOCAL_CATALOG_RECIPES);
  const { savedIds, toggleSave, reloadSavedIds } = useLocalCatalogSavedIds();

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchSeqRef = useRef(0);

  const runFilter = useCallback((q: string) => {
    const seq = ++searchSeqRef.current;
    const filtered = filterLocalCatalogRecipes(LOCAL_CATALOG_RECIPES, q);
    if (seq !== searchSeqRef.current) return;
    setResults(filtered);
  }, []);

  useEffect(() => {
    const q = query.trim();

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      runFilter(q);
    }, 250);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, runFilter]);

  const subtitle = useMemo(() => {
    const q = query.trim();
    if (!q) return `Built-in catalog — ${LOCAL_CATALOG_RECIPES.length} recipes`;
    return `${results.length} result${results.length === 1 ? "" : "s"}`;
  }, [query, results.length]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Text style={styles.title}>Search</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search recipes (e.g., salmon, lemon dill, greek yogurt)"
            placeholderTextColor={colors.textDisabled}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            style={styles.searchInput}
          />
          {!!query && (
            <TouchableOpacity
              onPress={() => setQuery("")}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.7}
            >
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={results}
        keyExtractor={(item, index) => item.id || `search-${index}`}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={64} color={colors.textDisabled} />
            <Text style={styles.emptyText}>No matches</Text>
            <Text style={styles.emptySubtext}>
              Try different keywords like ingredients, cuisine, or dietary tags.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <RecipeCard
            recipe={item}
            isSaved={!!item.id && savedIds.has(item.id)}
            onToggleSave={toggleSave}
            onPress={() => {
              if (item.id) {
                router.push(`/cooking/${item.id}`);
              }
            }}
            disabled={!item.id}
            loading={false}
          />
        )}
        refreshing={false}
        onRefresh={async () => {
          await reloadSavedIds();
          runFilter(query.trim());
        }}
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
    gap: spacing.xs / 2,
  },
  title: {
    ...typography.h1,
    color: colors.text,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    paddingVertical: 0,
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

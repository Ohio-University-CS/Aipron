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
import { recipeApi } from "../../src/services/api";
import { borderRadius, colors, spacing, typography } from "../../src/constants/DesignTokens";

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Recipe[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadSavedIds = useCallback(async () => {
    try {
      const savedIdsList = await recipeApi.getSavedIds();
      setSavedIds(new Set(savedIdsList));
    } catch {
      setSavedIds(new Set());
    }
  }, []);

  useEffect(() => {
    loadSavedIds();
  }, [loadSavedIds]);

  const runSearch = useCallback(async (q: string) => {
    setIsLoading(true);
    try {
      const data = await recipeApi.search(q, { limit: 30, offset: 0 });
      setResults(data);
    } catch (error) {
      console.error("Search failed:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const q = query.trim();

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      runSearch(q);
    }, 250);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, runSearch]);

  const handleToggleSave = useCallback((recipeId: string) => {
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

  const subtitle = useMemo(() => {
    const q = query.trim();
    if (!q) return "Search all recipes";
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
            <Ionicons
              name={query.trim() ? "search-outline" : "compass-outline"}
              size={64}
              color={colors.textDisabled}
            />
            <Text style={styles.emptyText}>
              {query.trim() ? "No results" : "Start typing to search"}
            </Text>
            <Text style={styles.emptySubtext}>
              {query.trim()
                ? "Try different keywords like ingredients, cuisine, or substitutions."
                : "Try: salmon, lemon dill, green beans, sour cream, trout"}
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
            disabled={!item.id}
            loading={isLoading}
          />
        )}
        refreshing={isLoading}
        onRefresh={async () => {
          await loadSavedIds();
          await runSearch(query.trim());
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


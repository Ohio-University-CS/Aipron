import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "./LinearGradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Recipe } from "@aipron/shared";
import { TopBar } from "./TopBar";
import { GradientButton } from "./GradientButton";
import { Chip } from "./Chip";
import { IngredientRow } from "./IngredientRow";
import { recipeApi } from "../services/api";
import { findLocalCatalogRecipeById } from "../data/localCatalog";
import { useLocalCatalogSavedIds } from "../hooks/useLocalCatalogSavedIds";
import { useThemeColors } from "../hooks/useThemeColors";
import {
  StitchImages,
  pickFallbackPhoto,
  recipeImageFallbackSeed,
} from "../constants/StitchImages";
import {
  borderRadius,
  fonts,
  shadows,
  spacing,
  typography,
} from "../constants/DesignTokens";

export type RecipeDetailViewProps = {
  recipeId: string;
  onBack: () => void;
  onStartCooking: (recipeId: string) => void;
  /** Called after server save/unsave succeeds (e.g. refresh Favorites list). */
  onFavoriteChanged?: () => void;
};

export function RecipeDetailView({
  recipeId,
  onBack,
  onStartCooking,
  onFavoriteChanged,
}: RecipeDetailViewProps) {
  const insets = useSafeAreaInsets();
  const theme = useThemeColors();
  const { savedIds: localSavedIds, toggleSave: toggleLocalSave } =
    useLocalCatalogSavedIds();

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isApiSaved, setIsApiSaved] = useState(false);
  const [heroFailed, setHeroFailed] = useState(false);

  const isLocalCatalogRecipe = useMemo(
    () => !!findLocalCatalogRecipeById(recipeId),
    [recipeId],
  );

  const heartFilled = useMemo(() => {
    if (!recipe?.id) return false;
    if (isLocalCatalogRecipe) return localSavedIds.has(recipe.id);
    return isApiSaved;
  }, [recipe?.id, isLocalCatalogRecipe, localSavedIds, isApiSaved]);

  useEffect(() => {
    let cancelled = false;
    const loadRecipe = async () => {
      const local = findLocalCatalogRecipeById(recipeId);
      if (local) {
        if (!cancelled) setRecipe(local);
        return;
      }
      try {
        const data = await recipeApi.getById(recipeId);
        if (!cancelled) setRecipe(data);
      } catch (error) {
        console.error("Failed to load recipe:", error);
      }
    };
    loadRecipe();
    return () => {
      cancelled = true;
    };
  }, [recipeId]);

  useEffect(() => {
    if (!recipe?.id || isLocalCatalogRecipe) return;
    let cancelled = false;
    recipeApi
      .getSavedIds()
      .then((ids) => {
        if (!cancelled) setIsApiSaved(ids.includes(recipe.id!));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [recipe?.id, isLocalCatalogRecipe]);

  const handleSubstitutionPress = useCallback(
    async (ingredientName: string) => {
      if (!ingredientName.trim()) return;
      try {
        const data = (await recipeApi.getSubstitutions(
          ingredientName.trim(),
          recipe?.dietaryTags ?? [],
        )) as { substitutions?: unknown };
        const subs = data?.substitutions;
        const text = Array.isArray(subs)
          ? subs.map((s) => String(s)).filter(Boolean).join(", ")
          : subs != null
            ? String(subs)
            : "";
        Alert.alert(
          `Substitutions for ${ingredientName}`,
          text.length > 0 ? text : "No suggestions returned.",
        );
      } catch (e: unknown) {
        const status = (e as { response?: { status?: number } })?.response
          ?.status;
        Alert.alert(
          "Substitutions",
          status === 401
            ? "Sign in to load substitution suggestions."
            : "Could not load substitutions. Try again when online.",
        );
      }
    },
    [recipe?.dietaryTags],
  );

  const topBarHeight = insets.top + spacing.sm + 56;

  const heroUri = useMemo(() => {
    if (!recipe) return StitchImages.recipeDetailHero;
    if (recipe.heroImage && !heroFailed) return recipe.heroImage;
    return pickFallbackPhoto(recipeImageFallbackSeed(recipe));
  }, [recipe, heroFailed]);

  const difficultyLabel = useMemo(() => {
    if (!recipe?.difficulty) return null;
    return (
      recipe.difficulty.charAt(0).toUpperCase() + recipe.difficulty.slice(1)
    );
  }, [recipe?.difficulty]);

  const eyebrow = useMemo(() => {
    if (!recipe) return "";
    if (recipe.cuisine) return recipe.cuisine.toUpperCase();
    const firstTag = recipe.dietaryTags?.[0];
    if (firstTag) return firstTag.toUpperCase();
    return "SEASONAL BRUNCH";
  }, [recipe]);

  if (!recipe) {
    return (
      <View
        style={[
          styles.container,
          styles.loadingContainer,
          { backgroundColor: theme.background },
        ]}
      >
        <TopBar showBack onBackPress={onBack} showAvatar={false} />
        <Text style={[typography.body, { color: theme.onSurfaceVariant }]}>
          Loading recipe...
        </Text>
      </View>
    );
  }

  const categoryChips = [
    recipe.cuisine,
    ...(recipe.dietaryTags ?? []).slice(0, 2),
  ].filter(Boolean) as string[];

  const calories = recipe.nutrition?.calories;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <TopBar
        showBack
        onBackPress={onBack}
        rightIcon="share"
        onRightPress={async () => {
          try {
            await Share.share({
              title: recipe.title,
              message: `${recipe.title}${recipe.description ? `\n\n${recipe.description}` : ""}`,
            });
          } catch {
            // user cancelled or share unavailable — no-op
          }
        }}
        showAvatar={false}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: topBarHeight,
            paddingBottom: insets.bottom + 120,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentFrame}>
          <View style={styles.heroWrapper}>
            <View
              style={[
                styles.heroMask,
                { backgroundColor: theme.surfaceContainerHighest },
              ]}
            >
              <Image
                source={{ uri: heroUri }}
                style={styles.heroImage}
                resizeMode="cover"
                onError={() => setHeroFailed(true)}
              />
              <LinearGradient
                colors={["transparent", theme.background]}
                start={{ x: 0.5, y: 0.6 }}
                end={{ x: 0.5, y: 1 }}
                style={styles.heroFade}
                pointerEvents="none"
              />
            </View>

            <TouchableOpacity
              style={[
                styles.floatingHeart,
                { backgroundColor: theme.surfaceContainerLowest },
                shadows.md,
              ]}
              onPress={async () => {
                if (!recipe.id) return;
                if (isLocalCatalogRecipe) {
                  toggleLocalSave(recipe.id);
                  return;
                }
                try {
                  if (isApiSaved) {
                    await recipeApi.unsave(recipe.id);
                  } else {
                    await recipeApi.save(recipe.id);
                  }
                  setIsApiSaved((v) => !v);
                  onFavoriteChanged?.();
                } catch {
                  Alert.alert(
                    "Favorites",
                    "Could not update saved recipes. Sign in and try again.",
                  );
                }
              }}
              activeOpacity={0.8}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialIcons
                name={heartFilled ? "favorite" : "favorite-border"}
                size={22}
                color={heartFilled ? theme.tertiary : theme.onSurfaceVariant}
              />
            </TouchableOpacity>

            <View
              style={[
                styles.chefTipFloat,
                { backgroundColor: theme.tertiaryContainer },
                shadows.md,
              ]}
            >
              <MaterialIcons
                name="lightbulb"
                size={14}
                color={theme.onTertiaryContainer}
              />
              <Text
                style={[
                  styles.chefTipText,
                  { color: theme.onTertiaryContainer },
                ]}
              >
                CHEF'S TIP: DON'T OVERMIX
              </Text>
            </View>
          </View>

          <View style={styles.body}>
            {categoryChips.length > 0 && (
              <View style={styles.categoryRow}>
                {categoryChips.map((tag) => (
                  <Chip key={tag} label={tag} variant="tonal" size="sm" />
                ))}
              </View>
            )}

            {recipe.isAiGenerated ? (
              <View
                style={[
                  styles.aiBadge,
                  { backgroundColor: theme.primary },
                ]}
              >
                <MaterialIcons
                  name="auto-awesome"
                  size={14}
                  color={theme.onPrimary}
                />
                <Text
                  style={[styles.aiBadgeText, { color: theme.onPrimary }]}
                >
                  AI generated
                </Text>
              </View>
            ) : null}

            <Text style={[styles.eyebrow, { color: theme.tertiary }]}>
              {eyebrow}
            </Text>

            <Text style={[styles.title, { color: theme.onSurface }]}>
              {recipe.title}
            </Text>

            <View style={styles.chefIntroRow}>
              <Image
                source={{ uri: StitchImages.chatChefAvatar }}
                style={styles.chefAvatar}
              />
              <View style={styles.chefIntroText}>
                <Text style={[styles.chefLabel, { color: theme.outline }]}>
                  AIPRON CHEF
                </Text>
                <Text style={[styles.chefName, { color: theme.onSurface }]}>
                  Curated by your AI sous-chef
                </Text>
              </View>
            </View>

            {recipe.description && (
              <Text
                style={[
                  styles.description,
                  { color: theme.onSurfaceVariant },
                ]}
              >
                {recipe.description}
              </Text>
            )}

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.statsRow}
              style={styles.statsScroll}
            >
              <StatTile
                icon="schedule"
                label="Total Time"
                value={`${recipe.totalTime ?? recipe.prepTime + recipe.cookTime}m`}
                theme={theme}
              />
              <StatTile
                icon="people-outline"
                label="Serves"
                value={String(recipe.servings)}
                theme={theme}
              />
              <StatTile
                icon="signal-cellular-alt"
                label="Level"
                value={difficultyLabel ?? "—"}
                theme={theme}
              />
              {typeof calories === "number" && (
                <StatTile
                  icon="local-fire-department"
                  label="Calories"
                  value={String(calories)}
                  theme={theme}
                />
              )}
            </ScrollView>

            {recipe.ingredients.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <Text
                    style={[styles.sectionTitle, { color: theme.onSurface }]}
                  >
                    Ingredients
                  </Text>
                  <Chip
                    label={`${recipe.servings} servings`}
                    variant="tonal"
                    size="sm"
                  />
                </View>
                <View
                  style={[
                    styles.sectionDivider,
                    { backgroundColor: theme.outlineVariant + "40" },
                  ]}
                />
                <View style={styles.ingredientsList}>
                  {recipe.ingredients.map((ing, idx) => (
                    <IngredientRow
                      key={ing.id || `${ing.name}-${idx}`}
                      ingredient={ing}
                      showSubstitution
                      onSubstitutionPress={() =>
                        handleSubstitutionPress(ing.name)
                      }
                    />
                  ))}
                </View>
              </View>
            )}

            {recipe.steps.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <Text
                    style={[styles.sectionTitle, { color: theme.onSurface }]}
                  >
                    Preparation
                  </Text>
                </View>
                <View
                  style={[
                    styles.sectionDivider,
                    { backgroundColor: theme.outlineVariant + "40" },
                  ]}
                />
                <View style={styles.stepsList}>
                  {recipe.steps.map((step, idx) => (
                    <View
                      key={step.stepNumber ?? idx}
                      style={styles.stepRow}
                    >
                      <Text
                        style={[
                          styles.stepNumber,
                          { color: theme.primaryContainer },
                        ]}
                      >
                        {String(step.stepNumber ?? idx + 1).padStart(2, "0")}
                      </Text>
                      <View style={styles.stepContent}>
                        <Text
                          style={[
                            styles.stepInstruction,
                            { color: theme.onSurface },
                          ]}
                        >
                          {step.instruction}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: theme.background + "F2",
            paddingBottom: insets.bottom + spacing.lg,
            borderTopColor: theme.outlineVariant + "40",
          },
        ]}
      >
        <View style={styles.bottomBarInner}>
          <View style={styles.bottomBarCopy}>
            <Text style={[styles.bottomEyebrow, { color: theme.outline }]}>
              READY TO BEGIN?
            </Text>
            <Text style={[styles.bottomHeadline, { color: theme.onSurface }]}>
              Let's get cooking.
            </Text>
          </View>
          <GradientButton
            title="Start Cooking"
            icon="restaurant"
            onPress={() => onStartCooking(recipeId)}
            style={styles.startButton}
          />
        </View>
      </View>
    </View>
  );
}

interface StatTileProps {
  icon: React.ComponentProps<typeof MaterialIcons>["name"];
  label: string;
  value: string;
  theme: ReturnType<typeof useThemeColors>;
}

const StatTile: React.FC<StatTileProps> = ({ icon, label, value, theme }) => {
  return (
    <View
      style={[
        styles.statCard,
        { backgroundColor: theme.surfaceContainerLow },
      ]}
    >
      <MaterialIcons name={icon} size={22} color={theme.primary} />
      <Text style={[styles.statLabel, { color: theme.outline }]}>
        {label.toUpperCase()}
      </Text>
      <Text style={[styles.statValue, { color: theme.onSurface }]}>
        {value}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    flexGrow: 1,
  },
  contentFrame: {
    maxWidth: 680,
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: spacing.screenPadding,
  },
  heroWrapper: {
    position: "relative",
    marginBottom: spacing.xl,
  },
  heroMask: {
    width: "100%",
    aspectRatio: 4 / 5,
    overflow: "hidden",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 8,
    borderBottomLeftRadius: 64,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroFade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 100,
  },
  floatingHeart: {
    position: "absolute",
    top: spacing.lg,
    right: spacing.lg,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  chefTipFloat: {
    position: "absolute",
    bottom: spacing.xl,
    right: -spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    transform: [{ rotate: "-2deg" }],
  },
  chefTipText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  body: {
    paddingTop: spacing.sm,
  },
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  aiBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginBottom: spacing.md,
  },
  aiBadgeText: {
    fontFamily: fonts.sansBold,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  eyebrow: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 10,
    letterSpacing: 4,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
  },
  title: {
    fontFamily: fonts.serifBold,
    fontSize: 42,
    lineHeight: 48,
    letterSpacing: -0.5,
    marginBottom: spacing.xl,
  },
  chefIntroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  chefAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.06)",
  },
  chefIntroText: {
    flex: 1,
  },
  chefLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  chefName: {
    fontFamily: fonts.sans,
    fontSize: 13,
    marginTop: 2,
  },
  description: {
    fontFamily: fonts.serifItalic,
    fontSize: 20,
    lineHeight: 30,
    marginBottom: spacing.xl,
  },
  statsScroll: {
    marginHorizontal: -spacing.screenPadding,
    marginBottom: spacing.sectionGap,
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.md,
    paddingHorizontal: spacing.screenPadding,
  },
  statCard: {
    minWidth: 110,
    alignItems: "flex-start",
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.xxl,
    gap: spacing.xs,
  },
  statLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginTop: spacing.xs,
  },
  statValue: {
    fontFamily: fonts.serifBold,
    fontSize: 22,
    lineHeight: 26,
  },
  section: {
    marginBottom: spacing.sectionGap,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontFamily: fonts.serifBold,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.3,
  },
  sectionDivider: {
    height: 1,
    marginBottom: spacing.lg,
  },
  ingredientsList: {
    marginHorizontal: -spacing.lg,
  },
  stepsList: {
    gap: spacing.xl,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.lg,
  },
  stepNumber: {
    fontFamily: fonts.serifItalic,
    fontSize: 42,
    lineHeight: 46,
    width: 56,
  },
  stepContent: {
    flex: 1,
    paddingTop: spacing.sm,
  },
  stepInstruction: {
    fontFamily: fonts.serif,
    fontSize: 18,
    lineHeight: 28,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.screenPadding,
    borderTopWidth: 1,
  },
  bottomBarInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    maxWidth: 680,
    width: "100%",
    alignSelf: "center",
  },
  bottomBarCopy: {
    flex: 1,
  },
  bottomEyebrow: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  bottomHeadline: {
    fontFamily: fonts.serifBold,
    fontSize: 18,
    marginTop: 2,
  },
  startButton: {
    minWidth: 180,
  },
});

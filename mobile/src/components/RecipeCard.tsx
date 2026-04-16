import React, { useMemo, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image, ImageSourcePropType } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Recipe } from "@aipron/shared";
import { spacing, borderRadius, typography, shadows, fonts, type ThemeColors } from "../constants/DesignTokens";
import { useThemeColors } from "../hooks/useThemeColors";
import { pickFallbackPhoto } from "../constants/StitchImages";

type CardVariant = "standard" | "editorial";

interface RecipeCardProps {
  recipe: Recipe;
  onPress: () => void;
  isSaved?: boolean;
  onToggleSave?: (recipeId: string) => void;
  loading?: boolean;
  error?: boolean;
  disabled?: boolean;
  /**
   * "standard" – square-ish card (default, used in grids).
   * "editorial" – wide 16:9 hero card with large headline,
   *  matching the Stitch Discover hero tiles.
   */
  variant?: CardVariant;
  /** Optional top-left badge (e.g. "Seasonal", "Editor's Choice"). */
  badge?: string;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  onPress,
  isSaved = false,
  onToggleSave,
  loading = false,
  error = false,
  disabled = false,
  variant = "standard",
  badge,
}) => {
  const c = useThemeColors();
  const styles = useMemo(() => getStyles(c, variant), [c, variant]);
  const [imageFailed, setImageFailed] = useState(false);

  const primaryImage = recipe.heroImage && !imageFailed
    ? recipe.heroImage
    : pickFallbackPhoto(recipe.id ?? recipe.title);

  const imageSource: ImageSourcePropType = { uri: primaryImage };

  if (error) {
    return (
      <View style={[styles.card, styles.errorCard]}>
        <Text style={styles.errorText}>Failed to load recipe</Text>
      </View>
    );
  }

  const primaryTag =
    recipe.dietaryTags[0] ??
    recipe.cuisine ??
    (recipe.difficulty ? recipe.difficulty : undefined);

  return (
    <TouchableOpacity
      style={[styles.card, disabled && styles.cardDisabled]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      <View style={styles.imageContainer}>
        <Image
          source={imageSource}
          style={styles.image}
          resizeMode="cover"
          onError={() => setImageFailed(true)}
        />
        {badge ? (
          <View style={[styles.badge, { backgroundColor: c.tertiaryContainer }]}>
            <Text style={[styles.badgeText, { color: c.onTertiaryContainer }]}>
              {badge}
            </Text>
          </View>
        ) : null}
        {onToggleSave && variant === "standard" ? (
          <TouchableOpacity
            style={styles.saveBadge}
            onPress={(e) => {
              e.stopPropagation?.();
              if (!recipe.id) return;
              onToggleSave(recipe.id);
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name={isSaved ? "favorite" : "favorite-border"}
              size={18}
              color={isSaved ? c.error : c.onSurfaceVariant}
            />
          </TouchableOpacity>
        ) : null}
      </View>
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title} numberOfLines={variant === "editorial" ? 2 : 2}>
              {recipe.title}
            </Text>
            <View style={styles.meta}>
              <View style={styles.metaItem}>
                <MaterialIcons name="schedule" size={14} color={c.onSurfaceVariant} />
                <Text style={styles.metaText}>{recipe.totalTime}m</Text>
              </View>
              {primaryTag ? (
                <View style={styles.metaItem}>
                  <MaterialIcons name="filter-vintage" size={14} color={c.onSurfaceVariant} />
                  <Text style={styles.metaText}>{primaryTag}</Text>
                </View>
              ) : null}
              {recipe.difficulty && variant === "editorial" ? (
                <View style={styles.metaItem}>
                  <MaterialIcons name="signal-cellular-alt" size={14} color={c.onSurfaceVariant} />
                  <Text style={styles.metaText}>{recipe.difficulty}</Text>
                </View>
              ) : null}
            </View>
          </View>
          {variant === "editorial" && onToggleSave ? (
            <TouchableOpacity
              style={styles.editorialHeart}
              onPress={(e) => {
                e.stopPropagation?.();
                if (!recipe.id) return;
                onToggleSave(recipe.id);
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.7}
            >
              <MaterialIcons
                name={isSaved ? "favorite" : "favorite-border"}
                size={22}
                color={isSaved ? c.tertiary : c.onSurfaceVariant}
              />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
      {loading && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const getStyles = (c: ThemeColors, variant: CardVariant) =>
  StyleSheet.create({
    card: {
      backgroundColor: "transparent",
      marginBottom: spacing.xl,
      overflow: "visible",
    },
    cardDisabled: {
      opacity: 0.5,
    },
    errorCard: {
      borderWidth: 1,
      borderColor: c.error,
      padding: spacing.lg,
      borderRadius: borderRadius.lg,
    },
    imageContainer: {
      width: "100%",
      aspectRatio: variant === "editorial" ? 16 / 9 : 1,
      backgroundColor: c.surfaceContainerLow,
      position: "relative",
      borderTopLeftRadius:
        variant === "editorial" ? 32 : borderRadius.editorialTL,
      borderTopRightRadius: variant === "editorial" ? 32 : borderRadius.lg,
      borderBottomLeftRadius: variant === "editorial" ? 32 : borderRadius.lg,
      borderBottomRightRadius:
        variant === "editorial" ? 8 : borderRadius.editorialBR,
      overflow: "hidden",
      ...shadows.sm,
    },
    image: {
      width: "100%",
      height: "100%",
    },
    badge: {
      position: "absolute",
      top: spacing.lg,
      left: spacing.lg,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.full,
    },
    badgeText: {
      fontFamily: fonts.sansBold,
      fontSize: 10,
      textTransform: "uppercase",
      letterSpacing: 2,
    },
    saveBadge: {
      position: "absolute",
      top: spacing.md,
      right: spacing.md,
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: c.surfaceContainerLowest,
      justifyContent: "center",
      alignItems: "center",
      ...shadows.sm,
    },
    content: {
      paddingTop: spacing.lg,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.md,
    },
    title: {
      fontFamily: fonts.serifBold,
      fontSize: variant === "editorial" ? 28 : 20,
      lineHeight: variant === "editorial" ? 34 : 26,
      letterSpacing: -0.3,
      color: c.onBackground,
    },
    meta: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: spacing.sm,
      gap: spacing.md,
      flexWrap: "wrap",
    },
    metaItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    metaText: {
      fontFamily: fonts.sans,
      fontSize: 12,
      color: c.onSurfaceVariant,
      textTransform: "capitalize",
    },
    editorialHeart: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: c.surfaceContainerLowest,
      justifyContent: "center",
      alignItems: "center",
      ...shadows.sm,
    },
    loadingOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: c.surfaceContainerLowest + "CC",
      justifyContent: "center",
      alignItems: "center",
      borderRadius: borderRadius.sm,
    },
    loadingText: {
      ...typography.body,
      color: c.onSurfaceVariant,
    },
    errorText: {
      ...typography.body,
      color: c.error,
    },
  });

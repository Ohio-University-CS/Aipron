import React, { useCallback, useEffect, useMemo, useState } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "../src/components/LinearGradient";
import { pantryApi, recipeApi } from "../src/services/api";
import {
  borderRadius,
  fonts,
  shadows,
  spacing,
} from "../src/constants/DesignTokens";
import { useThemeColors } from "../src/hooks/useThemeColors";
import { TopBar } from "../src/components/TopBar";
import {
  StitchImages,
  pickFallbackPhoto,
} from "../src/constants/StitchImages";
import { useRouter } from "expo-router";
import axios from "axios";

interface PantryItem {
  id: string;
  name: string;
  quantity?: number;
  unit?: string;
  expiresAt?: Date;
}

type PantrySuggestion = {
  title?: string;
  description?: string;
  matchPercentage?: number;
  match_percent?: number;
  [key: string]: unknown;
};

type MdIconName = React.ComponentProps<typeof MaterialIcons>["name"];

const SPICE_PLACEHOLDERS: { name: string; icon: MdIconName }[] = [
  { name: "Chili Flakes", icon: "local-fire-department" },
  { name: "Star Anise", icon: "spa" },
  { name: "Smoked Paprika", icon: "whatshot" },
  { name: "Cumin Seed", icon: "grass" },
];

/** Pick a hero image for a fresh item by index (first two are fixed). */
function freshImageFor(index: number, id: string): string {
  if (index === 0) return StitchImages.pantryRicottaBowl;
  if (index === 1) return StitchImages.pantryLemonsBowl;
  return pickFallbackPhoto(id);
}

export default function PantryScreen(
  props: {
    onOpenCookingId?: (id: string) => void;
    /** When Pantry is embedded (e.g. Web Preview), use this instead of the router stack. */
    onBack?: () => void;
  } = {},
) {
  const router = useRouter();

  const handleBack = useCallback(() => {
    if (props.onBack) {
      props.onBack();
      return;
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/chat");
    }
  }, [props.onBack, router]);
  const insets = useSafeAreaInsets();
  const theme = useThemeColors();
  const [items, setItems] = useState<PantryItem[]>([]);
  const [newItem, setNewItem] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<PantrySuggestion[]>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const [generatingKey, setGeneratingKey] = useState<string | null>(null);
  const [addingVisible, setAddingVisible] = useState(false);

  useEffect(() => {
    loadPantry();
  }, []);

  const loadPantry = async () => {
    try {
      const data = await pantryApi.getAll();
      setItems(data);
    } catch (error) {
      console.error("Failed to load pantry:", error);
    }
  };

  const handleAddItem = async () => {
    if (!newItem.trim()) return;

    setIsLoading(true);
    try {
      const item = await pantryApi.add({ name: newItem.trim() });
      setItems((prev) => [...prev, item]);
      setNewItem("");
      setAddingVisible(false);
    } catch (error) {
      console.error("Failed to add item:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await pantryApi.delete(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Failed to delete item:", error);
    }
  };

  // Backend currently has no PATCH for pantry items — adjust locally so the
  // steppers give tactile feedback until the update endpoint lands.
  const handleAdjustQuantity = (id: string, delta: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const current = typeof item.quantity === "number" ? item.quantity : 1;
        const next = Math.max(0, current + delta);
        return { ...item, quantity: next };
      }),
    );
  };

  const handleSuggestRecipes = async () => {
    setSuggestError(null);
    setSuggestLoading(true);
    try {
      try {
        const data = await pantryApi.findRecipes();
        setSuggestions(Array.isArray(data) ? data : []);
      } catch (error) {
        if (
          axios.isAxiosError(error) &&
          error.message.toLowerCase().includes("network")
        ) {
          await new Promise((r) => setTimeout(r, 600));
          const data = await pantryApi.findRecipes();
          setSuggestions(Array.isArray(data) ? data : []);
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error("Failed to suggest recipes:", error);
      setSuggestError(
        "Could not fetch suggestions. Make sure you're logged in and the backend is running.",
      );
      setSuggestions([]);
    } finally {
      setSuggestLoading(false);
    }
  };

  const handleGenerateFromSuggestion = async (
    s: PantrySuggestion,
    idx: number,
  ) => {
    const title =
      typeof s.title === "string" && s.title.trim() ? s.title.trim() : null;
    const desc =
      typeof s.description === "string" && s.description.trim()
        ? s.description.trim()
        : null;
    const prompt = title || desc;
    if (!prompt) return;

    const key = `${prompt}-${idx}`;
    setGeneratingKey(key);
    try {
      const recipe = await recipeApi.generate(prompt, { usePantry: true });
      if (recipe?.id) {
        if (props.onOpenCookingId) {
          props.onOpenCookingId(String(recipe.id));
        } else {
          router.push(`/cooking/${recipe.id}`);
        }
      }
    } catch (error) {
      console.error("Failed to generate recipe from suggestion:", error);
      setSuggestError(
        "Could not generate that recipe. Try again (and make sure the backend is running).",
      );
    } finally {
      setGeneratingKey(null);
    }
  };

  const { freshItems, pantryStaples } = useMemo(() => {
    const fresh = items.slice(0, Math.min(3, items.length));
    const staples = items.slice(fresh.length);
    return { freshItems: fresh, pantryStaples: staples };
  }, [items]);

  const topBarHeight = insets.top + spacing.sm + 56;

  // ---------- Sub renders ----------

  const renderHero = () => (
    <View style={styles.heroSection}>
      <Text style={[styles.eyebrow, { color: theme.tertiary }]}>
        INVENTORY MANAGEMENT
      </Text>
      <Text style={[styles.heroTitle, { color: theme.onSurface }]}>
        Your Kitchen
      </Text>
    </View>
  );

  const renderBento = () => (
    <TouchableOpacity
      activeOpacity={0.88}
      disabled={suggestLoading}
      onPress={handleSuggestRecipes}
      style={[
        styles.bentoCard,
        {
          backgroundColor: theme.surfaceContainerLow,
          borderColor: theme.outlineVariant + "26",
        },
      ]}
    >
      <View style={styles.bentoBody}>
        <View
          style={[
            styles.bentoChip,
            { backgroundColor: theme.primaryContainer },
          ]}
        >
          <MaterialIcons
            name="auto-awesome"
            size={14}
            color={theme.onPrimaryContainer}
          />
          <Text
            style={[
              styles.bentoChipText,
              { color: theme.onPrimaryContainer },
            ]}
          >
            AI RECOMMENDATION
          </Text>
        </View>

        <Text style={[styles.bentoHeadline, { color: theme.onSurface }]}>
          What can I make?
        </Text>

        <Text style={[styles.bentoBodyText, { color: theme.onSurfaceVariant }]}>
          Based on your fresh{" "}
          <Text style={{ color: theme.primary, fontFamily: fonts.sansBold }}>
            Ricotta
          </Text>{" "}
          and seasonal{" "}
          <Text style={{ color: theme.primary, fontFamily: fonts.sansBold }}>
            Lemons
          </Text>
          , we suggest:
        </Text>

        <View
          style={[
            styles.bentoSuggestionRow,
            {
              backgroundColor: theme.surfaceContainerLowest,
              borderColor: theme.outlineVariant + "22",
            },
            shadows.sm,
          ]}
        >
          <Image
            source={{ uri: StitchImages.pantryLemonRicottaDish }}
            style={styles.bentoSuggestionImg}
            resizeMode="cover"
          />
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.bentoSuggestionTitle,
                { color: theme.onSurface },
              ]}
            >
              Lemon Ricotta Linguine
            </Text>
            <Text
              style={[
                styles.bentoSuggestionMeta,
                { color: theme.onSurfaceVariant },
              ]}
            >
              25 mins · Intermediate · 98% Match
            </Text>
          </View>
          <MaterialIcons
            name="chevron-right"
            size={22}
            color={theme.primary}
          />
        </View>

        {suggestLoading && (
          <ActivityIndicator
            size="small"
            color={theme.primary}
            style={{ marginTop: spacing.md }}
          />
        )}
      </View>

      <View style={styles.bentoImageWrap}>
        <View style={styles.bentoImageInner}>
          <Image
            source={{ uri: StitchImages.pantryHeroLemons }}
            style={styles.bentoImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={[
              "transparent",
              theme.surfaceContainerLow + "CC",
              theme.surfaceContainerLow,
            ]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0.5, y: 0.4 }}
            end={{ x: 0.5, y: 1 }}
          />
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderRealSuggestions = () => {
    if (suggestError) {
      return (
        <Text style={[styles.errorText, { color: theme.error }]}>
          {suggestError}
        </Text>
      );
    }
    if (suggestions.length === 0) return null;
    return (
      <View style={styles.suggestionsWrap}>
        {suggestions.slice(0, 5).map((r, idx) => {
          const title =
            typeof r.title === "string" && r.title.trim().length > 0
              ? r.title
              : typeof r.description === "string" &&
                  r.description.trim().length > 0
                ? r.description
                : `Suggestion ${idx + 1}`;
          const desc = typeof r.description === "string" ? r.description : "";
          const pctRaw =
            typeof r.matchPercentage === "number"
              ? r.matchPercentage
              : r.match_percent;
          const pct = typeof pctRaw === "number" ? Math.round(pctRaw) : null;
          const key = `${title}-${idx}`;
          const canGenerate =
            (typeof r.title === "string" && r.title.trim().length > 0) ||
            (typeof r.description === "string" &&
              r.description.trim().length > 0);
          const isGenerating = generatingKey === key;
          return (
            <TouchableOpacity
              key={key}
              style={[
                styles.suggestionRow,
                {
                  backgroundColor: theme.surfaceContainerLowest,
                  borderColor: canGenerate
                    ? theme.primaryContainer
                    : theme.outlineVariant + "26",
                },
              ]}
              activeOpacity={0.85}
              disabled={!canGenerate || isGenerating}
              onPress={() => handleGenerateFromSuggestion(r, idx)}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.suggestionRowTitle,
                    { color: theme.onSurface },
                  ]}
                >
                  {title}
                </Text>
                {desc ? (
                  <Text
                    style={[
                      styles.suggestionRowDesc,
                      { color: theme.onSurfaceVariant },
                    ]}
                  >
                    {desc}
                  </Text>
                ) : null}
                {canGenerate && (
                  <Text
                    style={[styles.suggestionRowHint, { color: theme.tertiary }]}
                  >
                    {isGenerating ? "Generating recipe…" : "Tap to generate"}
                  </Text>
                )}
              </View>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.sm,
                }}
              >
                {pct != null && (
                  <Text style={[styles.matchPct, { color: theme.primary }]}>
                    {pct}%
                  </Text>
                )}
                <MaterialIcons
                  name="chevron-right"
                  size={20}
                  color={theme.primary}
                />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderSectionHeader = (label: string, count: number) => (
    <View
      style={[
        styles.sectionHeader,
        { borderBottomColor: theme.outlineVariant + "4D" },
      ]}
    >
      <Text style={[styles.sectionTitle, { color: theme.onSurface }]}>
        {label}
      </Text>
      <Text style={[styles.sectionCount, { color: theme.onSurfaceVariant }]}>
        {count} item{count !== 1 ? "s" : ""}
      </Text>
    </View>
  );

  const renderStepper = (item: PantryItem) => (
    <View style={styles.stepperRow}>
      <TouchableOpacity
        style={[styles.stepperBtn, { backgroundColor: theme.surfaceContainer }]}
        activeOpacity={0.8}
        onPress={() => handleAdjustQuantity(item.id, -1)}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      >
        <MaterialIcons
          name="remove"
          size={16}
          color={theme.onSurfaceVariant}
        />
      </TouchableOpacity>
      <Text style={[styles.stepperValue, { color: theme.onSurface }]}>
        {item.quantity != null
          ? `${item.quantity}${item.unit ? item.unit : ""}`
          : "—"}
      </Text>
      <TouchableOpacity
        style={[
          styles.stepperBtn,
          { backgroundColor: theme.primaryContainer },
        ]}
        activeOpacity={0.8}
        onPress={() => handleAdjustQuantity(item.id, 1)}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      >
        <MaterialIcons
          name="add"
          size={16}
          color={theme.onPrimaryContainer}
        />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => handleDeleteItem(item.id)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <MaterialIcons name="delete-outline" size={20} color={theme.error} />
      </TouchableOpacity>
    </View>
  );

  const renderFreshItem = (item: PantryItem, index: number) => (
    <View key={item.id} style={styles.freshCard}>
      <View style={styles.freshHeader}>
        <Text style={[styles.freshName, { color: theme.onSurface }]}>
          {item.name}
        </Text>
        {renderStepper(item)}
      </View>
      <Image
        source={{ uri: freshImageFor(index, item.id) }}
        style={styles.freshImage}
        resizeMode="cover"
      />
    </View>
  );

  const renderStapleItem = (item: PantryItem) => (
    <View
      key={item.id}
      style={[
        styles.stapleCard,
        {
          backgroundColor: theme.surfaceContainerLowest,
          borderColor: theme.outlineVariant + "1A",
        },
      ]}
    >
      <View style={{ flex: 1 }}>
        <Text style={[styles.stapleName, { color: theme.onSurface }]}>
          {item.name}
        </Text>
        <Text style={[styles.stapleSub, { color: theme.secondary }]}>
          {item.quantity != null
            ? `${item.quantity}${item.unit ? ` ${item.unit}` : ""}`
            : "Remaining: 60%"}
        </Text>
      </View>
      <View style={styles.stapleBtns}>
        <TouchableOpacity
          style={styles.stapleIconBtn}
          activeOpacity={0.7}
          onPress={() => handleAdjustQuantity(item.id, -1)}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <MaterialIcons
            name="remove"
            size={22}
            color={theme.onSurfaceVariant}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.stapleIconBtn}
          activeOpacity={0.7}
          onPress={() => handleAdjustQuantity(item.id, 1)}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <MaterialIcons
            name="add"
            size={22}
            color={theme.onSurfaceVariant}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.stapleIconBtn}
          onPress={() => handleDeleteItem(item.id)}
          activeOpacity={0.7}
        >
          <MaterialIcons name="delete-outline" size={20} color={theme.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSpicesGrid = () => (
    <View style={styles.spicesGrid}>
      {SPICE_PLACEHOLDERS.map((spice) => (
        <View
          key={spice.name}
          style={[
            styles.spiceTile,
            { backgroundColor: theme.surfaceContainer },
          ]}
        >
          <MaterialIcons name={spice.icon} size={32} color={theme.primary} />
          <Text style={[styles.spiceName, { color: theme.onSurface }]}>
            {spice.name}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderAddRow = () => {
    if (addingVisible) {
      return (
        <View
          style={[styles.addInputWrap, { borderColor: theme.outlineVariant }]}
        >
          <TextInput
            style={[styles.addInput, { color: theme.onSurface }]}
            placeholder="Add ingredient..."
            placeholderTextColor={theme.onSurfaceVariant}
            value={newItem}
            onChangeText={setNewItem}
            onSubmitEditing={handleAddItem}
            returnKeyType="done"
            autoFocus
          />
          <TouchableOpacity
            style={[
              styles.addConfirmBtn,
              {
                backgroundColor: newItem.trim()
                  ? theme.primaryContainer
                  : theme.surfaceContainer,
              },
            ]}
            onPress={handleAddItem}
            disabled={!newItem.trim() || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator
                size="small"
                color={theme.onPrimaryContainer}
              />
            ) : (
              <MaterialIcons
                name="check"
                size={20}
                color={
                  newItem.trim()
                    ? theme.onPrimaryContainer
                    : theme.onSurfaceVariant
                }
              />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setAddingVisible(false);
              setNewItem("");
            }}
            style={{ padding: spacing.sm }}
          >
            <MaterialIcons
              name="close"
              size={20}
              color={theme.onSurfaceVariant}
            />
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <TouchableOpacity
        style={[styles.addRow, { borderColor: theme.outlineVariant }]}
        onPress={() => setAddingVisible(true)}
        activeOpacity={0.7}
      >
        <MaterialIcons name="add" size={20} color={theme.onSurfaceVariant} />
        <Text style={[styles.addRowText, { color: theme.onSurfaceVariant }]}>
          Add New Spice
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <TopBar title="Pantry" showBack onBackPress={handleBack} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: topBarHeight + spacing.lg,
            paddingBottom: 140 + insets.bottom,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.maxWidthWrap}>
          {renderHero()}
          {renderBento()}
          {renderRealSuggestions()}

          {/* Fresh */}
          {freshItems.length > 0 && (
            <View style={styles.sectionBlock}>
              {renderSectionHeader("Fresh", freshItems.length)}
              <View style={styles.freshList}>
                {freshItems.map((item, idx) => renderFreshItem(item, idx))}
              </View>
            </View>
          )}

          {/* Pantry Staples */}
          {pantryStaples.length > 0 && (
            <View style={styles.sectionBlock}>
              {renderSectionHeader("Pantry Staples", pantryStaples.length)}
              <View style={styles.stapleList}>
                {pantryStaples.map(renderStapleItem)}
              </View>
            </View>
          )}

          {/* Empty state */}
          {items.length === 0 && (
            <View style={styles.emptyWrap}>
              <View
                style={[
                  styles.emptyIcon,
                  { backgroundColor: theme.surfaceContainer },
                ]}
              >
                <MaterialIcons
                  name="kitchen"
                  size={40}
                  color={theme.onSurfaceVariant}
                />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.onSurface }]}>
                Your pantry is empty
              </Text>
              <Text
                style={[styles.emptyDesc, { color: theme.onSurfaceVariant }]}
              >
                Add ingredients to get recipe suggestions
              </Text>
            </View>
          )}

          {/* Spices */}
          <View style={styles.sectionBlock}>
            {renderSectionHeader("Spices", SPICE_PLACEHOLDERS.length)}
            {renderSpicesGrid()}
            {renderAddRow()}
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity
        style={[
          styles.fab,
          {
            backgroundColor: theme.tertiary,
            bottom: 100 + insets.bottom,
          },
        ]}
        activeOpacity={0.85}
        onPress={() => setAddingVisible(true)}
        accessibilityLabel="Add pantry ingredient"
      >
        <MaterialIcons name="add" size={30} color={theme.onTertiary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.screenPadding,
  },
  maxWidthWrap: {
    maxWidth: 680,
    width: "100%",
    alignSelf: "center",
  },

  // Hero
  heroSection: {
    marginBottom: spacing.xxl,
  },
  eyebrow: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 10,
    letterSpacing: 4,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
  },
  heroTitle: {
    fontFamily: fonts.serifBold,
    fontSize: 56,
    lineHeight: 62,
    letterSpacing: -1.5,
  },

  // Bento
  bentoCard: {
    borderRadius: borderRadius.xxl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    borderWidth: 1,
    overflow: "hidden",
  },
  bentoBody: {
    flex: 1,
  },
  bentoChip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    marginBottom: spacing.lg,
  },
  bentoChipText: {
    fontFamily: fonts.sansBold,
    fontSize: 10,
    letterSpacing: 1.5,
  },
  bentoHeadline: {
    fontFamily: fonts.serifBold,
    fontSize: 30,
    lineHeight: 38,
    marginBottom: spacing.sm,
    letterSpacing: -0.5,
  },
  bentoBodyText: {
    fontFamily: fonts.sans,
    fontSize: 16,
    lineHeight: 26,
    marginBottom: spacing.lg,
    maxWidth: 420,
  },
  bentoSuggestionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  bentoSuggestionImg: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.md,
    backgroundColor: "#00000010",
  },
  bentoSuggestionTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 15,
    marginBottom: 2,
  },
  bentoSuggestionMeta: {
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 18,
  },
  bentoImageWrap: {
    marginTop: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  bentoImageInner: {
    width: "85%",
    aspectRatio: 1,
    borderRadius: 20,
    overflow: "hidden",
    transform: [{ rotate: "3deg" }],
    ...shadows.lg,
  },
  bentoImage: {
    width: "100%",
    height: "100%",
  },

  // Real suggestions
  errorText: {
    fontFamily: fonts.sans,
    fontSize: 13,
    marginBottom: spacing.md,
  },
  suggestionsWrap: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  suggestionRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    ...shadows.sm,
  },
  suggestionRowTitle: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
    marginBottom: 2,
  },
  suggestionRowDesc: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 18,
  },
  suggestionRowHint: {
    fontFamily: fonts.serifItalic,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  matchPct: {
    fontFamily: fonts.sansBold,
    fontSize: 13,
  },

  // Section blocks
  sectionBlock: {
    marginBottom: spacing.sectionGap,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderBottomWidth: 1,
    paddingBottom: spacing.md,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontFamily: fonts.serif,
    fontSize: 24,
  },
  sectionCount: {
    fontFamily: fonts.sans,
    fontSize: 14,
  },

  // Fresh items
  freshList: {
    gap: spacing.xxl,
  },
  freshCard: {
    width: "100%",
  },
  freshHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  freshName: {
    fontFamily: fonts.sansBold,
    fontSize: 18,
    letterSpacing: -0.3,
  },
  freshImage: {
    width: "100%",
    height: 192,
    borderRadius: borderRadius.lg,
    backgroundColor: "#00000010",
  },

  // Stepper
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperValue: {
    fontFamily: fonts.sansBold,
    fontSize: 13,
    minWidth: 40,
    textAlign: "center",
  },
  deleteBtn: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
  },

  // Staples
  stapleList: {
    gap: spacing.md,
  },
  stapleCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
  },
  stapleName: {
    fontFamily: fonts.sansBold,
    fontSize: 16,
  },
  stapleSub: {
    fontFamily: fonts.sans,
    fontSize: 12,
    marginTop: 2,
  },
  stapleBtns: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  stapleIconBtn: {
    padding: spacing.sm,
  },

  // Spices grid
  spicesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  spiceTile: {
    width: "48%",
    aspectRatio: 1,
    borderRadius: borderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
    gap: spacing.sm,
    flexGrow: 1,
  },
  spiceName: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    textAlign: "center",
  },

  // Add row
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    borderWidth: 2,
    borderStyle: "dashed",
    borderRadius: borderRadius.md,
  },
  addRowText: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    letterSpacing: 0.3,
  },
  addInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  addInput: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 15,
    paddingVertical: spacing.sm,
  },
  addConfirmBtn: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },

  // Empty
  emptyWrap: {
    alignItems: "center",
    paddingVertical: spacing.sectionGap,
    paddingHorizontal: spacing.lg,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontFamily: fonts.serif,
    fontSize: 20,
    marginBottom: spacing.sm,
  },
  emptyDesc: {
    fontFamily: fonts.sans,
    fontSize: 15,
    textAlign: "center",
    marginBottom: spacing.xl,
  },

  // FAB
  fab: {
    position: "absolute",
    right: spacing.xl,
    width: 60,
    height: 60,
    borderRadius: borderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.lg,
    zIndex: 20,
  },
});

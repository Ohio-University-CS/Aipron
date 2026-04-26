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
import { reschedulePantryNotifications } from "../src/services/pantryNotifications";
import {
  borderRadius,
  fonts,
  shadows,
  spacing,
} from "../src/constants/DesignTokens";
import { useThemeColors } from "../src/hooks/useThemeColors";
import { TopBar } from "../src/components/TopBar";
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
  const [newExpiresText, setNewExpiresText] = useState("");
  const [expiresDraftById, setExpiresDraftById] = useState<Record<string, string>>(
    {},
  );
  const [quantityDraftById, setQuantityDraftById] = useState<Record<string, string>>(
    {},
  );
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<PantrySuggestion[]>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const [generatingKey, setGeneratingKey] = useState<string | null>(null);
  const [addingVisible, setAddingVisible] = useState(false);

  const sortByName = useCallback((list: PantryItem[]) => {
    return [...list].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
    );
  }, []);

  const getDaysLeft = useCallback((item: PantryItem): number | null => {
    if (!item.expiresAt) return null;
    const exp = new Date(item.expiresAt);
    if (Number.isNaN(exp.getTime())) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    exp.setHours(0, 0, 0, 0);
    return Math.ceil((exp.getTime() - today.getTime()) / 86400000);
  }, []);

  const getExpiryBadge = useCallback((item: PantryItem) => {
    const daysLeft = getDaysLeft(item);
    if (daysLeft == null) return null;
    if (daysLeft < 0) {
      return { label: "Expired", tone: "expired" as const };
    }
    if (daysLeft <= 3) {
      if (daysLeft === 0) return { label: "Expires today", tone: "soon" as const };
      if (daysLeft === 1) return { label: "Expires in 1 day", tone: "soon" as const };
      return { label: `Expires in ${daysLeft} days`, tone: "soon" as const };
    }
    return null;
  }, [getDaysLeft]);

  useEffect(() => {
    loadPantry();
  }, []);

  const normalizePantryItem = useCallback((raw: any): PantryItem => {
    const expiresRaw = raw?.expires_at ?? raw?.expiresAt;
    const expiresAt =
      typeof expiresRaw === "string" || expiresRaw instanceof Date
        ? new Date(expiresRaw)
        : undefined;
    return {
      id: String(raw?.id ?? ""),
      name: String(raw?.name ?? ""),
      quantity:
        raw?.quantity == null
          ? 1
          : typeof raw.quantity === "number"
            ? raw.quantity
            : Number(raw.quantity),
      unit: typeof raw?.unit === "string" ? raw.unit : undefined,
      expiresAt: expiresAt && !Number.isNaN(expiresAt.getTime()) ? expiresAt : undefined,
    };
  }, []);

  const loadPantry = async () => {
    try {
      const data = await pantryApi.getAll();
      const normalized = Array.isArray(data) ? data.map(normalizePantryItem) : [];
      const sorted = sortByName(normalized);
      setItems(sorted);
      // Keep notifications in sync with server state.
      reschedulePantryNotifications(sorted).catch(() => {});
    } catch (error) {
      console.error("Failed to load pantry:", error);
    }
  };

  const parseExpiresInput = (text: string): Date | undefined => {
    const t = text.trim();
    if (!t) return undefined;
    // Accept YYYY-MM-DD (recommended)
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t);
    if (!m) return undefined;
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return undefined;
    const dt = new Date(y, mo - 1, d);
    if (Number.isNaN(dt.getTime())) return undefined;
    // normalize to local date (midnight)
    dt.setHours(0, 0, 0, 0);
    return dt;
  };

  const parseQuantityInput = (text: string): number | undefined => {
    const t = text.trim();
    if (!t) return undefined;
    const n = Number(t);
    if (!Number.isFinite(n)) return undefined;
    if (n < 0) return 0;
    return n;
  };

  const getExpiresText = useCallback((item: PantryItem) => {
    if (expiresDraftById[item.id] != null) return expiresDraftById[item.id];
    return item.expiresAt ? item.expiresAt.toISOString().slice(0, 10) : "";
  }, [expiresDraftById]);

  const getQuantityText = useCallback((item: PantryItem) => {
    if (quantityDraftById[item.id] != null) return quantityDraftById[item.id];
    const q = typeof item.quantity === "number" ? item.quantity : 1;
    return String(q);
  }, [quantityDraftById]);

  const handleSetQuantity = async (id: string, qtyText: string) => {
    const parsed = parseQuantityInput(qtyText);
    if (parsed == null) return;
    try {
      const updated = await pantryApi.update(id, { quantity: parsed });
      const normalized = normalizePantryItem(updated);
      setItems((prev) => {
        const next = sortByName(
          prev.map((i) => (i.id === id ? { ...i, quantity: normalized.quantity } : i)),
        );
        return next;
      });
    } catch (error) {
      console.error("Failed to update quantity:", error);
    }
  };

  const commitQuantityEdit = async (item: PantryItem) => {
    const draft = (quantityDraftById[item.id] ?? "").trim();
    const current = String(typeof item.quantity === "number" ? item.quantity : 1);

    if (draft === current) return;

    const parsed = parseQuantityInput(draft);
    if (parsed == null) {
      // Revert invalid edits.
      setQuantityDraftById((prev) => ({ ...prev, [item.id]: current }));
      return;
    }

    await handleSetQuantity(item.id, String(parsed));
    setQuantityDraftById((prev) => {
      const next = { ...prev };
      delete next[item.id];
      return next;
    });
  };

  const commitExpirationEdit = async (item: PantryItem) => {
    const draft = (expiresDraftById[item.id] ?? "").trim();
    const current = item.expiresAt ? item.expiresAt.toISOString().slice(0, 10) : "";

    // If unchanged, no-op.
    if (draft === current) return;

    // Empty string clears the expiration date.
    if (!draft) {
      await handleSetExpiration(item.id, "");
      setExpiresDraftById((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
      return;
    }

    // Invalid format: revert to current value.
    const parsed = parseExpiresInput(draft);
    if (!parsed) {
      setExpiresDraftById((prev) => ({ ...prev, [item.id]: current }));
      return;
    }

    await handleSetExpiration(item.id, draft);
    setExpiresDraftById((prev) => {
      const next = { ...prev };
      delete next[item.id];
      return next;
    });
  };

  const handleAddItem = async () => {
    if (!newItem.trim()) return;

    setIsLoading(true);
    try {
      const expiresAt = parseExpiresInput(newExpiresText);
      const created = await pantryApi.add({ name: newItem.trim(), quantity: 1, expiresAt });
      const normalized = normalizePantryItem(created);
      setItems((prev) => sortByName([...prev, normalized]));
      setNewItem("");
      setNewExpiresText("");
      setAddingVisible(false);
      reschedulePantryNotifications(sortByName([...items, normalized])).catch(() => {});
    } catch (error) {
      console.error("Failed to add item:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await pantryApi.delete(id);
      setItems((prev) => {
        const next = prev.filter((item) => item.id !== id);
        reschedulePantryNotifications(next).catch(() => {});
        return next;
      });
    } catch (error) {
      console.error("Failed to delete item:", error);
    }
  };

  const handleSetExpiration = async (id: string, expiresText: string) => {
    const expiresAt = parseExpiresInput(expiresText);
    try {
      const updated = await pantryApi.update(id, { expiresAt: expiresAt ?? null });
      const normalized = normalizePantryItem(updated);
      setItems((prev) => {
        const next = sortByName(
          prev.map((i) => (i.id === id ? { ...i, expiresAt: normalized.expiresAt } : i)),
        );
        reschedulePantryNotifications(next).catch(() => {});
        return next;
      });
    } catch (error) {
      console.error("Failed to update expiration:", error);
    }
  };

  const handleAdjustQuantity = async (id: string, delta: number) => {
    let nextQty = 1;
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const current = typeof item.quantity === "number" ? item.quantity : 1;
        nextQty = Math.max(0, current + delta);
        return { ...item, quantity: nextQty };
      }),
    );
    // Best-effort persist.
    await handleSetQuantity(id, String(nextQty));
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

  const { freshItems, expiringItems, expiredItems } = useMemo(() => {
    const fresh: PantryItem[] = [];
    const expiring: PantryItem[] = [];
    const expired: PantryItem[] = [];

    for (const item of items) {
      const daysLeft = getDaysLeft(item);
      if (daysLeft == null) {
        fresh.push(item);
      } else if (daysLeft < 0) {
        expired.push(item);
      } else if (daysLeft <= 3) {
        expiring.push(item);
      } else {
        fresh.push(item);
      }
    }

    return {
      freshItems: sortByName(fresh),
      expiringItems: sortByName(expiring),
      expiredItems: sortByName(expired),
    };
  }, [getDaysLeft, items, sortByName]);

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
          Based on your ingredients, we suggest:
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
          <View
            style={[
              styles.bentoSuggestionIcon,
              { backgroundColor: theme.surfaceContainer },
            ]}
          >
            <MaterialIcons
              name="restaurant-menu"
              size={22}
              color={theme.onSurfaceVariant}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.bentoSuggestionTitle,
                { color: theme.onSurface },
              ]}
            >
              Tap to get suggestions
            </Text>
            <Text
              style={[
                styles.bentoSuggestionMeta,
                { color: theme.onSurfaceVariant },
              ]}
            >
              We’ll generate recipes from your pantry
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
      <View
        style={[
          styles.stepperValuePill,
          { backgroundColor: theme.surfaceContainer },
        ]}
      >
        <TextInput
          style={[styles.stepperValueInput, { color: theme.onSurface }]}
          value={getQuantityText(item)}
          onChangeText={(t) => setQuantityDraftById((prev) => ({ ...prev, [item.id]: t }))}
          onBlur={() => commitQuantityEdit(item)}
          onSubmitEditing={() => commitQuantityEdit(item)}
          keyboardType="numeric"
          returnKeyType="done"
          autoCorrect={false}
          autoCapitalize="none"
        />
      </View>
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
        style={[styles.stepperBtn, { backgroundColor: theme.surfaceContainer }]}
        onPress={() => handleDeleteItem(item.id)}
        activeOpacity={0.8}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityLabel={`Delete ${item.name}`}
      >
        <MaterialIcons name="delete-outline" size={18} color={theme.error} />
      </TouchableOpacity>
    </View>
  );

  const renderPantryItemCard = (item: PantryItem) => (
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
      <View style={styles.cardTopRow}>
        <View style={styles.cardHeaderLeft}>
          <Text style={[styles.stapleName, { color: theme.onSurface }]}>
            {item.name}
          </Text>
          {(() => {
            const badge = getExpiryBadge(item);
            if (!badge) return null;
            const bg =
              badge.tone === "expired"
                ? theme.errorContainer
                : theme.tertiaryContainer;
            const fg =
              badge.tone === "expired" ? theme.onSurface : theme.onTertiaryContainer;
            return (
              <View style={[styles.badge, { backgroundColor: bg }]}>
                <Text style={[styles.badgeText, { color: fg }]}>
                  {badge.label}
                </Text>
              </View>
            );
          })()}
        </View>
        {renderStepper(item)}
      </View>

      <View style={{ marginTop: spacing.sm }}>
        <TextInput
          style={[
            styles.expInput,
            {
              color: theme.onSurface,
              borderColor: theme.outlineVariant + "66",
              backgroundColor: theme.surfaceContainerLowest,
            },
          ]}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={theme.onSurfaceVariant}
          value={getExpiresText(item)}
          onChangeText={(t) =>
            setExpiresDraftById((prev) => ({ ...prev, [item.id]: t }))
          }
          onBlur={() => commitExpirationEdit(item)}
          onSubmitEditing={() => commitExpirationEdit(item)}
          returnKeyType="done"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
    </View>
  );

  const renderStapleItem = (item: PantryItem) => renderPantryItemCard(item);

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
          <View style={{ flex: 1 }}>
            <TextInput
              style={[styles.addInput, { color: theme.onSurface }]}
              placeholder="Add ingredient..."
              placeholderTextColor={theme.onSurfaceVariant}
              value={newItem}
              onChangeText={setNewItem}
              returnKeyType="next"
              autoFocus
            />
            <Text style={[styles.addHelper, { color: theme.onSurfaceVariant }]}>
              Expiration (optional)
            </Text>
            <TextInput
              style={[styles.addInput, { color: theme.onSurface }]}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.onSurfaceVariant}
              value={newExpiresText}
              onChangeText={setNewExpiresText}
              onSubmitEditing={handleAddItem}
              returnKeyType="done"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
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
              setNewExpiresText("");
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

          {/* Expiring */}
          {expiringItems.length > 0 && (
            <View style={styles.sectionBlock}>
              {renderSectionHeader("Expiring", expiringItems.length)}
              <View style={styles.stapleList}>
                {expiringItems.map(renderStapleItem)}
              </View>
            </View>
          )}

          {/* Expired */}
          {expiredItems.length > 0 && (
            <View style={styles.sectionBlock}>
              {renderSectionHeader("Expired", expiredItems.length)}
              <View style={styles.stapleList}>
                {expiredItems.map(renderStapleItem)}
              </View>
            </View>
          )}

          {/* Fresh */}
          {freshItems.length > 0 && (
            <View style={styles.sectionBlock}>
              {renderSectionHeader("Fresh", freshItems.length)}
              <View style={styles.stapleList}>{freshItems.map(renderStapleItem)}</View>
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
  bentoSuggestionIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
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
  cardHeaderLeft: {
    flex: 1,
    minWidth: 0,
    paddingRight: spacing.lg,
    gap: spacing.sm,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    alignSelf: "flex-start",
  },
  badgeText: {
    fontFamily: fonts.sansBold,
    fontSize: 11,
  },

  // Stepper
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs + 2,
    flexShrink: 0,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperValueInput: {
    fontFamily: fonts.sansBold,
    fontSize: 13,
    textAlign: "center",
    paddingVertical: 0,
    paddingHorizontal: 0,
    width: 22,
    maxWidth: 22,
    height: 18,
  },
  stepperValuePill: {
    width: 44,
    paddingHorizontal: 0,
    height: 32,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  // Staples
  stapleList: {
    gap: spacing.md,
  },
  stapleCard: {
    flexDirection: "column",
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  stapleName: {
    fontFamily: fonts.sansBold,
    fontSize: 16,
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
  addHelper: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    marginTop: 2,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  expLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    marginBottom: 6,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  expInput: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontFamily: fonts.sans,
    fontSize: 13,
    width: "100%",
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

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  View,
  StyleSheet,
  ScrollView,
  Text,
  KeyboardAvoidingView,
  Platform,
  Image,
  TouchableOpacity,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "../../src/components/LinearGradient";
import { ChatComposer } from "../../src/components/ChatComposer";
import { ChatMessage } from "../../src/components/ChatMessage";
import { RecipeCard } from "../../src/components/RecipeCard";
import { TopBar } from "../../src/components/TopBar";
import { pantryApi, recipeApi } from "../../src/services/api";
import { useRealtimeVoice } from "../../src/hooks/useRealtimeVoice";
import {
  spacing,
  fonts,
  borderRadius,
  shadows,
} from "../../src/constants/DesignTokens";
import { useThemeColors } from "../../src/hooks/useThemeColors";
import {
  StitchImages,
  pickFallbackPhoto,
  recipeImageFallbackSeed,
} from "../../src/constants/StitchImages";
import { localRecipeHeroUris } from "../../src/constants/localRecipeHeroImages";
import { Recipe } from "@aipron/shared";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "../../src/store/useAuthStore";
import { useUserPrefsStore } from "../../src/store/useUserPrefsStore";
import { pickPreferredRecipe } from "../../src/utils/dietaryMatch";

interface ChatEntry {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  recipe?: Recipe;
}

function getGreeting(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function HomeScreen() {
  const router = useRouter();
  const theme = useThemeColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();

  const scrollViewRef = useRef<ScrollView>(null);
  const [chatHistory, setChatHistory] = useState<ChatEntry[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const [suggested, setSuggested] = useState<Recipe | null>(null);
  const [pantryCount, setPantryCount] = useState<number | null>(null);

  const firstName =
    ((user?.user_metadata as any)?.name as string | undefined)?.split(" ")[0] ||
    user?.email?.split("@")[0] ||
    "chef";
  const greeting = getGreeting(new Date().getHours());
  const dietaryTags = useUserPrefsStore((s) => s.dietaryPreferences);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // Prefer the user's saved recipes, then fall back to the global catalog.
      // In either case, try to surface a recipe that matches the user's active
      // dietary preferences so the "Suggested" tile never contradicts them.
      try {
        const saved = await recipeApi.getSaved();
        const pick = pickPreferredRecipe(saved, dietaryTags);
        if (!cancelled && pick) {
          setSuggested(pick);
          return;
        }
      } catch {
        // ignore — not signed in or no saved
      }
      try {
        const all = await recipeApi.getAll();
        const pick = pickPreferredRecipe(all, dietaryTags);
        if (!cancelled && pick) {
          setSuggested(pick);
        }
      } catch {
        // ignore
      }
    })();

    (async () => {
      try {
        const items = await pantryApi.getAll();
        if (!cancelled) {
          setPantryCount(Array.isArray(items) ? items.length : 0);
        }
      } catch {
        if (!cancelled) setPantryCount(null);
      }
    })();

    return () => {
      cancelled = true;
    };
    // Re-pick the suggested recipe whenever the user's dietary preferences
    // change, so toggling a chip in settings immediately updates the home tile.
  }, [dietaryTags]);

  const handleSend = async (message: string) => {
    const userMessage: ChatEntry = {
      id: Date.now().toString(),
      role: "user",
      content: message,
      timestamp: new Date(),
    };

    setChatHistory((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const recipe = await recipeApi.generate(message);
      setRecipes((prev) => [recipe, ...prev]);

      const assistantMessage: ChatEntry = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `I've created a recipe for "${recipe.title}". Tap the card below to start cooking!`,
        timestamp: new Date(),
        recipe,
      };

      setChatHistory((prev) => [...prev, assistantMessage]);

      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error("Failed to generate recipe:", error);
      const errorMessage: ChatEntry = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I couldn't generate a recipe. Please try again.",
        timestamp: new Date(),
      };
      setChatHistory((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoicePress = () => {
    setIsRecording(!isRecording);
  };

  const hasChatContent = chatHistory.length > 0 || recipes.length > 0;

  const clearChat = useCallback(() => {
    setChatHistory([]);
    setRecipes([]);
  }, []);

  /**
   * Cross-platform confirm. RN's `Alert` does not render on web, so we fall
   * back to the browser `window.confirm` there.
   */
  const handleClearChatPress = useCallback(() => {
    if (!hasChatContent) return;
    const title = "Clear chat";
    const message = "This will delete every message and recipe from this chat. This can't be undone.";
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.confirm(`${title}\n\n${message}`)) {
        clearChat();
      }
      return;
    }
    Alert.alert(title, message, [
      { text: "Cancel", style: "cancel" },
      { text: "Clear", style: "destructive", onPress: clearChat },
    ]);
  }, [hasChatContent, clearChat]);

  const liveVoiceInstructions = useMemo(() => {
    const base =
      "You are Chef Aipron, a warm and concise cooking assistant. Help with recipes, substitutions, techniques, and meal ideas. Keep spoken replies brief and friendly.";
    const prefsLine =
      dietaryTags.length > 0
        ? `\n\nThe user's current dietary preferences are: ${dietaryTags.join(", ")}. Always honor them when suggesting recipes, substitutions, or ingredients. If a request would violate these preferences, propose a compliant alternative.`
        : "\n\nThe user has not set any dietary preferences yet; treat them as unrestricted unless they say otherwise.";
    return base + prefsLine;
  }, [dietaryTags]);

  const appendLiveTranscript = useCallback(
    (text: string, role: "user" | "assistant") => {
      const entry: ChatEntry = {
        id: `${Date.now()}-${role}-${Math.random().toString(36).slice(2, 8)}`,
        role,
        content: text,
        timestamp: new Date(),
      };
      setChatHistory((prev) => [...prev, entry]);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    },
    []
  );

  const handleLiveVoiceError = useCallback((err: Error) => {
    console.warn("Live voice:", err.message);
  }, []);

  const liveVoice = useRealtimeVoice({
    instructions: liveVoiceInstructions,
    onTranscript: appendLiveTranscript,
    onError: handleLiveVoiceError,
  });

  const disconnectLiveVoiceRef = useRef(liveVoice.disconnect);
  disconnectLiveVoiceRef.current = liveVoice.disconnect;

  useEffect(() => {
    return () => {
      disconnectLiveVoiceRef.current();
    };
  }, []);

  // Keep the live session's instructions in sync with the user's preferences.
  // If they toggle a dietary tag mid-conversation, push the updated prompt so
  // Chef Aipron respects it on the very next turn.
  useEffect(() => {
    if (!liveVoice.isConnected) return;
    liveVoice.updateInstructions(liveVoiceInstructions);
  }, [liveVoice, liveVoiceInstructions]);

  const handleLiveVoicePress = () => {
    if (liveVoice.isConnected || liveVoice.isConnecting) {
      liveVoice.disconnect();
    } else {
      liveVoice.connect();
    }
  };

  const liveVoiceStatus = liveVoice.error
    ? liveVoice.error
    : liveVoice.isConnecting
    ? "Connecting to Chef Aipron..."
    : liveVoice.isSpeaking
    ? "Chef Aipron is speaking..."
    : liveVoice.isListening
    ? "Listening..."
    : liveVoice.isConnected
    ? "Live voice connected — just talk"
    : null;

  const topBarClearance = insets.top + 56 + spacing.md;
  const composerClearance = 96 + insets.bottom + spacing.lg;
  const showHome = chatHistory.length === 0;

  const openSuggested = () => {
    if (suggested?.id) {
      router.push(`/recipe/${suggested.id}`);
    }
  };

  const openPantry = () => {
    router.push("/pantry");
  };

  const suggestedImage =
    suggested?.heroImage ||
    (suggested
      ? pickFallbackPhoto(recipeImageFallbackSeed(suggested))
      : localRecipeHeroUris.pancakes);

  const suggestedTitle = suggested?.title ?? "Lemon Ricotta Pancakes";
  const suggestedMeta = suggested
    ? `${suggested.totalTime ?? (suggested.prepTime + suggested.cookTime)} min · ${suggested.servings} servings`
    : "A sunny Sunday brunch favorite";

  const renderHomeDashboard = () => (
    <View style={styles.homeWrap}>
      <View style={styles.greetingBlock}>
        <Text style={[styles.eyebrow, { color: theme.tertiary }]}>
          TODAY
        </Text>
        <Text style={[styles.greetingTitle, { color: theme.onSurface }]}>
          {greeting},{"\n"}
          <Text style={{ fontFamily: fonts.serifItalic }}>{firstName}</Text>
        </Text>
        <Text style={[styles.greetingSub, { color: theme.onSurfaceVariant }]}>
          What should we cook today? Tap a tile or just ask below.
        </Text>
      </View>

      <View style={styles.gridRow}>
        {/* SUGGESTED RECIPE TILE */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={openSuggested}
          disabled={!suggested?.id}
          style={[
            styles.tile,
            { backgroundColor: theme.surfaceContainerLow },
          ]}
        >
          <View style={styles.tileImageWrap}>
            <Image
              source={{ uri: suggestedImage }}
              style={styles.tileImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.45)"]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0.5, y: 0.45 }}
              end={{ x: 0.5, y: 1 }}
            />
            <View
              style={[
                styles.tilePill,
                { backgroundColor: "rgba(255,255,255,0.92)" },
              ]}
            >
              <MaterialIcons name="auto-awesome" size={10} color={theme.tertiary} />
              <Text style={[styles.tilePillText, { color: theme.onSurface }]}>
                SUGGESTED
              </Text>
            </View>
          </View>
          <View style={styles.tileBody}>
            <Text
              style={[styles.tileTitle, { color: theme.onSurface }]}
              numberOfLines={2}
            >
              {suggestedTitle}
            </Text>
            <Text
              style={[styles.tileMeta, { color: theme.onSurfaceVariant }]}
              numberOfLines={1}
            >
              {suggestedMeta}
            </Text>
            <View style={styles.tileFooter}>
              <Text style={[styles.tileCta, { color: theme.primary }]}>
                {suggested?.id ? "View recipe" : "Ask Aipron"}
              </Text>
              <MaterialIcons
                name="arrow-forward"
                size={14}
                color={theme.primary}
              />
            </View>
          </View>
        </TouchableOpacity>

        {/* PANTRY TILE */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={openPantry}
          style={[
            styles.tile,
            { backgroundColor: theme.surfaceContainerLow },
          ]}
        >
          <View style={styles.tileImageWrap}>
            <Image
              source={{ uri: StitchImages.pantryHeroLemons }}
              style={styles.tileImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.45)"]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0.5, y: 0.45 }}
              end={{ x: 0.5, y: 1 }}
            />
            <View
              style={[
                styles.tilePill,
                { backgroundColor: "rgba(255,255,255,0.92)" },
              ]}
            >
              <MaterialIcons name="kitchen" size={10} color={theme.primary} />
              <Text style={[styles.tilePillText, { color: theme.onSurface }]}>
                PANTRY
              </Text>
            </View>
          </View>
          <View style={styles.tileBody}>
            <Text
              style={[styles.tileTitle, { color: theme.onSurface }]}
              numberOfLines={2}
            >
              Your Pantry
            </Text>
            <Text
              style={[styles.tileMeta, { color: theme.onSurfaceVariant }]}
              numberOfLines={1}
            >
              {pantryCount === null
                ? "Tap to check what's in stock"
                : pantryCount === 0
                ? "Empty — add your first ingredient"
                : `${pantryCount} item${pantryCount === 1 ? "" : "s"} in stock`}
            </Text>
            <View style={styles.tileFooter}>
              <Text style={[styles.tileCta, { color: theme.primary }]}>
                Open pantry
              </Text>
              <MaterialIcons
                name="arrow-forward"
                size={14}
                color={theme.primary}
              />
            </View>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.askLead}>
        <View
          style={[
            styles.aiAvatar,
            { backgroundColor: theme.primaryContainer },
          ]}
        >
          <MaterialIcons name="auto-awesome" size={14} color={theme.primary} />
        </View>
        <Text style={[styles.askLeadText, { color: theme.onSurfaceVariant }]}>
          Or ask me anything — "What can I make with chicken and rice?"
        </Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: theme.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={insets.bottom}
    >
      <TopBar
        transparent={false}
        showAvatar={!hasChatContent}
        rightIcon={hasChatContent ? "delete-outline" : undefined}
        onRightPress={hasChatContent ? handleClearChatPress : undefined}
      />

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: topBarClearance,
            paddingBottom: composerClearance,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      >
        <View style={styles.maxWidthWrap}>
          {showHome && renderHomeDashboard()}

          {chatHistory.map((entry) => (
            <ChatMessage
              key={entry.id}
              role={entry.role}
              content={entry.content}
              timestamp={entry.timestamp}
            />
          ))}

          {isLoading && (
            <View style={styles.loadingContainer}>
              <View
                style={[
                  styles.loadingDot,
                  { backgroundColor: theme.primaryContainer },
                ]}
              />
              <Text
                style={[styles.loadingText, { color: theme.onSurfaceVariant }]}
              >
                Creating your recipe...
              </Text>
            </View>
          )}

          {recipes.length > 0 && (
            <View style={styles.recipesContainer}>
              <Text style={[styles.recipesTitle, { color: theme.onSurface }]}>
                Your Recipes
              </Text>
              {recipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onPress={() => {
                    if (recipe.id) {
                      router.push(`/cooking/${recipe.id}`);
                    }
                  }}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {liveVoiceStatus ? (
        <View
          style={[
            styles.liveStatus,
            { bottom: 90 + 56, backgroundColor: theme.surfaceContainerLowest + "E6" },
            liveVoice.error && { borderColor: theme.error + "55" },
          ]}
          pointerEvents="none"
        >
          <View
            style={[
              styles.liveStatusDot,
              {
                backgroundColor: liveVoice.error
                  ? theme.error
                  : liveVoice.isSpeaking
                  ? theme.primary
                  : liveVoice.isListening
                  ? theme.tertiary
                  : theme.primaryContainer,
              },
            ]}
          />
          <Text
            style={[styles.liveStatusText, { color: theme.onSurfaceVariant }]}
            numberOfLines={1}
          >
            {liveVoiceStatus}
          </Text>
        </View>
      ) : null}

      <ChatComposer
        onSend={handleSend}
        onVoicePress={handleVoicePress}
        isRecording={isRecording}
        onLiveVoicePress={handleLiveVoicePress}
        liveVoiceActive={liveVoice.isConnected}
        liveVoiceConnecting={liveVoice.isConnecting}
        isLoading={isLoading}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.screenPadding,
  },
  maxWidthWrap: {
    maxWidth: 680,
    width: "100%",
    alignSelf: "center",
  },

  // Home dashboard
  homeWrap: {
    marginBottom: spacing.xl,
  },
  greetingBlock: {
    paddingTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  eyebrow: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 10,
    letterSpacing: 4,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
  },
  greetingTitle: {
    fontFamily: fonts.serif,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.5,
    marginBottom: spacing.sm,
  },
  greetingSub: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.xs,
  },

  // Grid of tiles
  gridRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  tile: {
    flex: 1,
    borderRadius: 20,
    overflow: "hidden",
    ...shadows.sm,
  },
  tileImageWrap: {
    width: "100%",
    aspectRatio: 4 / 3,
    position: "relative",
  },
  tileImage: {
    width: "100%",
    height: "100%",
  },
  tilePill: {
    position: "absolute",
    top: spacing.sm,
    left: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  tilePillText: {
    fontFamily: fonts.sansBold,
    fontSize: 9,
    letterSpacing: 1.5,
  },
  tileBody: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    gap: 2,
  },
  tileTitle: {
    fontFamily: fonts.serifBold,
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  tileMeta: {
    fontFamily: fonts.sans,
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
  tileFooter: {
    marginTop: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  tileCta: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
  },

  // Ask lead-in
  askLead: {
    marginTop: spacing.xxl,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  askLeadText: {
    flex: 1,
    fontFamily: fonts.serifItalic,
    fontSize: 14,
    lineHeight: 20,
  },

  // Loading / recipes
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  loadingText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    fontStyle: "italic",
  },
  recipesContainer: {
    marginTop: spacing.xxl,
    gap: spacing.md,
  },
  recipesTitle: {
    fontFamily: fonts.serif,
    fontSize: 22,
    lineHeight: 28,
  },

  liveStatus: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  liveStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  liveStatusText: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 16,
  },
});

import React, { useEffect, useRef, useState } from "react";
import {
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
import { LinearGradient } from "expo-linear-gradient";
import { ChatComposer } from "../../src/components/ChatComposer";
import { ChatMessage } from "../../src/components/ChatMessage";
import { RecipeCard } from "../../src/components/RecipeCard";
import { TopBar } from "../../src/components/TopBar";
import { pantryApi, recipeApi } from "../../src/services/api";
import {
  spacing,
  fonts,
  borderRadius,
  shadows,
} from "../../src/constants/DesignTokens";
import { useThemeColors } from "../../src/hooks/useThemeColors";
import { StitchImages, pickFallbackPhoto } from "../../src/constants/StitchImages";
import { Recipe } from "@aipron/shared";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "../../src/store/useAuthStore";

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

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const saved = await recipeApi.getSaved();
        if (!cancelled && saved.length > 0) {
          setSuggested(saved[0]);
          return;
        }
      } catch {
        // ignore — not signed in or no saved
      }
      try {
        const all = await recipeApi.getAll();
        if (!cancelled && all.length > 0) {
          setSuggested(all[0]);
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
  }, []);

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
    (suggested ? pickFallbackPhoto(suggested.id ?? suggested.title) : StitchImages.chatFeaturedDish);

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
                {suggested?.id ? "View recipe" : "Ask AIpron"}
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
      <TopBar transparent={false} />

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

      <ChatComposer
        onSend={handleSend}
        onVoicePress={handleVoicePress}
        isRecording={isRecording}
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
});

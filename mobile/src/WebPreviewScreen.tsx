import React, { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Recipe } from "@aipron/shared";
import { RecipeCard } from "./components/RecipeCard";
import { ChatMessage } from "./components/ChatMessage";
import { filterLocalCatalogRecipes, LOCAL_CATALOG_RECIPES } from "./data/localCatalog";
import { useLocalCatalogSavedIds } from "./hooks/useLocalCatalogSavedIds";
import { recipeApi, chatApi, Conversation } from "./services/api";
import { colors, spacing, typography, borderRadius, shadows } from "./constants/DesignTokens";
import { useThemeColors } from "./hooks/useThemeColors";
import { useWebSpeechToText } from "./hooks/useWebSpeechToText";
import { useSettingsStore } from "./store/useSettingsStore";
import ProfileScreen from "../app/(tabs)/profile";
import LoginScreen from "../app/login";
import SettingsScreen from "../app/settings";
import HelpScreen from "../app/help";
import AboutScreen from "../app/about";
import PantryScreen from "../app/pantry";
import { CookingModeFrame } from "./components/CookingModeFrame";

type MockTab =
  | "home"
  | "search"
  | "pantry"
  | "saved"
  | "profile"
  | "settings"
  | "help"
  | "about"
  | "login"
  | "chef";

const recipe = {
  title: "Classic Spaghetti Carbonara",
  image:
    "https://images.unsplash.com/photo-1633253037289-b1cec78fd209?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
  prepTime: "10 min",
  cookTime: "15 min",
  servings: 4,
  ingredients: [
    { id: "1", name: "Spaghetti pasta", amount: "400g" },
    { id: "2", name: "Pancetta or guanciale, diced", amount: "200g" },
    { id: "3", name: "Large eggs", amount: "4" },
    { id: "4", name: "Pecorino Romano cheese, grated", amount: "100g" },
    { id: "5", name: "Black pepper, freshly ground", amount: "2 tsp" },
    { id: "6", name: "Salt for pasta water", amount: "to taste" },
    { id: "7", name: "Extra virgin olive oil", amount: "1 tbsp" },
  ],
  steps: [
    {
      id: 1,
      instruction:
        "Bring a large pot of salted water to a boil. Add the spaghetti and cook until al dente.",
      duration: "10–12 min",
    },
    {
      id: 2,
      instruction:
        "Heat olive oil in a large pan over medium heat. Add the diced pancetta and cook until crispy and golden brown.",
      duration: "5–7 min",
    },
    {
      id: 3,
      instruction:
        "In a bowl, whisk together the eggs, grated Pecorino Romano, and plenty of freshly ground black pepper.",
    },
    {
      id: 4,
      instruction:
        "Reserve 1 cup of pasta cooking water, then drain the spaghetti. Add the hot pasta to the pan with the pancetta.",
      duration: "1 min",
    },
    {
      id: 5,
      instruction:
        "Remove from heat. Quickly pour the egg mixture over the pasta, tossing continuously. Add reserved pasta water a little at a time to create a creamy sauce.",
      duration: "2–3 min",
    },
    {
      id: 6,
      instruction:
        "Serve immediately with extra Pecorino Romano and black pepper on top. Enjoy your perfect carbonara!",
    },
  ],
};

const HIDE_SCROLLBAR_CSS = `
[data-hide-scrollbar] *::-webkit-scrollbar { display: none !important; }
[data-hide-scrollbar] * { scrollbar-width: none !important; -ms-overflow-style: none !important; }
`;

/** Maps API/network failures to a short user-visible line (devs still see console). */
function chefChatErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    if (!err.response) {
      return "Can't reach the API. Start the backend on port 3001 (or set EXPO_PUBLIC_API_URL to match).";
    }
    const status = err.response.status;
    const data = err.response.data as { error?: string; details?: string } | undefined;
    const serverMsg = [data?.error, data?.details].find((s) => typeof s === "string" && s.trim()) as
      | string
      | undefined;
    if (status === 401) {
      return "Session expired or not signed in. Open Profile and sign in, then try Chef again.";
    }
    if (status === 404) {
      return "That chat no longer exists. Use back, then start a new chat.";
    }
    if (serverMsg && serverMsg.length < 280) {
      return serverMsg;
    }
  }
  if (err instanceof Error && err.message && err.message.length < 200) {
    return err.message;
  }
  return "Sorry, something went wrong. Please try again.";
}

export default function WebPreviewScreen() {
  const isWeb = Platform.OS === "web";
  const insets = useSafeAreaInsets();
  const c = useThemeColors();
  const language = useSettingsStore((s) => s.language);
  const { width: winW, height: winH } = useWindowDimensions();

  useEffect(() => {
    if (typeof document === "undefined") return;
    const style = document.createElement("style");
    style.textContent = HIDE_SCROLLBAR_CSS;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  const [activeTab, setActiveTab] = useState<MockTab>("home");
  const [cookingId, setCookingId] = useState<string | null>(null);
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  const [savedLoading, setSavedLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Recipe[]>(LOCAL_CATALOG_RECIPES);
  const searchSeqRef = useRef(0);
  const { savedIds: localCatalogSavedIds, toggleSave: toggleLocalCatalogSave, reloadSavedIds: reloadLocalCatalogSaved } =
    useLocalCatalogSavedIds();

  const [chefView, setChefView] = useState<"history" | "chat">("history");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [activeConvoId, setActiveConvoId] = useState<string | null>(null);
  const [chefMessages, setChefMessages] = useState<
    { id: string; role: "user" | "assistant"; content: string; timestamp: Date }[]
  >([]);
  const [chefInput, setChefInput] = useState("");
  const [chefLoading, setChefLoading] = useState(false);
  const chefScrollRef = useRef<ScrollView>(null);
  const chefVoiceBaseRef = useRef("");
  const {
    supported: chefVoiceSupported,
    listening: chefVoiceListening,
    startListening: startChefVoiceListening,
    stopListening: stopChefVoiceListening,
  } = useWebSpeechToText();

  const loadSavedRecipes = useCallback(async () => {
    setSavedLoading(true);
    try {
      const list = await recipeApi.getSaved();
      setSavedRecipes(list);
    } catch {
      setSavedRecipes([]);
    } finally {
      setSavedLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "saved") {
      loadSavedRecipes();
    }
  }, [activeTab, loadSavedRecipes]);

  useEffect(() => {
    if (activeTab !== "search") return;

    const q = searchQuery.trim();
    const seq = ++searchSeqRef.current;

    const handle = setTimeout(() => {
      const list = filterLocalCatalogRecipes(LOCAL_CATALOG_RECIPES, q);
      if (seq !== searchSeqRef.current) return;
      setSearchResults(list);
    }, 250);

    return () => clearTimeout(handle);
  }, [activeTab, searchQuery]);

  const loadConversations = useCallback(async () => {
    setConversationsLoading(true);
    try {
      const list = await chatApi.getConversations();
      setConversations(list);
    } catch {
      setConversations([]);
    } finally {
      setConversationsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "chef" && chefView === "history") {
      loadConversations();
    }
  }, [activeTab, chefView, loadConversations]);

  const openConversation = useCallback(async (convoId: string) => {
    setActiveConvoId(convoId);
    setChefMessages([]);
    setChefView("chat");
    try {
      const msgs = await chatApi.getMessages(convoId);
      setChefMessages(
        msgs.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: new Date(m.created_at),
        }))
      );
      setTimeout(() => chefScrollRef.current?.scrollToEnd({ animated: false }), 150);
    } catch {
      setChefMessages([]);
    }
  }, []);

  const startNewChat = useCallback(async () => {
    try {
      const convo = await chatApi.createConversation();
      setActiveConvoId(convo.id);
      setChefMessages([]);
      setChefView("chat");
    } catch {
      setActiveConvoId(null);
      setChefMessages([]);
      setChefView("chat");
    }
  }, []);

  const goBackToHistory = useCallback(() => {
    setChefView("history");
    setActiveConvoId(null);
    setChefMessages([]);
    setChefInput("");
  }, []);

  const handleChefVoicePress = () => {
    if (chefVoiceListening) {
      stopChefVoiceListening();
      return;
    }
    chefVoiceBaseRef.current = chefInput.trim();
    startChefVoiceListening((text, isFinal) => {
      if (isFinal) {
        const next = chefVoiceBaseRef.current
          ? `${chefVoiceBaseRef.current} ${text}`.trim()
          : text.trim();
        chefVoiceBaseRef.current = next;
        setChefInput(next);
      } else {
        setChefInput(
          chefVoiceBaseRef.current
            ? `${chefVoiceBaseRef.current} ${text}`.trim()
            : text
        );
      }
    });
  };

  const handleChefSend = async (text?: string) => {
    const msg = (text ?? chefInput).trim();
    if (!msg || chefLoading) return;

    const userEntry = {
      id: Date.now().toString(),
      role: "user" as const,
      content: msg,
      timestamp: new Date(),
    };
    setChefMessages((prev) => [...prev, userEntry]);
    setChefInput("");
    setChefLoading(true);

    try {
      if (activeConvoId) {
        const reply = await chatApi.sendMessage(activeConvoId, msg, language);
        const assistantEntry = {
          id: reply.id,
          role: "assistant" as const,
          content: reply.content,
          timestamp: new Date(reply.created_at),
        };
        setChefMessages((prev) => [...prev, assistantEntry]);
      } else {
        const history = [...chefMessages, userEntry].map((m) => ({
          role: m.role,
          content: m.content,
        }));
        const replyContent = await chatApi.send(history, language);
        const assistantEntry = {
          id: (Date.now() + 1).toString(),
          role: "assistant" as const,
          content: replyContent,
          timestamp: new Date(),
        };
        setChefMessages((prev) => [...prev, assistantEntry]);
      }
    } catch (err) {
      console.error("Chef chat failed:", err);
      const errorEntry = {
        id: (Date.now() + 1).toString(),
        role: "assistant" as const,
        content: chefChatErrorMessage(err),
        timestamp: new Date(),
      };
      setChefMessages((prev) => [...prev, errorEntry]);
    } finally {
      setChefLoading(false);
      setTimeout(() => chefScrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const formatRelativeTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  const handleUnsave = useCallback(
    async (recipeId: string) => {
      const previous = savedRecipes;
      setSavedRecipes((prev) => prev.filter((r) => r.id !== recipeId));
      try {
        await recipeApi.unsave(recipeId);
      } catch {
        setSavedRecipes(previous);
      }
    },
    [savedRecipes]
  );

  const baseW = 390;
  const baseH = 844;
  const outerPad = spacing.lg * 2;
  const scale = isWeb ? Math.min(1, (winW - outerPad) / baseW, (winH - outerPad) / baseH) : 1;

  return (
    <View style={[styles.root, !isWeb && styles.rootNative]}>
      <View
        style={[
          styles.deviceFrame,
          !isWeb && styles.deviceFrameNative,
          isWeb && { transform: [{ scale }] },
        ]}
      >
        {isWeb ? <View style={styles.notch} /> : null}

        {/* Header */}
        <View
          style={[
            styles.header,
            !isWeb && { paddingTop: Math.max(insets.top, 8) + spacing.md },
          ]}
        >
          <View style={styles.headerTextBlock}>
            <Text style={styles.headerEyebrow}>AI Cooking Assistant</Text>
            <Text style={styles.headerTitle}>
              {activeTab === "saved"
                ? "Favorites"
                : activeTab === "search"
                  ? "Search"
                  : activeTab === "pantry"
                    ? "Pantry"
                  : activeTab === "profile"
                    ? "Profile"
                    : activeTab === "settings"
                      ? "Settings"
                      : activeTab === "help"
                        ? "Help & Support"
                        : activeTab === "about"
                          ? "About"
                          : activeTab === "login"
                            ? "Login"
                            : activeTab === "chef"
                              ? "Chef"
                              : "Home"}
            </Text>
            {activeTab === "saved" && (
              <Text style={styles.headerSubtitle}>
                {savedRecipes.length} recipe{savedRecipes.length === 1 ? "" : "s"}{" "}
                saved
              </Text>
            )}
          </View>
          <View style={styles.headerIcon}>
            <Text style={styles.headerIconEmoji}>
              {activeTab === "saved"
                ? "❤️"
                : activeTab === "search"
                  ? "🔍"
                  : activeTab === "pantry"
                    ? "🧺"
                  : activeTab === "profile"
                    ? "👤"
                    : activeTab === "settings"
                      ? "⚙️"
                      : activeTab === "help"
                        ? "❓"
                        : activeTab === "about"
                          ? "ℹ️"
                          : activeTab === "login"
                            ? "🔐"
                            : activeTab === "chef"
                              ? "👨‍🍳"
                              : "🍳"}
            </Text>
          </View>
        </View>

        {/* Content — swaps inside the phone frame only */}
        {activeTab === "home" && (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.homeScrollContent}
        >
          {(() => {
            const suggested: Recipe | undefined =
              savedRecipes[0] || LOCAL_CATALOG_RECIPES[0];
            const suggestedTitle = suggested?.title ?? "A recipe for you";
            const suggestedMeta = suggested
              ? `${suggested.totalTime ?? ((suggested.prepTime ?? 0) + (suggested.cookTime ?? 0))} min · ${suggested.servings ?? 4} servings`
              : "Tap to explore";
            const suggestedImg =
              (suggested as unknown as { heroImage?: string; image?: string })?.heroImage ??
              (suggested as unknown as { image?: string })?.image ??
              recipe.image;
            const moreRecipes = LOCAL_CATALOG_RECIPES.slice(
              suggested && (suggested as { id?: string }).id === LOCAL_CATALOG_RECIPES[0]?.id ? 1 : 0,
              4
            );

            return (
              <>
                {/* Greeting */}
                <View style={styles.homeGreetingBlock}>
                  <Text style={styles.homeEyebrow}>TODAY</Text>
                  <Text style={styles.homeGreetingTitle}>
                    What's cooking?
                  </Text>
                  <Text style={styles.homeGreetingSub}>
                    Pick a tile or ask the chef anything.
                  </Text>
                </View>

                {/* Two-tile row: Suggested + Pantry */}
                <View style={styles.homeTileRow}>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.homeTile}
                    onPress={() => {
                      if (suggested && (suggested as { id?: string }).id) {
                        setCookingId((suggested as { id?: string }).id!);
                      }
                    }}
                  >
                    <View style={styles.homeTileImageWrap}>
                      <Image
                        source={{ uri: suggestedImg }}
                        style={styles.homeTileImage}
                        resizeMode="cover"
                      />
                      <View style={styles.homeTileScrim} />
                      <View style={styles.homeTilePill}>
                        <Ionicons name="sparkles" size={10} color={colors.primary} />
                        <Text style={styles.homeTilePillText}>SUGGESTED</Text>
                      </View>
                    </View>
                    <View style={styles.homeTileBody}>
                      <Text style={styles.homeTileTitle} numberOfLines={2}>
                        {suggestedTitle}
                      </Text>
                      <Text style={styles.homeTileMeta} numberOfLines={1}>
                        {suggestedMeta}
                      </Text>
                      <View style={styles.homeTileFooter}>
                        <Text style={styles.homeTileCta}>View recipe</Text>
                        <Ionicons
                          name="arrow-forward"
                          size={12}
                          color={colors.primary}
                        />
                      </View>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.homeTile}
                    onPress={() => setActiveTab("pantry")}
                  >
                    <View style={styles.homeTileImageWrap}>
                      <Image
                        source={{
                          uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuBTJ1x3JM8Cp7syM1C83NCrOP8108gpZtfM_cEnx1qhSJozejchzGsmF2LnP1xi6Jg-KOtzqcO36wELqYG-yrwhx2IutZZvkFfPE6taC0OSAfh3ai0S87Hi6DYzRyZR4FmoipNic6UlvvIXPVkS9YMBLlOpw5T_C5eimPVhOB4Q82CoAnNefFe-3Ve-BviRf7RBR0BzoJch1e9NOZEv4TXzdGywYi6QlYMb4bjmSu1Omy0LHeSqr2vqPSue4fqci9uGu49rIe45IPyf",
                        }}
                        style={styles.homeTileImage}
                        resizeMode="cover"
                      />
                      <View style={styles.homeTileScrim} />
                      <View style={styles.homeTilePill}>
                        <Ionicons name="basket-outline" size={10} color={colors.primary} />
                        <Text style={styles.homeTilePillText}>PANTRY</Text>
                      </View>
                    </View>
                    <View style={styles.homeTileBody}>
                      <Text style={styles.homeTileTitle} numberOfLines={2}>
                        Your Pantry
                      </Text>
                      <Text style={styles.homeTileMeta} numberOfLines={1}>
                        See what's in stock
                      </Text>
                      <View style={styles.homeTileFooter}>
                        <Text style={styles.homeTileCta}>Open pantry</Text>
                        <Ionicons
                          name="arrow-forward"
                          size={12}
                          color={colors.primary}
                        />
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Ask chef banner */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.homeChefBanner}
                  onPress={() => setActiveTab("chef")}
                >
                  <View style={styles.homeChefIcon}>
                    <Ionicons name="sparkles" size={16} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.homeChefTitle}>Ask the chef</Text>
                    <Text style={styles.homeChefSub} numberOfLines={1}>
                      "What can I make with chicken and rice?"
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                </TouchableOpacity>

                {/* More suggestions rail */}
                {moreRecipes.length > 0 && (
                  <View style={styles.homeMoreWrap}>
                    <Text style={styles.homeSectionTitle}>More for you</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.homeMoreScroll}
                    >
                      {moreRecipes.map((r) => {
                        const img =
                          (r as unknown as { heroImage?: string; image?: string }).heroImage ??
                          (r as unknown as { image?: string }).image ??
                          recipe.image;
                        return (
                          <TouchableOpacity
                            key={r.id}
                            activeOpacity={0.85}
                            style={styles.homeMoreCard}
                            onPress={() => r.id && setCookingId(r.id)}
                          >
                            <Image
                              source={{ uri: img }}
                              style={styles.homeMoreImage}
                              resizeMode="cover"
                            />
                            <Text style={styles.homeMoreTitle} numberOfLines={2}>
                              {r.title}
                            </Text>
                            <Text style={styles.homeMoreMeta} numberOfLines={1}>
                              {(r.totalTime ?? (r.prepTime ?? 0) + (r.cookTime ?? 0))} min
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}
              </>
            );
          })()}
        </ScrollView>
        )}

        {activeTab === "search" && (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.placeholderScroll}
          >
            <View style={styles.searchWrap}>
              <View style={styles.searchInputRow}>
                <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search recipes (salmon, lemon dill, greek yogurt, sour cream)"
                  placeholderTextColor={colors.textDisabled}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={styles.searchInput}
                />
                {!!searchQuery && (
                  <TouchableOpacity
                    onPress={() => setSearchQuery("")}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>

              <Text style={styles.searchMetaText}>
                {searchQuery.trim()
                  ? `${searchResults.length} result${searchResults.length === 1 ? "" : "s"}`
                  : `${LOCAL_CATALOG_RECIPES.length} built-in recipes — type to filter`}
              </Text>

              {searchResults.length === 0 && !!searchQuery.trim() && (
                <View style={styles.placeholderInner}>
                  <Text style={styles.placeholderEmoji}>🔍</Text>
                  <Text style={styles.placeholderTitle}>No matches</Text>
                  <Text style={styles.placeholderBody}>
                    Try: salmon, lemon dill, green beans, sour cream, trout, curry, dal
                  </Text>
                </View>
              )}

              {searchResults.map((r, idx) => (
                <RecipeCard
                  key={r.id || `search-${idx}`}
                  recipe={r}
                  isSaved={!!r.id && localCatalogSavedIds.has(r.id)}
                  onToggleSave={toggleLocalCatalogSave}
                  onPress={() => {
                    if (r.id) setCookingId(r.id);
                  }}
                  disabled={!r.id}
                  loading={false}
                />
              ))}
            </View>
          </ScrollView>
        )}

        {activeTab === "saved" && (
          <View style={styles.savedListWrap}>
            <FlatList
              data={savedRecipes}
              keyExtractor={(item) => item.id || `favorite-${item.title}`}
              contentContainerStyle={styles.savedListContent}
              refreshing={savedLoading}
              onRefresh={loadSavedRecipes}
              ListEmptyComponent={
                <View style={styles.savedEmpty}>
                  <Ionicons
                    name="heart-outline"
                    size={64}
                    color={colors.textDisabled}
                  />
                  <Text style={styles.savedEmptyTitle}>
                    you have no recipes saved
                  </Text>
                  <Text style={styles.savedEmptySub}>
                    Save a recipe with the heart icon and it will appear here.
                  </Text>
                </View>
              }
              renderItem={({ item }) => (
                <RecipeCard
                  recipe={item}
                  isSaved
                  onToggleSave={handleUnsave}
                  onPress={() => {
                    if (item.id) setCookingId(item.id);
                  }}
                  disabled={!item.id}
                />
              )}
            />
          </View>
        )}

        {activeTab === "profile" && (
          <View style={[styles.profileContainer, { backgroundColor: c.background }]}>
            <ProfileScreen
              onNavigateToLogin={() => setActiveTab("login")}
              onNavigateToPantry={() => setActiveTab("pantry")}
              onNavigateToSettings={() => setActiveTab("settings")}
              onNavigateToHelp={() => setActiveTab("help")}
              onNavigateToAbout={() => setActiveTab("about")}
              onLogout={() => setActiveTab("login")}
            />
          </View>
        )}

        {activeTab === "pantry" && (
          <View style={[styles.innerViewContainer, { backgroundColor: c.background }]}>
            <PantryScreen onOpenCookingId={(id) => setCookingId(id)} />
          </View>
        )}

        {cookingId ? (
          <View style={styles.cookingOverlay}>
            <CookingModeFrame
              recipeId={cookingId}
              onClose={() => setCookingId(null)}
              onAskChef={() => {
                setCookingId(null);
                setActiveTab("chef");
                setChefView("chat");
              }}
            />
          </View>
        ) : null}

        {activeTab === "settings" && (
          <View style={[styles.innerViewContainer, { backgroundColor: c.background }]}>
            <SettingsScreen onBack={() => setActiveTab("profile")} />
          </View>
        )}

        {activeTab === "help" && (
          <View style={[styles.innerViewContainer, { backgroundColor: c.background }]}>
            <HelpScreen onBack={() => setActiveTab("profile")} />
          </View>
        )}

        {activeTab === "about" && (
          <View style={[styles.innerViewContainer, { backgroundColor: c.background }]}>
            <AboutScreen onBack={() => setActiveTab("profile")} />
          </View>
        )}

        {activeTab === "chef" && chefView === "history" && (
          <View style={styles.chefContainer}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>Your Chats</Text>
              <TouchableOpacity style={styles.newChatBtn} onPress={startNewChat} activeOpacity={0.7}>
                <Ionicons name="add" size={18} color={colors.background} />
                <Text style={styles.newChatBtnText}>New Chat</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.scroll} contentContainerStyle={styles.historyScroll}>
              {conversationsLoading && conversations.length === 0 && (
                <View style={styles.historyEmpty}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              )}
              {!conversationsLoading && conversations.length === 0 && (
                <View style={styles.historyEmpty}>
                  <Ionicons name="chatbubbles-outline" size={48} color={colors.textDisabled} />
                  <Text style={styles.historyEmptyTitle}>No chats yet</Text>
                  <Text style={styles.historyEmptyBody}>
                    Tap &quot;New Chat&quot; to start a conversation with Chef.
                  </Text>
                </View>
              )}
              {conversations.map((convo) => (
                <TouchableOpacity
                  key={convo.id}
                  style={styles.historyItem}
                  activeOpacity={0.7}
                  onPress={() => openConversation(convo.id)}
                >
                  <View style={styles.historyItemIcon}>
                    <Ionicons name="chatbubble-outline" size={18} color={colors.primary} />
                  </View>
                  <View style={styles.historyItemContent}>
                    <Text style={styles.historyItemTitle} numberOfLines={1}>{convo.title}</Text>
                    <Text style={styles.historyItemTime}>{formatRelativeTime(convo.updated_at)}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {activeTab === "chef" && chefView === "chat" && (
          <View style={styles.chefContainer}>
            <View style={styles.chatHeader}>
              <TouchableOpacity style={styles.backBtn} onPress={goBackToHistory} activeOpacity={0.7}>
                <Ionicons name="arrow-back" size={20} color={colors.primary} />
              </TouchableOpacity>
              <Text style={styles.chatHeaderTitle} numberOfLines={1}>
                {conversations.find((x) => x.id === activeConvoId)?.title || "New Chat"}
              </Text>
            </View>
            <ScrollView
              ref={chefScrollRef}
              style={styles.scroll}
              contentContainerStyle={styles.chefScroll}
              keyboardShouldPersistTaps="always"
              showsVerticalScrollIndicator={false}
            >
              {chefMessages.length === 0 && !chefLoading && (
                <>
                  <View style={styles.chefWelcomeCard}>
                    <Ionicons name="sparkles" size={36} color={colors.primary} />
                    <Text style={styles.chefWelcomeTitle}>How can I help?</Text>
                    <Text style={styles.chefWelcomeBody}>
                      Ask me anything about cooking — ingredient substitutions,
                      techniques, meal planning, or let me generate a recipe for you.
                    </Text>
                  </View>
                  {[
                    { icon: "restaurant-outline" as const, label: "Generate a recipe from ingredients" },
                    { icon: "swap-horizontal-outline" as const, label: "Suggest ingredient substitutions" },
                    { icon: "nutrition-outline" as const, label: "Get nutritional info" },
                    { icon: "calendar-outline" as const, label: "Plan meals for the week" },
                  ].map((item) => (
                    <TouchableOpacity
                      key={item.label}
                      style={styles.chefSuggestion}
                      activeOpacity={0.7}
                      onPress={() => handleChefSend(item.label)}
                    >
                      <Ionicons name={item.icon} size={18} color={colors.primary} />
                      <Text style={styles.chefSuggestionText}>{item.label}</Text>
                      <Ionicons name="arrow-forward-circle-outline" size={18} color={colors.primary} />
                    </TouchableOpacity>
                  ))}
                </>
              )}
              {chefMessages.map((entry) => (
                <ChatMessage
                  key={entry.id}
                  role={entry.role}
                  content={entry.content}
                  timestamp={entry.timestamp}
                />
              ))}
              {chefLoading && (
                <View style={styles.chefTyping}>
                  <View style={styles.chefTypingAvatar}>
                    <Ionicons name="sparkles" size={12} color={colors.primary} />
                  </View>
                  <View style={styles.chefTypingBubble}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={styles.chefTypingText}>Cooking up a reply...</Text>
                  </View>
                </View>
              )}
            </ScrollView>
            <View
              style={[
                styles.chefComposer,
                !isWeb && { bottom: 64 + insets.bottom },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.chefMicBtn,
                  chefVoiceListening && styles.chefMicBtnActive,
                  (!chefVoiceSupported || chefLoading) && styles.chefMicBtnDisabled,
                ]}
                onPress={handleChefVoicePress}
                disabled={!chefVoiceSupported || chefLoading}
                accessibilityRole="button"
                accessibilityLabel={
                  chefVoiceListening ? "Stop voice input" : "Voice input"
                }
                activeOpacity={0.7}
              >
                <Ionicons
                  name={chefVoiceListening ? "mic-off" : "mic"}
                  size={20}
                  color={chefVoiceListening ? colors.error : colors.primary}
                />
              </TouchableOpacity>
              <TextInput
                style={styles.chefInput}
                value={chefInput}
                onChangeText={setChefInput}
                placeholder="What are you cooking today?"
                placeholderTextColor={colors.textSecondary}
                multiline
                editable={!chefLoading}
                onSubmitEditing={() => handleChefSend()}
                returnKeyType="send"
              />
              {chefInput.trim() ? (
                <TouchableOpacity
                  style={[styles.chefSendBtn, chefLoading && styles.chefSendBtnDisabled]}
                  onPress={() => handleChefSend()}
                  disabled={chefLoading}
                >
                  <Ionicons name="send" size={18} color={colors.background} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        )}

        {activeTab === "login" && (
          <View style={[styles.innerViewContainer, { backgroundColor: c.background }]}>
            <TouchableOpacity
              style={styles.loginBackButton}
              onPress={() => setActiveTab("profile")}
            >
              <Ionicons name="arrow-back" size={20} color={c.text} />
              <Text style={[styles.loginBackText, { color: c.text }]}>Back</Text>
            </TouchableOpacity>
            <LoginScreen onLoginSuccess={() => setActiveTab("home")} />
          </View>
        )}

        {/* Bottom nav — same chrome as before; only switches in-frame tab */}
        <View
          style={[
            styles.bottomBar,
            !isWeb && {
              paddingBottom: insets.bottom,
              height: 64 + insets.bottom,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.bottomItem}
            onPress={() => setActiveTab("home")}
            accessibilityRole="button"
            accessibilityLabel="Home"
          >
            <Text
              style={
                activeTab === "home"
                  ? styles.bottomIcon
                  : styles.bottomIconInactive
              }
            >
              🏠
            </Text>
            <Text
              style={
                activeTab === "home"
                  ? styles.bottomLabelActive
                  : styles.bottomLabel
              }
            >
              Home
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.bottomItem}
            onPress={() => setActiveTab("search")}
            accessibilityRole="button"
            accessibilityLabel="Search"
          >
            <Text
              style={
                activeTab === "search"
                  ? styles.bottomIcon
                  : styles.bottomIconInactive
              }
            >
              🔍
            </Text>
            <Text
              style={
                activeTab === "search"
                  ? styles.bottomLabelActive
                  : styles.bottomLabel
              }
            >
              Search
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.bottomItem}
            onPress={() => setActiveTab("chef")}
            accessibilityRole="button"
            accessibilityLabel="Chef AI chat"
          >
            <Ionicons
              name={activeTab === "chef" ? "sparkles" : "sparkles-outline"}
              size={20}
              color={activeTab === "chef" ? colors.primary : colors.textSecondary}
            />
            <Text
              style={
                activeTab === "chef"
                  ? styles.bottomLabelActive
                  : styles.bottomLabel
              }
            >
              Chef
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.bottomItem}
            onPress={() => setActiveTab("saved")}
            accessibilityRole="button"
            accessibilityLabel="Saved"
          >
            <Text
              style={
                activeTab === "saved"
                  ? styles.bottomIcon
                  : styles.bottomIconInactive
              }
            >
              ❤️
            </Text>
            <Text
              style={
                activeTab === "saved"
                  ? styles.bottomLabelActive
                  : styles.bottomLabel
              }
            >
              Saved
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.bottomItem}
            onPress={() => setActiveTab("profile")}
            accessibilityRole="button"
            accessibilityLabel="Profile"
          >
            <Text
              style={
                activeTab === "profile"
                  ? styles.bottomIcon
                  : styles.bottomIconInactive
              }
            >
              👤
            </Text>
            <Text
              style={
                activeTab === "profile"
                  ? styles.bottomLabelActive
                  : styles.bottomLabel
              }
            >
              Profile
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#020617",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  rootNative: {
    backgroundColor: "#FEF3C7",
    padding: 0,
    alignItems: "stretch",
    justifyContent: "flex-start",
  },
  deviceFrame: {
    width: 390,
    height: 844,
    borderRadius: 48,
    borderWidth: 8,
    borderColor: "#020617",
    backgroundColor: "#FEF3C7",
    ...shadows.lg,
    overflow: "hidden",
  },
  cookingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
  },
  deviceFrameNative: {
    width: "100%",
    flex: 1,
    alignSelf: "stretch",
    borderRadius: 0,
    borderWidth: 0,
    borderColor: "transparent",
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  notch: {
    position: "absolute",
    top: 0,
    left: "50%",
    marginLeft: -64,
    width: 128,
    height: 28,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    backgroundColor: "#020617",
    zIndex: 20,
  },
  header: {
    paddingTop: 56,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primary,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTextBlock: {
    flex: 1,
    marginRight: spacing.sm,
  },
  headerEyebrow: {
    ...typography.caption,
    color: "#FED7AA",
  },
  headerTitle: {
    ...typography.h2,
    color: colors.background,
    marginTop: 2,
  },
  headerSubtitle: {
    ...typography.caption,
    color: "#FED7AA",
    marginTop: 4,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerIconEmoji: {
    fontSize: 22,
  },
  scroll: {
    flex: 1,
  },
  savedListWrap: {
    flex: 1,
  },
  savedListContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 80,
    flexGrow: 1,
  },
  savedEmpty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl * 2,
    paddingHorizontal: spacing.lg,
  },
  savedEmptyTitle: {
    ...typography.h2,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    textAlign: "center",
  },
  savedEmptySub: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
  placeholderScroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: 80,
    justifyContent: "center",
  },
  placeholderInner: {
    alignItems: "center",
    paddingVertical: spacing.xxl,
  },
  placeholderEmoji: {
    fontSize: 48,
    opacity: 0.65,
  },
  placeholderTitle: {
    ...typography.h2,
    color: colors.text,
    marginTop: spacing.md,
    textAlign: "center",
  },
  placeholderBody: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: "center",
  },
  searchWrap: {
    flexGrow: 1,
    gap: spacing.md,
  },
  searchInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.background,
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
  searchMetaText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 80,
    gap: spacing.lg,
  },

  // Home dashboard
  homeScrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 96,
    gap: spacing.lg,
  },
  homeGreetingBlock: {
    paddingTop: spacing.xs,
    gap: 4,
  },
  homeEyebrow: {
    ...typography.caption,
    color: colors.primary,
    fontSize: 10,
    letterSpacing: 3,
    textTransform: "uppercase",
    fontWeight: "700",
  },
  homeGreetingTitle: {
    ...typography.h1,
    color: colors.text,
    fontSize: 28,
    lineHeight: 32,
    marginTop: 4,
  },
  homeGreetingSub: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  homeTileRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  homeTile: {
    flex: 1,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.background,
    overflow: "hidden",
    ...shadows.md,
  },
  homeTileImageWrap: {
    width: "100%",
    aspectRatio: 4 / 3,
    position: "relative",
  },
  homeTileImage: {
    width: "100%",
    height: "100%",
  },
  homeTileScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.14)",
  },
  homeTilePill: {
    position: "absolute",
    top: spacing.sm,
    left: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.94)",
  },
  homeTilePillText: {
    ...typography.caption,
    color: colors.text,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  homeTileBody: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm + 2,
    paddingBottom: spacing.md,
    gap: 2,
  },
  homeTileTitle: {
    ...typography.body,
    color: colors.text,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "700",
  },
  homeTileMeta: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 14,
    marginTop: 2,
  },
  homeTileFooter: {
    marginTop: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  homeTileCta: {
    ...typography.caption,
    color: colors.primary,
    fontSize: 11,
    fontWeight: "700",
  },
  homeChefBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: "#FFFBEB",
  },
  homeChefIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFF7ED",
    alignItems: "center",
    justifyContent: "center",
  },
  homeChefTitle: {
    ...typography.body,
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  homeChefSub: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 1,
    fontStyle: "italic",
  },
  homeMoreWrap: {
    gap: spacing.sm,
  },
  homeSectionTitle: {
    ...typography.body,
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  homeMoreScroll: {
    gap: spacing.md,
    paddingRight: spacing.lg,
  },
  homeMoreCard: {
    width: 140,
    gap: 4,
  },
  homeMoreImage: {
    width: 140,
    height: 105,
    borderRadius: borderRadius.md,
  },
  homeMoreTitle: {
    ...typography.caption,
    color: colors.text,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "600",
    marginTop: 4,
  },
  homeMoreMeta: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 10,
  },

  recipeCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    overflow: "hidden",
    ...shadows.md,
  },
  recipeImageWrapper: {
    height: 190,
    position: "relative",
  },
  recipeImage: {
    width: "100%",
    height: "100%",
  },
  recipeImageOverlay: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  recipeImageContent: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
  },
  recipeChip: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  recipeChipDot: {
    color: colors.background,
    marginRight: 4,
  },
  recipeChipText: {
    ...typography.caption,
    color: colors.background,
    fontSize: 11,
    textTransform: "uppercase",
  },
  recipeName: {
    ...typography.h2,
    color: colors.background,
    marginTop: spacing.sm,
  },
  recipeMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: "#FFFBEB",
  },
  recipeMetaItem: {
    flex: 1,
    alignItems: "center",
  },
  metaIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFF7ED",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  metaLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
  },
  metaValue: {
    ...typography.caption,
    color: colors.text,
    fontWeight: "600",
    fontSize: 11,
  },
  ingredientsCard: {
    backgroundColor: "#FFFBEB",
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.sm,
  },
  ingredientsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  ingredientsAccent: {
    width: 3,
    height: 24,
    borderRadius: 999,
    backgroundColor: colors.primary,
    marginRight: spacing.sm,
  },
  ingredientsTitle: {
    ...typography.body,
    fontWeight: "600",
    color: colors.text,
  },
  ingredientsAdjust: {
    ...typography.caption,
    color: colors.primary,
    textDecorationLine: "underline",
    fontSize: 12,
  },
  ingredientRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: "#FEE2E2",
  },
  ingredientLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: spacing.sm,
    gap: spacing.sm,
  },
  checkboxOuter: {
    width: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  ingredientName: {
    ...typography.body,
    color: colors.text,
    flexShrink: 1,
  },
  ingredientNameChecked: {
    color: colors.textSecondary,
    textDecorationLine: "line-through",
  },
  ingredientAmount: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: "600",
  },
  ingredientAmountChecked: {
    color: colors.textSecondary,
    fontWeight: "400",
  },
  stepsCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.md,
  },
  stepsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  stepsTitle: {
    ...typography.body,
    fontWeight: "600",
    color: colors.text,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  stepNumberCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFFBEB",
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: "600",
  },
  stepContent: {
    flex: 1,
  },
  stepInstruction: {
    ...typography.body,
    color: colors.text,
  },
  stepDurationChip: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#FFFBEB",
  },
  stepDurationText: {
    ...typography.caption,
    color: colors.primary,
    fontSize: 11,
  },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 64,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: spacing.lg,
  },
  bottomItem: {
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  bottomIcon: {
    fontSize: 18,
  },
  bottomIconInactive: {
    fontSize: 18,
    opacity: 0.6,
  },
  bottomLabelActive: {
    ...typography.caption,
    fontSize: 11,
    color: colors.primary,
  },
  bottomLabel: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textSecondary,
  },
  chefContainer: {
    flex: 1,
    paddingBottom: 64,
  },
  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  historyTitle: {
    ...typography.body,
    fontWeight: "600",
    color: colors.text,
    fontSize: 16,
  },
  newChatBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  newChatBtnText: {
    ...typography.caption,
    color: colors.background,
    fontWeight: "600",
    fontSize: 13,
  },
  historyScroll: {
    flexGrow: 1,
    paddingVertical: spacing.sm,
  },
  historyEmpty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl * 2,
    paddingHorizontal: spacing.lg,
  },
  historyEmptyTitle: {
    ...typography.body,
    fontWeight: "600",
    color: colors.text,
    marginTop: spacing.md,
  },
  historyEmptyBody: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: "center",
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  historyItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFF7ED",
    alignItems: "center",
    justifyContent: "center",
  },
  historyItemContent: {
    flex: 1,
  },
  historyItemTitle: {
    ...typography.body,
    color: colors.text,
    fontSize: 15,
  },
  historyItemTime: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFF7ED",
    alignItems: "center",
    justifyContent: "center",
  },
  chatHeaderTitle: {
    ...typography.body,
    fontWeight: "600",
    color: colors.text,
    flex: 1,
    fontSize: 15,
  },
  chefScroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  chefWelcomeCard: {
    alignItems: "center",
    backgroundColor: "#FFFBEB",
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.sm,
  },
  chefWelcomeTitle: {
    ...typography.h2,
    color: colors.text,
    marginTop: spacing.md,
    textAlign: "center",
  },
  chefWelcomeBody: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: "center",
    lineHeight: 22,
  },
  chefSuggestion: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chefSuggestionText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  chefTyping: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  chefTypingAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFF7ED",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  chefTypingBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: "#FFF7ED",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
  },
  chefTypingText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontStyle: "italic",
  },
  chefComposer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  chefMicBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#FDE8D0",
    alignItems: "center",
    justifyContent: "center",
  },
  chefMicBtnActive: {
    backgroundColor: "#FEE2E2",
    borderColor: colors.error,
  },
  chefMicBtnDisabled: {
    opacity: 0.4,
  },
  chefInput: {
    flex: 1,
    minHeight: 42,
    maxHeight: 80,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    backgroundColor: "#FFF7ED",
    borderRadius: 21,
    borderWidth: 1,
    borderColor: "#FDE8D0",
    ...typography.body,
    fontSize: 15,
    color: colors.text,
  },
  chefSendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  chefSendBtnDisabled: {
    backgroundColor: colors.textDisabled,
  },
  profileContainer: {
    flex: 1,
    overflow: "hidden",
  },
  innerViewContainer: {
    flex: 1,
    overflow: "hidden",
  },
  loginBackButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  loginBackText: {
    ...typography.body,
  },
});


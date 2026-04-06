import axios from "axios";
import React, { useCallback, useEffect, useRef, useState } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Recipe } from "@aipron/shared";
import { RecipeCard } from "../src/components/RecipeCard";
import { ChatMessage } from "../src/components/ChatMessage";
import { recipeApi, chatApi, Conversation } from "../src/services/api";
import { colors, spacing, typography, borderRadius, shadows } from "../src/constants/DesignTokens";
import { useThemeColors } from "../src/hooks/useThemeColors";
import { useWebSpeechToText } from "../src/hooks/useWebSpeechToText";
import ProfileScreen from "./(tabs)/profile";
import LoginScreen from "./login";
import SettingsScreen from "./settings";
import HelpScreen from "./help";
import AboutScreen from "./about";

type MockTab =
  | "home"
  | "search"
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

export default function WebPreviewScreen() {
  const c = useThemeColors();
  const [activeTab, setActiveTab] = useState<MockTab>("home");
  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(
    new Set()
  );
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  const [savedLoading, setSavedLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Recipe[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const searchSeqRef = useRef(0);

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
    setSearchLoading(true);
    setSearchError(null);

    const handle = setTimeout(() => {
      (async () => {
        try {
          const list = await recipeApi.search(q, { limit: 30, offset: 0 });
          if (seq !== searchSeqRef.current) return;
          setSearchResults(list);
        } catch (error: unknown) {
          if (seq !== searchSeqRef.current) return;
          setSearchResults([]);
          let msg = "Could not reach the recipe API.";
          if (axios.isAxiosError(error)) {
            const data = error.response?.data as { error?: string } | undefined;
            msg = data?.error || error.message || msg;
          } else if (error instanceof Error) {
            msg = error.message;
          }
          setSearchError(
            `${msg} Start the backend (npm run dev in /backend). If the browser blocks requests, CORS is relaxed for localhost in development.`
          );
        } finally {
          if (seq === searchSeqRef.current) {
            setSearchLoading(false);
          }
        }
      })();
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
        const reply = await chatApi.sendMessage(activeConvoId, msg);
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
        const replyContent = await chatApi.send(history);
        const assistantEntry = {
          id: (Date.now() + 1).toString(),
          role: "assistant" as const,
          content: replyContent,
          timestamp: new Date(),
        };
        setChefMessages((prev) => [...prev, assistantEntry]);
      }
    } catch {
      const errorEntry = {
        id: (Date.now() + 1).toString(),
        role: "assistant" as const,
        content: "Sorry, something went wrong. Please try again.",
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

  const toggleIngredient = (id: string) => {
    const next = new Set(checkedIngredients);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setCheckedIngredients(next);
  };

  return (
    <View style={styles.root}>
      <View style={styles.deviceFrame}>
        {/* Status bar notch */}
        <View style={styles.notch} />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTextBlock}>
            <Text style={styles.headerEyebrow}>AI Cooking Assistant</Text>
            <Text style={styles.headerTitle}>
              {activeTab === "saved"
                ? "Favorites"
                : activeTab === "search"
                  ? "Search"
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
                              : "Today's Recipe"}
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
          contentContainerStyle={styles.scrollContent}
        >
          {/* Recipe header card */}
          <View style={styles.recipeCard}>
            <View style={styles.recipeImageWrapper}>
              <Image
                source={{ uri: recipe.image }}
                style={styles.recipeImage}
                resizeMode="cover"
              />
              <View style={styles.recipeImageOverlay} />
              <View style={styles.recipeImageContent}>
                <View style={styles.recipeChip}>
                  <Text style={styles.recipeChipDot}>•</Text>
                  <Text style={styles.recipeChipText}>Featured recipe</Text>
                </View>
                <Text style={styles.recipeName}>{recipe.title}</Text>
              </View>
            </View>
            <View style={styles.recipeMetaRow}>
              <View style={styles.recipeMetaItem}>
                <View style={styles.metaIconBadge}>
                  <Ionicons
                    name="time-outline"
                    size={16}
                    color={colors.primary}
                  />
                </View>
                <Text style={styles.metaLabel}>Prep</Text>
                <Text style={styles.metaValue}>{recipe.prepTime}</Text>
              </View>
              <View style={styles.recipeMetaItem}>
                <View style={styles.metaIconBadge}>
                  <Ionicons
                    name="flame-outline"
                    size={16}
                    color={colors.primary}
                  />
                </View>
                <Text style={styles.metaLabel}>Cook</Text>
                <Text style={styles.metaValue}>{recipe.cookTime}</Text>
              </View>
              <View style={styles.recipeMetaItem}>
                <View style={styles.metaIconBadge}>
                  <Ionicons
                    name="people-outline"
                    size={16}
                    color={colors.primary}
                  />
                </View>
                <Text style={styles.metaLabel}>Serves</Text>
                <Text style={styles.metaValue}>{recipe.servings}</Text>
              </View>
            </View>
          </View>

          {/* Ingredients */}
          <View style={styles.ingredientsCard}>
            <View style={styles.ingredientsHeaderRow}>
              <View style={styles.ingredientsAccent} />
              <Text style={styles.ingredientsTitle}>Ingredients</Text>
              <View style={{ flex: 1 }} />
              <Text style={styles.ingredientsAdjust}>Adjust for guests</Text>
            </View>
            {recipe.ingredients.map((item) => {
              const isChecked = checkedIngredients.has(item.id);
              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.ingredientRow}
                  activeOpacity={0.8}
                  onPress={() => toggleIngredient(item.id)}
                >
                  <View style={styles.ingredientLeft}>
                    <View style={styles.checkboxOuter}>
                      {isChecked ? (
                        <Ionicons
                          name="checkmark-circle"
                          size={20}
                          color={colors.primary}
                        />
                      ) : (
                        <Ionicons
                          name="ellipse-outline"
                          size={20}
                          color={colors.textSecondary}
                        />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.ingredientName,
                        isChecked && styles.ingredientNameChecked,
                      ]}
                    >
                      {item.name}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.ingredientAmount,
                      isChecked && styles.ingredientAmountChecked,
                    ]}
                  >
                    {item.amount}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Steps */}
          <View style={styles.stepsCard}>
            <View style={styles.stepsHeaderRow}>
              <Ionicons
                name="restaurant-outline"
                size={18}
                color={colors.primary}
              />
              <Text style={styles.stepsTitle}>Cooking steps</Text>
            </View>
            {recipe.steps.map((step) => (
              <View key={step.id} style={styles.stepRow}>
                <View style={styles.stepNumberCircle}>
                  <Text style={styles.stepNumberText}>{step.id}</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepInstruction}>{step.instruction}</Text>
                  {step.duration && (
                    <View style={styles.stepDurationChip}>
                      <Ionicons
                        name="time-outline"
                        size={12}
                        color={colors.primary}
                      />
                      <Text style={styles.stepDurationText}>
                        {step.duration}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
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
                {searchError
                  ? "Could not load catalog"
                  : searchQuery.trim()
                    ? (searchLoading ? "Searching…" : `${searchResults.length} result${searchResults.length === 1 ? "" : "s"}`)
                    : (searchLoading ? "Loading catalog…" : `${searchResults.length} recipe${searchResults.length === 1 ? "" : "s"} — type to filter`)}
              </Text>

              {searchError ? (
                <Text style={styles.placeholderBody}>{searchError}</Text>
              ) : null}

              {searchResults.length === 0 && !searchQuery.trim() && !searchLoading && !searchError && (
                <View style={styles.placeholderInner}>
                  <Text style={styles.placeholderEmoji}>🔍</Text>
                  <Text style={styles.placeholderTitle}>Search recipes</Text>
                  <Text style={styles.placeholderBody}>
                    Try: salmon, lemon dill, green beans, sour cream, trout
                  </Text>
                </View>
              )}

              {searchResults.map((r, idx) => (
                <RecipeCard
                  key={r.id || `search-${idx}`}
                  recipe={r}
                  onPress={() => {}}
                  disabled
                  loading={searchLoading}
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
                  onPress={() => {}}
                />
              )}
            />
          </View>
        )}

        {activeTab === "profile" && (
          <View style={[styles.profileContainer, { backgroundColor: c.background }]}>
            <ProfileScreen
              onNavigateToLogin={() => setActiveTab("login")}
              onNavigateToSettings={() => setActiveTab("settings")}
              onNavigateToHelp={() => setActiveTab("help")}
              onNavigateToAbout={() => setActiveTab("about")}
              onLogout={() => setActiveTab("login")}
            />
          </View>
        )}

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
              keyboardShouldPersistTaps="handled"
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
            <View style={styles.chefComposer}>
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
        <View style={styles.bottomBar}>
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
    paddingBottom: 80,
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
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 64,
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


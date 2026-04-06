import React, { useState, useRef } from "react";
import { View, StyleSheet, ScrollView, Text, KeyboardAvoidingView, Platform } from "react-native";
import { ChatComposer } from "../../src/components/ChatComposer";
import { ChatMessage } from "../../src/components/ChatMessage";
import { RecipeCard } from "../../src/components/RecipeCard";
import { recipeApi } from "../../src/services/api";
import { colors, spacing, typography, borderRadius } from "../../src/constants/DesignTokens";
import { Recipe } from "@aipron/shared";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ChatEntry {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  recipe?: Recipe;
}

export default function ChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const [chatHistory, setChatHistory] = useState<ChatEntry[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

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

      // Scroll to bottom
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
    // TODO: Implement voice recording
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={insets.bottom}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>AIpron</Text>
        <Text style={styles.headerSubtitle}>Your cooking assistant</Text>
      </View>
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {chatHistory.length === 0 && (
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeTitle}>👨‍🍳 What would you like to cook?</Text>
            <Text style={styles.welcomeText}>
              Tell me what you're craving or what ingredients you have, and I'll create a personalized recipe for you!
            </Text>
          </View>
        )}
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
            <Text style={styles.loadingText}>Creating your recipe...</Text>
          </View>
        )}
        {recipes.length > 0 && (
          <View style={styles.recipesContainer}>
            <Text style={styles.recipesTitle}>Your Recipes</Text>
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
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    ...typography.h1,
    color: colors.text,
    fontWeight: "700",
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs / 2,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  welcomeContainer: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xl,
  },
  welcomeTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  welcomeText: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  loadingContainer: {
    padding: spacing.md,
    alignItems: "center",
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    fontStyle: "italic",
  },
  recipesContainer: {
    marginTop: spacing.xl,
  },
  recipesTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.md,
  },
});

import React, { useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, Text, StatusBar } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { CookingStep } from "../../src/components/CookingStep";
import { VoiceIndicator } from "../../src/components/VoiceIndicator";
import { cookingApi, recipeApi } from "../../src/services/api";
import { colors, spacing, typography, borderRadius } from "../../src/constants/DesignTokens";
import { Recipe, RecipeStep } from "@aipron/shared";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function CookingModeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [timerActive, setTimerActive] = useState(false);

  useEffect(() => {
    loadRecipe();
    startSession();
  }, [id]);

  const loadRecipe = async () => {
    try {
      const data = await recipeApi.getById(id);
      setRecipe(data);
    } catch (error) {
      console.error("Failed to load recipe:", error);
    }
  };

  const startSession = async () => {
    try {
      await cookingApi.startSession(id);
    } catch (error) {
      console.error("Failed to start session:", error);
    }
  };

  const handleNextStep = () => {
    if (recipe && currentStep < recipe.steps.length) {
      setCurrentStep(currentStep + 1);
      cookingApi.updateStep(id, currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      cookingApi.updateStep(id, currentStep - 1);
    }
  };

  const handleComplete = async () => {
    try {
      await cookingApi.completeSession(id);
      router.back();
    } catch (error) {
      console.error("Failed to complete session:", error);
    }
  };

  if (!recipe) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <StatusBar barStyle="light-content" />
        <Text style={styles.loadingText}>Loading recipe...</Text>
      </View>
    );
  }

  const activeStep = recipe.steps.find((s) => s.stepNumber === currentStep);
  const progress = (currentStep / recipe.steps.length) * 100;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={28} color={colors.cookingText} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.recipeTitle} numberOfLines={1}>
            {recipe.title}
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.stepIndicatorText}>
            Step {currentStep} of {recipe.steps.length}
          </Text>
        </View>
      </View>

      <CookingStep
        step={activeStep || recipe.steps[0]}
        isActive
        recipe={recipe}
      />

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <TouchableOpacity
          style={styles.aiAssistantBanner}
          onPress={() => router.push("/(tabs)/chat")}
          activeOpacity={0.8}
        >
          <View style={styles.aiIconContainer}>
            <Ionicons name="chatbubble-ellipses" size={18} color={colors.primary} />
          </View>
          <View style={styles.aiTextContainer}>
            <Text style={styles.aiTitle}>Ask your AI chef</Text>
            <Text style={styles.aiSubtitle} numberOfLines={1}>
              “What can I cook with what I have?”
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.cookingTextSecondary} />
        </TouchableOpacity>

        <VoiceIndicator
          isListening={isListening}
          isSpeaking={isSpeaking}
        />
        <View style={styles.controls}>
          <TouchableOpacity
            style={[
              styles.controlButton,
              styles.secondaryButton,
              currentStep === 1 && styles.controlButtonDisabled,
            ]}
            onPress={handlePreviousStep}
            disabled={currentStep === 1}
          >
            <Ionicons
              name="chevron-back"
              size={20}
              color={currentStep === 1 ? colors.textDisabled : colors.cookingText}
            />
            <Text
              style={[
                styles.controlButtonText,
                currentStep === 1 && styles.controlButtonTextDisabled,
              ]}
            >
              Previous
            </Text>
          </TouchableOpacity>
          {currentStep < recipe.steps.length ? (
            <TouchableOpacity style={styles.controlButton} onPress={handleNextStep}>
              <Text style={styles.controlButtonText}>Next Step</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.cookingBackground} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.completeButton} onPress={handleComplete}>
              <Ionicons name="checkmark-circle" size={20} color={colors.background} />
              <Text style={styles.completeButtonText}>Complete</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cookingBackground,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.cookingTextSecondary + "20",
  },
  closeButton: {
    marginBottom: spacing.md,
  },
  headerContent: {
    alignItems: "center",
  },
  recipeTitle: {
    ...typography.h2,
    color: colors.cookingText,
    marginBottom: spacing.md,
    textAlign: "center",
  },
  progressBar: {
    width: "100%",
    height: 4,
    backgroundColor: colors.cookingTextSecondary + "30",
    borderRadius: 2,
    marginBottom: spacing.sm,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  stepIndicatorText: {
    ...typography.caption,
    color: colors.cookingTextSecondary,
    fontSize: 12,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.cookingTextSecondary + "20",
  },
  controls: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.md,
    gap: spacing.md,
  },
  controlButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  secondaryButton: {
    backgroundColor: colors.cookingTextSecondary + "20",
    borderWidth: 1,
    borderColor: colors.cookingTextSecondary + "40",
  },
  controlButtonDisabled: {
    opacity: 0.3,
  },
  controlButtonText: {
    ...typography.body,
    color: colors.cookingBackground,
    fontWeight: "600",
  },
  controlButtonTextDisabled: {
    color: colors.cookingTextSecondary,
  },
  completeButton: {
    flex: 1,
    backgroundColor: colors.success,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  completeButtonText: {
    ...typography.body,
    color: colors.background,
    fontWeight: "600",
  },
  loadingText: {
    ...typography.body,
    color: colors.cookingText,
    textAlign: "center",
  },
  aiAssistantBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.cookingTextSecondary + "20",
    marginBottom: spacing.lg,
  },
  aiIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.cookingBackground,
    alignItems: "center",
    justifyContent: "center",
  },
  aiTextContainer: {
    flex: 1,
  },
  aiTitle: {
    ...typography.caption,
    color: colors.cookingText,
    fontWeight: "600",
  },
  aiSubtitle: {
    ...typography.caption,
    color: colors.cookingTextSecondary,
    fontSize: 12,
    marginTop: 2,
  },
});

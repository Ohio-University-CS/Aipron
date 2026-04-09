import React, { useEffect, useMemo, useState } from "react";
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CookingStep } from "./CookingStep";
import { VoiceIndicator } from "./VoiceIndicator";
import { cookingApi, recipeApi } from "../services/api";
import { findLocalCatalogRecipeById } from "../data/localCatalog";
import { borderRadius, colors, spacing, typography } from "../constants/DesignTokens";
import type { Recipe } from "@aipron/shared";

type Props = {
  recipeId: string;
  onClose: () => void;
  onAskChef?: () => void;
};

export function CookingModeFrame({ recipeId, onClose, onAskChef }: Props) {
  const insets = useSafeAreaInsets();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const isLocalCatalogRecipe = useMemo(() => !!findLocalCatalogRecipeById(recipeId), [recipeId]);

  useEffect(() => {
    setCurrentStep(1);
    setRecipe(null);
    setSessionId(null);

    const local = findLocalCatalogRecipeById(recipeId);
    if (local) {
      setRecipe(local);
      return;
    }

    recipeApi
      .getById(recipeId)
      .then((data) => setRecipe(data))
      .catch((error) => console.error("Failed to load recipe:", error));
  }, [recipeId]);

  useEffect(() => {
    if (isLocalCatalogRecipe) return;
    cookingApi
      .startSession(recipeId)
      .then((data) => {
        const id = data?.id;
        if (typeof id === "string") setSessionId(id);
      })
      .catch((error) => console.error("Failed to start session:", error));
  }, [recipeId, isLocalCatalogRecipe]);

  const handleNextStep = () => {
    if (recipe && currentStep < recipe.steps.length) {
      const next = currentStep + 1;
      setCurrentStep(next);
      if (!isLocalCatalogRecipe) {
        if (sessionId) {
          cookingApi.updateStep(sessionId, next).catch(() => {});
        }
      }
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      const prev = currentStep - 1;
      setCurrentStep(prev);
      if (!isLocalCatalogRecipe) {
        if (sessionId) {
          cookingApi.updateStep(sessionId, prev).catch(() => {});
        }
      }
    }
  };

  const handleComplete = async () => {
    if (!isLocalCatalogRecipe) {
      if (sessionId) {
        try {
          await cookingApi.completeSession(sessionId);
        } catch (error) {
          console.error("Failed to complete session:", error);
        }
      }
    }
    onClose();
  };

  if (!recipe) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <StatusBar barStyle="light-content" />
        <Text style={styles.loadingText}>Loading recipe...</Text>
      </View>
    );
  }

  const rawStep = recipe.steps[currentStep - 1] ?? recipe.steps[0];
  const stepNumber =
    (rawStep && typeof (rawStep as any).stepNumber === "number" && (rawStep as any).stepNumber) ||
    (rawStep && typeof (rawStep as any).step_number === "number" && (rawStep as any).step_number) ||
    currentStep;
  const activeStep = rawStep ? ({ ...rawStep, stepNumber } as any) : (recipe.steps[0] as any);
  const progress = (currentStep / recipe.steps.length) * 100;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
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

      <CookingStep step={activeStep || recipe.steps[0]} isActive recipe={recipe} />

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <TouchableOpacity
          style={styles.aiAssistantBanner}
          onPress={onAskChef}
          activeOpacity={0.8}
          disabled={!onAskChef}
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

        <VoiceIndicator isListening={isListening} isSpeaking={isSpeaking} />
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
            <Text style={[styles.controlButtonText, currentStep === 1 && styles.controlButtonTextDisabled]}>
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
  loadingText: {
    ...typography.body,
    color: colors.cookingTextSecondary,
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
  },
  progressBar: {
    width: "100%",
    height: 4,
    backgroundColor: colors.cookingTextSecondary + "20",
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.primary,
  },
  stepIndicatorText: {
    ...typography.caption,
    color: colors.cookingTextSecondary,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.cookingTextSecondary + "20",
    backgroundColor: colors.cookingBackground,
  },
  aiAssistantBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.cookingSurface,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.cookingTextSecondary + "15",
    opacity: 1,
  },
  aiIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary + "20",
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  aiTextContainer: {
    flex: 1,
  },
  aiTitle: {
    ...typography.body,
    color: colors.cookingText,
    fontWeight: "600",
  },
  aiSubtitle: {
    ...typography.caption,
    color: colors.cookingTextSecondary,
    marginTop: 2,
  },
  controls: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  controlButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.cookingSurface,
    borderWidth: 1,
    borderColor: colors.cookingTextSecondary + "20",
  },
  controlButtonDisabled: {
    opacity: 0.5,
  },
  controlButtonText: {
    ...typography.body,
    color: colors.cookingBackground,
    fontWeight: "600",
  },
  controlButtonTextDisabled: {
    color: colors.textDisabled,
  },
  completeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
  },
  completeButtonText: {
    ...typography.body,
    color: colors.background,
    fontWeight: "700",
  },
});


import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { spacing, typography, borderRadius, shadows } from "../src/constants/DesignTokens";
import { useThemeColors } from "../src/hooks/useThemeColors";
import ProfileScreen from "./(tabs)/profile";
import LoginScreen from "./login";
import SettingsScreen from "./settings";
import HelpScreen from "./help";
import AboutScreen from "./about";

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
  const [activeView, setActiveView] = useState<"recipe" | "profile" | "login" | "settings" | "help" | "about">("recipe");
  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(
    new Set()
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
      <View style={[styles.deviceFrame, { backgroundColor: c.background }]}>
        {/* Status bar notch */}
        <View style={styles.notch} />

        {/* Content: Recipe or Profile */}
        {activeView === "recipe" ? (
          <>
            <View style={[styles.header, { backgroundColor: c.primary }]}>
              <View>
                <Text style={[styles.headerEyebrow, { color: c.headerAccent }]}>AI Cooking Assistant</Text>
                <Text style={styles.headerTitle}>Today&apos;s Recipe</Text>
              </View>
              <View style={styles.headerIcon}>
                <Text style={styles.headerIconEmoji}>🍳</Text>
              </View>
            </View>
            <ScrollView
          style={[styles.scroll, { backgroundColor: c.surfaceWarm }]}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Recipe header card */}
          <View style={[styles.recipeCard, { backgroundColor: c.card }]}>
            <View style={styles.recipeImageWrapper}>
              <Image
                source={{ uri: recipe.image }}
                style={styles.recipeImage}
                resizeMode="cover"
              />
              <View style={styles.recipeImageOverlay} />
              <View style={styles.recipeImageContent}>
                <View style={[styles.recipeChip, { backgroundColor: c.primary }]}>
                  <Text style={styles.recipeChipDot}>•</Text>
                  <Text style={styles.recipeChipText}>Featured recipe</Text>
                </View>
                <Text style={styles.recipeName}>{recipe.title}</Text>
              </View>
            </View>
            <View style={[styles.recipeMetaRow, { backgroundColor: c.surfaceWarm }]}>
              <View style={styles.recipeMetaItem}>
                <View style={[styles.metaIconBadge, { backgroundColor: c.surfaceWarmAlt }]}>
                  <Ionicons name="time-outline" size={16} color={c.primary} />
                </View>
                <Text style={[styles.metaLabel, { color: c.textSecondary }]}>Prep</Text>
                <Text style={[styles.metaValue, { color: c.text }]}>{recipe.prepTime}</Text>
              </View>
              <View style={styles.recipeMetaItem}>
                <View style={[styles.metaIconBadge, { backgroundColor: c.surfaceWarmAlt }]}>
                  <Ionicons name="flame-outline" size={16} color={c.primary} />
                </View>
                <Text style={[styles.metaLabel, { color: c.textSecondary }]}>Cook</Text>
                <Text style={[styles.metaValue, { color: c.text }]}>{recipe.cookTime}</Text>
              </View>
              <View style={styles.recipeMetaItem}>
                <View style={[styles.metaIconBadge, { backgroundColor: c.surfaceWarmAlt }]}>
                  <Ionicons name="people-outline" size={16} color={c.primary} />
                </View>
                <Text style={[styles.metaLabel, { color: c.textSecondary }]}>Serves</Text>
                <Text style={[styles.metaValue, { color: c.text }]}>{recipe.servings}</Text>
              </View>
            </View>
          </View>

          {/* Ingredients */}
          <View style={[styles.ingredientsCard, { backgroundColor: c.surfaceWarm }]}>
            <View style={styles.ingredientsHeaderRow}>
              <View style={[styles.ingredientsAccent, { backgroundColor: c.primary }]} />
              <Text style={[styles.ingredientsTitle, { color: c.text }]}>Ingredients</Text>
              <View style={{ flex: 1 }} />
              <Text style={[styles.ingredientsAdjust, { color: c.primary }]}>Adjust for guests</Text>
            </View>
            {recipe.ingredients.map((item) => {
              const isChecked = checkedIngredients.has(item.id);
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.ingredientRow, { backgroundColor: c.background, borderTopColor: c.ingredientBorder }]}
                  activeOpacity={0.8}
                  onPress={() => toggleIngredient(item.id)}
                >
                  <View style={styles.ingredientLeft}>
                    <View style={styles.checkboxOuter}>
                      {isChecked ? (
                        <Ionicons name="checkmark-circle" size={20} color={c.primary} />
                      ) : (
                        <Ionicons name="ellipse-outline" size={20} color={c.textSecondary} />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.ingredientName,
                        { color: c.text },
                        isChecked && { color: c.textSecondary, textDecorationLine: "line-through" as const },
                      ]}
                    >
                      {item.name}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.ingredientAmount,
                      { color: c.primary },
                      isChecked && { color: c.textSecondary, fontWeight: "400" as const },
                    ]}
                  >
                    {item.amount}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Steps */}
          <View style={[styles.stepsCard, { backgroundColor: c.card }]}>
            <View style={styles.stepsHeaderRow}>
              <Ionicons name="restaurant-outline" size={18} color={c.primary} />
              <Text style={[styles.stepsTitle, { color: c.text }]}>Cooking steps</Text>
            </View>
            {recipe.steps.map((step) => (
              <View key={step.id} style={styles.stepRow}>
                <View style={[styles.stepNumberCircle, { backgroundColor: c.surfaceWarm }]}>
                  <Text style={[styles.stepNumberText, { color: c.primary }]}>{step.id}</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={[styles.stepInstruction, { color: c.text }]}>{step.instruction}</Text>
                  {step.duration && (
                    <View style={[styles.stepDurationChip, { backgroundColor: c.surfaceWarm }]}>
                      <Ionicons name="time-outline" size={12} color={c.primary} />
                      <Text style={[styles.stepDurationText, { color: c.primary }]}>
                        {step.duration}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
          </>
        ) : activeView === "profile" ? (
          <View style={[styles.profileContainer, { backgroundColor: c.background }]}>
            <ProfileScreen
              onNavigateToLogin={() => setActiveView("login")}
              onNavigateToSettings={() => setActiveView("settings")}
              onNavigateToHelp={() => setActiveView("help")}
              onNavigateToAbout={() => setActiveView("about")}
              onLogout={() => setActiveView("login")}
            />
          </View>
        ) : activeView === "settings" ? (
          <View style={[styles.innerViewContainer, { backgroundColor: c.background }]}>
            <SettingsScreen onBack={() => setActiveView("profile")} />
          </View>
        ) : activeView === "help" ? (
          <View style={[styles.innerViewContainer, { backgroundColor: c.background }]}>
            <HelpScreen onBack={() => setActiveView("profile")} />
          </View>
        ) : activeView === "about" ? (
          <View style={[styles.innerViewContainer, { backgroundColor: c.background }]}>
            <AboutScreen onBack={() => setActiveView("profile")} />
          </View>
        ) : (
          <View style={[styles.innerViewContainer, { backgroundColor: c.background }]}>
            <TouchableOpacity
              style={styles.loginBackButton}
              onPress={() => setActiveView("profile")}
            >
              <Ionicons name="arrow-back" size={20} color={c.text} />
              <Text style={[styles.loginBackText, { color: c.text }]}>Back</Text>
            </TouchableOpacity>
            <LoginScreen onLoginSuccess={() => setActiveView("recipe")} />
          </View>
        )}

        {/* Bottom nav / AI CTA */}
        <View style={[styles.bottomBar, { backgroundColor: c.background, borderTopColor: c.border }]}>
          <TouchableOpacity
            style={styles.bottomItem}
            onPress={() => setActiveView("recipe")}
          >
            <Text style={activeView === "recipe" ? styles.bottomIcon : styles.bottomIconInactive}>🏠</Text>
            <Text style={[activeView === "recipe" ? styles.bottomLabelActive : styles.bottomLabel, activeView === "recipe" && { color: c.primary }]}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bottomItem}>
            <Text style={styles.bottomIconInactive}>🔍</Text>
            <Text style={styles.bottomLabel}>Search</Text>
          </TouchableOpacity>
          <View style={styles.bottomCenterFabWrapper}>
            <TouchableOpacity style={[styles.bottomFab, { backgroundColor: c.primary }]}>
              <Ionicons name="sparkles" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.bottomItem}>
            <Text style={styles.bottomIconInactive}>❤️</Text>
            <Text style={styles.bottomLabel}>Saved</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.bottomItem}
            onPress={() => setActiveView("profile")}
          >
            <Text style={activeView !== "recipe" ? styles.bottomIcon : styles.bottomIconInactive}>👤</Text>
            <Text style={[activeView !== "recipe" ? styles.bottomLabelActive : styles.bottomLabel, activeView !== "recipe" && { color: c.primary }]}>Profile</Text>
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
    maxWidth: "100%",
    height: 844,
    maxHeight: "100%",
    borderRadius: 48,
    borderWidth: 8,
    borderColor: "#020617",
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerEyebrow: {
    ...typography.caption,
  },
  headerTitle: {
    ...typography.h2,
    color: "#FFFFFF",
    marginTop: 2,
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
  profileContainer: {
    flex: 1,
    minHeight: 0,
    paddingTop: 36,
  },
  innerViewContainer: {
    flex: 1,
    minHeight: 0,
    paddingTop: 36,
  },
  loginBackButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  loginBackText: {
    ...typography.body,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 80,
    gap: spacing.lg,
  },
  recipeCard: {
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
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
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
  },
  recipeChipDot: {
    color: "#FFFFFF",
    marginRight: 4,
  },
  recipeChipText: {
    ...typography.caption,
    color: "#FFFFFF",
    fontSize: 11,
    textTransform: "uppercase",
  },
  recipeName: {
    ...typography.h2,
    color: "#FFFFFF",
    marginTop: spacing.sm,
  },
  recipeMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  recipeMetaItem: {
    flex: 1,
    alignItems: "center",
  },
  metaIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  metaLabel: {
    ...typography.caption,
    fontSize: 11,
  },
  metaValue: {
    ...typography.caption,
    fontWeight: "600",
    fontSize: 11,
  },
  ingredientsCard: {
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
    marginRight: spacing.sm,
  },
  ingredientsTitle: {
    ...typography.body,
    fontWeight: "600",
  },
  ingredientsAdjust: {
    ...typography.caption,
    textDecorationLine: "underline",
    fontSize: 12,
  },
  ingredientRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
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
    flexShrink: 1,
  },
  ingredientAmount: {
    ...typography.caption,
    fontWeight: "600",
  },
  stepsCard: {
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
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: {
    ...typography.caption,
    fontWeight: "600",
  },
  stepContent: {
    flex: 1,
  },
  stepInstruction: {
    ...typography.body,
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
  },
  stepDurationText: {
    ...typography.caption,
    fontSize: 11,
  },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 64,
    borderTopWidth: 1,
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
  },
  bottomLabel: {
    ...typography.caption,
    fontSize: 11,
    color: "#9E9E9E",
  },
  bottomCenterFabWrapper: {
    marginTop: -24,
  },
  bottomFab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.md,
  },
});

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
import { colors, spacing, typography, borderRadius, shadows } from "../src/constants/DesignTokens";

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
      <View style={styles.deviceFrame}>
        {/* Status bar notch */}
        <View style={styles.notch} />

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerEyebrow}>AI Cooking Assistant</Text>
            <Text style={styles.headerTitle}>Today&apos;s Recipe</Text>
          </View>
          <View style={styles.headerIcon}>
            <Text style={styles.headerIconEmoji}>🍳</Text>
          </View>
        </View>

        {/* Content */}
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

        {/* Bottom nav / AI CTA */}
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.bottomItem}>
            <Text style={styles.bottomIcon}>🏠</Text>
            <Text style={styles.bottomLabelActive}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bottomItem}>
            <Text style={styles.bottomIconInactive}>🔍</Text>
            <Text style={styles.bottomLabel}>Search</Text>
          </TouchableOpacity>
          <View style={styles.bottomCenterFabWrapper}>
            <TouchableOpacity style={styles.bottomFab}>
              <Ionicons name="sparkles" size={20} color={colors.background} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.bottomItem}>
            <Text style={styles.bottomIconInactive}>❤️</Text>
            <Text style={styles.bottomLabel}>Saved</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bottomItem}>
            <Text style={styles.bottomIconInactive}>👤</Text>
            <Text style={styles.bottomLabel}>Profile</Text>
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
  headerEyebrow: {
    ...typography.caption,
    color: "#FED7AA",
  },
  headerTitle: {
    ...typography.h2,
    color: colors.background,
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
  bottomCenterFabWrapper: {
    marginTop: -24,
  },
  bottomFab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.md,
  },
});


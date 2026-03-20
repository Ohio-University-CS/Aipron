import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { spacing, borderRadius, typography, shadows } from "../src/constants/DesignTokens";
import { useThemeColors } from "../src/hooks/useThemeColors";

const features = [
  {
    icon: "sparkles" as const,
    color: "#FF6B35",
    title: "AI Recipe Generation",
    description: "Get personalized recipes crafted by AI based on your taste and dietary needs.",
  },
  {
    icon: "basket-outline" as const,
    color: "#10B981",
    title: "Smart Pantry",
    description: "Track ingredients at home and discover recipes you can make right now.",
  },
  {
    icon: "restaurant-outline" as const,
    color: "#3B82F6",
    title: "Step-by-Step Cooking",
    description: "Follow guided cooking sessions with built-in timers and voice assistance.",
  },
  {
    icon: "heart-outline" as const,
    color: "#EF4444",
    title: "Save Favorites",
    description: "Bookmark recipes you love and build your personal cookbook.",
  },
  {
    icon: "mic-outline" as const,
    color: "#8B5CF6",
    title: "Voice Assistant",
    description: "Hands-free cooking guidance powered by real-time AI voice interaction.",
  },
  {
    icon: "nutrition-outline" as const,
    color: "#F59E0B",
    title: "Dietary Filters",
    description: "Support for vegetarian, vegan, gluten-free, keto, halal, and more.",
  },
];

interface AboutScreenProps {
  onBack?: () => void;
}

export default function AboutScreen({ onBack }: AboutScreenProps = {}) {
  const c = useThemeColors();

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      {onBack && (
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color={c.text} />
          <Text style={[styles.backText, { color: c.text }]}>Back</Text>
        </TouchableOpacity>
      )}

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <View style={[styles.logoWrap, { backgroundColor: c.primary + "18" }]}>
            <Text style={styles.logoEmoji}>🍳</Text>
          </View>
          <Text style={[styles.appName, { color: c.text }]}>AIpron</Text>
          <Text style={[styles.version, { color: c.primary }]}>Version 1.0.0</Text>
          <Text style={[styles.tagline, { color: c.textSecondary }]}>
            Your AI-powered cooking companion. From pantry to plate, we make every meal an adventure.
          </Text>
        </View>

        <Text style={[styles.sectionHeader, { color: c.textSecondary }]}>WHAT AIPRON CAN DO</Text>
        <View style={styles.featuresGrid}>
          {features.map((feature, index) => (
            <View key={index} style={[styles.featureCard, { backgroundColor: c.surface, ...shadows.sm }]}>
              <View style={[styles.featureIconWrap, { backgroundColor: feature.color + "18" }]}>
                <Ionicons name={feature.icon} size={22} color={feature.color} />
              </View>
              <Text style={[styles.featureTitle, { color: c.text }]}>{feature.title}</Text>
              <Text style={[styles.featureDescription, { color: c.textSecondary }]}>{feature.description}</Text>
            </View>
          ))}
        </View>

        <Text style={[styles.sectionHeader, { color: c.textSecondary }]}>APP INFO</Text>
        <View style={[styles.infoCard, { backgroundColor: c.surface, ...shadows.sm }]}>
          <InfoRow label="Platform" value="React Native / Expo" c={c} />
          <InfoRow label="Backend" value="Node.js + Supabase" c={c} />
          <InfoRow label="AI Model" value="OpenAI GPT" c={c} />
          <InfoRow label="Last Updated" value="March 2026" c={c} />
          <InfoRow label="Developer" value="AIpron Team" c={c} last />
        </View>

        <Text style={[styles.sectionHeader, { color: c.textSecondary }]}>LEGAL</Text>
        <View style={[styles.infoCard, { backgroundColor: c.surface, ...shadows.sm }]}>
          <View style={[styles.legalRow, { borderBottomColor: c.border }]}>
            <Text style={[styles.legalText, { color: c.textSecondary }]}>
              AIpron generates recipe suggestions using AI. Always verify ingredient safety, especially regarding allergies and dietary restrictions. AIpron is not liable for adverse reactions to generated recipes.
            </Text>
          </View>
          <View style={styles.legalRow}>
            <Text style={[styles.legalText, { color: c.textSecondary }]}>
              © 2026 AIpron. All rights reserved.
            </Text>
          </View>
        </View>

        <View style={{ height: spacing.xxl * 2 }} />
      </ScrollView>
    </View>
  );
}

function InfoRow({ label, value, c, last }: { label: string; value: string; c: ReturnType<typeof useThemeColors>; last?: boolean }) {
  return (
    <View style={[styles.infoRow, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border }]}>
      <Text style={[styles.infoLabel, { color: c.textSecondary }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: c.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  backText: {
    ...typography.body,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  heroSection: {
    alignItems: "center",
    paddingVertical: spacing.xl,
  },
  logoWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  logoEmoji: {
    fontSize: 42,
  },
  appName: {
    ...typography.h1,
    marginBottom: spacing.xs,
  },
  version: {
    ...typography.caption,
    fontWeight: "600",
    marginBottom: spacing.md,
  },
  tagline: {
    ...typography.body,
    textAlign: "center",
    paddingHorizontal: spacing.lg,
  },
  sectionHeader: {
    ...typography.caption,
    fontWeight: "600",
    letterSpacing: 0.5,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  featuresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: spacing.md,
  },
  featureCard: {
    width: "48%",
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  featureIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  featureTitle: {
    ...typography.caption,
    fontWeight: "600",
  },
  featureDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  infoCard: {
    borderRadius: borderRadius.lg,
    overflow: "hidden",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  infoLabel: {
    ...typography.caption,
  },
  infoValue: {
    ...typography.body,
    fontWeight: "500",
  },
  legalRow: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  legalText: {
    ...typography.caption,
    lineHeight: 18,
  },
});

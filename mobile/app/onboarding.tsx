import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "../src/components/LinearGradient";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GradientButton } from "../src/components/GradientButton";
import { Chip } from "../src/components/Chip";
import { useThemeColors } from "../src/hooks/useThemeColors";
import { StitchImages } from "../src/constants/StitchImages";
import {
  spacing,
  fonts,
  typography,
  borderRadius,
} from "../src/constants/DesignTokens";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const HERO_HEIGHT = 520;

const FEATURES = [
  {
    icon: "inventory-2" as const,
    title: "Smart Inventory",
    body: "Scan your ingredients and we'll tell you exactly what you can make right now.",
  },
  {
    icon: "auto-awesome" as const,
    title: "AI Guidance",
    body: "Personalized chef tips that adapt to your skill level and taste profile.",
  },
  {
    icon: "menu-book" as const,
    title: "Visual Journals",
    body: "Document your culinary journey with beautiful, auto-generated food logs.",
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const theme = useThemeColors();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero image with gradient fade */}
        <View style={styles.heroContainer}>
          <Image
            source={{ uri: StitchImages.onboardingHero }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={[
              "transparent",
              theme.background + "66",
              theme.background,
            ]}
            locations={[0, 0.5, 1]}
            style={StyleSheet.absoluteFill}
          />
          {/* Branding anchor */}
          <View style={[styles.brandAnchor, { top: insets.top + 16 }]}>
            <Text style={[styles.brandText, { color: theme.primary }]}>
              AIpron
            </Text>
          </View>
        </View>

        {/* Content canvas — overlaps hero */}
        <View style={styles.contentCanvas}>
          <Chip label="Est. 2024" icon="restaurant-menu" variant="filled" size="sm" />

          <Text style={[styles.headline, { color: theme.onBackground }]}>
            Meet your new{"\n"}
            <Text style={[styles.headlineItalic, { color: theme.primary }]}>
              chef friend.
            </Text>
          </Text>

          <Text style={[styles.bodyText, { color: theme.onSurfaceVariant }]}>
            AIpron helps you turn your pantry into a gourmet experience.
            Intelligent recipes tailored to what you already have.
          </Text>

          {/* Action cluster */}
          <View style={styles.actions}>
            <GradientButton
              title="Get Started"
              onPress={() => router.push("/(tabs)/chat")}
              style={styles.ctaButton}
            />
            <TouchableOpacity
              onPress={() => router.push("/login")}
              style={styles.signInRow}
              activeOpacity={0.7}
            >
              <Text style={[styles.signInText, { color: theme.onSurfaceVariant }]}>
                Sign In
              </Text>
              <MaterialIcons
                name="arrow-forward"
                size={18}
                color={theme.onSurfaceVariant}
              />
            </TouchableOpacity>
          </View>

          {/* Feature cards */}
          <View style={[styles.featureSection, { borderTopColor: theme.outlineVariant + "26" }]}>
            {FEATURES.map((f) => (
              <View key={f.title} style={styles.featureCard}>
                <View style={[styles.featureIcon, { backgroundColor: theme.surfaceContainer }]}>
                  <MaterialIcons name={f.icon as any} size={24} color={theme.primary} />
                </View>
                <Text style={[styles.featureTitle, { color: theme.onSurface }]}>
                  {f.title}
                </Text>
                <Text style={[styles.featureBody, { color: theme.onSurfaceVariant }]}>
                  {f.body}
                </Text>
              </View>
            ))}
          </View>

          {/* Footer */}
          <View style={styles.footerRow}>
            <Text style={[styles.footerText, { color: theme.outline }]}>
              © 2024 AIpron Digital Curator
            </Text>
            <View style={styles.footerLinks}>
              <TouchableOpacity activeOpacity={0.7} onPress={() => router.push("/login")}>
                <Text style={[styles.footerLink, { color: theme.outline }]}>Privacy</Text>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.7} onPress={() => router.push("/login")}>
                <Text style={[styles.footerLink, { color: theme.outline }]}>Terms</Text>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.7} onPress={() => router.push("/login")}>
                <Text style={[styles.footerLink, { color: theme.outline }]}>Support</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
  },
  heroContainer: {
    width: SCREEN_WIDTH,
    height: HERO_HEIGHT,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  brandAnchor: {
    position: "absolute",
    left: spacing.screenPadding,
    zIndex: 10,
  },
  brandText: {
    fontFamily: fonts.serifItalic,
    fontSize: 32,
    letterSpacing: -0.5,
  },
  contentCanvas: {
    marginTop: -80,
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.sectionGap,
    zIndex: 20,
  },
  headline: {
    ...typography.displayXL,
    lineHeight: 54,
    letterSpacing: -0.5,
    marginTop: spacing.xl,
  },
  headlineItalic: {
    fontFamily: fonts.serifItalic,
    fontWeight: "400",
  },
  bodyText: {
    ...typography.bodyLg,
    marginTop: spacing.lg,
    maxWidth: 340,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xl,
    marginTop: spacing.xxl + 8,
  },
  ctaButton: {
    flex: 0,
  },
  signInRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.md,
  },
  signInText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  featureSection: {
    marginTop: spacing.sectionGap + 16,
    borderTopWidth: 1,
    paddingTop: spacing.xxl + 8,
    gap: spacing.xxl + 8,
  },
  featureCard: {
    gap: spacing.md,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  featureTitle: {
    fontFamily: fonts.serif,
    fontSize: 22,
    lineHeight: 28,
  },
  featureBody: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 22,
  },
  footer: {
    marginTop: spacing.sectionGap,
    fontFamily: fonts.sansSemiBold,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 2,
    textAlign: "center",
  },
  footerRow: {
    marginTop: spacing.sectionGap,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  footerText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  footerLinks: {
    flexDirection: "row",
    gap: spacing.xl,
  },
  footerLink: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
});

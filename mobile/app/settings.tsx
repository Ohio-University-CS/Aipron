import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { spacing, borderRadius, typography, shadows } from "../src/constants/DesignTokens";
import { useThemeColors } from "../src/hooks/useThemeColors";
import { useThemeStore } from "../src/store/useThemeStore";

type SubView =
  | null
  | "language"
  | "dietary"
  | "export"
  | "clearCache"
  | "privacy"
  | "appVersion"
  | "terms"
  | "rate";

interface SettingsScreenProps {
  onBack?: () => void;
}

export default function SettingsScreen({ onBack }: SettingsScreenProps = {}) {
  const c = useThemeColors();
  const { mode, toggleMode } = useThemeStore();
  const isDark = mode === "dark";

  const [subView, setSubView] = useState<SubView>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [cookingTimerSound, setCookingTimerSound] = useState(true);
  const [metricUnits, setMetricUnits] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const [dietaryPrefs, setDietaryPrefs] = useState({
    vegetarian: false,
    vegan: false,
    glutenFree: false,
    dairyFree: false,
    nutFree: false,
    halal: false,
    keto: false,
    lowCarb: false,
  });
  const [userRating, setUserRating] = useState(0);
  const [cacheCleared, setCacheCleared] = useState(false);

  const toggleDietaryPref = (key: keyof typeof dietaryPrefs) => {
    setDietaryPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const ToggleRow = ({
    icon,
    label,
    value,
    onToggle,
    iconColor,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value: boolean;
    onToggle: () => void;
    iconColor?: string;
  }) => (
    <View style={[styles.row, { backgroundColor: c.surface, borderBottomColor: c.border }]}>
      <View style={[styles.rowIconWrap, { backgroundColor: (iconColor ?? c.primary) + "18" }]}>
        <Ionicons name={icon} size={18} color={iconColor ?? c.primary} />
      </View>
      <Text style={[styles.rowLabel, { color: c.text }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: c.border, true: c.primary }}
        thumbColor="#FFFFFF"
      />
    </View>
  );

  const NavRow = ({
    icon,
    label,
    iconColor,
    detail,
    onPress,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    iconColor?: string;
    detail?: string;
    onPress?: () => void;
  }) => (
    <TouchableOpacity
      style={[styles.row, { backgroundColor: c.surface, borderBottomColor: c.border }]}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View style={[styles.rowIconWrap, { backgroundColor: (iconColor ?? c.primary) + "18" }]}>
        <Ionicons name={icon} size={18} color={iconColor ?? c.primary} />
      </View>
      <Text style={[styles.rowLabel, { color: c.text }]}>{label}</Text>
      {detail && <Text style={[styles.rowDetail, { color: c.textSecondary }]}>{detail}</Text>}
      <Ionicons name="chevron-forward" size={18} color={c.textSecondary} />
    </TouchableOpacity>
  );

  const SubViewHeader = ({ title }: { title: string }) => (
    <View style={styles.subViewHeader}>
      <TouchableOpacity style={styles.backButton} onPress={() => setSubView(null)} activeOpacity={0.7}>
        <Ionicons name="arrow-back" size={20} color={c.text} />
        <Text style={[styles.backText, { color: c.text }]}>Settings</Text>
      </TouchableOpacity>
      <Text style={[styles.title, { color: c.text }]}>{title}</Text>
    </View>
  );

  const SectionHeader = ({ title }: { title: string }) => (
    <Text style={[styles.sectionHeader, { color: c.textSecondary }]}>{title}</Text>
  );

  // --- Sub-views ---

  if (subView === "language") {
    const languages = ["English", "Spanish", "French", "German", "Italian", "Portuguese", "Japanese", "Korean", "Chinese"];
    return (
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <SubViewHeader title="Language" />
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            {languages.map((lang) => (
              <TouchableOpacity
                key={lang}
                style={[styles.row, { backgroundColor: c.surface, borderBottomColor: c.border }]}
                activeOpacity={0.7}
                onPress={() => setSelectedLanguage(lang)}
              >
                <Text style={[styles.rowLabel, { color: c.text }]}>{lang}</Text>
                {selectedLanguage === lang && (
                  <Ionicons name="checkmark-circle" size={22} color={c.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  if (subView === "dietary") {
    const prefs: { key: keyof typeof dietaryPrefs; label: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
      { key: "vegetarian", label: "Vegetarian", icon: "leaf-outline", color: "#10B981" },
      { key: "vegan", label: "Vegan", icon: "flower-outline", color: "#059669" },
      { key: "glutenFree", label: "Gluten-Free", icon: "warning-outline", color: "#F59E0B" },
      { key: "dairyFree", label: "Dairy-Free", icon: "water-outline", color: "#3B82F6" },
      { key: "nutFree", label: "Nut-Free", icon: "close-circle-outline", color: "#EF4444" },
      { key: "halal", label: "Halal", icon: "checkmark-circle-outline", color: "#8B5CF6" },
      { key: "keto", label: "Keto", icon: "flame-outline", color: "#F97316" },
      { key: "lowCarb", label: "Low Carb", icon: "trending-down-outline", color: "#14B8A6" },
    ];
    return (
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <SubViewHeader title="Dietary Preferences" />
        <Text style={[styles.subDescription, { color: c.textSecondary }]}>
          Select your dietary preferences to get personalized recipe suggestions.
        </Text>
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            {prefs.map((p) => (
              <ToggleRow
                key={p.key}
                icon={p.icon}
                label={p.label}
                value={dietaryPrefs[p.key]}
                onToggle={() => toggleDietaryPref(p.key)}
                iconColor={p.color}
              />
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  if (subView === "export") {
    return (
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <SubViewHeader title="Export My Data" />
        <View style={styles.centeredContent}>
          <View style={[styles.bigIconWrap, { backgroundColor: "#6366F1" + "18" }]}>
            <Ionicons name="cloud-download-outline" size={48} color="#6366F1" />
          </View>
          <Text style={[styles.centeredTitle, { color: c.text }]}>Download Your Data</Text>
          <Text style={[styles.centeredDescription, { color: c.textSecondary }]}>
            Export all your recipes, preferences, and cooking history as a downloadable file.
          </Text>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: c.primary }]}
            activeOpacity={0.7}
            onPress={() => Alert.alert("Export Started", "Your data export is being prepared. You'll receive a notification when it's ready.")}
          >
            <Ionicons name="download-outline" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Request Data Export</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (subView === "clearCache") {
    return (
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <SubViewHeader title="Clear Cache" />
        <View style={styles.centeredContent}>
          <View style={[styles.bigIconWrap, { backgroundColor: "#EF4444" + "18" }]}>
            <Ionicons name={cacheCleared ? "checkmark-circle" : "trash-outline"} size={48} color={cacheCleared ? "#10B981" : "#EF4444"} />
          </View>
          <Text style={[styles.centeredTitle, { color: c.text }]}>
            {cacheCleared ? "Cache Cleared!" : "Clear App Cache"}
          </Text>
          <Text style={[styles.centeredDescription, { color: c.textSecondary }]}>
            {cacheCleared
              ? "All cached data has been removed. The app may take a moment to reload images and data."
              : "Free up storage by removing cached images, search results, and temporary data. Your saved recipes and account data won't be affected."}
          </Text>
          {!cacheCleared && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: "#EF4444" }]}
              activeOpacity={0.7}
              onPress={() => setCacheCleared(true)}
            >
              <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Clear Cache</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  if (subView === "privacy") {
    return (
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <SubViewHeader title="Privacy Policy" />
        <ScrollView style={styles.scroll} contentContainerStyle={styles.textContent} showsVerticalScrollIndicator={false}>
          <Text style={[styles.docTitle, { color: c.text }]}>Privacy Policy</Text>
          <Text style={[styles.docDate, { color: c.textSecondary }]}>Last updated: March 2026</Text>
          <Text style={[styles.docHeading, { color: c.text }]}>1. Information We Collect</Text>
          <Text style={[styles.docBody, { color: c.textSecondary }]}>
            We collect information you provide when creating an account, including your email address, name, and dietary preferences. We also collect usage data such as recipe views, cooking history, and app interaction patterns.
          </Text>
          <Text style={[styles.docHeading, { color: c.text }]}>2. How We Use Your Information</Text>
          <Text style={[styles.docBody, { color: c.textSecondary }]}>
            Your information is used to personalize recipe recommendations, improve our AI cooking assistant, and provide customer support. We never sell your personal data to third parties.
          </Text>
          <Text style={[styles.docHeading, { color: c.text }]}>3. Data Storage & Security</Text>
          <Text style={[styles.docBody, { color: c.textSecondary }]}>
            All data is encrypted in transit and at rest. We use industry-standard security measures to protect your information. You can request data deletion at any time.
          </Text>
          <Text style={[styles.docHeading, { color: c.text }]}>4. Cookies & Analytics</Text>
          <Text style={[styles.docBody, { color: c.textSecondary }]}>
            We use analytics to understand how users interact with the app. You can opt out of analytics tracking in the notification settings.
          </Text>
          <Text style={[styles.docHeading, { color: c.text }]}>5. Contact Us</Text>
          <Text style={[styles.docBody, { color: c.textSecondary }]}>
            If you have questions about this privacy policy, please contact us at privacy@aipron.app.
          </Text>
          <View style={{ height: spacing.xxl * 2 }} />
        </ScrollView>
      </View>
    );
  }

  if (subView === "terms") {
    return (
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <SubViewHeader title="Terms of Service" />
        <ScrollView style={styles.scroll} contentContainerStyle={styles.textContent} showsVerticalScrollIndicator={false}>
          <Text style={[styles.docTitle, { color: c.text }]}>Terms of Service</Text>
          <Text style={[styles.docDate, { color: c.textSecondary }]}>Effective: March 2026</Text>
          <Text style={[styles.docHeading, { color: c.text }]}>1. Acceptance of Terms</Text>
          <Text style={[styles.docBody, { color: c.textSecondary }]}>
            By using AIpron, you agree to these Terms of Service. If you do not agree, please do not use the app.
          </Text>
          <Text style={[styles.docHeading, { color: c.text }]}>2. Use of Service</Text>
          <Text style={[styles.docBody, { color: c.textSecondary }]}>
            AIpron provides AI-powered cooking assistance, recipe suggestions, and meal planning tools. The service is intended for personal, non-commercial use.
          </Text>
          <Text style={[styles.docHeading, { color: c.text }]}>3. User Accounts</Text>
          <Text style={[styles.docBody, { color: c.textSecondary }]}>
            You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized use.
          </Text>
          <Text style={[styles.docHeading, { color: c.text }]}>4. Content & Recipes</Text>
          <Text style={[styles.docBody, { color: c.textSecondary }]}>
            Recipes generated by our AI are suggestions only. Always verify ingredient safety, especially for allergies. AIpron is not liable for adverse reactions.
          </Text>
          <Text style={[styles.docHeading, { color: c.text }]}>5. Limitation of Liability</Text>
          <Text style={[styles.docBody, { color: c.textSecondary }]}>
            AIpron is provided "as is" without warranties. We are not liable for any indirect, incidental, or consequential damages arising from your use of the service.
          </Text>
          <View style={{ height: spacing.xxl * 2 }} />
        </ScrollView>
      </View>
    );
  }

  if (subView === "appVersion") {
    return (
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <SubViewHeader title="About AIpron" />
        <View style={styles.centeredContent}>
          <View style={[styles.bigIconWrap, { backgroundColor: "#8B5CF6" + "18" }]}>
            <Text style={{ fontSize: 42 }}>🍳</Text>
          </View>
          <Text style={[styles.centeredTitle, { color: c.text }]}>AIpron</Text>
          <Text style={[styles.versionText, { color: c.primary }]}>Version 1.0.0 (Build 42)</Text>
          <Text style={[styles.centeredDescription, { color: c.textSecondary }]}>
            Your AI-powered cooking companion. Personalized recipes, smart pantry management, and step-by-step cooking guidance.
          </Text>
          <View style={[styles.infoCard, { backgroundColor: c.surface }]}>
            <InfoRow label="Platform" value="React Native / Expo" color={c} />
            <InfoRow label="API Version" value="v2.1" color={c} />
            <InfoRow label="Last Updated" value="March 2026" color={c} />
            <InfoRow label="Developer" value="AIpron Team" color={c} last />
          </View>
        </View>
      </View>
    );
  }

  if (subView === "rate") {
    return (
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <SubViewHeader title="Rate AIpron" />
        <View style={styles.centeredContent}>
          <View style={[styles.bigIconWrap, { backgroundColor: "#F59E0B" + "18" }]}>
            <Text style={{ fontSize: 42 }}>
              {userRating >= 4 ? "🤩" : userRating >= 2 ? "😊" : "⭐"}
            </Text>
          </View>
          <Text style={[styles.centeredTitle, { color: c.text }]}>
            {userRating > 0 ? "Thanks for rating!" : "Enjoying AIpron?"}
          </Text>
          <Text style={[styles.centeredDescription, { color: c.textSecondary }]}>
            {userRating > 0
              ? `You gave us ${userRating} star${userRating > 1 ? "s" : ""}. Your feedback helps us improve!`
              : "Tap a star to let us know how we're doing. Your feedback helps us improve!"}
          </Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setUserRating(star)} activeOpacity={0.7}>
                <Ionicons
                  name={star <= userRating ? "star" : "star-outline"}
                  size={40}
                  color={star <= userRating ? "#F59E0B" : c.textDisabled}
                />
              </TouchableOpacity>
            ))}
          </View>
          {userRating > 0 && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: c.primary }]}
              activeOpacity={0.7}
              onPress={() => Alert.alert("Thank you!", "Your rating has been submitted.")}
            >
              <Text style={styles.actionButtonText}>Submit Rating</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  // --- Main settings view ---
  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      {onBack && (
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color={c.text} />
          <Text style={[styles.backText, { color: c.text }]}>Back</Text>
        </TouchableOpacity>
      )}

      <Text style={[styles.title, { color: c.text }]}>Settings</Text>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <SectionHeader title="APPEARANCE" />
        <View style={styles.card}>
          <ToggleRow
            icon={isDark ? "moon" : "sunny"}
            label="Dark Mode"
            value={isDark}
            onToggle={toggleMode}
            iconColor={isDark ? "#7C3AED" : "#FF9800"}
          />
        </View>

        <SectionHeader title="NOTIFICATIONS" />
        <View style={styles.card}>
          <ToggleRow
            icon="notifications-outline"
            label="Push Notifications"
            value={notificationsEnabled}
            onToggle={() => setNotificationsEnabled((v) => !v)}
            iconColor="#EF4444"
          />
          <ToggleRow
            icon="musical-note-outline"
            label="Timer Sound"
            value={cookingTimerSound}
            onToggle={() => setCookingTimerSound((v) => !v)}
            iconColor="#EC4899"
          />
        </View>

        <SectionHeader title="PREFERENCES" />
        <View style={styles.card}>
          <ToggleRow
            icon="scale-outline"
            label="Metric Units"
            value={metricUnits}
            onToggle={() => setMetricUnits((v) => !v)}
            iconColor="#10B981"
          />
          <NavRow icon="language-outline" label="Language" iconColor="#3B82F6" detail={selectedLanguage} onPress={() => setSubView("language")} />
          <NavRow icon="nutrition-outline" label="Dietary Preferences" iconColor="#F59E0B" onPress={() => setSubView("dietary")} />
        </View>

        <SectionHeader title="DATA & PRIVACY" />
        <View style={styles.card}>
          <NavRow icon="cloud-download-outline" label="Export My Data" iconColor="#6366F1" onPress={() => setSubView("export")} />
          <NavRow icon="trash-outline" label="Clear Cache" iconColor="#EF4444" onPress={() => { setCacheCleared(false); setSubView("clearCache"); }} />
          <NavRow icon="shield-checkmark-outline" label="Privacy Policy" iconColor="#14B8A6" onPress={() => setSubView("privacy")} />
        </View>

        <SectionHeader title="ABOUT" />
        <View style={styles.card}>
          <NavRow icon="information-circle-outline" label="App Version" iconColor="#8B5CF6" detail="1.0.0" onPress={() => setSubView("appVersion")} />
          <NavRow icon="document-text-outline" label="Terms of Service" iconColor="#64748B" onPress={() => setSubView("terms")} />
          <NavRow icon="star-outline" label="Rate the App" iconColor="#F59E0B" onPress={() => setSubView("rate")} />
        </View>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </View>
  );
}

function InfoRow({ label, value, color, last }: { label: string; value: string; color: ReturnType<typeof useThemeColors>; last?: boolean }) {
  return (
    <View style={[styles.infoRow, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: color.border }]}>
      <Text style={[styles.infoLabel, { color: color.textSecondary }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: color.text }]}>{value}</Text>
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
  title: {
    ...typography.h2,
    marginBottom: spacing.md,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  sectionHeader: {
    ...typography.caption,
    fontWeight: "600",
    letterSpacing: 0.5,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  card: {
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    ...shadows.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowIconWrap: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: {
    ...typography.body,
    flex: 1,
  },
  rowDetail: {
    ...typography.caption,
    marginRight: spacing.xs,
  },
  subViewHeader: {
    marginBottom: spacing.sm,
  },
  subDescription: {
    ...typography.caption,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  centeredContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    paddingBottom: 80,
  },
  bigIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xl,
  },
  centeredTitle: {
    ...typography.h2,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  centeredDescription: {
    ...typography.body,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  versionText: {
    ...typography.caption,
    fontWeight: "600",
    marginBottom: spacing.md,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  actionButtonText: {
    ...typography.body,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  starsRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  textContent: {
    paddingBottom: 80,
  },
  docTitle: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  docDate: {
    ...typography.caption,
    marginBottom: spacing.xl,
  },
  docHeading: {
    ...typography.body,
    fontWeight: "600",
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  docBody: {
    ...typography.body,
    lineHeight: 22,
  },
  infoCard: {
    width: "100%",
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    ...shadows.sm,
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
});

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
} from "react-native";
import Constants from "expo-constants";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  spacing,
  borderRadius,
  shadows,
  fonts,
} from "../src/constants/DesignTokens";
import { useThemeColors } from "../src/hooks/useThemeColors";
import { TopBar } from "../src/components/TopBar";
import { Chip } from "../src/components/Chip";
import { useSettingsStore, type AppLanguage } from "../src/store/useSettingsStore";
import { useAuthStore } from "../src/store/useAuthStore";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type SubView =
  | null
  | "language"
  | "dietary"
  | "clearCache"
  | "privacy"
  | "appVersion"
  | "terms"
  | "help"
  | "rate";

interface SettingsScreenProps {
  onBack?: () => void;
  /** Web Preview: open Chef tab in-frame instead of router.push to chat. */
  onNavigateToChat?: () => void;
  /** Web Preview: stay in-frame after sign-out instead of router.replace. */
  onSignOutSuccess?: () => void;
}

const DIETARY_OPTIONS: {
  key: keyof DietaryState;
  label: string;
  icon: string;
}[] = [
  { key: "vegetarian", label: "Vegetarian", icon: "eco" },
  { key: "vegan", label: "Vegan", icon: "spa" },
  { key: "glutenFree", label: "Gluten-Free", icon: "grain" },
  { key: "dairyFree", label: "Dairy-Free", icon: "water-drop" },
  { key: "nutFree", label: "Nut-Free", icon: "block" },
  { key: "halal", label: "Halal", icon: "check-circle" },
  { key: "keto", label: "Keto", icon: "local-fire-department" },
  { key: "lowCarb", label: "Low Carb", icon: "trending-down" },
];

interface DietaryState {
  vegetarian: boolean;
  vegan: boolean;
  glutenFree: boolean;
  dairyFree: boolean;
  nutFree: boolean;
  halal: boolean;
  keto: boolean;
  lowCarb: boolean;
}

function formatAboutVersionLine(): string {
  const v = Constants.expoConfig?.version ?? "1.1.0";
  const iosBuild = Constants.expoConfig?.ios?.buildNumber;
  const androidCode = Constants.expoConfig?.android?.versionCode;
  const build = iosBuild ?? (androidCode != null ? String(androidCode) : undefined);
  return build ? `Version ${v} (Build ${build})` : `Version ${v}`;
}

export default function SettingsScreen({
  onBack,
  onNavigateToChat,
  onSignOutSuccess,
}: SettingsScreenProps = {}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useThemeColors();
  const { language: selectedLanguage, setLanguage: setSelectedLanguage } = useSettingsStore();
  const { user, logout } = useAuthStore();

  const [subView, setSubView] = useState<SubView>(null);
  const [recipeReminders, setRecipeReminders] = useState(true);
  const [weeklyInspiration, setWeeklyInspiration] = useState(true);
  const [cookingTimerAlerts, setCookingTimerAlerts] = useState(true);
  const [dietaryPrefs, setDietaryPrefs] = useState<DietaryState>({
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

  const toggleDietaryPref = (key: keyof DietaryState) => {
    setDietaryPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const topBarHeight = insets.top + spacing.sm + 56;

  const userName =
    (user?.user_metadata as any)?.name ||
    user?.email?.split("@")[0] ||
    "Guest cook";
  const userEmail = user?.email ?? "Not signed in";

  const handleSignOut = () => {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await logout();
            if (onSignOutSuccess) onSignOutSuccess();
            else router.replace("/login");
          } catch (e) {
            Alert.alert("Error", "Could not sign out. Please try again.");
          }
        },
      },
    ]);
  };

  const SectionHeader = ({ title }: { title: string }) => (
    <Text style={[styles.sectionHeader, { color: theme.onSurface }]}>{title}</Text>
  );

  const NavRow = ({
    icon,
    label,
    iconColor,
    value,
    onPress,
    last,
    destructive,
  }: {
    icon: string;
    label: string;
    iconColor?: string;
    value?: string;
    onPress?: () => void;
    last?: boolean;
    destructive?: boolean;
  }) => (
    <TouchableOpacity
      style={[
        styles.row,
        !last && { borderBottomColor: theme.outlineVariant + "40", borderBottomWidth: 1 },
      ]}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <MaterialIcons
        name={icon as any}
        size={22}
        color={iconColor ?? (destructive ? theme.error : theme.primary)}
      />
      <Text
        style={[
          styles.rowLabel,
          { color: destructive ? theme.error : theme.onSurface },
        ]}
      >
        {label}
      </Text>
      {value && (
        <Text style={[styles.rowValue, { color: theme.onSurfaceVariant }]}>{value}</Text>
      )}
      {!destructive && (
        <MaterialIcons name="chevron-right" size={22} color={theme.outline} />
      )}
    </TouchableOpacity>
  );

  const SwitchRow = ({
    icon,
    label,
    description,
    value,
    onToggle,
    last,
  }: {
    icon: string;
    label: string;
    description?: string;
    value: boolean;
    onToggle: (v: boolean) => void;
    last?: boolean;
  }) => (
    <View
      style={[
        styles.row,
        !last && { borderBottomColor: theme.outlineVariant + "40", borderBottomWidth: 1 },
      ]}
    >
      <MaterialIcons name={icon as any} size={22} color={theme.primary} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, { color: theme.onSurface, flex: 0 }]}>{label}</Text>
        {description && (
          <Text style={[styles.rowDescription, { color: theme.onSurfaceVariant }]}>
            {description}
          </Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{
          false: theme.outlineVariant,
          true: theme.primary,
        }}
        thumbColor={
          Platform.OS === "android"
            ? value
              ? theme.onPrimary
              : theme.surfaceContainerHighest
            : undefined
        }
        ios_backgroundColor={theme.outlineVariant}
      />
    </View>
  );

  const SubViewHeader = ({ title }: { title: string }) => (
    <View style={[styles.subViewHeader, { paddingTop: topBarHeight + spacing.md }]}>
      <TouchableOpacity
        style={styles.backRow}
        onPress={() => setSubView(null)}
        activeOpacity={0.7}
      >
        <MaterialIcons name="arrow-back" size={20} color={theme.onSurface} />
        <Text style={[styles.backText, { color: theme.onSurface }]}>Settings</Text>
      </TouchableOpacity>
      <Text style={[styles.subViewTitle, { color: theme.onSurface }]}>{title}</Text>
    </View>
  );

  // --- Sub-views ---
  if (subView === "language") {
    const languages: AppLanguage[] = [
      "English", "Spanish", "French", "German", "Italian", "Portuguese", "Japanese", "Korean", "Chinese",
    ];
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <SubViewHeader title="Language" />
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={[styles.card, { backgroundColor: theme.surfaceContainerLowest, marginHorizontal: spacing.screenPadding }]}>
            {languages.map((lang, idx) => (
              <TouchableOpacity
                key={lang}
                style={[
                  styles.row,
                  idx < languages.length - 1 && {
                    borderBottomColor: theme.outlineVariant + "40",
                    borderBottomWidth: 1,
                  },
                ]}
                activeOpacity={0.7}
                onPress={() => { setSelectedLanguage(lang); setSubView(null); }}
              >
                <Text style={[styles.rowLabel, { color: theme.onSurface }]}>{lang}</Text>
                {selectedLanguage === lang && (
                  <MaterialIcons name="check-circle" size={22} color={theme.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  if (subView === "dietary") {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <SubViewHeader title="Dietary Preferences" />
        <Text style={[styles.subDescription, { color: theme.onSurfaceVariant }]}>
          Select preferences to personalize recipe suggestions.
        </Text>
        <ScrollView style={styles.scroll} contentContainerStyle={{ paddingHorizontal: spacing.screenPadding }} showsVerticalScrollIndicator={false}>
          <View style={styles.chipWrap}>
            {DIETARY_OPTIONS.map((p) => (
              <Chip
                key={p.key}
                label={p.label}
                selected={dietaryPrefs[p.key]}
                variant={dietaryPrefs[p.key] ? "filled" : "outlined"}
                icon={dietaryPrefs[p.key] ? "check" : undefined}
                onPress={() => toggleDietaryPref(p.key)}
              />
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  if (subView === "help") {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <SubViewHeader title="Help & Support" />
        <View style={styles.centeredContent}>
          <View style={[styles.bigIconWrap, { backgroundColor: theme.primaryContainer + "40" }]}>
            <MaterialIcons name="help-outline" size={48} color={theme.primary} />
          </View>
          <Text style={[styles.centeredTitle, { color: theme.onSurface }]}>Help &amp; FAQ</Text>
          <Text style={[styles.centeredDescription, { color: theme.onSurfaceVariant }]}>
            In-app support is coming soon. For now, ask Aipron directly in chat — it can walk you through most features.
          </Text>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.primary }]}
            activeOpacity={0.7}
            onPress={() => {
              setSubView(null);
              if (onNavigateToChat) onNavigateToChat();
              else router.push("/(tabs)/chat");
            }}
          >
            <MaterialIcons name="chat-bubble-outline" size={20} color={theme.onPrimary} />
            <Text style={[styles.actionButtonText, { color: theme.onPrimary }]}>Ask Aipron</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (subView === "clearCache") {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <SubViewHeader title="Clear Cache" />
        <View style={styles.centeredContent}>
          <View style={[styles.bigIconWrap, { backgroundColor: (cacheCleared ? theme.primary : theme.error) + "20" }]}>
            <MaterialIcons
              name={cacheCleared ? "check-circle" : "delete-outline"}
              size={48}
              color={cacheCleared ? theme.primary : theme.error}
            />
          </View>
          <Text style={[styles.centeredTitle, { color: theme.onSurface }]}>
            {cacheCleared ? "Cache Cleared!" : "Clear App Cache"}
          </Text>
          <Text style={[styles.centeredDescription, { color: theme.onSurfaceVariant }]}>
            {cacheCleared
              ? "All cached data has been removed. The app may take a moment to reload images and data."
              : "Free up storage by removing cached images, search results, and temporary data. Your saved recipes and account data won't be affected."}
          </Text>
          {!cacheCleared && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.error }]}
              activeOpacity={0.7}
              onPress={() => setCacheCleared(true)}
            >
              <MaterialIcons name="delete-outline" size={20} color={theme.onError} />
              <Text style={[styles.actionButtonText, { color: theme.onError }]}>Clear Cache</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  if (subView === "privacy") {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <SubViewHeader title="Privacy Policy" />
        <ScrollView style={styles.scroll} contentContainerStyle={styles.textContent} showsVerticalScrollIndicator={false}>
          <Text style={[styles.docTitle, { color: theme.onSurface }]}>Privacy Policy</Text>
          <Text style={[styles.docDate, { color: theme.onSurfaceVariant }]}>Last updated: March 2026</Text>
          <Text style={[styles.docHeading, { color: theme.onSurface }]}>1. Information We Collect</Text>
          <Text style={[styles.docBody, { color: theme.onSurfaceVariant }]}>
            We collect information you provide when creating an account, including your email address, name, and dietary preferences. We also collect usage data such as recipe views, cooking history, and app interaction patterns.
          </Text>
          <Text style={[styles.docHeading, { color: theme.onSurface }]}>2. How We Use Your Information</Text>
          <Text style={[styles.docBody, { color: theme.onSurfaceVariant }]}>
            Your information is used to personalize recipe recommendations, improve our AI cooking assistant, and provide customer support. We never sell your personal data to third parties.
          </Text>
          <Text style={[styles.docHeading, { color: theme.onSurface }]}>3. Data Storage & Security</Text>
          <Text style={[styles.docBody, { color: theme.onSurfaceVariant }]}>
            All data is encrypted in transit and at rest. We use industry-standard security measures to protect your information. You can request data deletion at any time.
          </Text>
          <Text style={[styles.docHeading, { color: theme.onSurface }]}>4. Cookies & Analytics</Text>
          <Text style={[styles.docBody, { color: theme.onSurfaceVariant }]}>
            We use analytics to understand how users interact with the app. You can opt out of analytics tracking in the notification settings.
          </Text>
          <Text style={[styles.docHeading, { color: theme.onSurface }]}>5. Contact Us</Text>
          <Text style={[styles.docBody, { color: theme.onSurfaceVariant }]}>
            If you have questions about this privacy policy, please reach out through the in-app support flow.
          </Text>
          <View style={{ height: spacing.xxl * 2 }} />
        </ScrollView>
      </View>
    );
  }

  if (subView === "terms") {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <SubViewHeader title="Terms of Service" />
        <ScrollView style={styles.scroll} contentContainerStyle={styles.textContent} showsVerticalScrollIndicator={false}>
          <Text style={[styles.docTitle, { color: theme.onSurface }]}>Terms of Service</Text>
          <Text style={[styles.docDate, { color: theme.onSurfaceVariant }]}>Effective: March 2026</Text>
          <Text style={[styles.docHeading, { color: theme.onSurface }]}>1. Acceptance of Terms</Text>
          <Text style={[styles.docBody, { color: theme.onSurfaceVariant }]}>
            By using Aipron, you agree to these Terms of Service. If you do not agree, please do not use the app.
          </Text>
          <Text style={[styles.docHeading, { color: theme.onSurface }]}>2. Use of Service</Text>
          <Text style={[styles.docBody, { color: theme.onSurfaceVariant }]}>
            Aipron provides AI-powered cooking assistance, recipe suggestions, and meal planning tools. The service is intended for personal, non-commercial use.
          </Text>
          <Text style={[styles.docHeading, { color: theme.onSurface }]}>3. User Accounts</Text>
          <Text style={[styles.docBody, { color: theme.onSurfaceVariant }]}>
            You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized use.
          </Text>
          <Text style={[styles.docHeading, { color: theme.onSurface }]}>4. Content & Recipes</Text>
          <Text style={[styles.docBody, { color: theme.onSurfaceVariant }]}>
            Recipes generated by our AI are suggestions only. Always verify ingredient safety, especially for allergies. Aipron is not liable for adverse reactions.
          </Text>
          <Text style={[styles.docHeading, { color: theme.onSurface }]}>5. Limitation of Liability</Text>
          <Text style={[styles.docBody, { color: theme.onSurfaceVariant }]}>
            Aipron is provided "as is" without warranties. We are not liable for any indirect, incidental, or consequential damages arising from your use of the service.
          </Text>
          <View style={{ height: spacing.xxl * 2 }} />
        </ScrollView>
      </View>
    );
  }

  if (subView === "appVersion") {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <SubViewHeader title="About Aipron" />
        <View style={styles.centeredContent}>
          <View style={[styles.bigIconWrap, { backgroundColor: theme.primaryContainer + "40" }]}>
            <Text style={{ fontSize: 42 }}>🍳</Text>
          </View>
          <Text style={[styles.centeredTitle, { color: theme.onSurface }]}>Aipron</Text>
          <Text style={[styles.versionText, { color: theme.primary }]}>
            {formatAboutVersionLine()}
          </Text>
          <Text style={[styles.centeredDescription, { color: theme.onSurfaceVariant }]}>
            Your AI-powered cooking companion. Personalized recipes, smart pantry management, and step-by-step cooking guidance.
          </Text>
          <View style={[styles.infoCard, { backgroundColor: theme.surfaceContainerLowest }]}>
            <InfoRow label="Platform" value="React Native / Expo" theme={theme} />
            <InfoRow label="API Version" value="v1.1" theme={theme} />
            <InfoRow label="Last Updated" value="April 2026" theme={theme} />
            <InfoRow label="Developer" value="Aipron Team" theme={theme} last />
          </View>
        </View>
      </View>
    );
  }

  if (subView === "rate") {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <SubViewHeader title="Rate Aipron" />
        <View style={styles.centeredContent}>
          <View style={[styles.bigIconWrap, { backgroundColor: theme.tertiaryContainer + "40" }]}>
            <Text style={{ fontSize: 42 }}>
              {userRating >= 4 ? "🤩" : userRating >= 2 ? "😊" : "⭐"}
            </Text>
          </View>
          <Text style={[styles.centeredTitle, { color: theme.onSurface }]}>
            {userRating > 0 ? "Thanks for rating!" : "Enjoying Aipron?"}
          </Text>
          <Text style={[styles.centeredDescription, { color: theme.onSurfaceVariant }]}>
            {userRating > 0
              ? `You gave us ${userRating} star${userRating > 1 ? "s" : ""}. Your feedback helps us improve!`
              : "Tap a star to let us know how we're doing. Your feedback helps us improve!"}
          </Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setUserRating(star)} activeOpacity={0.7}>
                <MaterialIcons
                  name={star <= userRating ? "star" : "star-outline"}
                  size={40}
                  color={star <= userRating ? theme.tertiary : theme.outline}
                />
              </TouchableOpacity>
            ))}
          </View>
          {userRating > 0 && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.primary }]}
              activeOpacity={0.7}
              onPress={() => Alert.alert("Thank you!", "Your rating has been submitted.")}
            >
              <Text style={[styles.actionButtonText, { color: theme.onPrimary }]}>
                Submit Rating
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  // --- Main settings view ---
  const activeDietaryCount = Object.values(dietaryPrefs).filter(Boolean).length;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <TopBar title="Settings" showBack onBackPress={onBack ?? (() => router.back())} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: topBarHeight + spacing.lg, paddingBottom: 120 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.inner}>
          {/* Hero profile summary card */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.profileCard, { backgroundColor: theme.surfaceContainerLow }]}
            onPress={() => Alert.alert("Profile", "Profile editing coming soon.")}
          >
            <View
              style={[
                styles.profileAvatar,
                {
                  backgroundColor: theme.surfaceContainerHighest,
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                },
              ]}
            >
              <MaterialIcons
                name="person"
                size={44}
                color={theme.outline}
                style={{ marginTop: 6 }}
              />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[styles.profileName, { color: theme.onSurface }]} numberOfLines={1}>
                {userName}
              </Text>
              <Text style={[styles.profileEmail, { color: theme.onSurfaceVariant }]} numberOfLines={1}>
                {userEmail}
              </Text>
              <Text style={[styles.profileStats, { color: theme.tertiary }]}>
                {activeDietaryCount} dietary preference{activeDietaryCount === 1 ? "" : "s"}
                {"  ·  "}
                Premium member
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={theme.outline} />
          </TouchableOpacity>

          {/* Preferences */}
          <SectionHeader title="Preferences" />
          <Text style={[styles.sectionHint, { color: theme.onSurfaceVariant }]}>
            Tap a chip to toggle your default filters for recipe discovery.
          </Text>
          <View style={styles.chipWrap}>
            {DIETARY_OPTIONS.map((p) => (
              <Chip
                key={p.key}
                label={p.label}
                selected={dietaryPrefs[p.key]}
                variant={dietaryPrefs[p.key] ? "filled" : "outlined"}
                icon={dietaryPrefs[p.key] ? "check" : undefined}
                onPress={() => toggleDietaryPref(p.key)}
              />
            ))}
          </View>
          <View style={[styles.card, { backgroundColor: theme.surfaceContainerLowest, marginTop: spacing.lg }]}>
            <NavRow
              icon="language"
              label="Language"
              value={selectedLanguage}
              onPress={() => setSubView("language")}
              last
            />
          </View>

          {/* Notifications */}
          <SectionHeader title="Notifications" />
          <View style={[styles.card, { backgroundColor: theme.surfaceContainerLowest }]}>
            <SwitchRow
              icon="restaurant"
              label="Recipe reminders"
              description="Daily nudges to try something new"
              value={recipeReminders}
              onToggle={setRecipeReminders}
            />
            <SwitchRow
              icon="auto-awesome"
              label="Weekly inspiration"
              description="Editorial picks every Sunday"
              value={weeklyInspiration}
              onToggle={setWeeklyInspiration}
            />
            <SwitchRow
              icon="timer"
              label="Cooking timer alerts"
              description="Never forget something on the stove"
              value={cookingTimerAlerts}
              onToggle={setCookingTimerAlerts}
              last
            />
          </View>

          {/* Account */}
          <SectionHeader title="Account" />
          <View style={[styles.card, { backgroundColor: theme.surfaceContainerLowest }]}>
            <NavRow
              icon="mail-outline"
              label="Email"
              value={userEmail}
              onPress={() => Alert.alert("Email", "Change email is coming soon.")}
            />
            <NavRow
              icon="lock-outline"
              label="Password"
              onPress={() => Alert.alert("Password", "Change password is coming soon.")}
            />
            <NavRow
              icon="logout"
              label="Sign out"
              onPress={handleSignOut}
              destructive
              last
            />
          </View>

          {/* About */}
          <SectionHeader title="About" />
          <View style={[styles.card, { backgroundColor: theme.surfaceContainerLowest }]}>
            <NavRow icon="help-outline" label="Help" onPress={() => setSubView("help")} />
            <NavRow icon="verified-user" label="Privacy Policy" onPress={() => setSubView("privacy")} />
            <NavRow icon="description" label="Terms of Service" onPress={() => setSubView("terms")} />
            <NavRow icon="star-outline" label="Rate the app" onPress={() => setSubView("rate")} />
            <NavRow
              icon="info-outline"
              label="App version"
              value={formatAboutVersionLine().replace("Version ", "")}
              onPress={() => setSubView("appVersion")}
              last
            />
          </View>

          {/* Editorial quote footer */}
          <View style={[styles.quoteCard, { backgroundColor: theme.surfaceContainerLow }]}>
            <Text style={[styles.editorialKicker, { color: theme.primary }]}>Editor's Note</Text>
            <Text style={[styles.editorialQuote, { color: theme.onSurface }]}>
              "Cooking is the most ancient of the arts — and the most personal."
            </Text>
            <Text style={[styles.editorialByline, { color: theme.onSurfaceVariant }]}>
              — the Aipron team
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function InfoRow({
  label,
  value,
  theme,
  last,
}: {
  label: string;
  value: string;
  theme: ReturnType<typeof useThemeColors>;
  last?: boolean;
}) {
  return (
    <View
      style={[
        styles.infoRow,
        !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.outlineVariant + "40" },
      ]}
    >
      <Text style={[styles.infoLabel, { color: theme.onSurfaceVariant }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: theme.onSurface }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.screenPadding,
  },
  inner: {
    width: "100%",
    maxWidth: 680,
    alignSelf: "center",
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.xl,
    borderRadius: 24,
    gap: spacing.lg,
    ...shadows.sm,
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  profileName: {
    fontFamily: fonts.serifBold,
    fontSize: 20,
  },
  profileEmail: {
    fontFamily: fonts.sans,
    fontSize: 13,
  },
  profileStats: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  sectionHeader: {
    fontFamily: fonts.serifBold,
    fontSize: 22,
    marginTop: spacing.xxl + spacing.xs,
    marginBottom: spacing.md,
    letterSpacing: -0.3,
  },
  sectionHint: {
    fontFamily: fonts.sans,
    fontSize: 13,
    marginBottom: spacing.md,
    lineHeight: 19,
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  card: {
    borderRadius: borderRadius.xl,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  rowLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
    flex: 1,
  },
  rowValue: {
    fontFamily: fonts.sans,
    fontSize: 13,
    marginRight: spacing.xs,
  },
  rowDescription: {
    fontFamily: fonts.sans,
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  quoteCard: {
    marginTop: spacing.sectionGap,
    borderRadius: borderRadius.xxl,
    padding: spacing.xl,
    gap: spacing.xs,
    ...shadows.sm,
  },
  editorialKicker: {
    fontFamily: fonts.sansBold,
    fontSize: 10,
    letterSpacing: 3,
    textTransform: "uppercase",
  },
  editorialQuote: {
    fontFamily: fonts.serifBoldItalic,
    fontSize: 22,
    lineHeight: 30,
    marginTop: spacing.sm,
  },
  editorialByline: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    marginTop: spacing.sm,
  },
  subViewHeader: {
    paddingHorizontal: spacing.screenPadding,
    marginBottom: spacing.md,
  },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  backText: {
    fontFamily: fonts.sans,
    fontSize: 15,
  },
  subViewTitle: {
    fontFamily: fonts.serifBold,
    fontSize: 28,
    marginTop: spacing.sm,
  },
  subDescription: {
    fontFamily: fonts.sans,
    fontSize: 13,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.screenPadding,
  },
  centeredContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
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
    fontFamily: fonts.serifBold,
    fontSize: 24,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  centeredDescription: {
    fontFamily: fonts.sans,
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  versionText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
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
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
  },
  starsRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  textContent: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: 80,
  },
  docTitle: {
    fontFamily: fonts.serifBold,
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  docDate: {
    fontFamily: fonts.sans,
    fontSize: 13,
    marginBottom: spacing.xl,
  },
  docHeading: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 16,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  docBody: {
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 22,
  },
  infoCard: {
    width: "100%",
    borderRadius: borderRadius.xl,
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
    fontFamily: fonts.sans,
    fontSize: 13,
  },
  infoValue: {
    fontFamily: fonts.sansMedium,
    fontSize: 15,
  },
});

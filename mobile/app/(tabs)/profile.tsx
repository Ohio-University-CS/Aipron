import React from "react";
import { View, StyleSheet, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { spacing, borderRadius, typography, shadows } from "../../src/constants/DesignTokens";
import { useThemeColors } from "../../src/hooks/useThemeColors";
import { useAuthStore } from "../../src/store/useAuthStore";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

const loggedOutFeatures = [
  { key: "login", icon: "log-in-outline" as const, label: "Go to Login", accent: "#4CAF50" },
  { key: "settings", icon: "settings-outline" as const, label: "Settings", accent: "#FF6B35" },
  { key: "help", icon: "help-circle-outline" as const, label: "Help & Support", accent: "#2196F3" },
  { key: "about", icon: "information-circle-outline" as const, label: "About", accent: "#FF9800" },
];

const loggedInFeatures = [
  { key: "logout", icon: "log-out-outline" as const, label: "Logout", accent: "#F44336" },
  { key: "settings", icon: "settings-outline" as const, label: "Settings", accent: "#FF6B35" },
  { key: "help", icon: "help-circle-outline" as const, label: "Help & Support", accent: "#2196F3" },
  { key: "about", icon: "information-circle-outline" as const, label: "About", accent: "#FF9800" },
];

interface ProfileScreenProps {
  onNavigateToLogin?: () => void;
  onNavigateToSettings?: () => void;
  onNavigateToHelp?: () => void;
  onNavigateToAbout?: () => void;
  onLogout?: () => void;
}

export default function ProfileScreen({
  onNavigateToLogin,
  onNavigateToSettings,
  onNavigateToHelp,
  onNavigateToAbout,
  onLogout,
}: ProfileScreenProps = {}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const c = useThemeColors();
  const { user, logout } = useAuthStore();
  const name = (user?.user_metadata as any)?.name as string | undefined;
  const displayName = name || user?.email?.split("@")[0] || null;
  const initial = displayName ? displayName.charAt(0).toUpperCase() : null;
  const isSignedIn = !!user;

  const handleLogout = () => {
    logout();
    if (onLogout) {
      onLogout();
    } else {
      router.replace("/login");
    }
  };

  const handleFeaturePress = (key: string) => {
    if (key === "logout") {
      handleLogout();
    } else if (key === "login") {
      if (onNavigateToLogin) {
        onNavigateToLogin();
      } else {
        router.push("/login");
      }
    } else if (key === "settings") {
      if (onNavigateToSettings) {
        onNavigateToSettings();
      } else {
        router.push("/settings");
      }
    } else if (key === "help") {
      if (onNavigateToHelp) {
        onNavigateToHelp();
      } else {
        router.push("/help");
      }
    } else if (key === "about") {
      if (onNavigateToAbout) {
        onNavigateToAbout();
      } else {
        router.push("/about");
      }
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.xl, backgroundColor: c.background }]}>
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <View style={[styles.avatar, isSignedIn ? { backgroundColor: c.primary } : { backgroundColor: c.primaryLight + "20" }]}>
          {initial ? (
            <Text style={styles.avatarInitial}>{initial}</Text>
          ) : (
            <Ionicons name="person" size={28} color={c.primary} />
          )}
        </View>
        <View style={styles.headerInfo}>
          <Text style={[styles.name, { color: c.text }]}>{displayName || "Profile"}</Text>
          <Text style={[styles.email, { color: c.textSecondary }]}>
            {isSignedIn ? user?.email : "Not signed in"}
          </Text>
        </View>
      </View>

      <View style={styles.grid}>
        {(isSignedIn ? loggedInFeatures : loggedOutFeatures).map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.featureCard, { backgroundColor: c.surface }]}
            activeOpacity={0.7}
            onPress={() => handleFeaturePress(f.key)}
          >
            <View style={[styles.featureIconWrap, { backgroundColor: f.accent + "18" }]}>
              <Ionicons name={f.icon} size={26} color={f.accent} />
            </View>
            <Text style={[styles.featureLabel, { color: c.text }]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingBottom: spacing.xl,
    borderBottomWidth: 1,
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  headerInfo: {
    flex: 1,
  },
  name: {
    ...typography.h2,
  },
  email: {
    ...typography.caption,
    marginTop: 2,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: spacing.md,
  },
  featureCard: {
    width: "48%",
    aspectRatio: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    ...shadows.sm,
  },
  featureIconWrap: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  featureLabel: {
    ...typography.body,
    fontWeight: "500",
    textAlign: "center",
  },
});

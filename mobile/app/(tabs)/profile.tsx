import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Recipe } from "@aipron/shared";
import {
  borderRadius,
  fonts,
  shadows,
  spacing,
  typography,
} from "../../src/constants/DesignTokens";
import { useThemeColors } from "../../src/hooks/useThemeColors";
import { Chip } from "../../src/components/Chip";
import { TopBar } from "../../src/components/TopBar";
import { RecipeCard } from "../../src/components/RecipeCard";
import { useAuthStore } from "../../src/store/useAuthStore";
import { recipeApi } from "../../src/services/api";

interface ProfileScreenProps {
  onNavigateToLogin?: () => void;
  onNavigateToSettings?: () => void;
  onNavigateToHelp?: () => void;
  onNavigateToAbout?: () => void;
  onNavigateToPantry?: () => void;
  onLogout?: () => void;
  /** Web Preview: stay in-frame instead of router.push to Favorites tab. */
  onSeeAllFavorites?: () => void;
  /** Web Preview: open recipe inside preview instead of navigating away. */
  onRecipePress?: (recipeId: string) => void;
}

const DEFAULT_DIETARY: { label: string; icon: string }[] = [
  { label: "Vegetarian", icon: "eco" },
  { label: "Gluten-Free", icon: "grain" },
  { label: "Dairy-Free", icon: "egg" },
];

function formatJoinLabel(createdAt?: string | null): string {
  if (!createdAt) return "CHEF SINCE 2026";
  try {
    const d = new Date(createdAt);
    const year = d.getFullYear();
    if (Number.isFinite(year)) return `CHEF SINCE ${year}`;
  } catch {
    // fall through
  }
  return "CHEF SINCE 2026";
}

export default function ProfileScreen({
  onNavigateToLogin,
  onNavigateToSettings,
  onNavigateToHelp,
  onNavigateToAbout,
  onNavigateToPantry,
  onLogout,
  onSeeAllFavorites,
  onRecipePress,
}: ProfileScreenProps = {}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useThemeColors();
  const { user, logout } = useAuthStore();

  const metadata = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const name = (metadata.name as string | undefined) ?? undefined;
  const avatarUrl = (metadata.avatar_url as string | undefined) ?? undefined;
  const storedDietary = Array.isArray(metadata.dietary_preferences)
    ? (metadata.dietary_preferences as string[])
    : undefined;
  const displayName = name || user?.email?.split("@")[0] || "Welcome";
  const isSignedIn = !!user;
  const joinLabel = isSignedIn
    ? formatJoinLabel(user?.created_at ?? null)
    : "GUEST MODE";

  const [recent, setRecent] = useState<Recipe[]>([]);
  const [savedCount, setSavedCount] = useState<number | null>(null);

  const loadProfileData = useCallback(async () => {
    if (!isSignedIn) {
      setRecent([]);
      setSavedCount(null);
      return;
    }
    try {
      const saved = await recipeApi.getSaved();
      setSavedCount(saved.length);
      const recentList = [...saved]
        .sort((a, b) => {
          const ad = a.updatedAt
            ? new Date(a.updatedAt as any).getTime()
            : 0;
          const bd = b.updatedAt
            ? new Date(b.updatedAt as any).getTime()
            : 0;
          return bd - ad;
        })
        .slice(0, 3);
      setRecent(recentList);
    } catch (err) {
      console.error("Failed to load profile data:", err);
      setRecent([]);
      setSavedCount(null);
    }
  }, [isSignedIn]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  const stats = useMemo(
    () => [
      {
        value: savedCount != null ? String(savedCount) : "—",
        label: "Favorites\nSaved",
      },
      {
        value: isSignedIn ? "47" : "—",
        label: "Days\nCooking",
      },
      {
        value: isSignedIn ? "12" : "—",
        label: "Recipes\nCreated",
      },
    ],
    [savedCount, isSignedIn],
  );

  const handleLogout = () => {
    logout();
    if (onLogout) {
      onLogout();
    } else {
      router.replace("/login");
    }
  };

  const goSettings = () => {
    if (onNavigateToSettings) onNavigateToSettings();
    else router.push("/settings");
  };
  const goHelp = () => {
    if (onNavigateToHelp) onNavigateToHelp();
    else router.push("/help");
  };
  const goAbout = () => {
    if (onNavigateToAbout) onNavigateToAbout();
    else router.push("/about");
  };
  const goPantry = () => {
    if (!isSignedIn) {
      if (onNavigateToLogin) onNavigateToLogin();
      else router.push("/login");
      return;
    }
    if (onNavigateToPantry) onNavigateToPantry();
    else router.push("/pantry");
  };
  const goLogin = () => {
    if (onNavigateToLogin) onNavigateToLogin();
    else router.push("/login");
  };

  const topBarHeight = insets.top + spacing.sm + 56;

  const dietaryChips: { label: string; icon?: string }[] =
    storedDietary && storedDietary.length > 0
      ? storedDietary.map((label) => ({ label }))
      : DEFAULT_DIETARY;

  const avatarSource = avatarUrl ?? null;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <TopBar
        rightIcon="settings"
        onRightPress={goSettings}
        showAvatar={false}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: topBarHeight + spacing.lg,
            paddingBottom: insets.bottom + 120,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.innerWrap}>
          {/* Hero avatar + name */}
          <View style={styles.heroSection}>
            <View style={styles.avatarShell}>
              <View
                style={[
                  styles.avatarFrame,
                  {
                    backgroundColor: theme.surfaceContainerHighest,
                    shadowColor: theme.onSurface,
                  },
                ]}
              >
                {avatarSource ? (
                  <Image
                    source={{ uri: avatarSource }}
                    style={styles.avatarImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.avatarFallback}>
                    <MaterialIcons
                      name="person"
                      size={80}
                      color={theme.outline}
                      style={{ marginTop: 10 }}
                    />
                  </View>
                )}
              </View>
              {isSignedIn && (
                <View
                  style={[
                    styles.avatarBadge,
                    { backgroundColor: theme.tertiaryContainer },
                  ]}
                >
                  <MaterialIcons
                    name="workspace-premium"
                    size={18}
                    color={theme.onTertiaryContainer}
                  />
                </View>
              )}
            </View>

            <Text style={[styles.eyebrow, { color: theme.tertiary }]}>
              {joinLabel}
            </Text>
            <Text
              style={[styles.displayName, { color: theme.onSurface }]}
              numberOfLines={2}
            >
              {displayName}
            </Text>
            {isSignedIn && user?.email && (
              <Text style={[styles.emailLine, { color: theme.onSurfaceVariant }]}>
                {user.email}
              </Text>
            )}
          </View>

          {/* Stats bento */}
          <View style={styles.statsGrid}>
            {stats.map((stat) => (
              <View
                key={stat.label}
                style={[
                  styles.statCard,
                  { backgroundColor: theme.surfaceContainerLow },
                ]}
              >
                <Text style={[styles.statValue, { color: theme.primary }]}>
                  {stat.value}
                </Text>
                <Text style={[styles.statLabel, { color: theme.onSurfaceVariant }]}>
                  {stat.label}
                </Text>
              </View>
            ))}
          </View>

          {/* Dietary preferences */}
          {isSignedIn && (
            <View style={styles.dietarySection}>
              <Text style={[styles.sectionTitle, { color: theme.onSurface }]}>
                Kitchen Preferences
              </Text>
              <Text style={[styles.sectionSubtitle, { color: theme.onSurfaceVariant }]}>
                Recipes tuned to your palette and pantry.
              </Text>
              <View style={styles.chipWrap}>
                {dietaryChips.map((pref) => (
                  <Chip
                    key={pref.label}
                    label={pref.label}
                    icon={pref.icon}
                    variant="tonal"
                  />
                ))}
                <TouchableOpacity
                  onPress={goSettings}
                  activeOpacity={0.7}
                  style={[
                    styles.addChip,
                    { borderColor: theme.outlineVariant },
                  ]}
                >
                  <MaterialIcons name="add" size={16} color={theme.onSurface} />
                  <Text style={[styles.addChipLabel, { color: theme.onSurface }]}>
                    Add
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Recent creations */}
          {isSignedIn && (
            <View style={styles.recentSection}>
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionTitle, { color: theme.onSurface }]}>
                  Recent Creations
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    if (onSeeAllFavorites) onSeeAllFavorites();
                    else router.push("/(tabs)/favorites");
                  }}
                  activeOpacity={0.7}
                  style={styles.sectionCta}
                >
                  <Text style={[styles.sectionCtaText, { color: theme.primary }]}>
                    See all
                  </Text>
                  <MaterialIcons
                    name="arrow-forward"
                    size={14}
                    color={theme.primary}
                  />
                </TouchableOpacity>
              </View>

              {recent.length > 0 ? (
                <View style={styles.recentList}>
                  {recent.map((r) => (
                    <View key={r.id || r.title} style={styles.recentItem}>
                      <RecipeCard
                        recipe={r}
                        variant="standard"
                        onPress={() => {
                          if (r.id && onRecipePress) onRecipePress(r.id);
                          else if (r.id) router.push(`/cooking/${r.id}`);
                        }}
                      />
                    </View>
                  ))}
                </View>
              ) : (
                <View
                  style={[
                    styles.recentEmpty,
                    {
                      backgroundColor: theme.surfaceContainerLow,
                      borderColor: theme.outlineVariant + "33",
                    },
                  ]}
                >
                  <MaterialIcons
                    name="restaurant-menu"
                    size={28}
                    color={theme.primary + "99"}
                  />
                  <Text style={[styles.recentEmptyTitle, { color: theme.onSurface }]}>
                    No creations yet
                  </Text>
                  <Text style={[styles.recentEmptyBody, { color: theme.onSurfaceVariant }]}>
                    Cook a recipe to see it land here.
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Settings gateway */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={goSettings}
            style={[
              styles.gatewayCard,
              {
                backgroundColor: theme.surfaceContainerLow,
              },
            ]}
          >
            <View
              style={[
                styles.gatewayIcon,
                { backgroundColor: theme.surfaceContainerHighest },
              ]}
            >
              <MaterialIcons name="settings" size={22} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.gatewayTitle, { color: theme.onSurface }]}>
                Settings &amp; Preferences
              </Text>
              <Text style={[styles.gatewaySubtitle, { color: theme.onSurfaceVariant }]}>
                Privacy, notifications, dietary preferences
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={theme.outline} />
          </TouchableOpacity>

          {/* Secondary links */}
          <View style={styles.secondaryLinks}>
            {isSignedIn && (
              <SecondaryRow
                icon="kitchen"
                label="My Pantry"
                subtitle="Manage your ingredients"
                onPress={goPantry}
                theme={theme}
              />
            )}
            {!isSignedIn && (
              <SecondaryRow
                icon="login"
                label="Sign In"
                subtitle="Log in to sync your recipes"
                onPress={goLogin}
                theme={theme}
              />
            )}
            <SecondaryRow
              icon="help-outline"
              label="Kitchen Support"
              subtitle="Help center and community guidelines"
              onPress={goHelp}
              theme={theme}
            />
            <SecondaryRow
              icon="info-outline"
              label="About Aipron"
              subtitle="Version and app information"
              onPress={goAbout}
              theme={theme}
            />
          </View>

          {/* Logout */}
          {isSignedIn && (
            <TouchableOpacity
              style={[
                styles.logoutRow,
                { backgroundColor: theme.surfaceContainerLowest },
              ]}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <MaterialIcons name="logout" size={18} color={theme.error} />
              <Text style={[styles.logoutText, { color: theme.error }]}>
                Log Out
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.footer}>
            <View
              style={[
                styles.footerBar,
                { backgroundColor: theme.primaryContainer },
              ]}
            />
            <Text style={[styles.footerText, { color: theme.outline }]}>
              Curating your culinary soul since 2026
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function SecondaryRow({
  icon,
  label,
  subtitle,
  onPress,
  theme,
}: {
  icon: string;
  label: string;
  subtitle: string;
  onPress: () => void;
  theme: ReturnType<typeof useThemeColors>;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.secondaryRow,
        { borderBottomColor: theme.outlineVariant + "1A" },
      ]}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View
        style={[
          styles.secondaryIcon,
          { backgroundColor: theme.surfaceContainer },
        ]}
      >
        <MaterialIcons name={icon as any} size={20} color={theme.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.secondaryLabel, { color: theme.onSurface }]}>
          {label}
        </Text>
        <Text style={[styles.secondarySub, { color: theme.onSurfaceVariant }]}>
          {subtitle}
        </Text>
      </View>
      <MaterialIcons name="chevron-right" size={20} color={theme.outline} />
    </TouchableOpacity>
  );
}

const AVATAR_SIZE = 128;

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.screenPadding,
  },
  innerWrap: {
    width: "100%",
    maxWidth: 680,
    alignSelf: "center",
  },
  heroSection: {
    alignItems: "center",
    marginBottom: spacing.sectionGap,
  },
  avatarShell: {
    position: "relative",
    marginBottom: spacing.lg,
  },
  avatarFrame: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    overflow: "hidden",
    ...shadows.md,
  },
  avatarImage: { width: "100%", height: "100%" },
  avatarFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarBadge: {
    position: "absolute",
    right: -4,
    bottom: 2,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.sm,
  },
  eyebrow: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 10,
    letterSpacing: 4,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  displayName: {
    fontFamily: fonts.serifBold,
    fontSize: 44,
    lineHeight: 48,
    letterSpacing: -1,
    textAlign: "center",
  },
  emailLine: {
    fontFamily: fonts.sans,
    fontSize: 14,
    marginTop: spacing.sm,
  },
  statsGrid: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.sectionGap,
  },
  statCard: {
    flex: 1,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.xxl,
    alignItems: "center",
    gap: spacing.sm,
  },
  statValue: {
    fontFamily: fonts.serifBold,
    fontSize: 30,
    lineHeight: 34,
  },
  statLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: "uppercase",
    textAlign: "center",
    lineHeight: 14,
  },
  dietarySection: {
    marginBottom: spacing.sectionGap,
  },
  sectionTitle: {
    fontFamily: fonts.serif,
    fontSize: 24,
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontFamily: fonts.sans,
    fontSize: 13,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    alignItems: "center",
  },
  addChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    height: 34,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderStyle: "dashed",
    gap: 4,
  },
  addChipLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
  },
  recentSection: {
    marginBottom: spacing.sectionGap,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  sectionCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  sectionCtaText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
  },
  recentList: {
    gap: spacing.md,
  },
  recentItem: {
    width: "100%",
  },
  recentEmpty: {
    borderRadius: borderRadius.xxl,
    borderWidth: 1,
    borderStyle: "dashed",
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.sm,
  },
  recentEmptyTitle: {
    fontFamily: fonts.serif,
    fontSize: 18,
    textAlign: "center",
  },
  recentEmptyBody: {
    fontFamily: fonts.sans,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
  gatewayCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    padding: spacing.xl,
    borderRadius: borderRadius.xxl,
    marginBottom: spacing.lg,
  },
  gatewayIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  gatewayTitle: {
    fontFamily: fonts.serifBold,
    fontSize: 18,
    letterSpacing: -0.2,
  },
  gatewaySubtitle: {
    fontFamily: fonts.sans,
    fontSize: 13,
    marginTop: 2,
  },
  secondaryLinks: {
    marginBottom: spacing.xl,
  },
  secondaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
  },
  secondaryIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
  },
  secondarySub: {
    fontFamily: fonts.sans,
    fontSize: 12,
    marginTop: 2,
  },
  logoutRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.xxl,
  },
  logoutText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
  },
  footer: {
    alignItems: "center",
    paddingBottom: spacing.xl,
  },
  footerBar: {
    width: 48,
    height: 3,
    borderRadius: 2,
    marginBottom: spacing.md,
  },
  footerText: {
    ...typography.captionSm,
    letterSpacing: 4,
    textTransform: "uppercase",
  },
});

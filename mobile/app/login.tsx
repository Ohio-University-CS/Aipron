import React, { useEffect, useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { authApi } from "../src/services/api";
import { useAuthStore } from "../src/store/useAuthStore";
import { GradientButton } from "../src/components/GradientButton";
import { StitchImages } from "../src/constants/StitchImages";
import {
  spacing,
  borderRadius,
  fonts,
} from "../src/constants/DesignTokens";
import { useThemeColors } from "../src/hooks/useThemeColors";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FieldErrors {
  email: boolean;
  password: boolean;
  name: boolean;
}

interface LoginScreenProps {
  onLoginSuccess?: () => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps = {}) {
  const router = useRouter();
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const { setSession, isAuthenticated, isLoading: authBootstrapping } = useAuthStore();

  useEffect(() => {
    if (authBootstrapping || !isAuthenticated) return;
    if (onLoginSuccess) {
      onLoginSuccess();
    } else {
      router.replace("/(tabs)/chat");
    }
  }, [authBootstrapping, isAuthenticated, onLoginSuccess, router]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({
    email: false,
    password: false,
    name: false,
  });
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);

  const clearErrors = () => {
    setErrorMessage("");
    setFieldErrors({ email: false, password: false, name: false });
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (errorMessage) clearErrors();
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (errorMessage) clearErrors();
  };

  const handleNameChange = (text: string) => {
    setName(text);
    if (errorMessage) clearErrors();
  };

  const handleToggleMode = () => {
    setIsRegister(!isRegister);
    setName("");
    clearErrors();
  };

  const validate = (): boolean => {
    if (isRegister && !name.trim()) {
      setErrorMessage("Please enter a username");
      setFieldErrors({ email: false, password: false, name: true });
      return false;
    }
    if (!email.trim() && !password) {
      setErrorMessage("Please enter your email and password");
      setFieldErrors({ email: true, password: true, name: false });
      return false;
    }
    if (!email.trim()) {
      setErrorMessage("Please enter your email address");
      setFieldErrors({ email: true, password: false, name: false });
      return false;
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      setErrorMessage("Please enter a valid email address");
      setFieldErrors({ email: true, password: false, name: false });
      return false;
    }
    if (!password) {
      setErrorMessage("Please enter your password");
      setFieldErrors({ email: false, password: true, name: false });
      return false;
    }
    if (isRegister && password.length < 6) {
      setErrorMessage("Password must be at least 6 characters");
      setFieldErrors({ email: false, password: true, name: false });
      return false;
    }
    return true;
  };

  const getServerErrorMessage = (error: any): string => {
    const msg: string =
      error?.message ||
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      "";
    const lower = msg.toLowerCase();

    if (lower.includes("invalid login") || lower.includes("invalid credentials")) {
      return "Invalid email or password";
    }
    if (
      lower.includes("already registered") ||
      lower.includes("already exists") ||
      lower.includes("duplicate")
    ) {
      return "An account with this email already exists";
    }
    if (lower.includes("rate limit") || lower.includes("too many")) {
      return "Too many attempts. Please try again later";
    }
    return msg || "Authentication failed. Please try again";
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsLoading(true);
    clearErrors();
    try {
      await (isRegister
        ? await authApi.register(email, password, name.trim())
        : await authApi.login(email, password));

      const { data, error } = await authApi.getSession();
      if (error) throw error;
      setSession(data.session);

      if (onLoginSuccess) {
        onLoginSuccess();
      } else {
        router.replace("/(tabs)/chat");
      }
    } catch (error: any) {
      const msg = getServerErrorMessage(error);
      setErrorMessage(msg);
      if (msg.toLowerCase().includes("email")) {
        setFieldErrors({ email: true, password: false, name: false });
      } else if (msg.toLowerCase().includes("password")) {
        setFieldErrors({ email: false, password: true, name: false });
      } else {
        setFieldErrors({ email: true, password: true, name: false });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuth = (provider: "google" | "apple") => {
    // OAuth not yet wired — placeholder alert preserves UI intent.
    Alert.alert(
      "Coming soon",
      `${provider === "google" ? "Google" : "Apple"} sign-in will be available in a future update.`,
    );
  };

  const handleForgot = () => {
    Alert.alert(
      "Reset password",
      "Enter your email and we'll send a reset link. (This flow is not yet wired.)",
    );
  };

  const underlineColor = (focused: boolean, errored: boolean) =>
    errored ? c.error : focused ? c.primary : c.outlineVariant;

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: c.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={insets.top}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: spacing.sectionGap + insets.bottom },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Editorial hero image */}
          <View style={styles.heroWrap}>
            <Image
              source={{ uri: StitchImages.signinHero }}
              style={styles.heroImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={["transparent", c.background + "00", c.background]}
              locations={[0, 0.55, 1]}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
            <View style={[styles.wordmarkPill, { backgroundColor: c.surface + "E6" }]}>
              <Text style={[styles.wordmark, { color: c.primary }]}>AIpron</Text>
            </View>
          </View>

          {/* Headline block */}
          <View style={styles.headingBlock}>
            <Text style={[styles.heading, { color: c.onSurface }]}>
              {isRegister ? "Welcome.\n" : "Welcome back.\n"}
              <Text style={[styles.headingItalic, { color: c.primary }]}>
                {isRegister ? "Let's cook." : "Let's cook."}
              </Text>
            </Text>
            <Text style={[styles.subheading, { color: c.onSurfaceVariant }]}>
              {isRegister
                ? "Create an account to save recipes and follow your culinary journey."
                : "Sign in to access your curated collections and chef's journals."}
            </Text>
          </View>

          {/* Error banner */}
          {errorMessage !== "" && (
            <View style={[styles.errorBanner, { backgroundColor: c.errorContainer }]}>
              <MaterialIcons name="error-outline" size={18} color={c.error} />
              <Text style={[styles.errorText, { color: c.error }]}>{errorMessage}</Text>
            </View>
          )}

          {/* Form */}
          <View style={styles.form}>
            {isRegister && (
              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { color: c.onSurfaceVariant }]}>NAME</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: c.onSurface,
                      borderBottomColor: underlineColor(nameFocused, fieldErrors.name),
                    },
                  ]}
                  placeholder="Your name"
                  placeholderTextColor={c.outline}
                  value={name}
                  onChangeText={handleNameChange}
                  onFocus={() => setNameFocused(true)}
                  onBlur={() => setNameFocused(false)}
                  autoCapitalize="words"
                  editable={!isLoading}
                />
              </View>
            )}

            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: c.onSurfaceVariant }]}>EMAIL</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: c.onSurface,
                    borderBottomColor: underlineColor(emailFocused, fieldErrors.email),
                  },
                ]}
                placeholder="hello@epicurean.com"
                placeholderTextColor={c.outline}
                value={email}
                onChangeText={handleEmailChange}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={!isLoading}
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: c.onSurfaceVariant }]}>PASSWORD</Text>
              <View
                style={[
                  styles.passwordRow,
                  { borderBottomColor: underlineColor(passwordFocused, fieldErrors.password) },
                ]}
              >
                <TextInput
                  style={[styles.inputInline, { color: c.onSurface }]}
                  placeholder="••••••••"
                  placeholderTextColor={c.outline}
                  value={password}
                  onChangeText={handlePasswordChange}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete={isRegister ? "new-password" : "current-password"}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword((v) => !v)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  activeOpacity={0.7}
                >
                  <MaterialIcons
                    name={showPassword ? "visibility-off" : "visibility"}
                    size={20}
                    color={c.onSurfaceVariant}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Primary CTA */}
          <GradientButton
            title={isLoading ? "Please wait..." : isRegister ? "Create Account" : "Sign In"}
            onPress={handleSubmit}
            disabled={isLoading}
            style={styles.submitButton}
          />

          {/* Secondary link row */}
          <View style={styles.secondaryRow}>
            {!isRegister ? (
              <TouchableOpacity onPress={handleForgot} activeOpacity={0.7}>
                <Text style={[styles.secondaryLink, { color: c.tertiary }]}>
                  Forgot password?
                </Text>
              </TouchableOpacity>
            ) : (
              <View />
            )}
            <TouchableOpacity onPress={handleToggleMode} activeOpacity={0.7} disabled={isLoading}>
              <Text style={[styles.secondaryLink, { color: c.tertiary }]}>
                {isRegister ? "Have an account? Sign In" : "Don't have an account? Sign Up"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* OR divider */}
          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: c.outlineVariant }]} />
            <Text style={[styles.dividerLabel, { color: c.onSurfaceVariant }]}>
              OR CONTINUE WITH
            </Text>
            <View style={[styles.dividerLine, { backgroundColor: c.outlineVariant }]} />
          </View>

          {/* Social auth cards */}
          <View style={styles.socialColumn}>
            <TouchableOpacity
              style={[
                styles.socialCard,
                {
                  borderColor: c.outlineVariant,
                  backgroundColor: c.surfaceContainerLowest,
                },
              ]}
              activeOpacity={0.7}
              onPress={() => handleOAuth("google")}
            >
              <Image
                source={{ uri: StitchImages.googleLogo }}
                style={styles.googleLogo}
                resizeMode="contain"
              />
              <Text style={[styles.socialLabel, { color: c.onSurface }]}>
                Continue with Google
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.socialCard,
                {
                  borderColor: c.outlineVariant,
                  backgroundColor: c.surfaceContainerLowest,
                },
              ]}
              activeOpacity={0.7}
              onPress={() => handleOAuth("apple")}
            >
              <MaterialIcons name="apple" size={22} color={c.onSurface} />
              <Text style={[styles.socialLabel, { color: c.onSurface }]}>
                Continue with Apple
              </Text>
            </TouchableOpacity>
          </View>

          {/* Terms footer */}
          <Text style={[styles.terms, { color: c.onSurfaceVariant }]}>
            By continuing you agree to AIpron's Terms of Service & Privacy Policy.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const HERO_HEIGHT = 340;
const MAX_WIDTH = 680;

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
  },
  container: {
    width: "100%",
    maxWidth: MAX_WIDTH,
    alignSelf: "center",
  },
  heroWrap: {
    width: "100%",
    height: HERO_HEIGHT,
    overflow: "hidden",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 60,
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 12,
    marginHorizontal: 0,
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  wordmarkPill: {
    position: "absolute",
    top: spacing.xl,
    left: spacing.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  wordmark: {
    fontFamily: fonts.serifItalic,
    fontSize: 28,
  },
  headingBlock: {
    paddingHorizontal: spacing.screenPadding,
    marginTop: spacing.xxl,
    gap: spacing.md,
  },
  heading: {
    fontFamily: fonts.serifBold,
    fontSize: 42,
    lineHeight: 48,
    letterSpacing: -0.5,
  },
  headingItalic: {
    fontFamily: fonts.serifBoldItalic,
    fontSize: 42,
    lineHeight: 48,
  },
  subheading: {
    fontFamily: fonts.sans,
    fontSize: 16,
    lineHeight: 24,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.screenPadding,
    marginTop: spacing.lg,
  },
  errorText: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    flex: 1,
  },
  form: {
    paddingHorizontal: spacing.screenPadding,
    marginTop: spacing.xxl,
    gap: spacing.xl,
  },
  field: {
    gap: spacing.sm,
  },
  fieldLabel: {
    fontFamily: fonts.sansBold,
    fontSize: 10,
    letterSpacing: 4,
  },
  input: {
    fontFamily: fonts.sans,
    fontSize: 17,
    borderBottomWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 0,
  },
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
  },
  inputInline: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 17,
    paddingVertical: 10,
    paddingHorizontal: 0,
  },
  submitButton: {
    marginHorizontal: spacing.screenPadding,
    marginTop: spacing.xxl,
  },
  secondaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.lg,
    paddingHorizontal: spacing.screenPadding,
    gap: spacing.md,
    flexWrap: "wrap",
  },
  secondaryLink: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: spacing.screenPadding,
    marginTop: spacing.xxl,
    gap: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerLabel: {
    fontFamily: fonts.sansBold,
    fontSize: 10,
    letterSpacing: 3,
  },
  socialColumn: {
    paddingHorizontal: spacing.screenPadding,
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  socialCard: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
  },
  googleLogo: {
    width: 20,
    height: 20,
  },
  socialLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
  },
  terms: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    textAlign: "center",
    lineHeight: 18,
    maxWidth: 300,
    alignSelf: "center",
    marginTop: spacing.xxl,
    paddingHorizontal: spacing.screenPadding,
    opacity: 0.75,
  },
});

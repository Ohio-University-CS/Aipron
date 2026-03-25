import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
  Alert,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
} from "react-native";
import { useRouter } from "expo-router";
import { authApi } from "../src/services/api";
import { useAuthStore } from "../src/store/useAuthStore";
import { colors, spacing, borderRadius, typography } from "../src/constants/DesignTokens";
import { supabase } from "../src/services/supabase";

function getAuthErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    const msg = (error as { message?: string }).message;
    if (typeof msg === "string" && msg.trim()) return msg;
  }
  if (error && typeof error === "object" && "response" in error) {
    const data = (error as { response?: { data?: { error?: string } } }).response?.data;
    if (data?.error && typeof data.error === "string") return data.error;
  }
  return "Something went wrong. Please try again.";
}

function notify(title: string, message: string) {
  if (Platform.OS === "web") {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
}

export default function LoginScreen() {
  const router = useRouter();
  const { setSession } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setFormError(null);

    if (!email.trim() || !password) {
      const msg = "Please enter email and password.";
      setFormError(msg);
      notify("Missing fields", msg);
      return;
    }

    setIsLoading(true);
    try {
      if (isRegister) {
        const result = await authApi.register(email.trim(), password);

        if (!result.session) {
          setFormError(
            "Account created. If Supabase requires email confirmation, check your inbox and click the link—then sign in below."
          );
          setIsRegister(false);
          notify(
            "Check your email",
            "If your project uses email confirmation, open the link we sent you, then sign in here."
          );
          return;
        }

        const { data: sessionData } = await supabase.auth.getSession();
        setSession(sessionData.session ?? null);
        router.replace("/(tabs)/chat");
        return;
      }

      await authApi.login(email.trim(), password);
      const { data: sessionData } = await supabase.auth.getSession();
      setSession(sessionData.session ?? null);

      if (!sessionData.session) {
        setFormError("Signed in but no session was stored. Try again or check Supabase settings.");
        return;
      }

      router.replace("/(tabs)/chat");
    } catch (error: unknown) {
      const msg = getAuthErrorMessage(error);
      setFormError(msg);
      notify("Sign in failed", msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <View style={styles.inner}>
          <Text style={styles.title}>AIpron</Text>
          <Text style={styles.subtitle}>
            {isRegister ? "Create an account" : "Sign in to continue"}
          </Text>

          {formError ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{formError}</Text>
            </View>
          ) : null}

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={colors.textSecondary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoading}
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={colors.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!isLoading}
          />

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={() => void handleSubmit()}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>
              {isLoading ? "Please wait…" : isRegister ? "Register" : "Login"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => {
              setFormError(null);
              setIsRegister(!isRegister);
            }}
            disabled={isLoading}
          >
            <Text style={styles.switchText}>
              {isRegister ? "Already have an account? Sign in" : "Don't have an account? Register"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: spacing.xl,
  },
  inner: {
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
  },
  title: {
    ...typography.h1,
    color: colors.text,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  errorBanner: {
    backgroundColor: colors.error + "18",
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.error + "40",
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    lineHeight: 20,
  },
  input: {
    ...typography.body,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    color: colors.text,
  },
  button: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: "center",
    marginTop: spacing.md,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    ...typography.body,
    color: colors.background,
    fontWeight: "600",
  },
  switchButton: {
    marginTop: spacing.lg,
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  switchText: {
    ...typography.caption,
    color: colors.primary,
  },
});

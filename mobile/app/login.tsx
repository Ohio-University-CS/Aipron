import React, { useState } from "react";
import { View, TextInput, TouchableOpacity, StyleSheet, Text } from "react-native";
import { useRouter } from "expo-router";
import { authApi } from "../src/services/api";
import { useAuthStore } from "../src/store/useAuthStore";
import { spacing, borderRadius, typography } from "../src/constants/DesignTokens";
import { useThemeColors } from "../src/hooks/useThemeColors";

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
  const { setSession } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({ email: false, password: false, name: false });

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
    if (lower.includes("already registered") || lower.includes("already exists") || lower.includes("duplicate")) {
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

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <Text style={[styles.title, { color: c.text }]}>AIpron</Text>
      <Text style={[styles.subtitle, { color: c.textSecondary }]}>
        {isRegister ? "Create an account" : "Sign in to continue"}
      </Text>

      {errorMessage !== "" && (
        <View style={[styles.errorBanner, { backgroundColor: c.error + "15" }]}>
          <Text style={styles.warningIcon}>{"\u26A0"}</Text>
          <Text style={[styles.errorText, { color: c.error }]}>{errorMessage}</Text>
        </View>
      )}

      {isRegister && (
        <TextInput
          style={[
            styles.input,
            { backgroundColor: c.surface, color: c.text },
            fieldErrors.name && { borderColor: c.error, borderWidth: 1 },
          ]}
          placeholder="Username"
          placeholderTextColor={c.textSecondary}
          value={name}
          onChangeText={handleNameChange}
          autoCapitalize="none"
          editable={!isLoading}
        />
      )}

      <TextInput
        style={[
          styles.input,
          { backgroundColor: c.surface, color: c.text },
          fieldErrors.email && { borderColor: c.error, borderWidth: 1 },
        ]}
        placeholder="Email"
        placeholderTextColor={c.textSecondary}
        value={email}
        onChangeText={handleEmailChange}
        keyboardType="email-address"
        autoCapitalize="none"
        editable={!isLoading}
      />

      <TextInput
        style={[
          styles.input,
          { backgroundColor: c.surface, color: c.text },
          fieldErrors.password && { borderColor: c.error, borderWidth: 1 },
        ]}
        placeholder="Password"
        placeholderTextColor={c.textSecondary}
        value={password}
        onChangeText={handlePasswordChange}
        secureTextEntry
        editable={!isLoading}
      />

      <TouchableOpacity
        style={[styles.button, { backgroundColor: c.primary }, isLoading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? "Loading..." : isRegister ? "Register" : "Login"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.switchButton}
        onPress={handleToggleMode}
        disabled={isLoading}
      >
        <Text style={[styles.switchText, { color: c.primary }]}>
          {isRegister ? "Already have an account? Sign in" : "Don't have an account? Register"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: "center",
  },
  title: {
    ...typography.h1,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  warningIcon: {
    fontSize: 18,
    marginRight: spacing.sm,
  },
  errorText: {
    ...typography.caption,
    fontWeight: "500",
    flex: 1,
  },
  input: {
    ...typography.body,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  button: {
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
    color: "#FFFFFF",
    fontWeight: "600",
  },
  switchButton: {
    marginTop: spacing.lg,
    alignItems: "center",
  },
  switchText: {
    ...typography.caption,
  },
});

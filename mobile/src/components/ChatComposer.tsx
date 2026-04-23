import React, { useState, useMemo } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { spacing, borderRadius, fonts, type ThemeColors } from "../constants/DesignTokens";
import { useThemeColors } from "../hooks/useThemeColors";
import { VoiceButton } from "./VoiceButton";

interface ChatComposerProps {
  onSend: (message: string) => void;
  onVoicePress?: () => void;
  isRecording?: boolean;
  onLiveVoicePress?: () => void;
  liveVoiceActive?: boolean;
  liveVoiceConnecting?: boolean;
  isLoading?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

export const ChatComposer: React.FC<ChatComposerProps> = ({
  onSend,
  onVoicePress,
  isRecording = false,
  onLiveVoicePress,
  liveVoiceActive = false,
  liveVoiceConnecting = false,
  isLoading = false,
  placeholder = "What would you like to cook?",
  disabled = false,
}) => {
  const [message, setMessage] = useState("");
  const c = useThemeColors();
  const styles = useMemo(() => getStyles(c), [c]);

  const handleSend = () => {
    if (message.trim() && !isLoading && !disabled) {
      onSend(message.trim());
      setMessage("");
    }
  };

  const liveActiveOrConnecting = liveVoiceActive || liveVoiceConnecting;

  return (
    <View style={styles.container}>
      <View style={styles.bar}>
        {onLiveVoicePress ? (
          <TouchableOpacity
            onPress={onLiveVoicePress}
            disabled={disabled || isLoading}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={
              liveActiveOrConnecting ? "Stop live voice" : "Start live voice"
            }
            style={[
              styles.liveVoiceButton,
              liveActiveOrConnecting && styles.liveVoiceButtonActive,
              (disabled || isLoading) && styles.liveVoiceButtonDisabled,
            ]}
          >
            {liveVoiceConnecting ? (
              <ActivityIndicator size="small" color={c.primary} />
            ) : (
              <MaterialIcons
                name={liveVoiceActive ? "stop-circle" : "graphic-eq"}
                size={22}
                color={liveVoiceActive ? c.onPrimaryContainer : c.primary}
              />
            )}
          </TouchableOpacity>
        ) : null}
        {onVoicePress ? (
          <VoiceButton
            onPress={onVoicePress}
            isRecording={isRecording}
            disabled={disabled || isLoading || liveActiveOrConnecting}
          />
        ) : (
          <View style={styles.attachButton} pointerEvents="none" />
        )}
        <TextInput
          style={styles.input}
          value={message}
          onChangeText={setMessage}
          placeholder={placeholder}
          placeholderTextColor={c.onSurfaceVariant}
          multiline
          editable={!disabled && !isLoading}
          onSubmitEditing={handleSend}
          returnKeyType="send"
        />
        {message.trim() ? (
          <TouchableOpacity
            style={[styles.sendButton, (disabled || isLoading) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={disabled || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={c.onPrimaryContainer} size="small" />
            ) : (
              <MaterialIcons name="arrow-upward" size={22} color={c.onPrimaryContainer} />
            )}
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const getStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 90,
    left: spacing.lg,
    right: spacing.lg,
  },
  bar: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: c.surfaceContainerLowest + "E6",
    borderRadius: borderRadius.xxl,
    borderWidth: 1,
    borderColor: c.outlineVariant + "1A",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  attachButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    fontFamily: fonts.sans,
    fontSize: 16,
    lineHeight: 24,
    color: c.onSurface,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: c.primaryContainer,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: c.outlineVariant,
  },
  liveVoiceButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: c.surfaceContainerHighest,
    borderWidth: 1,
    borderColor: c.outlineVariant + "33",
  },
  liveVoiceButtonActive: {
    backgroundColor: c.primaryContainer,
    borderColor: c.primary,
  },
  liveVoiceButtonDisabled: {
    opacity: 0.5,
  },
});

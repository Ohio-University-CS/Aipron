import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { spacing, borderRadius, typography, type ThemeColors } from "../constants/DesignTokens";
import { useThemeColors } from "../hooks/useThemeColors";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  role,
  content,
  timestamp,
}) => {
  const c = useThemeColors();
  const styles = useMemo(() => getStyles(c), [c]);
  const isUser = role === "user";

  return (
    <View style={[styles.container, isUser && styles.userContainer]}>
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        <Text style={[styles.text, isUser ? styles.userText : styles.assistantText]}>
          {content}
        </Text>
        {timestamp && (
          <Text style={[styles.timestamp, isUser ? styles.userTimestamp : styles.assistantTimestamp]}>
            {timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </Text>
        )}
      </View>
    </View>
  );
};

const getStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    marginBottom: spacing.md,
    alignItems: "flex-start",
  },
  userContainer: {
    alignItems: "flex-end",
  },
  bubble: {
    maxWidth: "80%",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  userBubble: {
    backgroundColor: c.primary,
    borderBottomRightRadius: borderRadius.sm,
  },
  assistantBubble: {
    backgroundColor: c.surface,
    borderBottomLeftRadius: borderRadius.sm,
  },
  text: {
    ...typography.body,
    lineHeight: 20,
  },
  userText: {
    color: c.background,
  },
  assistantText: {
    color: c.text,
  },
  timestamp: {
    ...typography.caption,
    fontSize: 11,
    marginTop: spacing.xs / 2,
  },
  userTimestamp: {
    color: c.background + "CC",
  },
  assistantTimestamp: {
    color: c.textSecondary,
  },
});

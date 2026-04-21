import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { spacing, fonts, type ThemeColors } from "../constants/DesignTokens";
import { useThemeColors } from "../hooks/useThemeColors";
import { AssistantMessageBody } from "../utils/assistantMessageContent";

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
        {!isUser && (
          <View style={styles.aiPrefix}>
            <MaterialIcons name="auto-awesome" size={16} color={c.primary} />
          </View>
        )}
        {isUser ? (
          <Text style={[styles.text, styles.userText]}>{content}</Text>
        ) : (
          <AssistantMessageBody content={content} theme={c} />
        )}
        {timestamp && (
          <Text style={styles.timestamp}>
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
    maxWidth: "92%",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  userBubble: {
    backgroundColor: c.surfaceContainerHigh,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
    borderBottomLeftRadius: 24,
  },
  assistantBubble: {
    backgroundColor: c.surfaceContainerLow,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    borderBottomLeftRadius: 4,
  },
  aiPrefix: {
    marginBottom: spacing.xs,
  },
  text: {
    fontFamily: fonts.sans,
    fontSize: 16,
    lineHeight: 24,
  },
  userText: {
    color: c.onSurface,
  },
  timestamp: {
    fontFamily: fonts.sansMedium,
    fontSize: 10,
    lineHeight: 14,
    color: c.onSurfaceVariant,
    marginTop: spacing.xs,
  },
});

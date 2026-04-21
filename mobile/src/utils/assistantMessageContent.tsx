import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { fonts, type ThemeColors } from "../constants/DesignTokens";

/**
 * Strips markdown-style markers for TTS / voice playback so the model output sounds natural.
 */
export function stripForSpeech(raw: string): string {
  return raw
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/^[\s]*[-*]\s*/gm, " ")
    .replace(/^\s*\d+\.\s*/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Inline **bold** segments inside a single Text line. */
function LineWithBold({
  text,
  color,
  style,
}: {
  text: string;
  color: string;
  style?: object;
}) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <Text style={style}>
      {parts.map((part, idx) => {
        if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
          return (
            <Text key={idx} style={{ fontFamily: fonts.sansBold, color }}>
              {part.slice(2, -2)}
            </Text>
          );
        }
        return <React.Fragment key={idx}>{part}</React.Fragment>;
      })}
    </Text>
  );
}

/**
 * Renders assistant text with readable structure (headings, bullets, numbered steps, bold).
 */
export function AssistantMessageBody({
  content,
  theme,
}: {
  content: string;
  theme: ThemeColors;
}): React.ReactElement {
  const bodyStyle = [styles.body, { color: theme.onSurface }];
  const titleStyle = [styles.sectionTitle, { color: theme.onSurface }];

  const lines = content.split(/\r?\n/);
  const blocks: React.ReactNode[] = [];
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === "") {
      blocks.push(<View key={`sp-${key++}`} style={styles.spacer} />);
      continue;
    }

    const h = trimmed.match(/^#{1,3}\s+(.+)$/);
    if (h) {
      blocks.push(
        <Text key={`h-${key++}`} style={titleStyle}>
          {h[1]}
        </Text>
      );
      continue;
    }

    const plainSection = trimmed.match(
      /^(Ingredients|Instructions|Tips|Notes|Method|Steps|Equipment|Overview)(:)?\s*$/i
    );
    if (plainSection) {
      blocks.push(
        <Text key={`ps-${key++}`} style={titleStyle}>
          {plainSection[1]}
        </Text>
      );
      continue;
    }

    const bullet = trimmed.match(/^[-*]\s+(.+)$/);
    if (bullet) {
      blocks.push(
        <View key={`b-${key++}`} style={styles.bulletRow}>
          <Text style={[styles.bulletDot, { color: theme.primary }]}>{"\u2022"}</Text>
          <View style={styles.bulletTextWrap}>
            <LineWithBold text={bullet[1]} color={theme.onSurface} style={bodyStyle} />
          </View>
        </View>
      );
      continue;
    }

    const num = trimmed.match(/^(\d+)\.\s+(.+)$/);
    if (num) {
      blocks.push(
        <View key={`n-${key++}`} style={styles.stepRow}>
          <Text style={[styles.stepNum, { color: theme.tertiary }]}>{num[1]}.</Text>
          <View style={styles.stepTextWrap}>
            <LineWithBold text={num[2]} color={theme.onSurface} style={bodyStyle} />
          </View>
        </View>
      );
      continue;
    }

    blocks.push(
      <LineWithBold key={`p-${key++}`} text={trimmed} color={theme.onSurface} style={bodyStyle} />
    );
  }

  return <View style={styles.wrap}>{blocks}</View>;
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: "stretch",
  },
  spacer: {
    height: 6,
  },
  body: {
    fontFamily: fonts.sans,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 4,
  },
  sectionTitle: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 17,
    lineHeight: 24,
    marginTop: 8,
    marginBottom: 6,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
    paddingRight: 4,
  },
  bulletDot: {
    fontFamily: fonts.sansBold,
    fontSize: 16,
    lineHeight: 24,
    marginRight: 8,
  },
  bulletTextWrap: {
    flex: 1,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
    paddingRight: 4,
  },
  stepNum: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 16,
    lineHeight: 24,
    marginRight: 8,
    minWidth: 24,
  },
  stepTextWrap: {
    flex: 1,
  },
});

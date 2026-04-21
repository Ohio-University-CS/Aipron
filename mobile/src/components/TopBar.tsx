import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { fonts, spacing } from "../constants/DesignTokens";
import { useThemeColors } from "../hooks/useThemeColors";

interface TopBarProps {
  title?: string;
  showBack?: boolean;
  showAvatar?: boolean;
  rightIcon?: string;
  onRightPress?: () => void;
  onBackPress?: () => void;
  onMenuPress?: () => void;
  transparent?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  title,
  showBack = false,
  showAvatar = true,
  rightIcon,
  onRightPress,
  onBackPress,
  onMenuPress,
  transparent = false,
}) => {
  const theme = useThemeColors();
  const insets = useSafeAreaInsets();

  const containerStyle: ViewStyle = {
    ...styles.container,
    paddingTop: insets.top + spacing.sm,
    ...(transparent
      ? { backgroundColor: "transparent" }
      : { backgroundColor: theme.surface + "D9" }),
  };

  return (
    <View style={containerStyle}>
      <View style={styles.left}>
        {showBack ? (
          <TouchableOpacity
            onPress={onBackPress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
            disabled={!onBackPress}
          >
            <MaterialIcons name="arrow-back" size={24} color={theme.onSurface} />
          </TouchableOpacity>
        ) : onMenuPress ? (
          <TouchableOpacity
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={onMenuPress}
          >
            <MaterialIcons name="menu" size={24} color={theme.onSurface} />
          </TouchableOpacity>
        ) : (
          <View style={styles.leftPlaceholder} />
        )}
      </View>

      <View style={styles.center}>
        {title ? (
          <Text style={[styles.titleText, { color: theme.onSurface }]} numberOfLines={1}>
            {title}
          </Text>
        ) : (
          <Text style={[styles.wordmark, { color: theme.primary }]}>Aipron</Text>
        )}
      </View>

      <View style={styles.right}>
        {rightIcon && onRightPress ? (
          <TouchableOpacity
            onPress={onRightPress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
          >
            <MaterialIcons name={rightIcon as any} size={24} color={theme.onSurface} />
          </TouchableOpacity>
        ) : showAvatar ? (
          <View style={[styles.avatar, { borderColor: theme.outlineVariant }]} />
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.screenPadding,
  },
  left: {
    width: 40,
    alignItems: "flex-start",
  },
  leftPlaceholder: {
    width: 24,
    height: 24,
  },
  center: {
    flex: 1,
    alignItems: "center",
  },
  right: {
    width: 40,
    alignItems: "flex-end",
  },
  wordmark: {
    fontFamily: fonts.serifItalic,
    fontSize: 20,
  },
  titleText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 17,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    backgroundColor: "rgba(0,0,0,0.06)",
  },
  placeholder: {
    width: 36,
  },
});

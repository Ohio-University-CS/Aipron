import React from "react";
import { View, Image, StyleSheet, ViewStyle, ImageSourcePropType } from "react-native";

interface EditorialImageProps {
  source: ImageSourcePropType;
  style?: ViewStyle;
  aspectRatio?: number;
  variant?: "topLeft" | "bottomLeft";
}

const RADII = {
  topLeft: {
    borderTopLeftRadius: 48,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 12,
    borderBottomLeftRadius: 4,
  },
  bottomLeft: {
    borderTopLeftRadius: 4,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 4,
    borderBottomLeftRadius: 48,
  },
} as const;

export const EditorialImage: React.FC<EditorialImageProps> = ({
  source,
  style,
  aspectRatio = 3 / 4,
  variant = "topLeft",
}) => {
  return (
    <View style={[styles.wrapper, RADII[variant], style]}>
      <Image
        source={source}
        style={[styles.image, { aspectRatio }]}
        resizeMode="cover"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    overflow: "hidden",
  },
  image: {
    width: "100%",
  },
});

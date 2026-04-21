import type { ComponentType, PropsWithChildren } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

type Props = PropsWithChildren<{ style?: StyleProp<ViewStyle> }>;

const Root = GestureHandlerRootView as ComponentType<Props>;

/** Bridges RNGH root view typings with React 19 `children` checks. */
export function GestureRootView(props: Props) {
  return <Root {...props} />;
}

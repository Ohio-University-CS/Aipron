import type { ComponentType, PropsWithChildren } from "react";
import { LinearGradient as ExpoLinearGradient } from "expo-linear-gradient";
import type { LinearGradientProps } from "expo-linear-gradient";

export type { LinearGradientProps } from "expo-linear-gradient";

type Props = PropsWithChildren<LinearGradientProps>;

const ExpoLG = ExpoLinearGradient as unknown as ComponentType<Props>;

/** Bridges expo-linear-gradient class typings with React 19 JSX expectations. */
export function LinearGradient(props: Props) {
  return <ExpoLG {...props} />;
}

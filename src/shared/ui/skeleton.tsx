import { useEffect, useState, type PropsWithChildren } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  View,
  type DimensionValue,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from "react-native";

import { useReducedMotion } from "@/shared/accessibility/use-reduced-motion";
import { useAppTheme } from "@/shared/theme/use-app-theme";

export type SkeletonProps = {
  borderRadius?: number;
  height?: number;
  style?: StyleProp<ViewStyle>;
  width?: DimensionValue;
};

export type SkeletonGroupProps = PropsWithChildren<
  Omit<ViewProps, "children"> & {
    label?: string;
  }
>;

export function Skeleton({
  borderRadius,
  height = 16,
  style,
  width = "100%",
}: SkeletonProps) {
  const theme = useAppTheme();
  const reduceMotion = useReducedMotion();
  const [opacity] = useState(() => new Animated.Value(0.72));

  useEffect(() => {
    opacity.stopAnimation();

    if (reduceMotion) {
      opacity.setValue(0.72);
      return;
    }

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          isInteraction: false,
          toValue: 0.4,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          isInteraction: false,
          toValue: 0.82,
          useNativeDriver: true,
        }),
      ]),
    );

    pulse.start();

    return () => pulse.stop();
  }, [opacity, reduceMotion]);

  return (
    <Animated.View
      accessibilityElementsHidden
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.skeleton,
        {
          backgroundColor: theme.colors.border,
          borderRadius: borderRadius ?? theme.radii.sm,
          height,
          opacity,
          width,
        },
        style,
      ]}
    />
  );
}

export function SkeletonGroup({
  accessibilityLabel,
  children,
  label = "Đang tải nội dung",
  ...viewProps
}: SkeletonGroupProps) {
  return (
    <View
      {...viewProps}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityLiveRegion="polite"
      accessibilityRole="progressbar"
      accessibilityValue={{ text: label }}
      accessible
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    overflow: "hidden",
  },
});

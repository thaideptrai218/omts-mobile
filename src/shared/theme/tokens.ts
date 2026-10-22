import type { TextStyle, ViewStyle } from "react-native";

export const spacing = {
  none: 0,
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  xxxl: 48,
} as const;

export const radii = {
  none: 0,
  sm: 8,
  md: 12,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;

export const borderWidths = {
  default: 1,
  emphasis: 2,
} as const;

export const sizes = {
  touchTarget: 48,
  fieldHeight: 52,
  buttonHeight: 52,
  brandMark: 56,
  contentMaxWidth: 560,
} as const;

export const opacity = {
  disabled: 0.48,
  pressed: 0.72,
  visible: 1,
} as const;

type TypographyToken = Pick<
  TextStyle,
  "fontSize" | "fontWeight" | "letterSpacing" | "lineHeight"
>;

export const typography = {
  display: {
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: -0.6,
    lineHeight: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.25,
    lineHeight: 32,
  },
  heading: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.1,
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    fontWeight: "400",
    letterSpacing: 0,
    lineHeight: 24,
  },
  bodyStrong: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0,
    lineHeight: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.1,
    lineHeight: 20,
  },
  caption: {
    fontSize: 13,
    fontWeight: "400",
    letterSpacing: 0.1,
    lineHeight: 18,
  },
} as const satisfies Record<string, TypographyToken>;

type ElevationToken = Pick<
  ViewStyle,
  "elevation" | "shadowOffset" | "shadowOpacity" | "shadowRadius"
>;

export const elevation = {
  none: {
    elevation: 0,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  card: {
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  overlay: {
    elevation: 8,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
  },
} as const satisfies Record<string, ElevationToken>;

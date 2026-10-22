import {
  borderWidths,
  elevation,
  opacity,
  radii,
  sizes,
  spacing,
  typography,
} from "./tokens";

const lightColors = {
  background: "#F3F8F7",
  surface: "#FFFFFF",
  surfaceMuted: "#E7F1EF",
  surfaceRaised: "#FFFFFF",
  textPrimary: "#102A2E",
  textSecondary: "#49656A",
  textMuted: "#647B7F",
  border: "#C7D9D6",
  borderStrong: "#91ADA8",
  brand: "#0F766E",
  brandEmphasis: "#0B5F59",
  onBrand: "#FFFFFF",
  focus: "#2563EB",
  danger: "#B42318",
  onDanger: "#FFFFFF",
  dangerSurface: "#FEE4E2",
  onDangerSurface: "#7A271A",
  warning: "#B54708",
  warningSurface: "#FEF0C7",
  onWarningSurface: "#7A2E0E",
  success: "#067647",
  successSurface: "#DCFAE6",
  onSuccessSurface: "#085D3A",
  info: "#175CD3",
  infoSurface: "#E0EAFF",
  onInfoSurface: "#1849A9",
  disabled: "#D6E2E0",
  onDisabled: "#6B7F7C",
  overlay: "rgba(5, 31, 30, 0.48)",
  shadow: "#071B1B",
} as const;

type ColorTokenName = keyof typeof lightColors;
type ThemeColors = Record<ColorTokenName, string>;

const darkColors = {
  background: "#071B1B",
  surface: "#0D2928",
  surfaceMuted: "#143634",
  surfaceRaised: "#173C39",
  textPrimary: "#F0F9F7",
  textSecondary: "#B6CFCA",
  textMuted: "#8EAAA5",
  border: "#31504D",
  borderStrong: "#577570",
  brand: "#5EE0D3",
  brandEmphasis: "#82E9DE",
  onBrand: "#062A27",
  focus: "#84ADFF",
  danger: "#FDA29B",
  onDanger: "#3B0A03",
  dangerSurface: "#55160C",
  onDangerSurface: "#FECDCA",
  warning: "#FEC84B",
  warningSurface: "#4E1D09",
  onWarningSurface: "#FEEFC7",
  success: "#75E0A7",
  successSurface: "#074D31",
  onSuccessSurface: "#D3F8DF",
  info: "#84ADFF",
  infoSurface: "#102A56",
  onInfoSurface: "#D1E0FF",
  disabled: "#294440",
  onDisabled: "#839B97",
  overlay: "rgba(0, 0, 0, 0.68)",
  shadow: "#000000",
} as const satisfies ThemeColors;

export type AppColorScheme = "light" | "dark";

export type AppTheme = {
  borderWidths: typeof borderWidths;
  colorScheme: AppColorScheme;
  colors: ThemeColors;
  elevation: typeof elevation;
  opacity: typeof opacity;
  radii: typeof radii;
  sizes: typeof sizes;
  spacing: typeof spacing;
  typography: typeof typography;
};

function createTheme(
  colorScheme: AppColorScheme,
  colors: ThemeColors,
): AppTheme {
  return {
    borderWidths,
    colorScheme,
    colors,
    elevation,
    opacity,
    radii,
    sizes,
    spacing,
    typography,
  };
}

export const themes = {
  light: createTheme("light", lightColors),
  dark: createTheme("dark", darkColors),
} as const;

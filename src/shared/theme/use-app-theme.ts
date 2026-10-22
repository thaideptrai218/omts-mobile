import { useColorScheme } from "react-native";

import { themes } from "./theme";

export function useAppTheme() {
  const systemColorScheme = useColorScheme();

  return systemColorScheme === "dark" ? themes.dark : themes.light;
}

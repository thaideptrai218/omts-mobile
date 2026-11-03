import type { IconProps } from "zmp-ui/icon";

export type Tone = "neutral" | "success" | "warning" | "danger";

export type Label = {
  text: string;
  tone: Tone;
};

export type IconName = NonNullable<IconProps["icon"]>;

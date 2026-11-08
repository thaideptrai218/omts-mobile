import type { Tone } from "@/models/UI";

export function Badge({ text, tone }: { text: string; tone: Tone }) {
  return <span className={`badge badge--${tone}`}>{text}</span>;
}

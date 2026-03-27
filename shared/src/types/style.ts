import type { StyleId } from "./common.js";

export type BuiltinStyleId = "normal" | "concise" | "explanatory" | "formal";

export interface CustomStyle {
  id: StyleId;
  name: string;
  description: string;
  prompt: string;
  sampleText: string | null;
  createdAt: string;
}

export const BUILTIN_STYLES: Record<BuiltinStyleId, { name: string; prompt: string }> = {
  normal: { name: "Normal", prompt: "" },
  concise: { name: "Concise", prompt: "Be brief and direct. Skip unnecessary elaboration." },
  explanatory: { name: "Explanatory", prompt: "Explain concepts thoroughly with examples. Assume the reader is learning." },
  formal: { name: "Formal", prompt: "Use formal, professional language. Structure responses clearly with headings when appropriate." },
};

export type ThemeMode = "light" | "dark" | "system";
export type ThinkingMode = "adaptive" | "enabled" | "disabled";

export interface AppSettings {
  theme: ThemeMode;
  sidebarWidth: number;
  thinking: ThinkingMode;
  thinkingBudgetTokens: number;
  maxBudgetUsd: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: "system",
  sidebarWidth: 280,
  thinking: "adaptive",
  thinkingBudgetTokens: 128_000,
  maxBudgetUsd: 5,
};

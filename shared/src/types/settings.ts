export type ThemeMode = "light" | "dark" | "system";

export interface AppSettings {
  theme: ThemeMode;
  sidebarWidth: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: "system",
  sidebarWidth: 280,
};

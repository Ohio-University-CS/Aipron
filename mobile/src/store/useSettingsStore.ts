import { create } from "zustand";

export type AppLanguage =
  | "English"
  | "Spanish"
  | "French"
  | "German"
  | "Italian"
  | "Portuguese"
  | "Japanese"
  | "Korean"
  | "Chinese";

interface SettingsState {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
}

export const useSettingsStore = create<SettingsState>()((set) => ({
  language: "English",
  setLanguage: (language) => set({ language }),
}));

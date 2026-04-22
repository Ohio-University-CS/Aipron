import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { authApi } from "../services/api";

/**
 * Persists the signed-in user's chosen dietary tags on-device and syncs them
 * to `profiles.dietary_preferences` via `PUT /auth/preferences` so the backend
 * can automatically merge them into every recipe generation prompt.
 *
 * The store is intentionally optimistic: the UI updates immediately, and the
 * server write happens in the background. If the server write fails we roll
 * back to the previous value so Settings stays honest.
 */
interface UserPrefsState {
  dietaryPreferences: string[];
  isHydrated: boolean;
  isSyncing: boolean;
  /** Replace the on-device value (no server round-trip). */
  setLocal: (prefs: string[]) => void;
  /** Toggle one tag on/off and sync the result to the server. */
  toggle: (tag: string) => Promise<void>;
  /** Replace the full list and sync to the server. */
  setAndSync: (prefs: string[]) => Promise<void>;
  /** Load the authoritative list from the server (call on sign-in / app boot). */
  hydrateFromServer: () => Promise<void>;
}

export const useUserPrefsStore = create<UserPrefsState>()(
  persist(
    (set, get) => ({
      dietaryPreferences: [],
      isHydrated: false,
      isSyncing: false,

      setLocal: (dietaryPreferences) => set({ dietaryPreferences }),

      toggle: async (tag) => {
        const current = get().dietaryPreferences;
        const next = current.includes(tag)
          ? current.filter((t) => t !== tag)
          : [...current, tag];
        await get().setAndSync(next);
      },

      setAndSync: async (prefs) => {
        const previous = get().dietaryPreferences;
        set({ dietaryPreferences: prefs, isSyncing: true });
        try {
          const authoritative = await authApi.updatePreferences(prefs);
          set({ dietaryPreferences: authoritative, isSyncing: false });
        } catch (err) {
          console.warn("[useUserPrefsStore] sync failed, rolling back:", err);
          set({ dietaryPreferences: previous, isSyncing: false });
        }
      },

      hydrateFromServer: async () => {
        try {
          const me = await authApi.getMe();
          const prefs = me?.user?.dietary_preferences;
          if (Array.isArray(prefs)) {
            set({
              dietaryPreferences: prefs.filter(
                (p: unknown): p is string => typeof p === "string"
              ),
              isHydrated: true,
            });
            return;
          }
        } catch (err) {
          console.warn("[useUserPrefsStore] hydrate failed:", err);
        }
        set({ isHydrated: true });
      },
    }),
    {
      name: "aipron-user-prefs",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ dietaryPreferences: state.dietaryPreferences }),
    }
  )
);

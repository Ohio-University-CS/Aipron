import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface BudgetModeState {
  budgetMode: boolean;
  setBudgetMode: (value: boolean) => void;
}

export const useBudgetModeStore = create<BudgetModeState>()(
  persist(
    (set) => ({
      budgetMode: false,
      setBudgetMode: (budgetMode) => set({ budgetMode }),
    }),
    {
      name: "aipron-budget-mode",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

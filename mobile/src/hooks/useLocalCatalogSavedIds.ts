import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "@aipron/localCatalogSavedIds";

/** Keeps all `useLocalCatalogSavedIds` hook instances in sync after a toggle. */
const syncListeners = new Set<() => void>();

function notifyLocalCatalogSavedSync() {
  syncListeners.forEach((fn) => {
    try {
      fn();
    } catch {
      /* ignore */
    }
  });
}

export function useLocalCatalogSavedIds() {
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const reload = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const arr = JSON.parse(raw) as string[];
        setSavedIds(new Set(arr.filter((x) => typeof x === "string")));
      } else {
        setSavedIds(new Set());
      }
    } catch {
      setSavedIds(new Set());
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    const listener = () => {
      void reload();
    };
    syncListeners.add(listener);
    return () => {
      syncListeners.delete(listener);
    };
  }, [reload]);

  const toggleSave = useCallback((recipeId: string) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(recipeId)) {
        next.delete(recipeId);
      } else {
        next.add(recipeId);
      }
      void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...next])).then(
        () => {
          notifyLocalCatalogSavedSync();
        },
      );
      return next;
    });
  }, []);

  return { savedIds, toggleSave, reloadSavedIds: reload };
}

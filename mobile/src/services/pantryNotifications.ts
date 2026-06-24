import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Native-only. Expo web does not support push/local notifications in the same way.
type ExpoNotifications = typeof import("expo-notifications");

export type PantryNotificationItem = {
  id: string;
  name: string;
  expiresAt?: Date | string | null;
};

const STORAGE_KEY = "aipron:pantyNotifIds:v1";

function toDate(value: PantryNotificationItem["expiresAt"]): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function atLocalHour(date: Date, hour: number) {
  const d = new Date(date);
  d.setHours(hour, 0, 0, 0);
  return d;
}

function daysBefore(date: Date, days: number) {
  return new Date(date.getTime() - days * 86400000);
}

async function loadIds(): Promise<Record<string, string[]>> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, string[]>) : {};
  } catch {
    return {};
  }
}

async function saveIds(map: Record<string, string[]>) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

async function getNotifications(): Promise<ExpoNotifications | null> {
  if (Platform.OS === "web") return null;
  try {
    return await import("expo-notifications");
  } catch {
    return null;
  }
}

export async function ensurePantryNotificationPermissions(): Promise<boolean> {
  const Notifications = await getNotifications();
  if (!Notifications) return false;

  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    return true;
  }

  const req = await Notifications.requestPermissionsAsync();
  return !!req.granted;
}

export async function reschedulePantryNotifications(items: PantryNotificationItem[]) {
  const Notifications = await getNotifications();
  if (!Notifications) return;

  const granted = await ensurePantryNotificationPermissions();
  if (!granted) return;

  // Cancel everything we scheduled previously (simple & reliable).
  const prev = await loadIds();
  const allPrevIds = Object.values(prev).flat();
  await Promise.all(allPrevIds.map((id) => Notifications.cancelScheduledNotificationAsync(id)));

  const now = new Date();
  const nextMap: Record<string, string[]> = {};

  for (const item of items) {
    const exp = toDate(item.expiresAt);
    if (!exp) continue;

    // "About to expire" = 3 days before, 9am local time.
    const soonAt = atLocalHour(daysBefore(exp, 3), 9);
    // "Expired" = on expiration date, 9am local time.
    const expiredAt = atLocalHour(exp, 9);

    const ids: string[] = [];
    if (soonAt.getTime() > now.getTime()) {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: "Pantry expiring soon",
          body: `${item.name} expires in 3 days.`,
          sound: true,
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: soonAt },
      });
      ids.push(id);
    }

    if (expiredAt.getTime() > now.getTime()) {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: "Pantry expired",
          body: `${item.name} has expired.`,
          sound: true,
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: expiredAt },
      });
      ids.push(id);
    }

    if (ids.length) nextMap[item.id] = ids;
  }

  await saveIds(nextMap);
}


import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? "";

if (!supabaseUrl) {
  throw new Error(
    [
      "Missing Supabase URL.",
      'Set EXPO_PUBLIC_SUPABASE_URL in "mobile/.env" (then restart Metro with cache cleared).',
    ].join(" ")
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    [
      "Missing Supabase anon key.",
      'Set EXPO_PUBLIC_SUPABASE_ANON_KEY in "mobile/.env" (then restart Metro with cache cleared).',
    ].join(" ")
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

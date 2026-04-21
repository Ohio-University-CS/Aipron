import { supabaseAdmin } from "../db/supabase.js";

// Sentinel password hash used for Supabase-Auth users that get shimmed into
// the legacy public.users table. The actual auth happens against auth.users
// via Supabase Auth; this row exists only to satisfy the pre-Supabase-Auth
// foreign-key constraint on recipes.user_id (and siblings) that still points
// at public.users(id) in this project. Remove once the FK is repointed to
// auth.users(id); see backend/src/db/migrations/2026-04-21_repoint_user_fk.sql.
const LEGACY_SHIM_PASSWORD_HASH = "supabase-auth";

let warnedOnce = false;

/**
 * Ensure a row exists in the legacy public.users table for the given
 * Supabase-Auth user, so writes that FK to public.users(id) succeed.
 *
 * Idempotent. Silently no-ops if public.users doesn't exist anymore
 * (the post-migration happy path).
 */
export async function ensureLegacyUserRow(authUser) {
  if (!authUser?.id) return;

  const { error } = await supabaseAdmin
    .from("users")
    .upsert(
      {
        id: authUser.id,
        email: authUser.email || `${authUser.id}@supabase.auth`,
        password_hash: LEGACY_SHIM_PASSWORD_HASH,
      },
      { onConflict: "id", ignoreDuplicates: false }
    );

  if (error) {
    // PGRST205 = table not found (post-migration). Treat as success.
    // Any other error we log once and move on; the downstream insert will
    // surface the real problem.
    const code = error.code || "";
    if (code === "PGRST205" || /does not exist/i.test(error.message)) {
      return;
    }
    if (!warnedOnce) {
      warnedOnce = true;
      console.warn(
        "[legacyUsers] failed to shim public.users row (will retry on next call):",
        error.message
      );
    }
  }
}

-- 2026-04-21  Re-point legacy foreign keys from public.users(id) to auth.users(id)
--
-- Context:
-- Early versions of this project rolled their own auth into a custom
-- public.users table. We later moved to Supabase Auth, but the foreign-key
-- constraints on recipes.user_id, saved_recipes.user_id, etc. were never
-- repointed at auth.users. That meant any Supabase-Auth user (who lives only
-- in auth.users + profiles) could not insert into those tables — inserts
-- failed with:
--     code 23503  "violates foreign key constraint recipes_user_id_fkey"
--     details "Key is not present in table 'users'".
--
-- The code has a self-healing shim (see backend/src/services/legacyUsers.js)
-- that upserts a row into public.users on demand so writes still succeed.
-- This migration removes the need for that shim by pointing the FKs at the
-- real source of truth (auth.users). After applying, you can safely drop the
-- ensureLegacyUserRow calls.
--
-- How to apply:
-- Paste this entire file into the Supabase Dashboard SQL Editor and Run.

BEGIN;

-- Repoint every public-schema FK that still references public.users(id).
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT
      tc.table_schema  AS child_schema,
      tc.table_name    AS child_table,
      tc.constraint_name,
      kcu.column_name  AS child_column
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
     AND tc.table_schema   = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu
      ON tc.constraint_name = ccu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema   = 'public'
      AND ccu.table_schema  = 'public'
      AND ccu.table_name    = 'users'
  LOOP
    EXECUTE format(
      'ALTER TABLE %I.%I DROP CONSTRAINT %I',
      r.child_schema, r.child_table, r.constraint_name
    );
    EXECUTE format(
      'ALTER TABLE %I.%I
         ADD CONSTRAINT %I
         FOREIGN KEY (%I)
         REFERENCES auth.users(id)
         ON DELETE CASCADE',
      r.child_schema, r.child_table, r.constraint_name, r.child_column
    );
    RAISE NOTICE 'Repointed %.%.% -> auth.users(id)',
      r.child_schema, r.child_table, r.child_column;
  END LOOP;
END
$$;

-- Optionally remove the now-unused legacy table. Leaving this commented
-- because it also holds a legacy pre-Supabase-Auth catalog of users that
-- you may want to archive or audit before dropping.
-- DROP TABLE IF EXISTS public.users;

COMMIT;

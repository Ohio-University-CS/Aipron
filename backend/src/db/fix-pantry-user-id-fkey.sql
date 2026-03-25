-- Fix: POST /pantry fails with
--   insert or update on table "pantry_items" violates foreign key constraint "pantry_items_user_id_fkey"
--   details: Key is not present in table "users".
--
-- Cause: pantry_items.user_id was defined as REFERENCES public.users (or "users") instead of auth.users.
-- Supabase Auth only creates rows in auth.users — there is usually no matching row in public.users.
--
-- Run this in Supabase → SQL Editor (as a one-off migration).

ALTER TABLE public.pantry_items
  DROP CONSTRAINT IF EXISTS pantry_items_user_id_fkey;

ALTER TABLE public.pantry_items
  ADD CONSTRAINT pantry_items_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE;

-- If DROP fails, find the actual constraint name:
-- SELECT conname
-- FROM pg_constraint
-- WHERE conrelid = 'public.pantry_items'::regclass AND contype = 'f';

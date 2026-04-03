-- Supabase migration: public recipes + full-text search
--
-- Apply in Supabase SQL editor or via migrations workflow.
-- This repo's `backend/src/db/schema.sql` is documentation; this file is the runnable SQL.

-- 1) Public catalog support
ALTER TABLE public.recipes
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false;

-- Ensure user_id can be NULL for catalog recipes.
ALTER TABLE public.recipes
  ALTER COLUMN user_id DROP NOT NULL;

-- 2) Full-text search
ALTER TABLE public.recipes
  ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(cuisine, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(ingredients::text, '')), 'D')
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_recipes_is_public
  ON public.recipes (is_public);

CREATE INDEX IF NOT EXISTS idx_recipes_search_vector
  ON public.recipes USING GIN (search_vector);

-- 3) RLS: allow read access to public recipes or own recipes
-- Drop old policy if it exists (name from schema.sql docs).
DROP POLICY IF EXISTS "Users can view own recipes" ON public.recipes;

CREATE POLICY "Users can view public or own recipes"
  ON public.recipes
  FOR SELECT
  USING (is_public = TRUE OR auth.uid() = user_id);


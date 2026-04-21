-- Supabase migration: mark AI-generated recipes
--
-- Adds a boolean flag that distinguishes recipes produced by the
-- AI generation endpoint (POST /api/recipes/generate) from system/
-- catalog recipes and any future manually-created user recipes.

ALTER TABLE public.recipes
  ADD COLUMN IF NOT EXISTS is_ai_generated boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_recipes_is_ai_generated
  ON public.recipes (is_ai_generated);

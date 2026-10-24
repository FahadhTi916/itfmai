-- Run this ONCE in Supabase SQL Editor if your existing table is named public.itfm_api_keys.
-- It renames the existing table without deleting its data.
DO $$
BEGIN
  IF to_regclass('public.itfm_api_keys') IS NOT NULL
     AND to_regclass('public.itfm_ai_api_key') IS NULL THEN
    ALTER TABLE public.itfm_api_keys RENAME TO itfm_ai_api_key;
  END IF;
END $$;

-- Optional: rename the existing index for clarity.
ALTER INDEX IF EXISTS public.itfm_api_keys_user_active_idx
  RENAME TO itfm_ai_api_key_user_active_idx;

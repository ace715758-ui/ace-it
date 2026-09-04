-- ============================================================
-- Ace It! — Add Headline / Course to Profiles
-- Run this in Supabase Dashboard → SQL Editor (optional)
-- ============================================================

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS headline TEXT DEFAULT 'BSIT Student';

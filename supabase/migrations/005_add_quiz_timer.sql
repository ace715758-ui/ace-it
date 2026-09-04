-- ============================================================
-- Ace It! — Add Question Timer to Quizzes
-- Run this in Supabase Dashboard → SQL Editor (optional)
-- ============================================================

ALTER TABLE quizzes 
ADD COLUMN IF NOT EXISTS time_limit_per_question INTEGER DEFAULT 20;

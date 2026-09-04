-- ============================================================
-- Ace It! — AI Study Quiz Generator
-- Initial Database Schema (idempotent — safe to re-run)
-- ============================================================
-- Using VECTOR(768) for Gemini text-embedding-004.
-- Switch to VECTOR(1536) if you use OpenAI text-embedding-3-small.
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL DEFAULT '',
  email       TEXT NOT NULL DEFAULT '',
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on user sign-up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.email, '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- MATERIALS
-- ============================================================
CREATE TABLE IF NOT EXISTS materials (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename           TEXT NOT NULL,
  original_filename  TEXT NOT NULL,
  file_type          TEXT NOT NULL,
  file_size          BIGINT NOT NULL DEFAULT 0,
  storage_path       TEXT NOT NULL DEFAULT '',
  processing_status  TEXT NOT NULL DEFAULT 'uploading'
                       CHECK (processing_status IN ('uploading', 'processing', 'completed', 'failed')),
  extracted_text     TEXT,
  uploaded_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS materials_user_id_idx     ON materials(user_id);
CREATE INDEX IF NOT EXISTS materials_status_idx      ON materials(processing_status);
CREATE INDEX IF NOT EXISTS materials_uploaded_at_idx ON materials(uploaded_at DESC);

-- ============================================================
-- DOCUMENT CHUNKS
-- ============================================================
CREATE TABLE IF NOT EXISTS document_chunks (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  material_id    UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  chunk_index    INTEGER NOT NULL,
  content        TEXT NOT NULL,
  page_number    INTEGER,
  section_title  TEXT,
  embedding      VECTOR(768),   -- Gemini text-embedding-004 = 768 dims
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS document_chunks_material_id_idx ON document_chunks(material_id);
CREATE INDEX IF NOT EXISTS document_chunks_order_idx       ON document_chunks(material_id, chunk_index);

-- Vector index — uncomment after loading 500+ rows:
-- CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx
--   ON document_chunks USING ivfflat (embedding vector_cosine_ops)
--   WITH (lists = 100);

-- ============================================================
-- QUIZZES
-- ============================================================
CREATE TABLE IF NOT EXISTS quizzes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  difficulty      TEXT NOT NULL DEFAULT 'medium'
                    CHECK (difficulty IN ('easy', 'medium', 'hard', 'mixed')),
  question_count  INTEGER NOT NULL DEFAULT 10,
  question_type   TEXT NOT NULL DEFAULT 'multiple_choice'
                    CHECK (question_type IN ('multiple_choice', 'true_false', 'identification', 'mixed')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS quizzes_user_id_idx    ON quizzes(user_id);
CREATE INDEX IF NOT EXISTS quizzes_created_at_idx ON quizzes(created_at DESC);

-- ============================================================
-- QUIZ MATERIALS (many-to-many)
-- ============================================================
CREATE TABLE IF NOT EXISTS quiz_materials (
  quiz_id      UUID NOT NULL REFERENCES quizzes(id)   ON DELETE CASCADE,
  material_id  UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  PRIMARY KEY (quiz_id, material_id)
);

CREATE INDEX IF NOT EXISTS quiz_materials_quiz_id_idx     ON quiz_materials(quiz_id);
CREATE INDEX IF NOT EXISTS quiz_materials_material_id_idx ON quiz_materials(material_id);

-- ============================================================
-- QUESTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS questions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id          UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text    TEXT NOT NULL,
  question_type    TEXT NOT NULL
                     CHECK (question_type IN ('multiple_choice', 'true_false', 'identification')),
  options          JSONB,
  correct_answer   TEXT NOT NULL,
  explanation      TEXT NOT NULL DEFAULT '',
  source_chunk_id  UUID REFERENCES document_chunks(id) ON DELETE SET NULL,
  difficulty       TEXT NOT NULL
                     CHECK (difficulty IN ('easy', 'medium', 'hard')),
  question_order   INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS questions_quiz_id_idx    ON questions(quiz_id);
CREATE INDEX IF NOT EXISTS questions_quiz_order_idx ON questions(quiz_id, question_order);

-- ============================================================
-- QUIZ ATTEMPTS
-- ============================================================
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id          UUID NOT NULL REFERENCES quizzes(id)    ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score            INTEGER NOT NULL DEFAULT 0,
  total_questions  INTEGER NOT NULL DEFAULT 0,
  percentage       NUMERIC(5, 2) NOT NULL DEFAULT 0,
  started_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS quiz_attempts_user_id_idx    ON quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS quiz_attempts_quiz_id_idx    ON quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS quiz_attempts_started_at_idx ON quiz_attempts(started_at DESC);

-- ============================================================
-- ANSWERS
-- ============================================================
CREATE TABLE IF NOT EXISTS answers (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id       UUID NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  question_id      UUID NOT NULL REFERENCES questions(id)     ON DELETE CASCADE,
  selected_answer  TEXT NOT NULL,
  is_correct       BOOLEAN NOT NULL DEFAULT FALSE,
  answered_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS answers_attempt_id_idx  ON answers(attempt_id);
CREATE INDEX IF NOT EXISTS answers_question_id_idx ON answers(question_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Helper: drop a policy if it exists before recreating
-- (Supabase doesn't support CREATE POLICY IF NOT EXISTS)

-- profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
-- legacy names from a previous run
DROP POLICY IF EXISTS "Users can view own profile"   ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- materials
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "materials_select_own" ON materials;
DROP POLICY IF EXISTS "materials_insert_own" ON materials;
DROP POLICY IF EXISTS "materials_update_own" ON materials;
DROP POLICY IF EXISTS "materials_delete_own" ON materials;
DROP POLICY IF EXISTS "Users can view own materials"   ON materials;
DROP POLICY IF EXISTS "Users can insert own materials" ON materials;
DROP POLICY IF EXISTS "Users can update own materials" ON materials;
DROP POLICY IF EXISTS "Users can delete own materials" ON materials;
CREATE POLICY "materials_select_own" ON materials FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "materials_insert_own" ON materials FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "materials_update_own" ON materials FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "materials_delete_own" ON materials FOR DELETE USING (auth.uid() = user_id);

-- document_chunks
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "chunks_select_own"                        ON document_chunks;
DROP POLICY IF EXISTS "Service can manage chunks"                ON document_chunks;
DROP POLICY IF EXISTS "Users can view chunks from own materials" ON document_chunks;
CREATE POLICY "chunks_select_own" ON document_chunks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM materials
      WHERE materials.id = document_chunks.material_id
        AND materials.user_id = auth.uid()
    )
  );
-- Insert/Update/Delete is done server-side via service role (bypasses RLS).

-- quizzes
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "quizzes_select_own" ON quizzes;
DROP POLICY IF EXISTS "quizzes_insert_own" ON quizzes;
DROP POLICY IF EXISTS "quizzes_update_own" ON quizzes;
DROP POLICY IF EXISTS "quizzes_delete_own" ON quizzes;
DROP POLICY IF EXISTS "Users can view own quizzes"   ON quizzes;
DROP POLICY IF EXISTS "Users can insert own quizzes" ON quizzes;
DROP POLICY IF EXISTS "Users can update own quizzes" ON quizzes;
DROP POLICY IF EXISTS "Users can delete own quizzes" ON quizzes;
CREATE POLICY "quizzes_select_own" ON quizzes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "quizzes_insert_own" ON quizzes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "quizzes_update_own" ON quizzes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "quizzes_delete_own" ON quizzes FOR DELETE USING (auth.uid() = user_id);

-- quiz_materials
ALTER TABLE quiz_materials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "quiz_materials_select_own" ON quiz_materials;
DROP POLICY IF EXISTS "quiz_materials_insert_own" ON quiz_materials;
DROP POLICY IF EXISTS "quiz_materials_delete_own" ON quiz_materials;
DROP POLICY IF EXISTS "Users can view own quiz_materials"   ON quiz_materials;
DROP POLICY IF EXISTS "Users can manage own quiz_materials" ON quiz_materials;
CREATE POLICY "quiz_materials_select_own" ON quiz_materials
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM quizzes WHERE quizzes.id = quiz_materials.quiz_id AND quizzes.user_id = auth.uid())
  );
CREATE POLICY "quiz_materials_insert_own" ON quiz_materials
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM quizzes WHERE quizzes.id = quiz_materials.quiz_id AND quizzes.user_id = auth.uid())
  );
CREATE POLICY "quiz_materials_delete_own" ON quiz_materials
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM quizzes WHERE quizzes.id = quiz_materials.quiz_id AND quizzes.user_id = auth.uid())
  );

-- questions
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "questions_select_own"                       ON questions;
DROP POLICY IF EXISTS "Users can view questions from own quizzes"  ON questions;
CREATE POLICY "questions_select_own" ON questions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM quizzes WHERE quizzes.id = questions.quiz_id AND quizzes.user_id = auth.uid())
  );

-- quiz_attempts
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "attempts_select_own" ON quiz_attempts;
DROP POLICY IF EXISTS "attempts_insert_own" ON quiz_attempts;
DROP POLICY IF EXISTS "attempts_update_own" ON quiz_attempts;
DROP POLICY IF EXISTS "Users can view own attempts"   ON quiz_attempts;
DROP POLICY IF EXISTS "Users can insert own attempts" ON quiz_attempts;
DROP POLICY IF EXISTS "Users can update own attempts" ON quiz_attempts;
CREATE POLICY "attempts_select_own" ON quiz_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "attempts_insert_own" ON quiz_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "attempts_update_own" ON quiz_attempts FOR UPDATE USING (auth.uid() = user_id);

-- answers
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "answers_select_own" ON answers;
DROP POLICY IF EXISTS "answers_insert_own" ON answers;
DROP POLICY IF EXISTS "Users can view own answers"   ON answers;
DROP POLICY IF EXISTS "Users can insert own answers" ON answers;
CREATE POLICY "answers_select_own" ON answers
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM quiz_attempts WHERE quiz_attempts.id = answers.attempt_id AND quiz_attempts.user_id = auth.uid())
  );
CREATE POLICY "answers_insert_own" ON answers
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM quiz_attempts WHERE quiz_attempts.id = answers.attempt_id AND quiz_attempts.user_id = auth.uid())
  );

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Vector similarity search for RAG (768-dim for Gemini)
CREATE OR REPLACE FUNCTION search_document_chunks(
  query_embedding     VECTOR(768),
  target_material_ids UUID[],
  match_threshold     FLOAT DEFAULT 0.3,
  match_count         INT   DEFAULT 10
)
RETURNS TABLE (
  chunk_id      UUID,
  content       TEXT,
  similarity    FLOAT,
  material_id   UUID,
  page_number   INTEGER,
  section_title TEXT
)
LANGUAGE SQL STABLE AS $$
  SELECT
    dc.id                                      AS chunk_id,
    dc.content,
    1 - (dc.embedding <=> query_embedding)     AS similarity,
    dc.material_id,
    dc.page_number,
    dc.section_title
  FROM document_chunks dc
  WHERE dc.material_id = ANY(target_material_ids)
    AND dc.embedding IS NOT NULL
    AND 1 - (dc.embedding <=> query_embedding) > match_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS materials_updated_at ON materials;
CREATE TRIGGER materials_updated_at
  BEFORE UPDATE ON materials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

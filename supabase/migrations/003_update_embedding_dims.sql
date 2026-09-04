-- ============================================================
-- Migration 003: Update embedding dimensions for gemini-embedding-2
-- gemini-embedding-2 produces 3072-dimensional vectors
-- Run this in Supabase SQL Editor
-- ============================================================

-- Drop existing vector column and recreate with correct dimensions
-- (Cannot ALTER COLUMN type for vector — must drop and recreate)
ALTER TABLE document_chunks DROP COLUMN IF EXISTS embedding;
ALTER TABLE document_chunks ADD COLUMN embedding VECTOR(3072);

-- Update the RAG search function to match new dimensions
CREATE OR REPLACE FUNCTION search_document_chunks(
  query_embedding     VECTOR(3072),
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

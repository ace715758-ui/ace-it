/**
 * Document chunking strategy.
 * Splits extracted text into meaningful, overlapping chunks for RAG.
 *
 * Target: ~500–1000 tokens per chunk with ~100 token overlap.
 * Approximation: 1 token ≈ 4 characters.
 */

export interface TextChunk {
  content: string
  chunkIndex: number
  pageNumber: number | null
  sectionTitle: string | null
  tokenEstimate: number
}

const CHUNK_SIZE_CHARS = 2400  // ~600 tokens
const CHUNK_OVERLAP_CHARS = 300 // ~75 tokens overlap

/**
 * Split text into overlapping chunks.
 * Tries to split on paragraph/sentence boundaries.
 */
export function chunkText(
  text: string,
  options?: { chunkSize?: number; overlap?: number }
): TextChunk[] {
  const chunkSize = options?.chunkSize ?? CHUNK_SIZE_CHARS
  const overlap   = options?.overlap   ?? CHUNK_OVERLAP_CHARS

  if (!text || text.trim().length === 0) return []

  // Normalize whitespace
  const normalized = text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  // If the whole text fits in one chunk, return it as-is
  if (normalized.length <= chunkSize) {
    return [
      {
        content: normalized,
        chunkIndex: 0,
        pageNumber: null,
        sectionTitle: detectSectionTitle(normalized),
        tokenEstimate: Math.ceil(normalized.length / 4),
      },
    ]
  }

  const chunks: TextChunk[] = []
  let start = 0
  let chunkIndex = 0

  while (start < normalized.length) {
    const rawEnd = start + chunkSize
    let end = Math.min(rawEnd, normalized.length)

    // Try to break at a paragraph boundary before the hard cut
    if (end < normalized.length) {
      const paraBreak = normalized.lastIndexOf('\n\n', end)
      if (paraBreak > start + Math.floor(chunkSize * 0.5)) {
        end = paraBreak + 2
      } else {
        // Try sentence boundary
        const sentBreak = findLastSentenceBoundary(normalized, start, end)
        if (sentBreak > start + Math.floor(chunkSize * 0.3)) {
          end = sentBreak
        }
      }
    }

    const content = normalized.slice(start, end).trim()

    if (content.length > 50) { // skip tiny slivers
      chunks.push({
        content,
        chunkIndex,
        pageNumber: null,
        sectionTitle: detectSectionTitle(content),
        tokenEstimate: Math.ceil(content.length / 4),
      })
      chunkIndex++
    }

    // IMPORTANT: advance by (chunkSize - overlap), not by 1
    // This guarantees forward progress and prevents infinite/huge loops
    const advance = chunkSize - overlap
    start += advance

    // Safety: ensure we always move forward
    if (advance <= 0) break
  }

  return chunks
}

/** Find the last sentence-ending position (. ! ?) before `end`. */
function findLastSentenceBoundary(text: string, start: number, end: number): number {
  for (let i = end; i > start; i--) {
    const c = text[i]
    if ((c === '.' || c === '!' || c === '?') && text[i + 1] === ' ') {
      return i + 1
    }
  }
  return end
}

/** Try to detect a section heading from the first line of a chunk. */
function detectSectionTitle(content: string): string | null {
  const firstLine = content.split('\n')[0].trim()
  if (
    firstLine.length > 0 &&
    firstLine.length < 100 &&
    !firstLine.endsWith('.') &&
    /^[A-Z0-9]/.test(firstLine)
  ) {
    return firstLine
  }
  return null
}

/** Estimate token count (rough: 4 chars ≈ 1 token). */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

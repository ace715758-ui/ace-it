/**
 * AI Provider abstraction layer.
 *
 * Supported providers (set via AI_PROVIDER env var):
 *   gemini  — Google Gemini (FREE tier available)
 *   openai  — OpenAI (paid)
 *
 * Environment variables:
 *   AI_PROVIDER=gemini           # or "openai"
 *   AI_API_KEY=your-key
 *   AI_MODEL=gemini-1.5-flash    # or "gpt-4o-mini" for OpenAI
 *   AI_EMBEDDING_MODEL=text-embedding-004  # or "text-embedding-3-small" for OpenAI
 *
 * Get a FREE Gemini API key at: https://aistudio.google.com/app/apikey
 */

export type AIProvider = 'gemini' | 'openai'

export function getProvider(): AIProvider {
  const p = process.env.AI_PROVIDER ?? 'gemini'
  if (p === 'openai') return 'openai'
  return 'gemini' // default to Gemini (free tier)
}

export function getModel(): string {
  if (process.env.AI_MODEL) return process.env.AI_MODEL
  return getProvider() === 'openai' ? 'gpt-4o-mini' : 'gemini-1.5-flash'
}

export function getEmbeddingModel(): string {
  if (process.env.AI_EMBEDDING_MODEL) return process.env.AI_EMBEDDING_MODEL
  // Gemini: text-embedding-004 produces 768-dim vectors
  // OpenAI: text-embedding-3-small produces 1536-dim vectors
  return getProvider() === 'openai' ? 'text-embedding-3-small' : 'text-embedding-004'
}

export function getEmbeddingDimensions(): number {
  const model = getEmbeddingModel()
  if (model.includes('large')) return 3072
  if (model.includes('gemini-embedding-2')) return 3072
  if (model.includes('text-embedding-004') || model.includes('embedding-004')) return 768
  return 1536 // OpenAI small / default
}

function requireApiKey(): string {
  const key = process.env.AI_API_KEY
  if (!key) {
    throw new Error(
      'AI_API_KEY is not set. Get a free Gemini key at https://aistudio.google.com/app/apikey'
    )
  }
  return key
}

// ─── OpenAI client ────────────────────────────────────────────────────────────

let _openaiClient: import('openai').default | null = null

export async function getOpenAIClient(): Promise<import('openai').default> {
  const key = requireApiKey()
  if (!_openaiClient) {
    const { default: OpenAI } = await import('openai')
    _openaiClient = new OpenAI({ apiKey: key })
  }
  return _openaiClient
}

// ─── Gemini client ────────────────────────────────────────────────────────────

let _geminiClient: import('@google/generative-ai').GoogleGenerativeAI | null = null

export async function getGeminiClient(): Promise<
  import('@google/generative-ai').GoogleGenerativeAI
> {
  const key = requireApiKey()
  if (!_geminiClient) {
    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    _geminiClient = new GoogleGenerativeAI(key)
  }
  return _geminiClient
}

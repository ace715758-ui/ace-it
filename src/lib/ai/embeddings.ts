import {
  getProvider,
  getEmbeddingModel,
  getOpenAIClient,
  getGeminiClient,
} from './provider'
import type { EmbeddingResult } from '@/types/ai'

const MAX_CHARS = 8000 // ~2000 tokens — safe for both providers

function truncate(text: string): string {
  return text.length > MAX_CHARS ? text.slice(0, MAX_CHARS) : text
}

// ─── Gemini embeddings ────────────────────────────────────────────────────────

async function geminiEmbed(text: string): Promise<EmbeddingResult> {
  const client = await getGeminiClient()
  const model = getEmbeddingModel()

  const embedModel = client.getGenerativeModel({ model })
  const result = await embedModel.embedContent(truncate(text))

  return {
    embedding: result.embedding.values,
    tokenCount: Math.ceil(text.length / 4), // Gemini doesn't return token count
  }
}

async function geminiEmbedBatch(texts: string[]): Promise<EmbeddingResult[]> {
  // Gemini doesn't have a native batch embed endpoint — run sequentially with
  // a small delay to stay under rate limits (free tier: 1500 req/min)
  const results: EmbeddingResult[] = []
  for (const text of texts) {
    results.push(await geminiEmbed(text))
    // Tiny delay to avoid rate-limit bursts on free tier
    await new Promise((r) => setTimeout(r, 50))
  }
  return results
}

// ─── OpenAI embeddings ────────────────────────────────────────────────────────

async function openaiEmbed(text: string): Promise<EmbeddingResult> {
  const client = await getOpenAIClient()
  const model = getEmbeddingModel()

  const response = await client.embeddings.create({
    model,
    input: truncate(text),
  })

  return {
    embedding: response.data[0].embedding,
    tokenCount: response.usage.total_tokens,
  }
}

async function openaiEmbedBatch(texts: string[]): Promise<EmbeddingResult[]> {
  const client = await getOpenAIClient()
  const model = getEmbeddingModel()

  const truncated = texts.map(truncate)
  const response = await client.embeddings.create({ model, input: truncated })

  const tokensEach = Math.floor(response.usage.total_tokens / texts.length)
  return response.data.map((item) => ({
    embedding: item.embedding,
    tokenCount: tokensEach,
  }))
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function generateEmbedding(text: string): Promise<EmbeddingResult> {
  return getProvider() === 'openai' ? openaiEmbed(text) : geminiEmbed(text)
}

export async function generateEmbeddingsBatch(
  texts: string[]
): Promise<EmbeddingResult[]> {
  return getProvider() === 'openai'
    ? openaiEmbedBatch(texts)
    : geminiEmbedBatch(texts)
}

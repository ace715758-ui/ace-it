/**
 * Text extraction from uploaded documents.
 * Supports PDF, DOCX, PPTX, and TXT files.
 */

export interface ExtractionResult {
  text: string
  pageCount?: number
  metadata?: Record<string, unknown>
}

/**
 * Extract text from a PDF buffer using pdfjs-dist (legacy build, server-side).
 */
export async function extractFromPDF(buffer: Buffer): Promise<ExtractionResult> {
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs')

  // Point workerSrc to the bundled worker file so pdfjs doesn't try to
  // fetch it from a URL (which fails in a Node.js/Next.js server context).
  const { pathToFileURL } = await import('node:url')
  const path = await import('node:path')
  const workerPath = path.resolve(process.cwd(), 'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs')
  const workerUrl = pathToFileURL(workerPath).href
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

  const uint8Array = new Uint8Array(buffer)

  const loadingTask = pdfjsLib.getDocument({
    data: uint8Array,
    useWorkerFetch: false,
    useSystemFonts: true,
  })

  const pdf = await loadingTask.promise
  const pageCount = pdf.numPages
  const pageTexts: string[] = []

  for (let i = 1; i <= pageCount; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const pageText = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
      .trim()
    if (pageText) pageTexts.push(pageText)
  }

  return {
    text: pageTexts.join('\n\n'),
    pageCount,
  }
}

/**
 * Extract text from a DOCX buffer using mammoth.
 */
export async function extractFromDOCX(buffer: Buffer): Promise<ExtractionResult> {
  const mammoth = await import('mammoth')
  const result = await mammoth.extractRawText({ buffer })
  return { text: result.value }
}

/**
 * Extract text from a PPTX buffer by reading slide XML directly.
 */
export async function extractFromPPTX(buffer: Buffer): Promise<ExtractionResult> {
  const JSZip = (await import('jszip')).default
  const zip = await JSZip.loadAsync(buffer)

  const slideFiles = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)/)?.[1] ?? '0')
      const numB = parseInt(b.match(/slide(\d+)/)?.[1] ?? '0')
      return numA - numB
    })

  const slideTexts: string[] = []

  for (const slideFile of slideFiles) {
    const content = await zip.files[slideFile].async('string')
    const textMatches = content.match(/<a:t[^>]*>([^<]*)<\/a:t>/g) ?? []
    const slideText = textMatches
      .map((m) => m.replace(/<[^>]+>/g, '').trim())
      .filter(Boolean)
      .join(' ')
    if (slideText) slideTexts.push(slideText)
  }

  return {
    text: slideTexts.join('\n\n'),
    pageCount: slideFiles.length,
  }
}

/**
 * Extract text from a plain text buffer.
 */
export function extractFromTXT(buffer: Buffer): ExtractionResult {
  return { text: buffer.toString('utf-8') }
}

/**
 * Route extraction to the correct handler based on MIME type.
 */
export async function extractText(
  buffer: Buffer,
  mimeType: string
): Promise<ExtractionResult> {
  switch (mimeType) {
    case 'application/pdf':
      return extractFromPDF(buffer)

    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return extractFromDOCX(buffer)

    case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
      return extractFromPPTX(buffer)

    case 'text/plain':
      return extractFromTXT(buffer)

    default:
      throw new Error(`Unsupported file type: ${mimeType}`)
  }
}

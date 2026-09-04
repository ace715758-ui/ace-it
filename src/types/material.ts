export const SUPPORTED_FILE_TYPES = {
  'application/pdf': {
    extension: 'pdf',
    label: 'PDF',
    description: 'Portable Document Format',
    examples: 'Textbooks, lecture notes, handouts',
  },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
    extension: 'docx',
    label: 'DOCX',
    description: 'Microsoft Word Document',
    examples: 'Essays, study guides, outlines',
  },
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': {
    extension: 'pptx',
    label: 'PPTX',
    description: 'Microsoft PowerPoint Presentation',
    examples: 'Lecture slides, pitch decks',
  },
  'text/plain': {
    extension: 'txt',
    label: 'TXT',
    description: 'Plain Text',
    examples: 'Class notes, transcripts, raw text',
  },
} as const

export type SupportedMimeType = keyof typeof SUPPORTED_FILE_TYPES

export const SUPPORTED_EXTENSIONS: readonly string[] = ['.pdf', '.docx', '.pptx', '.txt']
export type SupportedExtension = '.pdf' | '.docx' | '.pptx' | '.txt'

export function isSupportedExtension(ext: string): ext is SupportedExtension {
  return SUPPORTED_EXTENSIONS.includes(ext.toLowerCase())
}

export const ACCEPT_FILE_TYPES = SUPPORTED_EXTENSIONS.join(',')

// Map file extension → correct MIME type (fallback when browser reports empty/wrong type)
export const EXTENSION_TO_MIME: Record<string, SupportedMimeType> = {
  '.pdf':  'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.txt':  'text/plain',
}

export const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
export const MAX_FILE_SIZE_FORMATTED = '50MB'

export function isValidFileType(mimeType: string): mimeType is SupportedMimeType {
  return mimeType in SUPPORTED_FILE_TYPES
}

/**
 * Get the correct MIME type for a file.
 * Falls back to extension-based lookup when browser reports empty/incorrect type.
 */
export function resolveMimeType(filename: string, browserMimeType?: string | null): string {
  if (browserMimeType && isValidFileType(browserMimeType)) {
    return browserMimeType
  }
  // Fall back to extension
  const ext = '.' + filename.split('.').pop()?.toLowerCase()
  return EXTENSION_TO_MIME[ext] ?? (browserMimeType || '')
}

export function getFileTypeLabel(mimeType: string): string {
  if (isValidFileType(mimeType)) {
    return SUPPORTED_FILE_TYPES[mimeType].label
  }
  return 'Unknown'
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export interface SupportedFileTypeInfo {
  mimeType: SupportedMimeType
  extension: string
  dotExtension: string
  label: string
  description: string
  examples: string
}

export function getSupportedFileTypesInfo(): SupportedFileTypeInfo[] {
  return (Object.keys(SUPPORTED_FILE_TYPES) as SupportedMimeType[]).map((mimeType) => {
    const item = SUPPORTED_FILE_TYPES[mimeType]
    return {
      mimeType,
      extension: item.extension,
      dotExtension: `.${item.extension}`,
      label: item.label,
      description: item.description,
      examples: item.examples,
    }
  })
}

export interface FileValidationResult {
  isValid: boolean
  resolvedMimeType: string | null
  extension: string | null
  label: string
  isSizeValid: boolean
  maxFileSize: number
  maxFileSizeFormatted: string
  error: string | null
}

export function validateUploadFile(params: {
  filename?: string | null
  mimeType?: string | null
  fileSize?: number | null
}): FileValidationResult {
  const filename = params.filename?.trim() ?? ''
  const rawMime = params.mimeType?.trim() ?? ''
  const size = params.fileSize

  if (!filename && !rawMime) {
    return {
      isValid: false,
      resolvedMimeType: null,
      extension: null,
      label: 'Unknown',
      isSizeValid: true,
      maxFileSize: MAX_FILE_SIZE,
      maxFileSizeFormatted: MAX_FILE_SIZE_FORMATTED,
      error: 'Filename or MIME type must be provided',
    }
  }

  const resolved = filename ? resolveMimeType(filename, rawMime) : rawMime
  const ext = filename ? '.' + filename.split('.').pop()?.toLowerCase() : null
  const isTypeSupported = isValidFileType(resolved)
  const isSizeValid = size == null || (typeof size === 'number' && size > 0 && size <= MAX_FILE_SIZE)

  let error: string | null = null
  if (!isTypeSupported) {
    error = `Unsupported file type. Supported formats: PDF, DOCX, PPTX, TXT`
  } else if (!isSizeValid) {
    error = `File size exceeds maximum limit of ${MAX_FILE_SIZE_FORMATTED}`
  }

  return {
    isValid: isTypeSupported && isSizeValid,
    resolvedMimeType: isTypeSupported ? resolved : null,
    extension: ext,
    label: getFileTypeLabel(resolved),
    isSizeValid,
    maxFileSize: MAX_FILE_SIZE,
    maxFileSizeFormatted: MAX_FILE_SIZE_FORMATTED,
    error,
  }
}

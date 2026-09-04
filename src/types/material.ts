export const SUPPORTED_FILE_TYPES = {
  'application/pdf': { extension: 'pdf', label: 'PDF' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
    extension: 'docx',
    label: 'DOCX',
  },
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': {
    extension: 'pptx',
    label: 'PPTX',
  },
  'text/plain': { extension: 'txt', label: 'TXT' },
} as const

export type SupportedMimeType = keyof typeof SUPPORTED_FILE_TYPES

export const SUPPORTED_EXTENSIONS = ['.pdf', '.docx', '.pptx', '.txt']

// Map file extension → correct MIME type (fallback when browser reports empty/wrong type)
export const EXTENSION_TO_MIME: Record<string, string> = {
  '.pdf':  'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.txt':  'text/plain',
}

export const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

export function isValidFileType(mimeType: string): mimeType is SupportedMimeType {
  return mimeType in SUPPORTED_FILE_TYPES
}

/**
 * Get the correct MIME type for a file.
 * Falls back to extension-based lookup when browser reports empty/incorrect type.
 */
export function resolveMimeType(filename: string, browserMimeType: string): string {
  if (browserMimeType && isValidFileType(browserMimeType)) {
    return browserMimeType
  }
  // Fall back to extension
  const ext = '.' + filename.split('.').pop()?.toLowerCase()
  return EXTENSION_TO_MIME[ext] ?? browserMimeType
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

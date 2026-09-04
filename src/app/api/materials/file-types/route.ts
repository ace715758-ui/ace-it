import { NextRequest, NextResponse } from 'next/server'
import {
  getSupportedFileTypesInfo,
  SUPPORTED_EXTENSIONS,
  SUPPORTED_FILE_TYPES,
  MAX_FILE_SIZE,
  MAX_FILE_SIZE_FORMATTED,
  ACCEPT_FILE_TYPES,
  validateUploadFile,
} from '@/types/material'

export const dynamic = 'force-dynamic'

/**
 * GET /api/materials/file-types
 * Returns all supported file types, MIME types, extensions, and upload limits.
 */
export async function GET() {
  const supportedTypes = getSupportedFileTypesInfo()
  const supportedMimeTypes = Object.keys(SUPPORTED_FILE_TYPES)

  return NextResponse.json({
    success: true,
    supportedFileTypes: supportedTypes,
    supportedExtensions: [...SUPPORTED_EXTENSIONS],
    supportedMimeTypes,
    maxFileSize: MAX_FILE_SIZE,
    maxFileSizeFormatted: MAX_FILE_SIZE_FORMATTED,
    accept: ACCEPT_FILE_TYPES,
  })
}

/**
 * POST /api/materials/file-types
 * Validates a file type/size before upload.
 * Accepts JSON body or FormData with filename, mimeType, and optional fileSize.
 */
export async function POST(request: NextRequest) {
  let filename: string | null = null
  let mimeType: string | null = null
  let fileSize: number | null = null

  const contentType = request.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    try {
      const body = await request.json()
      filename = typeof body.filename === 'string' ? body.filename : null
      mimeType = typeof body.mimeType === 'string' ? body.mimeType : null
      fileSize = typeof body.fileSize === 'number' ? body.fileSize : null
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON body',
        },
        { status: 400 }
      )
    }
  } else if (contentType.includes('multipart/form-data')) {
    try {
      const formData = await request.formData()
      const file = formData.get('file')
      if (file instanceof File) {
        filename = file.name
        mimeType = file.type
        fileSize = file.size
      } else {
        filename = formData.get('filename') as string | null
        mimeType = formData.get('mimeType') as string | null
        const sizeStr = formData.get('fileSize') as string | null
        fileSize = sizeStr ? parseInt(sizeStr, 10) : null
      }
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid form data',
        },
        { status: 400 }
      )
    }
  } else {
    // Also support query parameters: ?filename=foo.pdf&mimeType=...
    const searchParams = request.nextUrl.searchParams
    filename = searchParams.get('filename')
    mimeType = searchParams.get('mimeType')
    const sizeParam = searchParams.get('fileSize')
    fileSize = sizeParam ? parseInt(sizeParam, 10) : null
  }

  const result = validateUploadFile({
    filename,
    mimeType,
    fileSize,
  })

  return NextResponse.json(
    {
      success: result.isValid,
      ...result,
    },
    { status: result.isValid ? 200 : 400 }
  )
}

/**
 * OPTIONS /api/materials/file-types
 * Preflight handler returning allowed methods and upload headers.
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      Allow: 'GET, POST, OPTIONS',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

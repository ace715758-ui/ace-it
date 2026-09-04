import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { extractText } from '@/lib/documents/extractor'
import { chunkText } from '@/lib/documents/chunker'
import { generateEmbeddingsBatch } from '@/lib/ai/embeddings'
import {
  isValidFileType,
  MAX_FILE_SIZE,
  MAX_FILE_SIZE_FORMATTED,
  resolveMimeType,
  getSupportedFileTypesInfo,
  ACCEPT_FILE_TYPES,
  SUPPORTED_EXTENSIONS,
  SUPPORTED_FILE_TYPES,
} from '@/types/material'

// Increase body size limit for this route to 55MB (default is 10MB)
export const maxDuration = 300 // 5 min timeout for large file processing
export const dynamic = 'force-dynamic'

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      Allow: 'GET, POST, OPTIONS',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'X-Supported-File-Types': ACCEPT_FILE_TYPES,
      'X-Max-File-Size': String(MAX_FILE_SIZE),
    },
  })
}

export async function GET(request: NextRequest) {
  // If ?types=true or ?action=file-types is requested, return supported upload types
  const searchParams = request.nextUrl.searchParams
  if (
    searchParams.get('types') === 'true' ||
    searchParams.get('action') === 'file-types' ||
    searchParams.get('action') === 'supported-types'
  ) {
    return NextResponse.json({
      success: true,
      supportedFileTypes: getSupportedFileTypesInfo(),
      supportedExtensions: [...SUPPORTED_EXTENSIONS],
      supportedMimeTypes: Object.keys(SUPPORTED_FILE_TYPES),
      maxFileSize: MAX_FILE_SIZE,
      maxFileSizeFormatted: MAX_FILE_SIZE_FORMATTED,
      accept: ACCEPT_FILE_TYPES,
    })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: materials, error } = await supabase
    .from('materials')
    .select('*')
    .eq('user_id', user.id)
    .order('uploaded_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch materials' }, { status: 500 })
  }

  return NextResponse.json({ materials })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let materialId: string | null = null

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Resolve MIME type — use extension fallback if browser sent empty/wrong type
    const resolvedMimeType = resolveMimeType(file.name, file.type)

    // Validate file type
    if (!isValidFileType(resolvedMimeType)) {
      return NextResponse.json(
        { error: `Unsupported file type. Supported formats: PDF, DOCX, PPTX, TXT` },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is 50MB` },
        { status: 400 }
      )
    }

    const serviceClient = createServiceClient()
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const timestamp = Date.now()
    const filename = `${timestamp}_${sanitizedName}`
    const fileBuffer = await file.arrayBuffer()

    // Step 1: Create material record
    const { data: material, error: insertError } = await supabase
      .from('materials')
      .insert({
        user_id: user.id,
        filename,
        original_filename: file.name,
        file_type: resolvedMimeType,
        file_size: file.size,
        storage_path: '',
        processing_status: 'uploading',
      })
      .select()
      .single()

    if (insertError || !material) {
      console.error('Insert error:', insertError)
      return NextResponse.json({ error: 'Failed to create material record' }, { status: 500 })
    }

    materialId = material.id

    // Step 2: Upload to Supabase Storage
    const storagePath = `${user.id}/${material.id}/${filename}`

    const { error: storageError } = await serviceClient.storage
      .from('student-materials')
      .upload(storagePath, fileBuffer, {
        contentType: resolvedMimeType,
        upsert: false,
      })

    if (storageError) {
      console.error('Storage error:', storageError)
      await serviceClient
        .from('materials')
        .update({ processing_status: 'failed' })
        .eq('id', materialId)

      const isRlsError = storageError.message?.toLowerCase().includes('row-level security')
      const errorMessage = isRlsError
        ? `Row-level security policy violation on storage. Please ensure SUPABASE_SERVICE_ROLE_KEY is set in .env.local (copy service_role secret from Supabase Settings → API Keys).`
        : `Failed to upload file: ${storageError.message}`

      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      )
    }

    // Step 3: Update storage path and mark as processing
    await serviceClient
      .from('materials')
      .update({ storage_path: storagePath, processing_status: 'processing' })
      .eq('id', materialId)

    // Step 4: Process document SYNCHRONOUSLY
    await processDocument(materialId!, fileBuffer, resolvedMimeType, serviceClient)

    // Step 5: Return the final material record
    const { data: finalMaterial } = await serviceClient
      .from('materials')
      .select('*')
      .eq('id', materialId)
      .single()

    return NextResponse.json({ material: finalMaterial ?? material })

  } catch (error) {
    console.error('Upload error:', error)
    if (materialId) {
      const serviceClient = createServiceClient()
      await serviceClient
        .from('materials')
        .update({ processing_status: 'failed' })
        .eq('id', materialId)
    }
    return NextResponse.json(
      { error: 'Upload failed. Please try again.' },
      { status: 500 }
    )
  }
}

/**
 * Process document synchronously:
 * extract text → chunk → generate embeddings → store chunks
 */
async function processDocument(
  materialId: string,
  fileBuffer: ArrayBuffer,
  mimeType: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  serviceClient: any
) {
  try {
    const buffer = Buffer.from(fileBuffer)

    // Extract text
    const extraction = await extractText(buffer, mimeType)

    if (!extraction.text || extraction.text.trim().length === 0) {
      console.error('Text extraction returned empty for material:', materialId)
      await serviceClient
        .from('materials')
        .update({ processing_status: 'failed' })
        .eq('id', materialId)
      return
    }

    // Save extracted text
    await serviceClient
      .from('materials')
      .update({ extracted_text: extraction.text })
      .eq('id', materialId)

    // Chunk the document
    const chunks = chunkText(extraction.text)

    if (chunks.length === 0) {
      await serviceClient
        .from('materials')
        .update({ processing_status: 'failed' })
        .eq('id', materialId)
      return
    }

    console.log(`Material ${materialId}: extracted ${chunks.length} chunks`)

    // Generate embeddings in batches of 20
    const texts = chunks.map((c) => c.content)
    const batchSize = 20
    const allEmbeddings: (number[] | null)[] = []

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize)
      try {
        const results = await generateEmbeddingsBatch(batch)
        allEmbeddings.push(...results.map((r) => r.embedding))
      } catch (embeddingError) {
        console.error(`Embedding batch ${i} failed:`, embeddingError)
        // Push nulls for this batch — chunks will still be stored without embeddings
        batch.forEach(() => allEmbeddings.push(null))
      }
    }

    // Store chunks with embeddings in batches of 50
    const chunkRows = chunks.map((chunk, i) => ({
      material_id: materialId,
      chunk_index: chunk.chunkIndex,
      content: chunk.content,
      page_number: chunk.pageNumber,
      section_title: chunk.sectionTitle,
      embedding: allEmbeddings[i] && allEmbeddings[i]!.length > 0
        ? allEmbeddings[i]
        : null,
    }))

    const chunkBatchSize = 50
    for (let i = 0; i < chunkRows.length; i += chunkBatchSize) {
      const batch = chunkRows.slice(i, i + chunkBatchSize)
      const { error: chunkError } = await serviceClient
        .from('document_chunks')
        .insert(batch)

      if (chunkError) {
        console.error('Chunk insert error:', chunkError)
        throw new Error(`Failed to store chunks: ${chunkError.message}`)
      }
    }

    // Mark as completed
    await serviceClient
      .from('materials')
      .update({ processing_status: 'completed' })
      .eq('id', materialId)

    console.log(`Material ${materialId}: processing completed`)

  } catch (error) {
    console.error('processDocument failed:', error)
    await serviceClient
      .from('materials')
      .update({ processing_status: 'failed' })
      .eq('id', materialId)
  }
}

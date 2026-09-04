import assert from 'node:assert'
import { NextRequest } from 'next/server'
import * as fileTypesRoute from '../src/app/api/materials/file-types/route.ts'
import * as supportedTypesRoute from '../src/app/api/materials/supported-types/route.ts'
import * as globalFileTypesRoute from '../src/app/api/file-types/route.ts'
import * as materialsRoute from '../src/app/api/materials/route.ts'

async function runTests() {
  console.log('--- Starting API File Types Test Suite ---')

  // 1. Test GET /api/materials/file-types
  console.log('Test 1: GET /api/materials/file-types')
  const getRes = await fileTypesRoute.GET()
  assert.strictEqual(getRes.status, 200, 'GET should return 200')
  const getData = await getRes.json()
  assert.strictEqual(getData.success, true)
  assert.strictEqual(Array.isArray(getData.supportedFileTypes), true)
  assert.strictEqual(getData.supportedFileTypes.length, 4)
  assert.deepStrictEqual(getData.supportedExtensions, ['.pdf', '.docx', '.pptx', '.txt'])
  assert.strictEqual(getData.maxFileSize, 50 * 1024 * 1024)
  assert.strictEqual(getData.maxFileSizeFormatted, '50MB')
  assert.strictEqual(getData.accept, '.pdf,.docx,.pptx,.txt')
  console.log('✓ GET /api/materials/file-types passed')

  // 2. Test POST /api/materials/file-types with valid PDF
  console.log('Test 2: POST valid PDF')
  const postPdfReq = new NextRequest('http://localhost:3000/api/materials/file-types', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename: 'biology_notes.pdf', mimeType: 'application/pdf', fileSize: 1024 * 1024 }),
  })
  const postPdfRes = await fileTypesRoute.POST(postPdfReq)
  assert.strictEqual(postPdfRes.status, 200)
  const postPdfData = await postPdfRes.json()
  assert.strictEqual(postPdfData.isValid, true)
  assert.strictEqual(postPdfData.resolvedMimeType, 'application/pdf')
  assert.strictEqual(postPdfData.extension, '.pdf')
  assert.strictEqual(postPdfData.label, 'PDF')
  assert.strictEqual(postPdfData.isSizeValid, true)
  assert.strictEqual(postPdfData.error, null)
  console.log('✓ Valid PDF POST passed')

  // 3. Test POST valid DOCX without browser mimeType (fallback resolution)
  console.log('Test 3: POST valid DOCX with fallback resolution')
  const postDocxReq = new NextRequest('http://localhost:3000/api/materials/file-types', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename: 'history_essay.docx' }),
  })
  const postDocxRes = await fileTypesRoute.POST(postDocxReq)
  assert.strictEqual(postDocxRes.status, 200)
  const postDocxData = await postDocxRes.json()
  assert.strictEqual(postDocxData.isValid, true)
  assert.strictEqual(postDocxData.resolvedMimeType, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
  assert.strictEqual(postDocxData.extension, '.docx')
  assert.strictEqual(postDocxData.label, 'DOCX')
  console.log('✓ Fallback resolution DOCX POST passed')

  // 4. Test POST invalid file extension (.exe)
  console.log('Test 4: POST invalid file type (.exe)')
  const postExeReq = new NextRequest('http://localhost:3000/api/materials/file-types', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename: 'malware.exe' }),
  })
  const postExeRes = await fileTypesRoute.POST(postExeReq)
  assert.strictEqual(postExeRes.status, 400)
  const postExeData = await postExeRes.json()
  assert.strictEqual(postExeData.isValid, false)
  assert.strictEqual(postExeData.extension, '.exe')
  assert(postExeData.error.includes('Unsupported file type'))
  console.log('✓ Invalid file type rejection passed')

  // 5. Test POST oversized file (>50MB)
  console.log('Test 5: POST oversized file (60MB)')
  const postBigReq = new NextRequest('http://localhost:3000/api/materials/file-types', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename: 'large_book.pdf', fileSize: 60 * 1024 * 1024 }),
  })
  const postBigRes = await fileTypesRoute.POST(postBigReq)
  assert.strictEqual(postBigRes.status, 400)
  const postBigData = await postBigRes.json()
  assert.strictEqual(postBigData.isValid, false)
  assert.strictEqual(postBigData.isSizeValid, false)
  assert(postBigData.error.includes('exceeds maximum limit'))
  console.log('✓ Oversized file rejection passed')

  // 6. Test OPTIONS preflight
  console.log('Test 6: OPTIONS /api/materials/file-types')
  const optRes = await fileTypesRoute.OPTIONS()
  assert.strictEqual(optRes.status, 204)
  assert.strictEqual(optRes.headers.get('Allow'), 'GET, POST, OPTIONS')
  console.log('✓ OPTIONS handler passed')

  // 7. Test alias routes
  console.log('Test 7: Alias routes (supported-types and file-types)')
  const aliasRes1 = await supportedTypesRoute.GET()
  assert.strictEqual(aliasRes1.status, 200)
  const aliasData1 = await aliasRes1.json()
  assert.strictEqual(aliasData1.success, true)

  const aliasRes2 = await globalFileTypesRoute.GET()
  assert.strictEqual(aliasRes2.status, 200)
  const aliasData2 = await aliasRes2.json()
  assert.strictEqual(aliasData2.success, true)
  console.log('✓ Alias routes passed')

  // 8. Test materials route query ?types=true and OPTIONS
  console.log('Test 8: GET /api/materials?types=true and OPTIONS')
  const matTypesReq = new NextRequest('http://localhost:3000/api/materials?types=true')
  const matTypesRes = await materialsRoute.GET(matTypesReq)
  assert.strictEqual(matTypesRes.status, 200)
  const matTypesData = await matTypesRes.json()
  assert.strictEqual(matTypesData.success, true)
  assert.strictEqual(matTypesData.supportedFileTypes.length, 4)

  const matOptRes = await materialsRoute.OPTIONS()
  assert.strictEqual(matOptRes.status, 204)
  assert.strictEqual(matOptRes.headers.get('X-Supported-File-Types'), '.pdf,.docx,.pptx,.txt')
  console.log('✓ Materials route query & OPTIONS passed')

  console.log('\nALL 8 TESTS PASSED SUCCESSFULLY! ✓')
}

runTests().catch((err) => {
  console.error('Test failed:', err)
  process.exit(1)
})

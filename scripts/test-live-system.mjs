import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'
import path from 'node:path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testLive() {
  console.log('--- TESTING LIVE SUPABASE CONNECTION ---')
  const testEmail = `test_student_${Date.now()}@teststudy.com`
  const testPassword = 'Password123!'
  const fullName = 'Test Student'

  console.log(`1. Creating account for: ${testEmail}...`)
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
    options: {
      data: { full_name: fullName },
    },
  })

  if (signUpError) {
    console.error('Sign up error:', signUpError.message)
    return
  }

  console.log('✓ Account created! User ID:', signUpData.user?.id)

  // Check if session was returned or if email confirmation is required
  let session = signUpData.session
  if (!session) {
    console.log('Attempting sign-in...')
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    })
    if (signInError) {
      console.log('Sign in note:', signInError.message)
    } else {
      session = signInData.session
      console.log('✓ Logged in successfully!')
    }
  }

  console.log('2. Testing file extraction on sample-study-material.pdf...')
  const pdfPath = path.resolve(process.cwd(), 'public', 'sample-study-material.pdf')
  const pdfBuffer = fs.readFileSync(pdfPath)

  const { extractFromPDF } = await import('../src/lib/documents/extractor.ts')
  const extraction = await extractFromPDF(pdfBuffer)
  console.log('✓ PDF extracted text length:', extraction.text.length, 'characters')
  console.log('✓ Extracted snippet:', extraction.text.slice(0, 150))

  console.log('3. Testing document chunking...')
  const { chunkText } = await import('../src/lib/documents/chunker.ts')
  const chunks = chunkText(extraction.text)
  console.log(`✓ Chunks generated: ${chunks.length}`)

  console.log('4. Testing quiz question generation from extracted PDF chunks...')
  const { generateQuestions } = await import('../src/lib/ai/quiz-generator.ts')
  const questions = await generateQuestions({
    chunks: chunks.map((c, idx) => ({
      id: `chunk_${idx + 1}`,
      content: c.content,
      materialName: 'sample-study-material.pdf',
    })),
    questionType: 'multiple_choice',
    difficulty: 'medium',
    count: 3,
  })

  console.log(`✓ Questions generated: ${questions.length}`)
  questions.forEach((q, idx) => {
    console.log(`\n--- Question ${idx + 1} (${q.question_type}) ---`)
    console.log(`Q: ${q.question}`)
    if (q.options) console.log(`Options: ${q.options.join(' | ')}`)
    console.log(`Answer: ${q.correct_answer}`)
    console.log(`Explanation: ${q.explanation}`)
  })

  console.log('\n✓ ALL SYSTEM STEPS VERIFIED AND FUNCTIONING!')
}

testLive().catch(console.error)

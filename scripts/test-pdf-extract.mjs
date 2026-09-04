import { extractFromPDF } from '../src/lib/documents/extractor.ts'

const rawPdf = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length 310 >> stream
BT
/F1 14 Tf
50 700 Td
(Photosynthesis is the biological process by which plants convert light energy into chemical energy.) Tj
0 -25 Td
(Chlorophyll is the primary green pigment in plants responsible for absorbing light.) Tj
0 -25 Td
(The light reactions take place in the thylakoid membrane of the chloroplast organelles.) Tj
0 -25 Td
(Oxygen gas is produced as a byproduct during the photolysis of water molecules.) Tj
ET
endstream
endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000605 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
680
%%EOF`

async function main() {
  const buffer = Buffer.from(rawPdf)
  const result = await extractFromPDF(buffer)
  console.log('Extraction success! Page count:', result.pageCount)
  console.log('Text content:\n', result.text)
}

main().catch(console.error)

import fs from 'node:fs'
import path from 'node:path'

const rawPdf = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length 450 >> stream
BT
/F1 14 Tf
50 720 Td
(CELLULAR BIOLOGY STUDY GUIDE) Tj
0 -30 Td
(1. Photosynthesis is the biological process where plants convert solar light energy into chemical energy.) Tj
0 -25 Td
(2. Chlorophyll is the primary green pigment in plant leaves responsible for absorbing solar wavelengths.) Tj
0 -25 Td
(3. The light-dependent reactions take place within the thylakoid membranes of chloroplast organelles.) Tj
0 -25 Td
(4. Oxygen gas is released as a vital byproduct during the photolysis and splitting of water molecules.) Tj
0 -25 Td
(5. The Calvin cycle occurs in the stroma and utilizes ATP and NADPH to synthesize glucose sugars.) Tj
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
0000000745 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
820
%%EOF`

const outDir = path.resolve(process.cwd(), 'public')
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true })
}
const outPath = path.join(outDir, 'sample-study-material.pdf')
fs.writeFileSync(outPath, Buffer.from(rawPdf))
console.log('Sample PDF generated at:', outPath)

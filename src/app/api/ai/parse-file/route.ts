import { NextRequest, NextResponse } from 'next/server'
import { PDFParse } from 'pdf-parse'
import ExcelJS from 'exceljs'
import mammoth from 'mammoth'
import { validateFile } from '@/lib/file-upload-config'

// POST /api/ai/parse-file - Parse uploaded files (PDF, Excel, DOCX)
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file using shared config
    const validation = validateFile(file)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    let content = ''

    // Handle different file types
    if (fileExtension === 'pdf') {
      content = await parsePDF(file)
    } else if (fileExtension === 'xlsx') {
      content = await parseExcel(file)
    } else if (fileExtension === 'docx') {
      content = await parseDOCX(file)
    } else {
      return NextResponse.json(
        { error: 'Unsupported file type. Please use .pdf, .xlsx, or .docx' },
        { status: 400 }
      )
    }

    return NextResponse.json({ content }, { status: 200 })
  } catch (error) {
    console.error('File parsing error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to parse file'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

// Parse PDF files
async function parsePDF(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const parser = new PDFParse({ data: buffer })

    try {
      const data = await parser.getText()

      if (!data?.text || data.text.trim().length === 0) {
        throw new Error('PDF appears to be empty or contains only images')
      }

      return data.text
    } finally {
      await parser.destroy().catch(() => {})
    }
  } catch (error) {
    console.error('PDF parsing error:', error)
    throw new Error('Failed to parse PDF. The file may be corrupted, password-protected, or contain only images.')
  }
}

// Parse Excel files
async function parseExcel(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)
    const workbook = new ExcelJS.Workbook()
    // @ts-ignore - ExcelJS accepts Uint8Array but types don't reflect it
    await workbook.xlsx.load(uint8Array)

    let content = ''

    workbook.eachSheet((worksheet, index) => {
      if (index > 0) content += '\n\n'
      content += `Sheet: ${worksheet.name}\n`
      content += '='.repeat(50) + '\n\n'

      worksheet.eachRow({ includeEmpty: false }, (row) => {
        const values = row.values
        if (!values || !Array.isArray(values)) return

        const rowText = values
          .slice(1) // first element is workbook metadata
          .map((cell) => {
            if (cell === null || cell === undefined) return ''
            if (typeof cell === 'object' && 'text' in cell && cell.text) {
              return String(cell.text)
            }
            return String(cell)
          })
          .join(' | ')

        if (rowText.trim()) {
          content += rowText + '\n'
        }
      })
    })

    if (!content.trim()) {
      throw new Error('Excel file appears to be empty')
    }

    return content
  } catch (error) {
    console.error('Excel parsing error:', error)
    throw new Error('Failed to parse Excel file. Only .xlsx is supported and the file may be corrupted or in an unsupported format.')
  }
}

// Parse DOCX files
async function parseDOCX(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer) as Buffer

    const result = await mammoth.extractRawText({ buffer: buffer as Buffer })

    if (!result.value || result.value.trim().length === 0) {
      throw new Error('DOCX file appears to be empty')
    }

    // Log any conversion warnings
    if (result.messages && result.messages.length > 0) {
      console.warn('DOCX conversion warnings:', result.messages)
    }

    return result.value
  } catch (error) {
    console.error('DOCX parsing error:', error)
    throw new Error('Failed to parse DOCX file. The file may be corrupted or password-protected.')
  }
}

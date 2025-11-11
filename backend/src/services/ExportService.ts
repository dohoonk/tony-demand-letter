import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx'
import prisma from '../config/database'

class ExportService {
  async exportToDocx(documentId: string): Promise<Buffer> {
    // Get document
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    })

    if (!document) {
      throw new Error('Document not found')
    }

    // Get content
    const content = document.content as any
    const draftText = typeof content === 'string' 
      ? content 
      : content?.draft || 'No content'

    // Split into paragraphs
    const paragraphs = draftText.split('\n').map((line: string) => 
      new Paragraph({
        children: [
          new TextRun({
            text: line || ' ',
            font: 'Times New Roman',
            size: 24, // 12pt
          }),
        ],
        spacing: {
          after: 200,
        },
      })
    )

    // Create letterhead
    const letterhead = [
      new Paragraph({
        children: [
          new TextRun({
            text: 'LAW FIRM NAME',
            font: 'Times New Roman',
            size: 28,
            bold: true,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: '123 Legal Street, Suite 100',
            font: 'Times New Roman',
            size: 20,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 50 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: 'City, State 12345 | Phone: (555) 123-4567',
            font: 'Times New Roman',
            size: 20,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }),
    ]

    // Create document
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            ...letterhead,
            ...paragraphs,
          ],
        },
      ],
    })

    // Generate buffer
    const buffer = await Packer.toBuffer(doc)
    return buffer
  }
}

export default new ExportService()


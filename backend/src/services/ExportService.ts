import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx'
import prisma from '../config/database'

class ExportService {
  // Helper to strip HTML tags and convert to plain text
  private stripHtmlTags(html: string): string {
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<\/h[1-6]>/gi, '\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim()
  }

  async exportToDocx(documentId: string): Promise<Buffer> {
    // Get document
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    })

    if (!document) {
      throw new Error('Document not found')
    }

    // Get firm settings
    const firmSettings = await prisma.firmSettings.findUnique({
      where: { id: 1 },
    })

    // Get content - handle both string and structured content
    let draftText = 'No content'
    
    if (typeof document.content === 'string') {
      // If it's HTML, strip tags
      if (document.content.includes('<')) {
        draftText = this.stripHtmlTags(document.content)
      } else {
        draftText = document.content
      }
    } else if (document.content && typeof document.content === 'object') {
      const content = document.content as any
      if (content.draft) {
        draftText = typeof content.draft === 'string' 
          ? (content.draft.includes('<') ? this.stripHtmlTags(content.draft) : content.draft)
          : 'No content'
      }
    }

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

    // Create letterhead using firm settings or defaults
    const firmName = firmSettings?.firmName || 'LAW FIRM NAME'
    const address = firmSettings?.address || '123 Legal Street, Suite 100'
    const cityStateZip = firmSettings 
      ? `${firmSettings.city}, ${firmSettings.state} ${firmSettings.zipCode}` 
      : 'City, State 12345'
    const contactInfo = firmSettings
      ? `Phone: ${firmSettings.phone} | Email: ${firmSettings.email}`
      : 'Phone: (555) 123-4567'

    const letterhead = [
      new Paragraph({
        children: [
          new TextRun({
            text: firmName,
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
            text: address,
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
            text: `${cityStateZip} | ${contactInfo}`,
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


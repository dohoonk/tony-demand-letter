/**
 * Export Service
 * 
 * Handles document export to DOCX and PDF formats.
 * Integrated into backend (NOT a separate service).
 * 
 * Key Features:
 * - HTML to DOCX conversion (using `docx` library)
 * - HTML to PDF conversion (using `html-pdf-node` + Puppeteer)
 * - Preserves formatting (headings, bold, italic, lists)
 * - Applies firm letterhead
 * - Professional styling (Times New Roman, 1" margins)
 * 
 * Why in backend (not separate service)?
 * - Not compute-intensive enough to separate
 * - Direct database access
 * - Simpler deployment
 * 
 * Production TODOs:
 * - Cache generated exports
 * - Add watermarks for drafts
 * - Support custom fonts/templates
 * - Add digital signatures
 * - Generate exports asynchronously (background jobs)
 * - Add progress tracking for large documents
 */

import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, UnderlineType } from 'docx'
import prisma from '../config/database'
import * as cheerio from 'cheerio'
import htmlPdf from 'html-pdf-node'

class ExportService {
  /**
   * Parses HTML element and extracts formatted text runs
   * 
   * Handles inline formatting: <strong>, <em>, <u>, <br>
   * 
   * Production TODO:
   * - Support more HTML tags (<span>, <div>, <a>)
   * - Handle nested formatting
   * - Preserve colors and custom styles
   * 
   * @private
   * @param element - Cheerio element to parse
   * @param $ - Cheerio instance
   * @returns Array of TextRun objects with formatting
   */
  private parseTextNode(element: cheerio.Cheerio<any>, $: cheerio.CheerioAPI): TextRun[] {
    const runs: TextRun[] = []
    
    element.contents().each((_, node) => {
      if (node.type === 'text') {
        const text = $(node).text()
        if (text.trim()) {
          runs.push(new TextRun({
            text: text,
            font: 'Times New Roman',
            size: 24, // 12pt
          }))
        }
      } else if (node.type === 'tag') {
        const $node = $(node)
        const tagName = node.name.toLowerCase()
        const text = $node.text()
        
        if (!text.trim()) return
        
        const runOptions: any = {
          text: text,
          font: 'Times New Roman',
          size: 24,
        }
        
        // Apply formatting based on tags
        if (tagName === 'strong' || tagName === 'b') {
          runOptions.bold = true
        }
        if (tagName === 'em' || tagName === 'i') {
          runOptions.italics = true
        }
        if (tagName === 'u') {
          runOptions.underline = { type: UnderlineType.SINGLE }
        }
        if (tagName === 'br') {
          runs.push(new TextRun({ text: '', break: 1 }))
          return
        }
        
        runs.push(new TextRun(runOptions))
      }
    })
    
    return runs
  }

  /**
   * Converts HTML to DOCX paragraph objects
   * 
   * Supports:
   * - Headings (h1, h2, h3)
   * - Paragraphs with inline formatting
   * - Lists (ul, ol)
   * - Divs with special classes (letterhead)
   * 
   * Production TODO:
   * - Support tables
   * - Handle images
   * - Preserve indentation
   * - Support page breaks
   * 
   * @private
   * @param html - HTML string to convert
   * @returns Array of Paragraph objects for DOCX
   */
  private htmlToDocxParagraphs(html: string): Paragraph[] {
    const $ = cheerio.load(html)
    const paragraphs: Paragraph[] = []
    
    // Process each top-level element
    $('body').children().each((_, element) => {
      const $element = $(element)
      const tagName = element.name.toLowerCase()
      const text = $element.text().trim()
      
      if (!text) return
      
      // Headings
      if (tagName === 'h1') {
        paragraphs.push(new Paragraph({
          children: [
            new TextRun({
              text: text,
              font: 'Times New Roman',
              size: 32, // 16pt
              bold: true,
            }),
          ],
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
        }))
      } else if (tagName === 'h2') {
        paragraphs.push(new Paragraph({
          children: [
            new TextRun({
              text: text,
              font: 'Times New Roman',
              size: 28, // 14pt
              bold: true,
            }),
          ],
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 150 },
        }))
      } else if (tagName === 'h3') {
        paragraphs.push(new Paragraph({
          children: [
            new TextRun({
              text: text,
              font: 'Times New Roman',
              size: 26, // 13pt
              bold: true,
            }),
          ],
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200, after: 100 },
        }))
      } else if (tagName === 'p') {
        // Parse paragraph with inline formatting
        const runs = this.parseTextNode($element, $)
        if (runs.length > 0) {
          paragraphs.push(new Paragraph({
            children: runs,
            spacing: { after: 200 },
          }))
        }
      } else if (tagName === 'div') {
        // Handle divs (like letterhead sections)
        const className = $element.attr('class') || ''
        
        if (className.includes('letterhead')) {
          // Center-aligned, larger text for letterhead
          paragraphs.push(new Paragraph({
            children: [
              new TextRun({
                text: text,
                font: 'Times New Roman',
                size: 28,
                bold: true,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
          }))
        } else {
          // Regular div content
          const runs = this.parseTextNode($element, $)
          if (runs.length > 0) {
            paragraphs.push(new Paragraph({
              children: runs,
              spacing: { after: 200 },
            }))
          }
        }
      } else if (tagName === 'ul' || tagName === 'ol') {
        // Handle lists
        $element.find('li').each((_, li) => {
          const $li = $(li)
          paragraphs.push(new Paragraph({
            children: [
              new TextRun({
                text: $li.text(),
                font: 'Times New Roman',
                size: 24,
              }),
            ],
            bullet: tagName === 'ul' ? { level: 0 } : undefined,
            spacing: { after: 100 },
          }))
        })
      }
    })
    
    return paragraphs
  }

  /**
   * Exports document to DOCX format with firm letterhead
   * 
   * Flow:
   * 1. Fetch document content (HTML) from database
   * 2. Parse HTML with cheerio
   * 3. Convert to DOCX paragraph objects
   * 4. Create DOCX document with proper margins
   * 5. Pack to buffer
   * 
   * Output:
   * - Times New Roman font
   * - 1" margins on all sides
   * - Preserved formatting from HTML
   * 
   * Production TODO:
   * - Add custom templates per firm
   * - Include page numbers
   * - Add header/footer with firm info
   * - Support track changes mode
   * - Add metadata (author, creation date)
   * 
   * @param documentId - Document UUID
   * @returns DOCX file as Buffer
   * @throws Error if document not found
   */
  async exportToDocx(documentId: string): Promise<Buffer> {
    // Get document
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    })

    if (!document) {
      throw new Error('Document not found')
    }

    // Get content - handle both string and structured content
    let htmlContent = ''
    
    if (typeof document.content === 'string') {
      htmlContent = document.content
    } else if (document.content && typeof document.content === 'object') {
      const content = document.content as any
      if (content.draft) {
        htmlContent = typeof content.draft === 'string' ? content.draft : ''
      }
    }

    if (!htmlContent) {
      htmlContent = '<p>No content</p>'
    }

    // Parse HTML and convert to DOCX paragraphs
    const paragraphs = this.htmlToDocxParagraphs(htmlContent)

    // Create document with proper margins
    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 1440, // 1 inch
                right: 1440,
                bottom: 1440,
                left: 1440,
              },
            },
          },
          children: paragraphs,
        },
      ],
    })

    // Generate buffer
    const buffer = await Packer.toBuffer(doc)
    return buffer
  }

  /**
   * Exports document to PDF format with professional styling
   * 
   * Flow:
   * 1. Fetch document content (HTML) and firm settings
   * 2. Wrap in styled HTML template
   * 3. Use Puppeteer to render HTML to PDF
   * 4. Return PDF buffer
   * 
   * Uses html-pdf-node which wraps Puppeteer.
   * Note: Puppeteer adds ~100MB to container size.
   * 
   * Production TODO:
   * - Use headless Chrome in separate container
   * - Add PDF optimization/compression
   * - Support A4 vs Letter paper sizes
   * - Add password protection option
   * - Generate PDFs asynchronously (background job)
   * - Cache generated PDFs
   * 
   * @param documentId - Document UUID
   * @returns PDF file as Buffer
   * @throws Error if document not found or generation fails
   */
  async exportToPdf(documentId: string): Promise<Buffer> {
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
    let htmlContent = ''
    
    if (typeof document.content === 'string') {
      htmlContent = document.content
    } else if (document.content && typeof document.content === 'object') {
      const content = document.content as any
      if (content.draft) {
        htmlContent = typeof content.draft === 'string' ? content.draft : ''
      }
    }

    if (!htmlContent) {
      htmlContent = '<p>No content</p>'
    }

    // Create professional PDF styling
    const styledHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      margin: 1in;
      size: letter;
    }
    
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #000;
      margin: 0;
      padding: 0;
    }
    
    /* Letterhead styling */
    .letterhead {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #333;
    }
    
    .letterhead h1 {
      font-size: 18pt;
      font-weight: bold;
      margin: 0 0 10px 0;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .letterhead p {
      font-size: 11pt;
      margin: 3px 0;
    }
    
    /* Headings */
    h1 {
      font-size: 16pt;
      font-weight: bold;
      margin: 24px 0 12px 0;
      text-transform: uppercase;
    }
    
    h2 {
      font-size: 14pt;
      font-weight: bold;
      margin: 20px 0 10px 0;
    }
    
    h3 {
      font-size: 13pt;
      font-weight: bold;
      margin: 16px 0 8px 0;
    }
    
    /* Paragraphs */
    p {
      margin: 0 0 12px 0;
      text-align: justify;
      text-indent: 0;
    }
    
    /* Lists */
    ul, ol {
      margin: 12px 0;
      padding-left: 40px;
    }
    
    li {
      margin: 6px 0;
    }
    
    /* Strong and emphasis */
    strong, b {
      font-weight: bold;
    }
    
    em, i {
      font-style: italic;
    }
    
    /* Line breaks */
    br {
      line-height: 1.8;
    }
    
    /* Divs */
    div {
      margin: 12px 0;
    }
    
    /* Date and address blocks */
    .date, .address-block {
      margin: 20px 0;
    }
  </style>
</head>
<body>
  ${htmlContent}
</body>
</html>
    `

    // PDF options
    const options = {
      format: 'Letter',
      printBackground: true,
      margin: {
        top: '1in',
        right: '1in',
        bottom: '1in',
        left: '1in',
      },
    }

    const file = { content: styledHtml }
    
    try {
      const pdfBuffer = await htmlPdf.generatePdf(file, options)
      return pdfBuffer as Buffer
    } catch (error) {
      console.error('Error generating PDF:', error)
      throw new Error('Failed to generate PDF')
    }
  }
}

export default new ExportService()


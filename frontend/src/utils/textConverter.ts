/**
 * Converts plain text with line breaks to HTML suitable for TipTap editor
 */
export function plainTextToHtml(text: string): string {
  if (!text) return '<p></p>'

  // Split by double line breaks to identify paragraphs
  const paragraphs = text.split(/\n\n+/)

  // Process each paragraph
  const htmlParagraphs = paragraphs.map(para => {
    // Trim whitespace
    const trimmed = para.trim()
    if (!trimmed) return ''

    // Check for markdown-style headings
    if (trimmed.startsWith('### ')) {
      const content = trimmed.substring(4).trim()
      return `<h3>${escapeHtml(content)}</h3>`
    } else if (trimmed.startsWith('## ')) {
      const content = trimmed.substring(3).trim()
      return `<h2>${escapeHtml(content)}</h2>`
    } else if (trimmed.startsWith('# ')) {
      const content = trimmed.substring(2).trim()
      return `<h1>${escapeHtml(content)}</h1>`
    } else {
      // Regular paragraph - convert single line breaks to <br>
      const withBreaks = trimmed.split('\n').map(line => escapeHtml(line.trim())).join('<br>')
      return `<p>${withBreaks}</p>`
    }
  })

  // Filter out empty paragraphs and join
  return htmlParagraphs.filter(p => p).join('')
}

/**
 * Escapes HTML special characters
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

/**
 * Checks if content is already HTML (contains HTML tags)
 */
export function isHtmlContent(content: string): boolean {
  // Check for common HTML tags
  return /<\/?[a-z][\s\S]*>/i.test(content)
}

/**
 * Strips markdown code fences from content
 */
function stripCodeFences(content: string): string {
  // Remove opening code fence (```html, ```javascript, etc.)
  let cleaned = content.replace(/^```\w*\n?/m, '')
  // Remove closing code fence
  cleaned = cleaned.replace(/\n?```\s*$/m, '')
  return cleaned.trim()
}

/**
 * Converts content to HTML if it's plain text, otherwise returns as-is
 */
export function ensureHtmlFormat(content: string): string {
  if (!content) return '<p></p>'
  
  // Strip markdown code fences if present
  const cleanedContent = stripCodeFences(content)
  
  // Check if it's HTML content
  if (isHtmlContent(cleanedContent)) return cleanedContent
  
  // Otherwise convert plain text to HTML
  return plainTextToHtml(cleanedContent)
}


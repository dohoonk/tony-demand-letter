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
 * Converts content to HTML if it's plain text, otherwise returns as-is
 */
export function ensureHtmlFormat(content: string): string {
  if (!content) return '<p></p>'
  if (isHtmlContent(content)) return content
  return plainTextToHtml(content)
}


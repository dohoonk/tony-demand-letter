import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect } from 'react'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

export function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Start typing...',
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onChange(html)
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[500px] p-4',
      },
    },
  })

  // Update editor content when prop changes (for collaborative editing)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      const { from, to } = editor.state.selection
      editor.commands.setContent(content, false)
      editor.commands.setTextSelection({ from, to })
    }
  }, [content, editor])

  if (!editor) {
    return null
  }

  return (
    <div className="border border-gray-300 rounded-md overflow-hidden">
      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-300 p-2 flex flex-wrap gap-1">
        {/* Text Formatting */}
        <div className="flex gap-1 border-r border-gray-300 pr-2">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`px-3 py-1 rounded text-sm font-bold hover:bg-gray-200 ${
              editor.isActive('bold') ? 'bg-gray-300' : 'bg-white'
            }`}
            title="Bold"
          >
            B
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`px-3 py-1 rounded text-sm italic hover:bg-gray-200 ${
              editor.isActive('italic') ? 'bg-gray-300' : 'bg-white'
            }`}
            title="Italic"
          >
            I
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`px-3 py-1 rounded text-sm underline hover:bg-gray-200 ${
              editor.isActive('underline') ? 'bg-gray-300' : 'bg-white'
            }`}
            title="Underline"
          >
            U
          </button>
        </div>

        {/* Headings */}
        <div className="flex gap-1 border-r border-gray-300 pr-2">
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`px-3 py-1 rounded text-sm hover:bg-gray-200 ${
              editor.isActive('heading', { level: 1 }) ? 'bg-gray-300' : 'bg-white'
            }`}
            title="Heading 1"
          >
            H1
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`px-3 py-1 rounded text-sm hover:bg-gray-200 ${
              editor.isActive('heading', { level: 2 }) ? 'bg-gray-300' : 'bg-white'
            }`}
            title="Heading 2"
          >
            H2
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`px-3 py-1 rounded text-sm hover:bg-gray-200 ${
              editor.isActive('heading', { level: 3 }) ? 'bg-gray-300' : 'bg-white'
            }`}
            title="Heading 3"
          >
            H3
          </button>
        </div>

        {/* Lists */}
        <div className="flex gap-1 border-r border-gray-300 pr-2">
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`px-3 py-1 rounded text-sm hover:bg-gray-200 ${
              editor.isActive('bulletList') ? 'bg-gray-300' : 'bg-white'
            }`}
            title="Bullet List"
          >
            •
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`px-3 py-1 rounded text-sm hover:bg-gray-200 ${
              editor.isActive('orderedList') ? 'bg-gray-300' : 'bg-white'
            }`}
            title="Numbered List"
          >
            1.
          </button>
        </div>

        {/* Alignment */}
        <div className="flex gap-1 border-r border-gray-300 pr-2">
          <button
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={`px-3 py-1 rounded text-sm hover:bg-gray-200 ${
              editor.isActive({ textAlign: 'left' }) ? 'bg-gray-300' : 'bg-white'
            }`}
            title="Align Left"
          >
            ←
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={`px-3 py-1 rounded text-sm hover:bg-gray-200 ${
              editor.isActive({ textAlign: 'center' }) ? 'bg-gray-300' : 'bg-white'
            }`}
            title="Align Center"
          >
            ↔
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={`px-3 py-1 rounded text-sm hover:bg-gray-200 ${
              editor.isActive({ textAlign: 'right' }) ? 'bg-gray-300' : 'bg-white'
            }`}
            title="Align Right"
          >
            →
          </button>
        </div>

        {/* More Options */}
        <div className="flex gap-1">
          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`px-3 py-1 rounded text-sm hover:bg-gray-200 ${
              editor.isActive('blockquote') ? 'bg-gray-300' : 'bg-white'
            }`}
            title="Quote"
          >
            "
          </button>
          <button
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className="px-3 py-1 rounded text-sm bg-white hover:bg-gray-200"
            title="Horizontal Rule"
          >
            —
          </button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="bg-white">
        <EditorContent editor={editor} className="font-serif" />
      </div>
    </div>
  )
}


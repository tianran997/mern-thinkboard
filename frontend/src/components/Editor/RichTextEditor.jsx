import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { createLowlight } from 'lowlight';

// 导入 highlight.js 的语言并注册到 lowlight
import javascript from 'highlight.js/lib/languages/javascript';
import python from 'highlight.js/lib/languages/python';
import json from 'highlight.js/lib/languages/json';
import css from 'highlight.js/lib/languages/css';
import html from 'highlight.js/lib/languages/xml';
import sql from 'highlight.js/lib/languages/sql';

// 创建 lowlight 实例
const lowlight = createLowlight();

// 注册语言
lowlight.register('javascript', javascript);
lowlight.register('python', python);
lowlight.register('json', json);
lowlight.register('css', css);
lowlight.register('html', html);
lowlight.register('sql', sql);

import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  Strikethrough, 
  Code, 
  Heading1, 
  Heading2, 
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Table as TableIcon,
  Link as LinkIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify
} from 'lucide-react';

const MenuBar = ({ editor }) => {
  if (!editor) return null;

  const addLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) editor.chain().focus().setLink({ href: url }).run();
  };

  const removeLink = () => {
    editor.chain().focus().unsetLink().run();
  };

  const buttonClass = "btn btn-sm btn-ghost";
  const activeClass = "btn btn-sm btn-primary";

  return (
    <div className="border-b border-base-300 p-3 flex flex-wrap gap-1">
      {/* Text Formatting */}
      <div className="flex gap-1 mr-2">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? activeClass : buttonClass}
          title="Bold"
        >
          <Bold size={16} />
        </button>
        
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? activeClass : buttonClass}
          title="Italic"
        >
          <Italic size={16} />
        </button>
        
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          disabled={!editor.can().chain().focus().toggleUnderline().run()}
          className={editor.isActive('underline') ? activeClass : buttonClass}
          title="Underline"
        >
          <UnderlineIcon size={16} />
        </button>
        
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={!editor.can().chain().focus().toggleStrike().run()}
          className={editor.isActive('strike') ? activeClass : buttonClass}
          title="Strikethrough"
        >
          <Strikethrough size={16} />
        </button>
        
        <button
          onClick={() => editor.chain().focus().toggleCode().run()}
          disabled={!editor.can().chain().focus().toggleCode().run()}
          className={editor.isActive('code') ? activeClass : buttonClass}
          title="Inline Code"
        >
          <Code size={16} />
        </button>
      </div>
      
      <div className="divider divider-horizontal my-0"></div>
      
      {/* Headings */}
      <div className="flex gap-1 mr-2">
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={editor.isActive('heading', { level: 1 }) ? activeClass : buttonClass}
          title="Heading 1"
        >
          <Heading1 size={16} />
        </button>
        
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive('heading', { level: 2 }) ? activeClass : buttonClass}
          title="Heading 2"
        >
          <Heading2 size={16} />
        </button>
        
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={editor.isActive('heading', { level: 3 }) ? activeClass : buttonClass}
          title="Heading 3"
        >
          <Heading3 size={16} />
        </button>
      </div>
      
      <div className="divider divider-horizontal my-0"></div>
      
      {/* Text Alignment */}
      <div className="flex gap-1 mr-2">
        <button
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={editor.isActive({ textAlign: 'left' }) ? activeClass : buttonClass}
          title="Align Left"
        >
          <AlignLeft size={16} />
        </button>
        
        <button
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={editor.isActive({ textAlign: 'center' }) ? activeClass : buttonClass}
          title="Align Center"
        >
          <AlignCenter size={16} />
        </button>
        
        <button
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={editor.isActive({ textAlign: 'right' }) ? activeClass : buttonClass}
          title="Align Right"
        >
          <AlignRight size={16} />
        </button>
        
        <button
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          className={editor.isActive({ textAlign: 'justify' }) ? activeClass : buttonClass}
          title="Justify"
        >
          <AlignJustify size={16} />
        </button>
      </div>
      
      <div className="divider divider-horizontal my-0"></div>
      
      {/* Lists and Blocks */}
      <div className="flex gap-1 mr-2">
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? activeClass : buttonClass}
          title="Bullet List"
        >
          <List size={16} />
        </button>
        
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? activeClass : buttonClass}
          title="Numbered List"
        >
          <ListOrdered size={16} />
        </button>
        
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive('blockquote') ? activeClass : buttonClass}
          title="Quote"
        >
          <Quote size={16} />
        </button>
        
        <button
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={editor.isActive('codeBlock') ? activeClass : buttonClass}
          title="Code Block"
        >
          <Code size={16} />
        </button>
      </div>
      
      <div className="divider divider-horizontal my-0"></div>
      
      {/* Links and Tables */}
      <div className="flex gap-1 mr-2">
        <button
          onClick={editor.isActive('link') ? removeLink : addLink}
          className={editor.isActive('link') ? activeClass : buttonClass}
          title={editor.isActive('link') ? 'Remove Link' : 'Add Link'}
        >
          <LinkIcon size={16} />
        </button>
        
        <button
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          className={buttonClass}
          title="Insert Table"
        >
          <TableIcon size={16} />
        </button>
      </div>
      
      <div className="divider divider-horizontal my-0"></div>
      
      {/* Undo/Redo */}
      <div className="flex gap-1">
        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
          className={buttonClass}
          title="Undo"
        >
          <Undo size={16} />
        </button>
        
        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
          className={buttonClass}
          title="Redo"
        >
          <Redo size={16} />
        </button>
      </div>
    </div>
  );
};

const RichTextEditor = ({ content, onChange, placeholder = "Start writing..." }) => {
const editor = useEditor({
  extensions: [
    StarterKit,
    Underline,
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: 'text-primary hover:underline',
      },
    }),
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    Table.configure({ resizable: true }),
    TableRow,
    TableHeader,
    TableCell,
    CodeBlockLowlight.configure({
      lowlight,
      HTMLAttributes: { class: 'hljs' },
    }),
  ],
  content: content || '',
  onUpdate: ({ editor }) => {
    const html = editor.getHTML();
    onChange && onChange(html);
  },
  editorProps: {
    attributes: {
      class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[300px] p-6',
      'data-placeholder': placeholder,
    },
  },
});

React.useEffect(() => {
  if (editor && content !== editor.getHTML()) {
    editor.commands.setContent(content || '');
  }
}, [content, editor]);

  return (
    <div className="border border-base-300 rounded-lg bg-base-100 overflow-hidden">
      <MenuBar editor={editor} />
      <div className="min-h-[300px] relative">
        <EditorContent 
          editor={editor} 
          className="prose max-w-none h-full"
        />
        {(!content || content === '<p></p>') && (
          <div className="absolute top-6 left-6 text-base-content/50 pointer-events-none">
            {placeholder}
          </div>
        )}
      </div>
      
      {/* Table controls (only show when table is selected) */}
      {editor && editor.isActive('table') && (
        <div className="border-t border-base-300 p-2 flex gap-2 text-sm">
          <button
            onClick={() => editor.chain().focus().addColumnBefore().run()}
            className="btn btn-xs btn-outline"
          >
            Add Column Before
          </button>
          <button
            onClick={() => editor.chain().focus().addColumnAfter().run()}
            className="btn btn-xs btn-outline"
          >
            Add Column After
          </button>
          <button
            onClick={() => editor.chain().focus().deleteColumn().run()}
            className="btn btn-xs btn-outline"
          >
            Delete Column
          </button>
          <button
            onClick={() => editor.chain().focus().addRowBefore().run()}
            className="btn btn-xs btn-outline"
          >
            Add Row Before
          </button>
          <button
            onClick={() => editor.chain().focus().addRowAfter().run()}
            className="btn btn-xs btn-outline"
          >
            Add Row After
          </button>
          <button
            onClick={() => editor.chain().focus().deleteRow().run()}
            className="btn btn-xs btn-outline"
          >
            Delete Row
          </button>
          <button
            onClick={() => editor.chain().focus().deleteTable().run()}
            className="btn btn-xs btn-error"
          >
            Delete Table
          </button>
        </div>
      )}
    </div>
  );
};

export default RichTextEditor;

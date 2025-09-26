'use client'

import { useEditor, EditorContent } from '@tiptap/react'
// 필요한 TipTap 확장만 선택적으로 임포트
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'

// MediaLibrary 컴포넌트를 동적으로 로드 (클라이언트 사이드 전용)
const MediaLibrary = dynamic(() => import('../media/MediaLibrary'), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-64 rounded-md" />
})

// EditorFileUpload 컴포넌트 동적 로드
const EditorFileUpload = dynamic(() => import('./EditorFileUpload'), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-32 rounded-md" />
})

interface TiptapEditorProps {
  content?: string
  onChange?: (content: string) => void
  placeholder?: string
  editable?: boolean
  className?: string
  category?: string // 카테고리 정보 (업로드 폴더 구분용)
}

export default function TiptapEditor({
  content = '',
  onChange,
  placeholder = '내용을 입력하세요...',
  editable = true,
  className = '',
  category = 'general'
}: TiptapEditorProps) {
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false)
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false)
  const [isMediaLibraryOpen, setIsMediaLibraryOpen] = useState(false)
  const [isFileUploadOpen, setIsFileUploadOpen] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        paragraph: {
          HTMLAttributes: {
            class: 'editor-paragraph',
          },
        },
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
        hardBreak: {
          keepMarks: false,
          HTMLAttributes: {
            class: 'editor-hard-break',
          },
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-md',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 hover:text-blue-800 underline',
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      if (onChange) {
        onChange(editor.getHTML())
      }
    },
    editorProps: {
      attributes: {
        class: `prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[200px] p-4 ${className}`,
      },
    },
  })

  // 이미지 삽입 (URL 입력)
  const addImage = useCallback(() => {
    const url = window.prompt('이미지 URL을 입력하세요:')
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }, [editor])

  // 미디어 라이브러리에서 이미지 선택
  const handleMediaSelect = useCallback((media: any) => {
    if (editor && media.type === 'image') {
      editor.chain().focus().setImage({ src: media.url, alt: media.name }).run()
      setIsMediaLibraryOpen(false)
    }
  }, [editor])

  // 파일 업로드 시작 알림
  const handleFileUploadStart = useCallback(() => {
    setUploadingFile(true)
  }, [])

  // 파일 업로드 완료 후 에디터에 삽입
  const handleFileUploadComplete = useCallback((file: any) => {
    setUploadingFile(false)
    if (editor && file.type === 'image') {
      // 이미지를 에디터에 삽입 (반응형 스타일로)
      editor.chain().focus().setImage({ 
        src: file.url, 
        alt: file.originalName,
        title: file.originalName,
        class: 'editor-uploaded-image'
      }).run()
      setIsFileUploadOpen(false)
    }
  }, [editor])

  // 파일 업로드 실패 처리
  const handleFileUploadError = useCallback(() => {
    setUploadingFile(false)
    // 에러는 EditorFileUpload 컴포넌트에서 처리
  }, [])

  // 링크 설정
  const setLink = useCallback(() => {
    const previousUrl = editor?.getAttributes('link').href
    const url = window.prompt('링크 URL을 입력하세요:', previousUrl)

    // 링크 제거
    if (url === null) {
      return
    }

    // 빈 URL인 경우 링크 제거
    if (url === '') {
      editor?.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    // 링크 업데이트
    editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  if (!editor) {
    return (
      <div className="min-h-[200px] p-4 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/2 mb-4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-2/3"></div>
      </div>
    )
  }

  return (
    <div className="border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800">
      {/* 툴바 */}
      {editable && (
        <div className="border-b border-gray-200 dark:border-gray-700 p-2 flex flex-wrap gap-1">
          {/* 텍스트 서식 */}
          <div className="flex border-r border-gray-200 dark:border-gray-700 pr-2 mr-2">
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              disabled={!editor.can().chain().focus().toggleBold().run()}
              className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${
                editor.isActive('bold') ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : ''
              }`}
              title="굵게 (Ctrl+B)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
              </svg>
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              disabled={!editor.can().chain().focus().toggleItalic().run()}
              className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${
                editor.isActive('italic') ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : ''
              }`}
              title="기울임 (Ctrl+I)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 4l4 16M6 8l12 2M6 16l12-2" />
              </svg>
            </button>
            <button
              onClick={() => editor.chain().focus().toggleStrike().run()}
              disabled={!editor.can().chain().focus().toggleStrike().run()}
              className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${
                editor.isActive('strike') ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : ''
              }`}
              title="취소선"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12h16M4 8h16M4 16h16" />
              </svg>
            </button>
          </div>

          {/* 제목 */}
          <div className="flex border-r border-gray-200 dark:border-gray-700 pr-2 mr-2">
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-bold ${
                editor.isActive('heading', { level: 1 }) ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : ''
              }`}
              title="제목 1"
            >
              H1
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-bold ${
                editor.isActive('heading', { level: 2 }) ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : ''
              }`}
              title="제목 2"
            >
              H2
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-bold ${
                editor.isActive('heading', { level: 3 }) ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : ''
              }`}
              title="제목 3"
            >
              H3
            </button>
          </div>

          {/* 목록 */}
          <div className="flex border-r border-gray-200 dark:border-gray-700 pr-2 mr-2">
            <button
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${
                editor.isActive('bulletList') ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : ''
              }`}
              title="글머리 기호"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <button
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${
                editor.isActive('orderedList') ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : ''
              }`}
              title="번호 매기기"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* 인용문 및 줄바꿈 */}
          <div className="flex border-r border-gray-200 dark:border-gray-700 pr-2 mr-2">
            <button
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${
                editor.isActive('blockquote') ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : ''
              }`}
              title="인용문"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </button>
            <button
              onClick={() => editor.chain().focus().setHardBreak().run()}
              className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              title="강제 줄바꿈 (또는 Shift+Enter)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 11l3-3m0 0l3 3m-3-3v8" />
              </svg>
            </button>
          </div>

          {/* 미디어 */}
          <div className="flex">
            {/* URL로 이미지 삽입 */}
            <button
              onClick={addImage}
              className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              title="URL로 이미지 삽입"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
            
            {/* 미디어 라이브러리에서 선택 */}
            <button
              onClick={() => setIsMediaLibraryOpen(true)}
              className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              title="미디어 라이브러리"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </button>
            
            {/* 파일 업로드 */}
            <button
              onClick={() => setIsFileUploadOpen(true)}
              disabled={uploadingFile}
              className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed ${
                uploadingFile ? 'animate-pulse' : ''
              }`}
              title="파일 업로드"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </button>
            <button
              onClick={setLink}
              className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${
                editor.isActive('link') ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : ''
              }`}
              title="링크"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* 편집기 본문 */}
      <div className="relative">
        <EditorContent editor={editor} />
        
        {/* 미디어 라이브러리 모달 */}
        {isMediaLibraryOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl max-h-[80vh] w-full mx-4 overflow-hidden">
              <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  미디어 라이브러리에서 선택
                </h3>
                <button
                  onClick={() => setIsMediaLibraryOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="p-4 overflow-y-auto max-h-[60vh]">
                <MediaLibrary
                  onSelectMedia={handleMediaSelect}
                  accept={{ 'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'] }}
                  category="editor"
                />
              </div>
            </div>
          </div>
        )}
        
        {/* 파일 업로드 모달 */}
        {isFileUploadOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <EditorFileUpload
              onUploadComplete={handleFileUploadComplete}
              onClose={() => setIsFileUploadOpen(false)}
              category={`editor-${category}`} // 카테고리별 업로드 폴더
              accept="image/*"
              maxSize={10 * 1024 * 1024} // 10MB
            />
          </div>
        )}
      </div>

      {/* CSS 스타일 */}
      <style jsx global>{`
        .ProseMirror {
          outline: none;
        }

        .ProseMirror p {
          margin: 0.75rem 0;
          line-height: 1.6;
          min-height: 1.6em;
        }

        .ProseMirror p:first-child {
          margin-top: 0;
        }

        .ProseMirror p:last-child {
          margin-bottom: 0;
        }

        /* 빈 문단 확실히 표시 */
        .ProseMirror p:empty {
          margin: 0.75rem 0 !important;
          line-height: 1.6 !important;
          min-height: 1.6em !important;
          display: block !important;
        }

        .ProseMirror p:empty::before {
          content: "";
          display: inline-block;
          width: 0;
          height: 1.6em;
        }

        .ProseMirror p.is-editor-empty:first-child::before {
          color: #adb5bd;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }

        .ProseMirror br {
          display: block;
          margin: 0.25rem 0;
        }

        .ProseMirror .editor-hard-break {
          display: block;
          margin: 0.25rem 0;
        }

        .ProseMirror h1, .ProseMirror h2, .ProseMirror h3,
        .ProseMirror h4, .ProseMirror h5, .ProseMirror h6 {
          line-height: 1.1;
          margin-top: 2.5rem;
          text-wrap: pretty;
        }

        .ProseMirror h1 {
          font-size: 1.4rem;
        }

        .ProseMirror h2 {
          font-size: 1.2rem;
        }

        .ProseMirror h3 {
          font-size: 1.1rem;
        }

        .ProseMirror blockquote {
          border-left: 3px solid #0ea5e9;
          margin: 1.5rem 0;
          padding-left: 1rem;
          font-style: italic;
        }

        .ProseMirror ul, .ProseMirror ol {
          padding-left: 1.5rem;
        }

        .ProseMirror li {
          margin: 0.25rem 0;
        }

        .ProseMirror img {
          max-width: 100%;
          height: auto;
          border-radius: 0.375rem;
        }
        
        .ProseMirror .editor-uploaded-image {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          margin: 1rem 0;
          display: block;
        }
        
        .dark .ProseMirror .editor-uploaded-image {
          box-shadow: 0 4px 6px -1px rgba(255, 255, 255, 0.1), 0 2px 4px -1px rgba(255, 255, 255, 0.06);
        }

        .ProseMirror a {
          color: #2563eb;
          text-decoration: underline;
        }

        .ProseMirror a:hover {
          color: #1d4ed8;
        }

        .ProseMirror pre {
          background: #f1f5f9;
          border-radius: 0.375rem;
          color: #1e293b;
          font-family: 'JetBrains Mono', monospace;
          padding: 0.75rem 1rem;
        }

        .ProseMirror code {
          background-color: #f1f5f9;
          border-radius: 0.25rem;
          color: #1e293b;
          font-size: 0.875rem;
          padding: 0.125rem 0.25rem;
        }

        .dark .ProseMirror pre {
          background: #374151;
          color: #f9fafb;
        }

        .dark .ProseMirror code {
          background-color: #374151;
          color: #f9fafb;
        }
      `}</style>
    </div>
  )
}
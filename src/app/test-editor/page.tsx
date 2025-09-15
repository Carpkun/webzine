'use client'

import { useState } from 'react'
import TiptapEditor from '../../components/editor/TiptapEditor'

export default function TestEditorPage() {
  const [content, setContent] = useState('<p>안녕하세요! <strong>WYSIWYG</strong> 에디터를 테스트해보세요.</p>')
  const [savedContent, setSavedContent] = useState('')

  const handleSave = () => {
    setSavedContent(content)
    alert('콘텐츠가 저장되었습니다!')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
          TiptapEditor 테스트
        </h1>
        
        {/* 에디터 */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            에디터
          </h2>
          <TiptapEditor
            content={content}
            onChange={setContent}
            placeholder="여기에 내용을 입력하세요..."
            className="min-h-[400px]"
          />
          
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              저장
            </button>
            <button
              onClick={() => setContent('')}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              초기화
            </button>
          </div>
        </div>

        {/* HTML 소스 */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            HTML 소스
          </h2>
          <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-x-auto text-sm">
            <code>{content}</code>
          </pre>
        </div>

        {/* 저장된 콘텐츠 미리보기 */}
        {savedContent && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              저장된 콘텐츠 미리보기 (실제 렌더링)
            </h2>
            <div className="border border-gray-200 dark:border-gray-700 rounded-md p-6 bg-white dark:bg-gray-800">
              <div 
                className="prose prose-lg prose-slate dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: savedContent }}
              />
            </div>
          </div>
        )}

        {/* 사용 가능한 기능 안내 */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-blue-900 dark:text-blue-100">
            지원되는 기능
          </h3>
          <ul className="space-y-2 text-blue-800 dark:text-blue-200">
            <li>• <strong>텍스트 서식</strong>: 굵게, 기울임, 취소선</li>
            <li>• <strong>제목</strong>: H1, H2, H3</li>
            <li>• <strong>목록</strong>: 글머리 기호, 번호 매기기</li>
            <li>• <strong>인용문</strong>: 블록 인용</li>
            <li>• <strong>이미지</strong>: URL로 이미지 삽입</li>
            <li>• <strong>링크</strong>: 하이퍼링크 추가/제거</li>
            <li>• <strong>버블 메뉴</strong>: 텍스트 선택시 플로팅 툴바</li>
            <li>• <strong>키보드 단축키</strong>: Ctrl+B (굵게), Ctrl+I (기울임) 등</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
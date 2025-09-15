'use client'

import { Content } from '@/lib/types'

interface PoetryToggleProps {
  content: Content & { category: 'poetry' }
}

export default function PoetryToggle({ content }: PoetryToggleProps) {
  // content에서 직접 원문과 번역 추출 (올바른 필드명 사용)
  const originalText = content.original_text || '원문이 없습니다.'
  
  // HTML 태그 제거하지만 줄바꿈 보존
  const cleanTranslationText = (html: string): string => {
    if (!html) return ''
    
    // <p> 태그를 줄바꿈으로 변환
    let text = html.replace(/<p[^>]*>/gi, '').replace(/<\/p>/gi, '\n')
    
    // <br> 태그를 줄바꿈으로 변환
    text = text.replace(/<br\s*\/?>/gi, '\n')
    
    // 다른 HTML 태그 제거
    text = text.replace(/<[^>]*>/g, '')
    
    // HTML 엔티티 디코딩
    text = text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&#x2F;/g, '/')
      .replace(/&nbsp;/g, ' ')
    
    // 여러 공백을 하나로 변환 (줄바꿈은 유지)
    text = text.replace(/ +/g, ' ')
    
    // 연속된 줄바꿈을 최대 2개로 제한
    text = text.replace(/\n\s*\n\s*\n/g, '\n\n')
    
    return text.trim()
  }
  
  // 번역문 처리
  const translatedText = content.translation ? cleanTranslationText(content.translation) : '번역이 없습니다.'

  return (
    <div className="space-y-6">
      {/* 병렬 표시 (좌우 분할) */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* 원문 */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-gray-800 dark:to-gray-900 rounded-lg p-6 border border-amber-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-300 mb-4 text-center">
            원문 (漢詩)
          </h3>
          <div className="text-center">
            <pre className="font-serif text-lg leading-relaxed text-amber-900 dark:text-amber-100 whitespace-pre-wrap">
              {originalText}
            </pre>
          </div>
        </div>

        {/* 번역문 */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-lg p-6 border border-blue-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-4 text-center">
            번역/해석 (韓國語)
          </h3>
          <div className="text-center">
            <pre className="font-sans text-lg leading-relaxed text-blue-900 dark:text-blue-100 whitespace-pre-wrap break-words">
              {translatedText}
            </pre>
          </div>
        </div>
      </div>

      {/* 모바일에서 구분선 */}
      <div className="md:hidden border-t border-gray-200 dark:border-gray-700 pt-4">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          💡 화면을 가로로 회전하면 원문과 번역을 나란히 볼 수 있습니다.
        </p>
      </div>

      {/* 작품 정보 */}
      {content.additional_data?.author_info && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
            작가 정보
          </h4>
          <p className="text-sm text-blue-800 dark:text-blue-400">
            {content.additional_data.author_info}
          </p>
        </div>
      )}

      {/* 작품 해설 */}
      {content.additional_data?.commentary && (
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
          <h4 className="font-medium text-amber-900 dark:text-amber-300 mb-2">
            작품 해설
          </h4>
          <p className="text-sm text-amber-800 dark:text-amber-400 leading-relaxed">
            {content.additional_data.commentary}
          </p>
        </div>
      )}
    </div>
  )
}
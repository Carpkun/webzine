'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import ContentDetail from '../../components/ContentDetail'
import RelatedContents from '../../components/RelatedContents'
import { Content } from '../../lib/types'

// 테스트용 더미 데이터
const testContent: Content = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  title: '봄날의 추억',
  content: '따뜻한 봄날, 벚꽃이 흩날리는 길을 걸으며 문득 어린 시절의 추억이 떠올랐다.\n\n그때는 모든 것이 새롭고 신기했다. 작은 꽃 하나, 나비 한 마리도 큰 기쁨이었다.\n\n지금 돌아보니 그 순수했던 마음이 그리워진다.',
  description: '어린 시절의 순수했던 마음을 그리워하는 수필',
  category: 'essay',
  author: '김춘천',
  created_at: '2024-03-15T10:30:00.000Z',
  updated_at: '2024-03-15T10:30:00.000Z',
  view_count: 42,
  likes_count: 8,
  image_url: null,
  video_url: null,
  additional_data: null
}

export default function TestContentPage() {
  const [content, setContent] = useState<Content | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 로딩 시뮬레이션
    const timer = setTimeout(() => {
      setContent(testContent)
      setLoading(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">콘텐츠를 불러오는 중...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!content) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">😵</div>
            <p className="text-gray-600 dark:text-gray-400">콘텐츠를 찾을 수 없습니다</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* 브레드크럼 */}
          <nav className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-8">
            <Link href="/" className="hover:text-gray-900 dark:hover:text-gray-200 transition-colors">
              홈
            </Link>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-gray-900 dark:text-gray-200 font-medium">
              테스트 콘텐츠
            </span>
          </nav>

          {/* 뒤로가기 버튼 */}
          <div className="mb-6">
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              뒤로가기
            </button>
          </div>

          {/* 콘텐츠 상세 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 md:p-8 mb-12">
            <ContentDetail content={content} />
          </div>

          {/* 관련 콘텐츠 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 md:p-8">
            <RelatedContents 
              category={content.category}
              currentContentId={content.id}
              limit={3}
            />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
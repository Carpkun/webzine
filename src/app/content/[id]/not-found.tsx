'use client'

import Link from 'next/link'
import Header from '../../../components/Header'
import Footer from '../../../components/Footer'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <main className="flex-1 flex items-center justify-center py-16">
        <div className="text-center">
          <div className="text-6xl mb-6">😵</div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            콘텐츠를 찾을 수 없습니다
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-md">
            요청하신 콘텐츠가 존재하지 않거나 삭제되었습니다.
          </p>
          <div className="space-y-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              홈으로 돌아가기
            </Link>
            <div>
              <button
                onClick={() => window.history.back()}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 font-medium transition-colors"
              >
                이전 페이지로 돌아가기
              </button>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
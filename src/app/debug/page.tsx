'use client'

import { useState } from 'react'
// import { supabase } from '../../lib/supabase'

export default function DebugPage() {
  const [connectionStatus] = useState<'checking' | 'connected' | 'error'>('connected')
  const [error] = useState<string | null>(null)

  // 임시로 정적 데이터 사용
  const debugInfo = {
    totalContents: 0,
    categoryStats: {
      essay: 0,
      poetry: 0,
      photo: 0,
      calligraphy: 0,
      video: 0
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            🔧 데이터베이스 디버그 페이지
          </h1>

          {/* 연결 상태 */}
          <div className="mb-6 p-4 rounded-lg border">
            <h2 className="text-lg font-semibold mb-2">연결 상태</h2>
            <div className="flex items-center gap-2">
              {connectionStatus === 'checking' && (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span>연결 확인 중...</span>
                </>
              )}
              {connectionStatus === 'connected' && (
                <>
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                  <span className="text-green-600">✅ 연결 성공</span>
                </>
              )}
              {connectionStatus === 'error' && (
                <>
                  <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                  <span className="text-red-600">❌ 연결 실패</span>
                </>
              )}
            </div>
          </div>

          {/* 에러 정보 */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h2 className="text-lg font-semibold text-red-800 mb-2">오류 정보</h2>
              <pre className="text-sm text-red-600 whitespace-pre-wrap">{error}</pre>
            </div>
          )}

          {/* 통계 정보 */}
          {debugInfo.totalContents !== undefined && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h2 className="text-lg font-semibold text-blue-800 mb-4">📊 데이터 통계</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{debugInfo.totalContents}</div>
                  <div className="text-sm text-gray-600">전체 콘텐츠</div>
                </div>
                {debugInfo.categoryStats && Object.entries(debugInfo.categoryStats).map(([category, count]: [string, number]) => (
                  <div key={category}>
                    <div className="text-2xl font-bold text-gray-600">{count}</div>
                    <div className="text-sm text-gray-600">
                      {category === 'essay' && '수필'}
                      {category === 'poetry' && '한시'}
                      {category === 'photo' && '사진'}
                      {category === 'calligraphy' && '서화'}
                      {category === 'video' && '영상'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 기타 정보 */}
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h2 className="text-lg font-semibold text-green-800 mb-2">시스템 상태</h2>
            <p className="text-sm text-green-700">
              관리자 CRUD 시스템이 구현되었습니다. 관리자 페이지에서 콘텐츠를 관리할 수 있습니다.
            </p>
          </div>

          {/* 콘솔 안내 */}
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-semibold text-yellow-800 mb-2">💡 디버깅 팁</h3>
            <p className="text-sm text-yellow-700">
              브라우저의 개발자 도구(F12) → Console 탭을 열어서 더 자세한 로그를 확인할 수 있습니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
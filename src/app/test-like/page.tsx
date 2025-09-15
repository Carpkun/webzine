'use client'

import { useState } from 'react'

export default function TestLikePage() {
  const [contentId, setContentId] = useState('1ad20906-96b6-4f34-b1e3-404699075bdc')
  const [result, setResult] = useState<{ status: number | string; data: unknown } | null>(null)
  const [loading, setLoading] = useState(false)

  const testLikeAPI = async () => {
    try {
      setLoading(true)
      setResult(null)
      
      const response = await fetch(`/api/contents/${contentId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const data = await response.json()
      setResult({
        status: response.status,
        data: data
      })
      
    } catch (error) {
      setResult({
        status: 'Error',
        data: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">좋아요 API 테스트</h1>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            콘텐츠 ID:
          </label>
          <input
            type="text"
            value={contentId}
            onChange={(e) => setContentId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="콘텐츠 ID 입력"
          />
        </div>
        
        <button
          onClick={testLikeAPI}
          disabled={loading || !contentId}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-md font-medium"
        >
          {loading ? '처리 중...' : '좋아요 테스트'}
        </button>
        
        {result && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-3">API 응답 결과:</h2>
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-md">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                <strong>Status:</strong> {result.status}
              </p>
              <pre className="text-sm overflow-auto">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
        <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
          테스트 방법:
        </h3>
        <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
          <li>1. 콘텐츠 ID를 입력하고 &quot;좋아요 테스트&quot; 버튼을 클릭하세요</li>
          <li>2. 성공 시 좋아요 수가 증가한 응답을 받습니다</li>
          <li>3. 1분 내 같은 IP에서 다시 클릭하면 제한 메시지를 받습니다</li>
        </ul>
      </div>
    </div>
  )
}
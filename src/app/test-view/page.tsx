'use client'

import { useState } from 'react'

export default function TestViewPage() {
  const [contentId, setContentId] = useState('1ad20906-96b6-4f34-b1e3-404699075bdc')
  const [result, setResult] = useState<{ status: number | string; data: unknown } | null>(null)
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState('')

  // 세션 ID 초기화
  const initSessionId = () => {
    const newSessionId = Math.random().toString(36).substring(2) + Date.now().toString(36)
    setSessionId(newSessionId)
    sessionStorage.setItem('webzine_session_id', newSessionId)
  }

  // 현재 세션 ID 가져오기
  const getCurrentSessionId = () => {
    let currentSessionId = sessionStorage.getItem('webzine_session_id')
    if (!currentSessionId) {
      currentSessionId = Math.random().toString(36).substring(2) + Date.now().toString(36)
      sessionStorage.setItem('webzine_session_id', currentSessionId)
    }
    setSessionId(currentSessionId)
    return currentSessionId
  }

  const testViewAPI = async () => {
    try {
      setLoading(true)
      setResult(null)
      
      const sessionId = getCurrentSessionId()
      
      const response = await fetch(`/api/contents/${contentId}/view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId })
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
      <h1 className="text-3xl font-bold mb-6">조회수 API 테스트</h1>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
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
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            현재 세션 ID:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={sessionId}
              readOnly
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
              placeholder="세션 ID가 표시됩니다"
            />
            <button
              onClick={getCurrentSessionId}
              className="px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md font-medium"
            >
              현재 세션 확인
            </button>
            <button
              onClick={initSessionId}
              className="px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-md font-medium"
            >
              새 세션 생성
            </button>
          </div>
        </div>
        
        <button
          onClick={testViewAPI}
          disabled={loading || !contentId}
          className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-md font-medium"
        >
          {loading ? '처리 중...' : '조회수 테스트'}
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
      
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
          테스트 방법:
        </h3>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <li>1. 콘텐츠 ID를 입력하고 &quot;조회수 테스트&quot; 버튼을 클릭하세요</li>
          <li>2. 첫 번째 요청에서는 조회수가 증가합니다</li>
          <li>3. 같은 세션에서 다시 클릭하면 중복 카운트되지 않습니다</li>
          <li>4. &quot;새 세션 생성&quot; 버튼을 클릭한 후 다시 테스트하면 조회수가 증가합니다</li>
          <li>5. 브라우저 새로고침 후에는 다시 카운트됩니다 (새 세션으로 간주)</li>
        </ul>
      </div>
    </div>
  )
}
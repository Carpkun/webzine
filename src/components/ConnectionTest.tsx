'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

interface ConnectionStatus {
  connected: boolean
  error: string | null
  tables: string[]
  projectInfo: {
    url?: string
    project_id?: string
  } | null
}

export default function ConnectionTest() {
  const [status, setStatus] = useState<ConnectionStatus>({
    connected: false,
    error: null,
    tables: [],
    projectInfo: null
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const testConnection = async () => {
      try {
        // 기본 연결 테스트 - contents 테이블 조회 시도 (타입 안전)
        const { error: testError } = await supabase
          .from('contents')
          .select('id')
          .limit(1)

        if (testError) {
          console.error('Connection test error:', testError)
          setStatus({
            connected: false,
            error: `연결 테스트 실패: ${testError.message}`,
            tables: [],
            projectInfo: null
          })
        } else {
          // 연결 성공 - 실제 테이블 목록 조회는 따로 처리
          const tableNames = ['contents'] // 우리가 생성한 테이블
          
          setStatus({
            connected: true,
            error: null,
            tables: tableNames,
            projectInfo: {
              url: process.env.NEXT_PUBLIC_SUPABASE_URL,
              project_id: 'oeeznxdrubsutvezyhxi'
            }
          })
        }
      } catch (err) {
        console.error('Connection test error:', err)
        setStatus({
          connected: false,
          error: `연결 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`,
          tables: [],
          projectInfo: null
        })
      } finally {
        setLoading(false)
      }
    }

    testConnection()
  }, [])

  if (loading) {
    return (
      <div className="p-6 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg">
        <h2 className="text-xl font-bold text-blue-800 dark:text-blue-200 mb-4">🔄 Supabase 연결 테스트 중...</h2>
        <div className="animate-pulse text-blue-700 dark:text-blue-300">연결 상태를 확인하고 있습니다...</div>
      </div>
    )
  }

  return (
    <div className={`p-6 border rounded-lg ${
      status.connected 
        ? 'bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-700' 
        : 'bg-red-50 dark:bg-red-900 border-red-200 dark:border-red-700'
    }`}>
      <h2 className={`text-xl font-bold mb-4 ${
        status.connected ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
      }`}>
        {status.connected ? '✅ Supabase 연결 성공' : '❌ Supabase 연결 실패'}
      </h2>
      
      {status.connected ? (
        <div className="space-y-3 text-gray-800 dark:text-gray-200">
          <div>
            <strong>프로젝트 URL:</strong> {status.projectInfo?.url}
          </div>
          <div>
            <strong>프로젝트 ID:</strong> {status.projectInfo?.project_id}
          </div>
          <div>
            <strong>현재 테이블 목록 ({status.tables.length}개):</strong>
            {status.tables.length > 0 ? (
              <ul className="list-disc list-inside mt-2 ml-4">
                {status.tables.map(table => (
                  <li key={table} className="text-sm">{table}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-600 mt-2">아직 생성된 테이블이 없습니다.</p>
            )}
          </div>
        </div>
      ) : (
        <div className="text-red-700 dark:text-red-300">
          <strong>오류:</strong> {status.error}
        </div>
      )}
    </div>
  )
}
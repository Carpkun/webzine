'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function ContentTest() {
  const [schemaInfo, setSchemaInfo] = useState<{
    tableExists: boolean
    error: string | null
    recordCount: number
    sampleRecord: Record<string, unknown> | null
    schemaFields: string[]
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkSchema = async () => {
      try {
        console.log('🔍 데이터베이스 스키마 확인 시작...')

        // 기본 테이블 처리 테스트
        const { data, error: fetchError } = await supabase
          .from('contents')
          .select('*')
          .limit(1)

        if (fetchError) {
          console.log('❌ 테이블 접근 오류:', fetchError.message)
          const info = {
            tableExists: false,
            error: fetchError.message,
            recordCount: 0,
            sampleRecord: null,
            schemaFields: []
          }
          setSchemaInfo(info)
        } else {
          console.log('✅ 테이블 접근 성공')
          
          // 전체 레코드 수 조회
          const { count } = await supabase
            .from('contents')
            .select('*', { count: 'exact', head: true })
          
          const info = {
            tableExists: true,
            error: null,
            recordCount: count || 0,
            sampleRecord: data?.[0] || null,
            schemaFields: data?.[0] ? Object.keys(data[0]) : []
          }
          setSchemaInfo(info)
        }

        console.log('데이터베이스 정보 확인 완료')

      } catch (err) {
        console.error('❌ 스키마 확인 실패:', err)
        setError(err instanceof Error ? err.message : '알 수 없는 오류')
      } finally {
        setLoading(false)
      }
    }

    checkSchema()
  }, [])


  if (loading) {
    return (
      <div className="p-6 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg">
        <h2 className="text-xl font-bold text-blue-800 dark:text-blue-200 mb-4">🔄 데이터베이스 스키마 확인 중...</h2>
        <div className="animate-pulse text-blue-700 dark:text-blue-300">테이블 구조 및 데이터 현황 조회 중...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg">
        <h2 className="text-xl font-bold text-red-800 dark:text-red-200 mb-4">❌ 스키마 확인 실패</h2>
        <p className="text-red-700 dark:text-red-300">{error}</p>
      </div>
    )
  }

  return (
    <div className="p-6 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg">
      <h2 className="text-xl font-bold text-green-800 dark:text-green-200 mb-4">📋 데이터베이스 스키마 정보</h2>
      
      {schemaInfo && (
        <div className="space-y-4">
          {/* 기본 정보 */}
          <div className="p-4 bg-white dark:bg-gray-800 rounded border dark:border-gray-600">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">🔍 테이블 상태</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">테이블 존재:</span>
                <span className={`ml-2 ${schemaInfo.tableExists ? 'text-green-600' : 'text-red-600'}`}>
                  {schemaInfo.tableExists ? '✅ 예' : '❌ 아니오'}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">레코드 수:</span>
                <span className="ml-2 text-blue-600">{schemaInfo.recordCount}개</span>
              </div>
            </div>
            
            {schemaInfo.error && (
              <div className="mt-2 p-2 bg-red-100 dark:bg-red-800 rounded text-sm text-red-700 dark:text-red-200">
                <span className="font-medium">오류:</span> {schemaInfo.error}
              </div>
            )}
          </div>

          {/* 스키마 구조 */}
          {schemaInfo.schemaFields.length > 0 && (
            <div className="p-4 bg-white dark:bg-gray-800 rounded border dark:border-gray-600">
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">📋 테이블 스키마</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-sm">
                {schemaInfo.schemaFields.map((field: string) => (
                  <div key={field} className="px-2 py-1 bg-blue-100 dark:bg-blue-800 rounded text-blue-700 dark:text-blue-200">
                    {field}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 샘플 데이터 */}
          {schemaInfo.sampleRecord && (
            <div className="p-4 bg-white dark:bg-gray-800 rounded border dark:border-gray-600">
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">🔍 샘플 데이터</h3>
              <pre className="text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 p-3 rounded overflow-x-auto">
                {JSON.stringify(schemaInfo.sampleRecord, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
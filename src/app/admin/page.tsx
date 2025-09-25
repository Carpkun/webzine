'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AdminOnly } from '../../lib/auth-context'

export default function AdminPage() {
  const router = useRouter()

  useEffect(() => {
    // /admin 접속 시 자동으로 /admin/dashboard로 리다이렉트
    router.replace('/admin/dashboard')
  }, [router])

  return (
    <AdminOnly>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 flex items-center gap-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="text-gray-900 dark:text-white">관리자 페이지로 이동 중...</span>
        </div>
      </div>
    </AdminOnly>
  )
}
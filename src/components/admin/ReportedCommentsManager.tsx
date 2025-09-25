'use client'

import { useState, useEffect } from 'react'
import { Comment } from '../../../lib/types'

interface ReportedCommentsManagerProps {
  className?: string
}

export default function ReportedCommentsManager({ className = '' }: ReportedCommentsManagerProps) {
  const [reportedComments, setReportedComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 신고된 댓글 목록 조회
  const fetchReportedComments = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/admin/comments/reported')
      const data = await response.json()

      if (response.ok) {
        setReportedComments(data.data || [])
      } else {
        setError(data.error || '신고된 댓글을 불러올 수 없습니다.')
      }
    } catch (err) {
      console.error('신고된 댓글 조회 실패:', err)
      setError('신고된 댓글을 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 댓글 승인 (신고 해제)
  const approveComment = async (commentId: string) => {
    if (!confirm('이 댓글의 신고를 해제하시겠습니까?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/comments/${commentId}/approve`, {
        method: 'POST',
      })

      const data = await response.json()

      if (response.ok) {
        alert('신고가 해제되었습니다.')
        fetchReportedComments() // 목록 새로고침
      } else {
        alert(data.error || '신고 해제에 실패했습니다.')
      }
    } catch (error) {
      console.error('댓글 승인 실패:', error)
      alert('신고 해제 중 오류가 발생했습니다.')
    }
  }

  // 댓글 삭제
  const deleteComment = async (commentId: string) => {
    if (!confirm('이 댓글을 완전히 삭제하시겠습니까?\\n삭제된 댓글은 복구할 수 없습니다.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/comments/${commentId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (response.ok) {
        alert('댓글이 삭제되었습니다.')
        fetchReportedComments() // 목록 새로고침
      } else {
        alert(data.error || '댓글 삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('댓글 삭제 실패:', error)
      alert('댓글 삭제 중 오류가 발생했습니다.')
    }
  }

  // 컴포넌트 마운트시 데이터 로드
  useEffect(() => {
    fetchReportedComments()
  }, [])

  // 시간 포맷팅
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow ${className}`}>
      {/* 헤더 */}
      <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            신고된 댓글 관리
            {reportedComments.length > 0 && (
              <span className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-sm font-medium px-2.5 py-0.5 rounded-full">
                {reportedComments.length}
              </span>
            )}
          </h2>
          <button
            onClick={fetchReportedComments}
            className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            새로고침
          </button>
        </div>
      </div>

      {/* 본문 */}
      <div className="p-6">
        {loading ? (
          // 로딩 상태
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                    <div className="space-y-1">
                      <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
                  <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          // 에러 상태
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-4 text-sm font-medium text-gray-900 dark:text-gray-100">오류 발생</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{error}</p>
            <button
              onClick={fetchReportedComments}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              다시 시도
            </button>
          </div>
        ) : reportedComments.length === 0 ? (
          // 빈 상태
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-4 text-sm font-medium text-gray-900 dark:text-gray-100">신고된 댓글이 없습니다</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              현재 검토가 필요한 신고된 댓글이 없습니다.
            </p>
          </div>
        ) : (
          // 신고된 댓글 목록
          <div className="space-y-4">
            {reportedComments.map((comment) => (
              <div key={comment.id} className="border border-red-200 dark:border-red-800 rounded-lg p-4 bg-red-50 dark:bg-red-900/10">
                {/* 댓글 헤더 */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <img
                      src={comment.user_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.user_name)}&background=random`}
                      alt={`${comment.user_name} 아바타`}
                      className="w-8 h-8 rounded-full"
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900 dark:text-white text-sm">
                          {comment.user_name}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          ({comment.user_email})
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatTime(comment.created_at)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                      신고됨
                    </span>
                  </div>
                </div>

                {/* 댓글 내용 */}
                <div className="mb-4">
                  <p className="text-gray-900 dark:text-white text-sm leading-relaxed whitespace-pre-wrap">
                    {comment.body}
                  </p>
                </div>

                {/* 관리자 액션 버튼 */}
                <div className="flex items-center justify-end space-x-3 pt-3 border-t border-red-200 dark:border-red-800">
                  <button
                    onClick={() => approveComment(comment.id)}
                    className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    승인 (신고해제)
                  </button>
                  <button
                    onClick={() => deleteComment(comment.id)}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
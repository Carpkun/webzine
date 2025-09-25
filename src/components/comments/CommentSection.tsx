'use client'

import { useState, useEffect } from 'react'
import { Comment, CommentsResponse } from '../../../lib/types'
import CommentList from './CommentList'
import CommentForm from './CommentForm'
import CommentSkeleton from './CommentSkeleton'

interface CommentSectionProps {
  contentId: string
  className?: string
}

export default function CommentSection({ contentId, className = '' }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalComments, setTotalComments] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 댓글 목록 조회
  const fetchComments = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/contents/${contentId}/comments`)
      const data: CommentsResponse = await response.json()

      if (data.error) {
        setError(data.error)
      } else {
        setComments(data.data || [])
        setTotalComments(data.count || 0)
      }
    } catch (err) {
      console.error('댓글 조회 실패:', err)
      setError('댓글을 불러올 수 없습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 컴포넌트 마운트시 댓글 로드
  useEffect(() => {
    if (contentId) {
      fetchComments()
    }
  }, [contentId])

  // 새 댓글 추가 핸들러
  const handleCommentAdded = (newComment: Comment) => {
    // 새 댓글을 목록 맨 위에 추가
    setComments(prev => [newComment, ...prev])
    setTotalComments(prev => prev + 1)
  }

  // 댓글 삭제 핸들러
  const handleCommentDeleted = (deletedCommentId: string) => {
    setComments(prev => prev.filter(comment => comment.id !== deletedCommentId))
    setTotalComments(prev => prev - 1)
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* 댓글 섹션 헤더 */}
      <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            댓글
            {totalComments > 0 && (
              <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-medium px-2.5 py-0.5 rounded-full">
                {totalComments}
              </span>
            )}
          </h3>
        </div>
      </div>

      <div className="px-6 py-4 space-y-6">
        {/* 댓글 작성 폼 */}
        <CommentForm
          contentId={contentId}
          onCommentAdded={handleCommentAdded}
          isSubmitting={isSubmitting}
          setIsSubmitting={setIsSubmitting}
        />

        {/* 댓글 목록 */}
        <div className="space-y-4">
          {loading ? (
            // 로딩 스켈레톤
            <div className="space-y-4">
              <CommentSkeleton />
              <CommentSkeleton />
              <CommentSkeleton />
            </div>
          ) : error ? (
            // 에러 상태
            <div className="text-center py-8">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <svg className="mx-auto h-8 w-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
                <button
                  onClick={fetchComments}
                  className="mt-3 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 font-medium"
                >
                  다시 시도
                </button>
              </div>
            </div>
          ) : comments.length === 0 ? (
            // 빈 상태
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <h3 className="mt-4 text-sm font-medium text-gray-900 dark:text-gray-100">아직 댓글이 없습니다</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                이 작품에 대한 첫 번째 댓글을 남겨보세요.
              </p>
            </div>
          ) : (
            // 댓글 목록 표시
            <CommentList
              comments={comments}
              onCommentDeleted={handleCommentDeleted}
            />
          )}
        </div>
      </div>
    </div>
  )
}
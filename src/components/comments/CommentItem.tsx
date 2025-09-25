'use client'

import { useState } from 'react'
import { Comment } from '../../../lib/types'
import PasswordModal from './PasswordModal'

interface CommentItemProps {
  comment: Comment
  onCommentDeleted: (commentId: string) => void
}

export default function CommentItem({ comment, onCommentDeleted }: CommentItemProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)

  // 시간 포맷팅
  const formatTime = (dateString: string) => {
    const now = new Date()
    const commentDate = new Date(dateString)
    const diffInMinutes = Math.floor((now.getTime() - commentDate.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return '방금 전'
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}시간 전`
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}일 전`
    
    return commentDate.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // 댓글 삭제 - 비밀번호 모달 표시
  const handleDeleteClick = () => {
    setShowMenu(false)
    setShowPasswordModal(true)
  }

  // 비밀번호 확인 후 삭제 실행
  const handleDeleteConfirm = async (password: string) => {
    setIsDeleting(true)

    try {
      const response = await fetch(`/api/contents/${comment.content_id}/comments/${comment.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password })
      })

      const data = await response.json()

      if (response.ok) {
        onCommentDeleted(comment.id)
      } else {
        throw new Error(data.error || '댓글 삭제에 실패했습니다.')
      }
    } catch (error: any) {
      console.error('댓글 삭제 실패:', error)
      throw error // PasswordModal에서 에러 처리
    } finally {
      setIsDeleting(false)
    }
  }

  // 신고 처리
  const handleReport = async () => {
    if (!confirm('이 댓글을 신고하시겠습니까?\n\n신고 사유: 부적절한 내용, 스팸, 욕설 등\n관리자가 검토 후 조치하겠습니다.')) {
      return
    }

    try {
      const response = await fetch(`/api/contents/${comment.content_id}/comments/${comment.id}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (response.ok) {
        alert(data.message || '댓글이 신고되었습니다.')
        setShowMenu(false)
      } else {
        alert(data.error || '댓글 신고에 실패했습니다.')
      }
    } catch (error) {
      console.error('댓글 신고 실패:', error)
      alert('댓글 신고 중 오류가 발생했습니다.')
    }
  }

  return (
    <div className={`
      bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4
      transition-opacity ${isDeleting ? 'opacity-50' : 'opacity-100'}
    `}>
      {/* 댓글 헤더 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          {/* 사용자 아바타 */}
          <img
            src={comment.user_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.user_name)}&background=random`}
            alt={`${comment.user_name} 아바타`}
            className="w-8 h-8 rounded-full"
          />
          
          {/* 사용자 정보 */}
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-900 dark:text-white text-sm">
                {comment.user_name}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatTime(comment.created_at)}
              </span>
            </div>
          </div>
        </div>

        {/* 액션 메뉴 */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>

          {/* 드롭다운 메뉴 */}
          {showMenu && (
            <div className="absolute right-0 top-8 w-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
              <button
                onClick={handleReport}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg"
              >
                신고하기
              </button>
              <button
                onClick={handleDeleteClick}
                disabled={isDeleting}
                className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-lg disabled:opacity-50"
              >
                {isDeleting ? '삭제 중...' : '삭제하기'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 댓글 내용 */}
      <div className="mb-3">
        <p className="text-gray-900 dark:text-white text-sm leading-relaxed whitespace-pre-wrap">
          {comment.body}
        </p>
      </div>

      {/* 댓글 하단 액션 */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center space-x-4">
          {/* 좋아요 버튼 (임시 비활성화) */}
          <button className="flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors opacity-50 cursor-not-allowed">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span>좋아요</span>
          </button>
        </div>

        {/* 수정/삭제 시간 표시 */}
        {comment.updated_at !== comment.created_at && (
          <span className="text-xs text-gray-400">
            (수정됨)
          </span>
        )}
      </div>

      {/* 메뉴 외부 클릭시 닫기 */}
      {showMenu && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowMenu(false)}
        />
      )}

      {/* 비밀번호 확인 모달 */}
      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onConfirm={handleDeleteConfirm}
        title="댓글 삭제"
        description="이 댓글을 삭제하시려면 댓글 작성 시 입력했던 비밀번호를 입력해주세요."
        isLoading={isDeleting}
      />
    </div>
  )
}
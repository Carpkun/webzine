'use client'

import { useState } from 'react'
import { Comment, CommentCreateParams } from '../../../lib/types'

interface CommentFormProps {
  contentId: string
  onCommentAdded: (comment: Comment) => void
  isSubmitting?: boolean
  setIsSubmitting?: (submitting: boolean) => void
}

export default function CommentForm({
  contentId,
  onCommentAdded,
  isSubmitting = false,
  setIsSubmitting
}: CommentFormProps) {
  const [comment, setComment] = useState('')
  const [userName, setUserName] = useState('')
  const [password, setPassword] = useState('')
  const [localSubmitting, setLocalSubmitting] = useState(false)

  // 제출 상태는 props나 local state 중 하나를 사용
  const submitting = setIsSubmitting ? isSubmitting : localSubmitting
  const setSubmitting = setIsSubmitting || setLocalSubmitting

  // 댓글 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!comment.trim() || !userName.trim() || !password.trim() || submitting) {
      if (!userName.trim()) {
        alert('사용자명을 입력해주세요.')
        return
      }
      if (!password.trim()) {
        alert('비밀번호를 입력해주세요.')
        return
      }
      if (!comment.trim()) {
        alert('댓글 내용을 입력해주세요.')
        return
      }
      return
    }

    if (userName.length < 2) {
      alert('사용자명은 2자 이상 입력해주세요.')
      return
    }

    if (userName.length > 20) {
      alert('사용자명은 20자 이하로 입력해주세요.')
      return
    }

    if (password.length < 4) {
      alert('비밀번호는 4자 이상 입력해주세요.')
      return
    }

    if (password.length > 50) {
      alert('비밀번호는 50자 이하로 입력해주세요.')
      return
    }

    if (comment.length > 2000) {
      alert('댓글은 2000자 이하로 입력해주세요.')
      return
    }

    setSubmitting(true)

    try {
      const payload: CommentCreateParams = {
        content_id: contentId,
        user_name: userName.trim(),
        password: password,
        body: comment.trim()
      }

      const response = await fetch(`/api/contents/${contentId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (response.ok && data.data) {
        onCommentAdded(data.data)
        setComment('') // 폼 초기화
        setUserName('')
        setPassword('')
      } else {
        alert(data.error || '댓글 작성에 실패했습니다.')
      }
    } catch (error) {
      console.error('댓글 작성 실패:', error)
      alert('댓글 작성 중 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  // 글자 수 카운터
  const characterCount = comment.length
  const isOverLimit = characterCount > 2000

  return (
    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 사용자명과 비밀번호 입력 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              사용자명 *
            </label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="사용자명 입력 (2-20자)"
              maxLength={20}
              disabled={submitting}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              비밀번호 *
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호 입력 (4-50자)"
              maxLength={50}
              disabled={submitting}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50"
            />
          </div>
        </div>
        
        {/* 안내 메시지 */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
          <p className="text-xs text-blue-600 dark:text-blue-400">
            • 사용자명과 비밀번호는 댓글 삭제/수정 시 필요합니다<br/>
            • 비밀번호는 안전하게 암호화되어 저장됩니다<br/>
            • 다른 사람이 사용할 수 있는 비밀번호는 피해주세요
          </p>
        </div>

        <div>
          <div className="relative">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="이 작품에 대한 생각을 댓글로 남겨보세요..."
              rows={4}
              className={`
                w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg
                bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                placeholder-gray-500 dark:placeholder-gray-400
                focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400
                resize-none transition-colors
                ${isOverLimit ? 'border-red-300 dark:border-red-600' : ''}
              `}
              disabled={submitting}
            />
            
            {/* 글자 수 카운터 */}
            <div className={`absolute bottom-3 right-3 text-xs ${
              isOverLimit 
                ? 'text-red-500 dark:text-red-400' 
                : characterCount > 1800 
                  ? 'text-yellow-600 dark:text-yellow-400'
                  : 'text-gray-400 dark:text-gray-500'
            }`}>
              {characterCount}/2000
            </div>
          </div>

          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            따뜻하고 건전한 댓글 문화를 위해 상대방을 배려하는 마음으로 댓글을 남겨주세요.
          </p>
        </div>

        {/* 폼 하단 정보 및 버튼 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* 사용자 정보 미리보기 */}
            {userName.trim() && (
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=random`}
                  alt="사용자 아바타"
                  className="w-6 h-6 rounded-full"
                />
                <span>{userName}</span>
              </div>
            )}
            
            {/* 안내 메시지 */}
            <div className="text-xs text-gray-400 dark:text-gray-500">
              사용자명과 비밀번호를 입력하여 댓글을 작성해주세요
            </div>
          </div>

          {/* 제출 버튼 */}
          <button
            type="submit"
            disabled={!comment.trim() || !userName.trim() || !password.trim() || isOverLimit || submitting}
            className={`
              px-6 py-2 text-sm font-medium rounded-lg transition-all
              ${!comment.trim() || !userName.trim() || !password.trim() || isOverLimit || submitting
                ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white shadow-sm hover:shadow-md'
              }
            `}
          >
            {submitting ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                <span>작성 중...</span>
              </div>
            ) : (
              '댓글 작성'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
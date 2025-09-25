'use client'

import { useState, useEffect } from 'react'
import { useContentContext } from '../contexts/ContentContext'

interface LikeButtonProps {
  contentId: string
  initialLikesCount: number
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showCount?: boolean
  disabled?: boolean
}

export default function LikeButton({
  contentId,
  initialLikesCount,
  className = '',
  size = 'md',
  showCount = true,
  disabled = false
}: LikeButtonProps) {
  const { updateContentLikes } = useContentContext()
  const [likesCount, setLikesCount] = useState(initialLikesCount)
  const [isLiked, setIsLiked] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  // 로컬 스토리지에서 좋아요 상태 확인
  useEffect(() => {
    const likedContents = JSON.parse(localStorage.getItem('likedContents') || '[]')
    setIsLiked(likedContents.includes(contentId))
  }, [contentId])

  // 사이즈별 스타일
  const sizeStyles = {
    sm: {
      button: 'px-2 py-1 text-sm',
      icon: 'w-4 h-4',
      text: 'text-xs'
    },
    md: {
      button: 'px-3 py-2',
      icon: 'w-5 h-5',
      text: 'text-sm'
    },
    lg: {
      button: 'px-4 py-3 text-lg',
      icon: 'w-6 h-6',
      text: 'text-base'
    }
  }

  const styles = sizeStyles[size]

  const handleLike = async () => {
    if (isLiked || isLoading || disabled) return

    // Optimistic Update - 즉시 UI 업데이트
    const previousCount = likesCount
    setIsLiked(true)
    setLikesCount(prev => prev + 1)
    setIsLoading(true)
    
    // 애니메이션 트리거
    setIsAnimating(true)
    setTimeout(() => setIsAnimating(false), 600) // 애니메이션 지속 시간

    try {
      const response = await fetch(`/api/contents/${contentId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const result = await response.json()
        console.log('좋아요 성공:', result.message)
        
        // 서버에서 받은 정확한 좋아요 수로 업데이트
        setLikesCount(result.likes_count)
        
        // Context에 좋아요 수 업데이트 반영 (실시간 UI 업데이트를 위해)
        updateContentLikes(contentId, result.likes_count)
        
        // 로컬 스토리지에 좋아요 상태 저장
        const likedContents = JSON.parse(localStorage.getItem('likedContents') || '[]')
        if (!likedContents.includes(contentId)) {
          likedContents.push(contentId)
          localStorage.setItem('likedContents', JSON.stringify(likedContents))
        }
        
      } else {
        // 오류 시 원복
        setIsLiked(false)
        setLikesCount(previousCount)
        
        const error = await response.json()
        
        if (response.status === 429) {
          // Rate limit 오류
          alert(error.message || '잠시 후 다시 시도해주세요.')
        } else if (response.status === 404) {
          alert('콘텐츠를 찾을 수 없습니다.')
        } else {
          alert('좋아요 처리 중 오류가 발생했습니다.')
        }
      }
    } catch (error) {
      console.error('좋아요 요청 오류:', error)
      
      // 네트워크 오류 시 원복
      setIsLiked(false)
      setLikesCount(previousCount)
      alert('네트워크 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleLike}
      disabled={isLiked || isLoading || disabled}
      className={`
        inline-flex items-center gap-2 font-medium rounded-lg transition-all duration-200
        ${styles.button}
        ${isLiked 
          ? 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 cursor-default'
          : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-500 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-red-900/30 dark:hover:text-red-400'
        }
        ${(isLiked || isLoading || disabled) && 'cursor-not-allowed'}
        ${isLoading && 'opacity-75'}
        ${className}
      `}
      title={isLiked ? '이미 좋아요를 눌렀습니다' : '좋아요'}
    >
      {/* 하트 아이콘 */}
      <div className="relative">
        <svg 
          className={`
            ${styles.icon} transition-all duration-200
            ${isAnimating ? 'animate-bounce scale-125' : ''}
          `} 
          fill={isLiked ? 'currentColor' : 'none'} 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
          />
        </svg>
        
        {/* 좋아요 애니메이션 하트들 */}
        {isAnimating && (
          <div className="absolute -top-2 -right-2 pointer-events-none">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className={`
                  absolute text-red-500 text-xs animate-ping
                  ${i === 0 ? 'animate-delay-0' : i === 1 ? 'animate-delay-100' : 'animate-delay-200'}
                `}
                style={{
                  left: `${i * 4 - 4}px`,
                  top: `${i * -4}px`,
                  animationDuration: '0.6s',
                  animationIterationCount: '1'
                }}
              >
                ❤️
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 좋아요 수 표시 */}
      {showCount && (
        <span className={`
          ${styles.text}
          ${isLoading && 'animate-pulse'}
        `}>
          {isLoading ? '...' : likesCount}
        </span>
      )}
      
      {/* 로딩 표시 */}
      {isLoading && (
        <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
      )}
    </button>
  )
}

// CSS 애니메이션을 위한 유틸리티 클래스 (Tailwind CSS에 추가됨)
export const LikeButtonStyles = `
  @keyframes heart-pop {
    0% { transform: scale(1); }
    50% { transform: scale(1.2); }
    100% { transform: scale(1); }
  }
  
  .animate-heart-pop {
    animation: heart-pop 0.3s ease-in-out;
  }
  
  .animate-delay-100 {
    animation-delay: 100ms;
  }
  
  .animate-delay-200 {
    animation-delay: 200ms;
  }
`
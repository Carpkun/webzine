'use client'

export default function CommentSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 animate-pulse">
      {/* 헤더 스켈레톤 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          {/* 아바타 스켈레톤 */}
          <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
          
          {/* 사용자 정보 스켈레톤 */}
          <div className="space-y-1">
            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
          </div>
        </div>
        
        {/* 메뉴 버튼 스켈레톤 */}
        <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
      </div>

      {/* 댓글 내용 스켈레톤 */}
      <div className="space-y-2 mb-3">
        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
      </div>

      {/* 하단 액션 스켈레톤 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
        </div>
      </div>
    </div>
  )
}
interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  showPages?: number
}

export default function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange,
  showPages = 5 
}: PaginationProps) {
  if (totalPages <= 1) {
    return null
  }

  // 표시할 페이지 번호들 계산
  const getPageNumbers = () => {
    const pages: number[] = []
    const halfShow = Math.floor(showPages / 2)
    
    let start = Math.max(1, currentPage - halfShow)
    let end = Math.min(totalPages, currentPage + halfShow)
    
    // 페이지 수가 부족한 경우 조정
    if (end - start + 1 < showPages) {
      if (start === 1) {
        end = Math.min(totalPages, start + showPages - 1)
      } else {
        start = Math.max(1, end - showPages + 1)
      }
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
    
    return pages
  }

  const pageNumbers = getPageNumbers()
  const showFirstPage = pageNumbers[0] > 1
  const showLastPage = pageNumbers[pageNumbers.length - 1] < totalPages

  return (
    <div className="flex items-center justify-center space-x-2">
      {/* 이전 페이지 */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="
          flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors
          disabled:opacity-50 disabled:cursor-not-allowed
          text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200
          hover:bg-gray-100 dark:hover:bg-gray-800
        "
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        이전
      </button>

      {/* 첫 페이지 */}
      {showFirstPage && (
        <>
          <button
            onClick={() => onPageChange(1)}
            className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            1
          </button>
          {pageNumbers[0] > 2 && (
            <span className="px-2 text-gray-400 dark:text-gray-500">...</span>
          )}
        </>
      )}

      {/* 페이지 번호들 */}
      {pageNumbers.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`
            px-3 py-2 rounded-lg text-sm font-medium transition-colors
            ${page === currentPage
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
            }
          `}
        >
          {page}
        </button>
      ))}

      {/* 마지막 페이지 */}
      {showLastPage && (
        <>
          {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
            <span className="px-2 text-gray-400 dark:text-gray-500">...</span>
          )}
          <button
            onClick={() => onPageChange(totalPages)}
            className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {totalPages}
          </button>
        </>
      )}

      {/* 다음 페이지 */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="
          flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors
          disabled:opacity-50 disabled:cursor-not-allowed
          text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200
          hover:bg-gray-100 dark:hover:bg-gray-800
        "
      >
        다음
        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  )
}
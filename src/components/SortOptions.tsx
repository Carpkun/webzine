interface SortOptionsProps {
  sortBy: 'created_at' | 'updated_at' | 'likes_count' | 'view_count' | 'title'
  sortOrder: 'asc' | 'desc'
  onSortChange: (sortBy: 'created_at' | 'updated_at' | 'likes_count' | 'view_count' | 'title', sortOrder: 'asc' | 'desc') => void
}

const sortOptions = [
  { 
    value: 'created_at', 
    label: '최신순', 
    icon: '🕒',
    defaultOrder: 'desc' as const
  },
  { 
    value: 'likes_count', 
    label: '인기순', 
    icon: '❤️',
    defaultOrder: 'desc' as const
  },
  { 
    value: 'view_count', 
    label: '조회순', 
    icon: '👁️',
    defaultOrder: 'desc' as const
  },
  { 
    value: 'title', 
    label: '제목순', 
    icon: '📝',
    defaultOrder: 'asc' as const
  }
] as const

export default function SortOptions({ sortBy, sortOrder, onSortChange }: SortOptionsProps) {
  const handleSortClick = (value: typeof sortBy) => {
    const option = sortOptions.find(opt => opt.value === value)
    if (option) {
      // 같은 정렬 기준을 다시 클릭하면 순서를 반대로
      if (sortBy === value) {
        onSortChange(value, sortOrder === 'asc' ? 'desc' : 'asc')
      } else {
        // 새로운 정렬 기준이면 기본 순서로
        onSortChange(value, option.defaultOrder)
      }
    }
  }

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
        정렬:
      </span>
      
      <div className="flex items-center space-x-1">
        {sortOptions.map((option) => {
          const isSelected = sortBy === option.value
          
          return (
            <button
              key={option.value}
              onClick={() => handleSortClick(option.value)}
              className={`
                flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                ${isSelected
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                }
              `}
            >
              <span>{option.icon}</span>
              <span>{option.label}</span>
              
              {isSelected && (
                <span className="ml-1">
                  {sortOrder === 'desc' ? '↓' : '↑'}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
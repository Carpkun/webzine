import { ContentCategory } from '../../lib/types'
import CategoryIcon from './CategoryIcon'

interface CategoryFilterProps {
  selectedCategory: ContentCategory | 'all'
  onCategoryChange: (category: ContentCategory | 'all') => void
  contentCounts?: Record<ContentCategory | 'all', number>
}

const categories: Array<{ id: ContentCategory | 'all'; name: string; icon: string }> = [
  { id: 'all', name: '전체', icon: '📚' },
  { id: 'essay', name: '수필', icon: '📝' },
  { id: 'poetry', name: '한시', icon: '📜' },
  { id: 'photo', name: '사진', icon: '📸' },
  { id: 'calligraphy', name: '서화', icon: '🖼️' },
  { id: 'video', name: '영상', icon: '🎬' }
]

export default function CategoryFilter({ 
  selectedCategory, 
  onCategoryChange,
  contentCounts = {}
}: CategoryFilterProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        카테고리
      </h3>
      
      <div className="space-y-2">
        {categories.map((category) => {
          const isSelected = selectedCategory === category.id
          const count = contentCounts[category.id] || 0
          
          return (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={`
                w-full flex items-center justify-between p-3 rounded-lg border transition-all duration-200
                ${isSelected 
                  ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 text-blue-900 dark:text-blue-100'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                }
              `}
            >
              <div className="flex items-center space-x-3">
                {category.id === 'all' ? (
                  <span className="text-lg">{category.icon}</span>
                ) : (
                  <CategoryIcon 
                    category={category.id as ContentCategory} 
                    size="sm" 
                    showLabel={false}
                  />
                )}
                <span className={`font-medium ${isSelected ? 'font-semibold' : ''}`}>
                  {category.name}
                </span>
              </div>
              
              <span className={`
                text-xs px-2 py-1 rounded-full
                ${isSelected 
                  ? 'bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }
              `}>
                {count}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
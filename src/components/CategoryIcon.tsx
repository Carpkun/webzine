import { ContentCategory } from '../../lib/types'

interface CategoryIconProps {
  category: ContentCategory
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showLabel?: boolean
  className?: string
}

const categoryConfig = {
  essay: {
    icon: '📝',
    label: '수필',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800'
  },
  poetry: {
    icon: '📜',
    label: '한시',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    borderColor: 'border-amber-200 dark:border-amber-800'
  },
  photo: {
    icon: '📸',
    label: '사진',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800'
  },
  calligraphy: {
    icon: '🖼️',
    label: '서화',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    borderColor: 'border-purple-200 dark:border-purple-800'
  },
  video: {
    icon: '🎬',
    label: '영상',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800'
  }
}

const sizeConfig = {
  sm: { icon: 'text-lg', padding: 'p-1.5', text: 'text-xs' },
  md: { icon: 'text-xl', padding: 'p-2', text: 'text-sm' },
  lg: { icon: 'text-2xl', padding: 'p-3', text: 'text-base' },
  xl: { icon: 'text-4xl', padding: 'p-4', text: 'text-lg' }
}

export default function CategoryIcon({ category, size = 'md', showLabel = true, className = '' }: CategoryIconProps) {
  const config = categoryConfig[category]
  const sizeClass = sizeConfig[size]

  return (
    <div className={`
      inline-flex items-center space-x-2 rounded-lg border
      ${config.bgColor} ${config.borderColor}
      ${sizeClass.padding}
      ${className}
    `}>
      <span className={`${sizeClass.icon}`}>
        {config.icon}
      </span>
      {showLabel && (
        <span className={`font-medium ${config.color} ${sizeClass.text}`}>
          {config.label}
        </span>
      )}
    </div>
  )
}

// 카테고리 설정을 외부에서 사용할 수 있도록 export
export { categoryConfig }
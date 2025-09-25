import { Content } from '../../lib/types'
import ContentCard from './ContentCard'
import { SkeletonGrid } from './SkeletonCard'

interface ContentGridProps {
  contents: Content[]
  loading?: boolean
  title?: string
  showEmpty?: boolean
}

export default function ContentGrid({ 
  contents, 
  loading = false, 
  title = "최신 작품",
  showEmpty = true 
}: ContentGridProps) {
  if (loading) {
    return (
      <div className="space-y-6">
        {title && (
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {title}
          </h2>
        )}
        <SkeletonGrid count={6} />
      </div>
    )
  }

  if (contents.length === 0 && showEmpty) {
    return (
      <div className="space-y-6">
        {title && (
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {title}
          </h2>
        )}
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            아직 작품이 없습니다
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            새로운 창작물이 곧 업로드될 예정입니다.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {title && (
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {title}
          </h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {contents.length}개의 작품
          </span>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {contents.map((content, index) => (
          <ContentCard 
            key={content.id} 
            content={content} 
            priority={index < 4} // 처음 4개는 우선순위 높게
          />
        ))}
      </div>
    </div>
  )
}
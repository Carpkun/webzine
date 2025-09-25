'use client'

import { useState, useEffect } from 'react'
import { ContentCategory, CategoryStats } from '../../../lib/types'
import { adminAPI } from '../../../lib/api'

// 전체 통계 타입 정의
interface OverallStats {
  totalContents: number
  totalViews: number
  totalLikes: number
  totalComments: number
}

interface CategoryManagerProps {
  onCategorySelect: (category: ContentCategory | 'all') => void
  selectedCategory?: ContentCategory | 'all'
  refreshTrigger?: number
}

const CATEGORIES: { 
  value: ContentCategory; 
  label: string; 
  description: string; 
  icon: string; 
  color: string;
  bgColor: string;
  borderColor: string;
}[] = [
  { 
    value: 'essay', 
    label: '수필', 
    description: '일상의 단상과 성찰을 담은 수필 작품',
    icon: '📝',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800'
  },
  { 
    value: 'poetry', 
    label: '한시', 
    description: '전통 한시와 현대적 번역',
    icon: '🎋',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800'
  },
  { 
    value: 'photo', 
    label: '사진', 
    description: '춘천의 아름다운 순간들',
    icon: '📷',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    borderColor: 'border-purple-200 dark:border-purple-800'
  },
  { 
    value: 'calligraphy', 
    label: '서화', 
    description: '전통 서예와 그림 작품',
    icon: '🖌️',
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-200 dark:border-yellow-800'
  },
  { 
    value: 'video', 
    label: '공연영상', 
    description: '문화 공연과 예술 영상',
    icon: '🎥',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800'
  },
]

export default function CategoryManager({ onCategorySelect, selectedCategory = 'all', refreshTrigger = 0 }: CategoryManagerProps) {
  const [categoryStats, setCategoryStats] = useState<Record<ContentCategory, CategoryStats>>({} as Record<ContentCategory, CategoryStats>)
  const [overallStats, setOverallStats] = useState<OverallStats>({ totalContents: 0, totalViews: 0, totalLikes: 0, totalComments: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 전체 통계 로드
  const loadOverallStats = async () => {
    try {
      const response = await adminAPI.getOverallStats()
      
      if (!response.ok) {
        throw new Error('전체 통계를 불러오는데 실패했습니다.')
      }
      
      const result = await response.json()
      setOverallStats(result.data)
    } catch (error) {
      console.error('전체 통계 로드 오류:', error)
      // 오류가 있어도 카테고리 통계는 계속 진행
    }
  }

  // 카테고리별 통계 로드
  const loadCategoryStats = async () => {
    // 로깅 제거 (성능 최적화)
    setLoading(true)
    setError(null)
    
    try {
      // 모든 카테고리의 통계를 병렬로 로드
      const promises = CATEGORIES.map(async (category) => {
        // 전체 콘텐츠 수 조회
        const params = new URLSearchParams()
        params.set('category', category.value)
        params.set('limit', '1')
        params.set('_t', Date.now().toString()) // 캐시 무효화
        params.set('_refresh', refreshTrigger.toString())
        
        const response = await adminAPI.getContents(params)
        if (!response.ok) {
          throw new Error(`${category.label} 통계를 불러오는데 실패했습니다. (${response.status})`)
        }
        
        const result = await response.json()
        const total = result.meta?.total || 0
        
        // 공개된 콘텐츠 수 조회
        const publishedParams = new URLSearchParams()
        publishedParams.set('category', category.value)
        publishedParams.set('published', 'true')
        publishedParams.set('limit', '1')
        publishedParams.set('_t', Date.now().toString()) // 캐시 무효화
        publishedParams.set('_refresh', refreshTrigger.toString())
        
        const publishedResponse = await adminAPI.getContents(publishedParams)
        // 공개 통계 오류 로깅 제거
        const publishedResult = publishedResponse.ok ? await publishedResponse.json() : { meta: { total: 0 } }
        const publishedCount = publishedResult.meta?.total || 0
        
        // 좋아요 수 집계 - 해당 카테고리의 모든 콘텐츠의 좋아요 수 합산
        const likesParams = new URLSearchParams()
        likesParams.set('category', category.value)
        likesParams.set('limit', '1000') // 충분히 큰 수로 설정
        likesParams.set('_t', Date.now().toString())
        likesParams.set('_refresh', refreshTrigger.toString())
        
        const likesResponse = await adminAPI.getContents(likesParams)
        let likesCount = 0
        
        if (likesResponse.ok) {
          const likesResult = await likesResponse.json()
          // 모든 콘텐츠의 좋아요 수 합산
          likesCount = likesResult.data?.reduce((sum: number, content: any) => {
            return sum + (content.likes_count || 0)
          }, 0) || 0
        }
        
        // featured_count는 0으로 설정 (추천 기능 제거)
        const featuredCount = 0
        
        // 최근 콘텐츠 조회
        const recentParams = new URLSearchParams()
        recentParams.set('category', category.value)
        recentParams.set('limit', '1')
        recentParams.set('sort', 'created_at')
        recentParams.set('order', 'desc')
        recentParams.set('_t', Date.now().toString()) // 캐시 무효화
        recentParams.set('_refresh', refreshTrigger.toString())
        
        const recentResponse = await adminAPI.getContents(recentParams)
        // 최근 콘텐츠 오류 로깅 제거
        const recentResult = recentResponse.ok ? await recentResponse.json() : { data: [] }
        const latestContent = recentResult.data?.[0] || null
        
        return {
          category: category.value,
          data: {
            category: category.value,
            total_count: total,
            published_count: publishedCount,
            featured_count: featuredCount,
            likes_count: likesCount,
            latest_content: latestContent
          } as CategoryStats
        }
      })

      const results = await Promise.all(promises)
      
      const statsMap = results.reduce((acc, { category, data }) => {
        acc[category] = data
        return acc
      }, {} as Record<ContentCategory, CategoryStats>)
      
      setCategoryStats(statsMap)
    } catch (err) {
      // 오류 로깅 제거 (성능 최적화)
      const errorMessage = err instanceof Error ? err.message : '통계를 불러오는데 실패했습니다.'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // 전체 데이터 로드
  const loadAllStats = async () => {
    await Promise.all([
      loadOverallStats(),
      loadCategoryStats()
    ])
  }

  useEffect(() => {
    loadAllStats()
  }, [refreshTrigger])

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) return '오늘'
    if (days === 1) return '어제'
    if (days < 7) return `${days}일 전`
    if (days < 30) return `${Math.floor(days / 7)}주 전`
    return date.toLocaleDateString('ko-KR')
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {CATEGORIES.map((category) => (
          <div key={category.value} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 animate-pulse">
            <div className="flex items-center mb-3">
              <div className="text-2xl mr-2">{category.icon}</div>
              <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
            </div>
            <div className="space-y-2">
              <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="flex items-center">
          <span className="text-red-500 text-xl mr-2">⚠️</span>
          <div>
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">통계 로드 오류</h3>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
          </div>
        </div>
        <button
          onClick={loadAllStats}
          className="mt-3 px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          다시 시도
        </button>
      </div>
    )
  }


  return (
    <div className="space-y-6">
      {/* 전체 통계 카드 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">📊 전체 통계</h2>
        <button
          onClick={loadAllStats}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center gap-1"
        >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            새로고침
          </button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{overallStats.totalContents}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">전체 콘텐츠</div>
          </div>
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{overallStats.totalViews.toLocaleString()}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">총 조회수</div>
          </div>
          <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{overallStats.totalLikes.toLocaleString()}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">총 좋아요수</div>
          </div>
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{overallStats.totalComments.toLocaleString()}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">총 댓글수</div>
          </div>
        </div>
      </div>

      {/* 전체 보기 버튼 */}
      <div className="flex justify-center">
        <button
          onClick={() => onCategorySelect('all')}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            selectedCategory === 'all'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          🌟 전체 콘텐츠 보기
        </button>
      </div>

      {/* 카테고리별 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {CATEGORIES.map((category) => {
          const stats = categoryStats[category.value]
          const isSelected = selectedCategory === category.value
          
          return (
            <div
              key={category.value}
              className={`${category.bgColor} ${category.borderColor} border rounded-lg transition-all duration-200 hover:shadow-md cursor-pointer ${
                isSelected ? 'ring-2 ring-blue-500 shadow-md' : ''
              }`}
              onClick={() => onCategorySelect(category.value)}
            >
              <div className="p-4">
                {/* 헤더 */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <span className="text-2xl mr-2">{category.icon}</span>
                    <div>
                      <h3 className={`font-semibold ${category.color}`}>
                        {category.label}
                      </h3>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* 설명 */}
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                  {category.description}
                </p>

                {/* 통계 */}
                {stats ? (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">전체</span>
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        {stats.total_count}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500 dark:text-gray-400">공개</span>
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">
                        {stats.published_count}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500 dark:text-gray-400">좋아요</span>
                      <span className="text-sm font-medium text-red-600 dark:text-red-400">
                        {stats.likes_count || 0}
                      </span>
                    </div>


                    {/* 최근 콘텐츠 */}
                    {stats.latest_content && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">최근 작성</div>
                        <div className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                          {stats.latest_content.title}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(stats.latest_content.created_at)}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-center text-gray-500 dark:text-gray-400 text-sm py-2">
                      데이터 없음
                    </div>
                  </div>
                )}

                {/* 액션 버튼 */}
                <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onCategorySelect(category.value)
                    }}
                    className={`w-full py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                      isSelected
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    {isSelected ? '선택됨' : '관리하기'}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* 카테고리별 특화 가이드 */}
      {selectedCategory && selectedCategory !== 'all' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          {(() => {
            const categoryInfo = CATEGORIES.find(cat => cat.value === selectedCategory)
            if (!categoryInfo) return null
            
            const guides = {
              essay: {
                title: '수필 작성 가이드',
                tips: [
                  '개인적인 경험이나 일상의 단상을 솔직하게 표현하세요',
                  '독자가 공감할 수 있는 보편적 주제를 선택하세요',
                  '자연스럽고 편안한 문체로 작성하세요',
                  '적절한 길이로 독자의 집중도를 유지하세요'
                ]
              },
              poetry: {
                title: '한시 등록 가이드',
                tips: [
                  '원문과 번역을 모두 정확하게 입력하세요',
                  '시의 배경이나 의미를 본문에서 설명해주세요',
                  '한자의 음과 뜻을 병기하면 더욱 좋습니다',
                  '시상의 아름다움이 잘 전달되도록 번역하세요'
                ]
              },
              photo: {
                title: '사진 등록 가이드',
                tips: [
                  '고품질의 이미지를 사용하세요',
                  '춘천의 특색이 잘 드러나는 장소를 촬영하세요',
                  '촬영 정보(장소, 시간, 카메라 설정)를 포함하세요',
                  '저작권을 확인하고 출처를 명시하세요'
                ]
              },
              calligraphy: {
                title: '서화 등록 가이드',
                tips: [
                  '작품의 해상도와 색감을 최대한 보존하세요',
                  '작가 정보와 작품 설명을 자세히 입력하세요',
                  '전통 기법이나 현대적 해석에 대해 설명하세요',
                  '작품에 담긴 의미나 창작 배경을 공유하세요'
                ]
              },
              video: {
                title: '공연영상 등록 가이드',
                tips: [
                  'YouTube, Vimeo 등의 안정적인 플랫폼을 이용하세요',
                  '공연자 정보와 공연 장소, 일시를 정확히 기재하세요',
                  '영상의 품질과 음질을 확인하세요',
                  '저작권 및 초상권 문제가 없는지 확인하세요'
                ]
              }
            }
            
            const guide = guides[selectedCategory as keyof typeof guides]
            if (!guide) return null
            
            return (
              <div>
                <div className="flex items-center mb-4">
                  <span className="text-2xl mr-3">{categoryInfo.icon}</span>
                  <h3 className={`text-lg font-semibold ${categoryInfo.color}`}>
                    {guide.title}
                  </h3>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {guide.tips.map((tip, index) => (
                    <div key={index} className="flex items-start">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                        {index + 1}
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        {tip}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}
import { useState, useEffect, useCallback } from 'react'
import { Content } from '../../lib/types'
import { useContentContext } from '../contexts/ContentContext'

interface UseContentsParams {
  category?: string
  search?: string
  sortBy?: 'created_at' | 'updated_at' | 'likes_count' | 'view_count' | 'title'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

interface UseContentsReturn {
  contents: Content[]
  loading: boolean
  error: string | null
  totalCount: number
  totalPages: number
  currentPage: number
  hasNextPage: boolean
  hasPrevPage: boolean
  categoryStats: Record<string, number>
  refetch: () => void
}

export function useContents({
  category = 'all',
  search = '',
  sortBy = 'created_at',
  sortOrder = 'desc',
  page = 1,
  limit = 12
}: UseContentsParams = {}): UseContentsReturn {
  const { setContentsList } = useContentContext()
  const [contents, setContents] = useState<Content[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [categoryStats, setCategoryStats] = useState<Record<string, number>>({})
  const [statsLoaded, setStatsLoaded] = useState(false)

  // 카테고리 통계 조회
  const fetchCategoryStats = useCallback(async () => {
    try {
      const response = await fetch('/api/contents/stats')
      if (response.ok) {
        const result = await response.json()
        setCategoryStats(result.stats || {})
        setStatsLoaded(true)
      }
    } catch (error) {
      console.error('카테고리 통계 조회 실패:', error)
    }
  }, [])

  // 콘텐츠 목록 조회
  const fetchContents = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // API 요청 파라미터 구성
      const params = new URLSearchParams({
        category: category,
        page: page.toString(),
        limit: limit.toString(),
        sortBy: sortBy,
        sortOrder: sortOrder
      })
      
      // 검색어가 있으면 추가
      if (search.trim()) {
        params.append('search', search.trim())
      }
      
      const response = await fetch(`/api/contents/simple?${params}`)
      const result = await response.json()
      
      if (response.ok && result.data) {
        setContents(result.data)
        setTotalCount(result.count || 0)
        setError(null)
        
        // Context와 동기화
        if (result.data && result.data.length > 0) {
          setContentsList(result.data)
        }
      } else {
        throw new Error(result.error || '콘텐츠 조회 실패')
      }
      
    } catch (err) {
      console.error('콘텐츠 조회 오류:', err)
      setError(err instanceof Error ? err.message : '콘텐츠를 불러올 수 없습니다.')
      setContents([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }, [category, search, sortBy, sortOrder, page, limit, setContentsList])

  // 카테고리 통계는 처음 한 번만 조회
  useEffect(() => {
    if (!statsLoaded) {
      fetchCategoryStats()
    }
  }, [fetchCategoryStats, statsLoaded])

  // 콘텐츠 목록 조회
  useEffect(() => {
    fetchContents()
  }, [fetchContents])

  // 계산된 페이지네이션 정보
  const totalPages = Math.ceil(totalCount / limit)
  const hasNextPage = page < totalPages
  const hasPrevPage = page > 1

  return {
    contents,
    loading,
    error,
    totalCount,
    totalPages,
    currentPage: page,
    hasNextPage,
    hasPrevPage,
    categoryStats,
    refetch: fetchContents
  }
}
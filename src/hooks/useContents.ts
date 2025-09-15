'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { Content, ContentCategory } from '../../lib/types'
import { useContentContext } from '../contexts/ContentContext'

interface UseContentsParams {
  category?: ContentCategory | 'all'
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

  const fetchCategoryStats = useCallback(async () => {
    try {
      const stats: Record<string, number> = {}
      const categories = ['essay', 'poetry', 'photo', 'calligraphy', 'video']
      
      console.log('📈 카테고리 통계 조회 시작...')
      
      // 전체 수
      const { count: allCount } = await supabase
        .from('contents')
        .select('*', { count: 'exact', head: true })
        .eq('is_published', true)
      stats.all = allCount || 0
      
      // 각 카테고리별 수
      for (const cat of categories) {
        const { count: catCount } = await supabase
          .from('contents')
          .select('*', { count: 'exact', head: true })
          .eq('category', cat)
          .eq('is_published', true)
        stats[cat] = catCount || 0
        console.log(`📋 ${cat}: ${catCount || 0}개`)
      }
      
      setCategoryStats(stats)
      setStatsLoaded(true)
      console.log('🏁 카테곥0리 통계 완료:', stats)
      
    } catch (error) {
      console.error('❌ 카테곥0리 통계 조회 실패:', error)
    }
  }, [])

  const fetchContents = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔍 useContents fetchContents 시작')
      console.log('📊 쿼리 조건:', { category, search, sortBy, sortOrder, page, limit })
      console.log('🔗 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)

      // 기본 쿼리 설정
      let query = supabase
        .from('contents')
        .select('*', { count: 'exact' })
        
      console.log('📄 기본 쿼리 생성 완료')

      // 카테고리 필터링
      if (category !== 'all') {
        query = query.eq('category', category)
      }

      // 검색 기능 (제목 또는 내용에서 검색)
      if (search.trim()) {
        query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`)
      }

      // 정렬
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })

      // 페이지네이션
      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)
      
      console.log('🚀 쿼리 실행 시작...')
      const { data, error: fetchError, count } = await query
      console.log('🏁 쿼리 실행 완료')

      if (fetchError) {
        console.error('❌ 쿼리 오류:', fetchError)
        console.error('❌ 오류 상세정보:', JSON.stringify(fetchError, null, 2))
        throw new Error(`Supabase 오류: ${fetchError.message} (Code: ${fetchError.code})`)
      }

      setContents(data || [])
      setTotalCount(count || 0)
      
      // Context와 동기화
      if (data) {
        setContentsList(data)
        console.log('🔄 Context에 콘텐츠 목록 동기화 완료')
      }

      console.log(`📈 콘텐츠 조회 완료: ${data?.length || 0}개 (총 ${count || 0}개)`)
      console.log('🔍 쿼리 조건:', { category, search, sortBy, sortOrder, page, limit })

    } catch (err) {
      console.error('❌ 콘텐츠 조회 실패:', err)
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다')
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

  // 의존성 배열에 모든 파라미터 포함
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
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { Content, ContentCategory } from '../../lib/types'

interface LatestContentsByCategory {
  [key: string]: Content[]
}

interface UseLatestContentsByCategoryResult {
  contentsByCategory: LatestContentsByCategory
  loading: boolean
  error: string | null
}

export function useLatestContentsByCategory(limit: number = 6): UseLatestContentsByCategoryResult {
  const [contentsByCategory, setContentsByCategory] = useState<LatestContentsByCategory>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLatestContentsByCategory = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const categories: ContentCategory[] = ['essay', 'poetry', 'photo', 'calligraphy', 'video']
      const results: LatestContentsByCategory = {}
      
      // 각 카테고리별로 최신 콘텐츠를 가져옴 - useContents 방식을 참고
      for (const category of categories) {
        try {
          // 기본 쿼리 설정 - useContents에서 사용하는 방식과 동일
          let query = supabase
            .from('contents')
            .select('*')
            .eq('category', category)
            .order('created_at', { ascending: false })
            .limit(limit)

          const { data, error: categoryError } = await query

          if (categoryError) {
            console.error(`❌ Error fetching ${category} contents:`, categoryError)
            console.error(`❌ Error details:`, JSON.stringify(categoryError, null, 2))
            results[category] = []
          } else {
            // 발행된 콘텐츠만 필터링 (클라이언트 사이드에서)
            const publishedContents = (data || []).filter(content => content.is_published)
            results[category] = publishedContents
          }
        } catch (catError) {
          console.error(`❌ Unexpected error for ${category}:`, catError)
          results[category] = []
        }
      }
      
      setContentsByCategory(results)
    } catch (err) {
      console.error('❌ Error fetching latest contents by category:', err)
      setError('콘텐츠를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }, [limit])

  useEffect(() => {
    fetchLatestContentsByCategory()
  }, [fetchLatestContentsByCategory])

  return {
    contentsByCategory,
    loading,
    error
  }
}

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
          // 기본 쿼리 설정 - 필요한 필드만 선택하여 성능 최적화
          let query = supabase
            .from('contents')
            .select(`
              id, title, content, category, author_name, author_id,
              created_at, view_count, likes_count, is_published,
              slug, thumbnail_url, image_url, meta_description
            `)
            .eq('category', category)
            .eq('is_published', true)
            .order('created_at', { ascending: false })
            .limit(limit)

          const { data, error: categoryError } = await query

          if (categoryError) {
            console.error(`❌ Error fetching ${category} contents:`, categoryError)
            console.error(`❌ Error details:`, JSON.stringify(categoryError, null, 2))
            results[category] = []
          } else {
            // 이미 서버에서 is_published=true로 필터링됨
            results[category] = data || []
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

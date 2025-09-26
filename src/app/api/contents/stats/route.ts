// 카테고리별 콘텐츠 통계 API
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 인라인 캐시 설정
const CACHE_15MIN = {
  maxAge: 900,
  staleWhileRevalidate: 3600,
  cdnMaxAge: 900
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET() {
  try {
    const stats: Record<string, number> = {}
    const categories = ['essay', 'poetry', 'photo', 'calligraphy', 'video']
    
    // 전체 공개 콘텐츠 수
    const { count: allCount } = await supabase
      .from('contents')
      .select('*', { count: 'exact', head: true })
      .eq('is_published', true)
    stats.all = allCount || 0
    
    // 각 카테고리별 수 (병렬 처리)
    const categoryPromises = categories.map(async (cat) => {
      const { count } = await supabase
        .from('contents')
        .select('*', { count: 'exact', head: true })
        .eq('category', cat)
        .eq('is_published', true)
      return { category: cat, count: count || 0 }
    })
    
    const categoryResults = await Promise.all(categoryPromises)
    categoryResults.forEach(({ category, count }) => {
      stats[category] = count
    })
    
    const responseData = {
      stats,
      timestamp: new Date().toISOString()
    }
    
    const response = NextResponse.json(responseData)
    
    // 통계 데이터는 15분 캐싱 적용 (비교적 오래 유지 가능)
    response.headers.set('Cache-Control', `public, s-maxage=${CACHE_15MIN.maxAge}, stale-while-revalidate=${CACHE_15MIN.staleWhileRevalidate}`)
    response.headers.set('CDN-Cache-Control', `public, s-maxage=${CACHE_15MIN.cdnMaxAge}`)
    
    return response
    
  } catch (error) {
    console.error('카테고리 통계 조회 실패:', error)
    return NextResponse.json({
      error: 'Failed to fetch category stats',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
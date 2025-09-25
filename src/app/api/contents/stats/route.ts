// 카테고리별 콘텐츠 통계 API
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET() {
  try {
    console.log('📈 카테고리 통계 조회 시작...')
    
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
      console.log(`📋 ${category}: ${count}개`)
    })
    
    console.log('🏁 카테고리 통계 완료:', stats)
    
    return NextResponse.json({
      stats,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ 카테고리 통계 조회 실패:', error)
    return NextResponse.json({
      error: 'Failed to fetch category stats',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
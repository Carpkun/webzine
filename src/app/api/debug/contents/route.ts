import { NextResponse } from 'next/server'
import { supabase } from '../../../../../lib/supabase'

export async function GET() {
  try {
    // 전체 콘텐츠 수 확인
    const { count: totalCount, error: totalError } = await supabase
      .from('contents')
      .select('*', { count: 'exact', head: true })

    if (totalError) {
      console.error('Error getting total count:', totalError)
      return NextResponse.json({ error: 'Failed to get total count', details: totalError }, { status: 500 })
    }

    // 카테고리별 콘텐츠 수 확인
    const categories = ['essay', 'poetry', 'photo', 'calligraphy', 'video']
    const categoryStats: any = {}
    
    for (const category of categories) {
      const { count, error } = await supabase
        .from('contents')
        .select('*', { count: 'exact', head: true })
        .eq('category', category)
        
      if (error) {
        console.error(`Error getting ${category} count:`, error)
        categoryStats[category] = { error: error.message }
      } else {
        categoryStats[category] = { total: count }
      }
      
      // 발행된 콘텐츠 수 확인
      const { count: publishedCount, error: publishedError } = await supabase
        .from('contents')
        .select('*', { count: 'exact', head: true })
        .eq('category', category)
        .eq('is_published', true)
        
      if (!publishedError) {
        categoryStats[category].published = publishedCount
      }
    }

    // 실제 콘텐츠 샘플 가져오기
    const { data: sampleContents, error: sampleError } = await supabase
      .from('contents')
      .select('id, title, category, is_published, created_at')
      .limit(10)

    return NextResponse.json({
      totalCount,
      categoryStats,
      sampleContents: sampleError ? null : sampleContents,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Debug API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
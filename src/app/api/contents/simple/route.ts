// 간단한 콘텐츠 목록 조회 API (폴백용)
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const search = searchParams.get('search') || ''
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    
    console.log('🔍 Simple API 쿼리 시작:', { category, page, limit, search, sortBy, sortOrder })
    
    // 기본 쿼리 - 필수 필드만 선택
    let query = supabase
      .from('contents')
      .select(`
        id,
        title,
        category,
        author_name,
        author_id,
        created_at,
        likes_count,
        view_count,
        featured,
        thumbnail_url,
        original_text,
        translation,
        image_url,
        video_url,
        video_platform,
        performance_date,
        performance_venue,
        artwork_size,
        artwork_material
      `, { count: 'exact' })
      .eq('is_published', true)
    
    // 카테고리 필터
    if (category !== 'all') {
      query = query.eq('category', category)
    }
    
    // 검색 필터
    if (search.trim()) {
      query = query.or(`title.ilike.%${search}%,author_name.ilike.%${search}%`)
    }
    
    // 정렬 및 페이지네이션
    const from = (page - 1) * limit
    const to = from + limit - 1
    
    query = query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(from, to)
    
    const { data, error, count } = await query
    
    if (error) {
      console.error('❌ Simple API 쿼리 오류:', error)
      return NextResponse.json({ 
        error: 'Database query failed',
        details: error.message 
      }, { status: 500 })
    }
    
    console.log(`✅ Simple API 쿼리 완료: ${data?.length || 0}개`)
    
    return NextResponse.json({
      data: data || [],
      count: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    })
    
  } catch (error) {
    console.error('❌ Simple API 서버 오류:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
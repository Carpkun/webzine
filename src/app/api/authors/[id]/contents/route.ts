import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// 인라인 캐시 설정
const CACHE_5MIN = {
  maxAge: 300,
  staleWhileRevalidate: 1800,
  cdnMaxAge: 300
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // URL 쿼리 파라미터 추출
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const category = searchParams.get('category')
    
    // 오프셋 계산
    const offset = (page - 1) * limit

    // 기본 쿼리 구성 (필요한 필드만 선택)
    let query = supabase
      .from('contents')
      .select(`
        id, title, content, category, author_name, author_id, 
        created_at, updated_at, view_count, likes_count, 
        is_published, slug, thumbnail_url, meta_description,
        image_url, video_url, video_platform,
        authors!inner(id, name, bio, profile_image_url)
      `)
      .eq('authors.id', id)
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // 카테고리 필터 적용
    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    const { data: contents, error, count } = await query

    if (error) {
      console.error('작가별 콘텐츠 조회 오류:', error)
      return NextResponse.json(
        { error: '콘텐츠를 불러올 수 없습니다.' },
        { status: 500 }
      )
    }

    // 작가 정보도 함께 조회 (필요한 필드만 선택)
    const { data: author, error: authorError } = await supabase
      .from('authors')
      .select('id, name, bio, profile_image_url, created_at')
      .eq('id', id)
      .single()

    if (authorError) {
      console.error('작가 정보 조회 오류:', authorError)
      return NextResponse.json(
        { error: '작가 정보를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 전체 콘텐츠 수 조회 (페이지네이션용)
    let countQuery = supabase
      .from('contents')
      .select('id', { count: 'exact', head: true })
      .eq('author_id', id)
      .eq('is_published', true)

    if (category && category !== 'all') {
      countQuery = countQuery.eq('category', category)
    }

    const { count: totalCount } = await countQuery

    const responseData = {
      contents,
      author,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit),
        hasNext: page < Math.ceil((totalCount || 0) / limit),
        hasPrev: page > 1
      }
    }
    
    const response = NextResponse.json(responseData)
    
    // 작가별 콘텐츠 목록에 5분 캐싱 적용
    response.headers.set('Cache-Control', `public, s-maxage=${CACHE_5MIN.maxAge}, stale-while-revalidate=${CACHE_5MIN.staleWhileRevalidate}`)
    response.headers.set('CDN-Cache-Control', `public, s-maxage=${CACHE_5MIN.cdnMaxAge}`)
    
    return response
  } catch (error) {
    console.error('API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
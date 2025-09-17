// 관리자 콘텐츠 CRUD API 라우트
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ContentCreateParams, ContentListParams, ContentCategory } from '../../../../../lib/types'
import { requireAdmin, createAuthErrorResponse } from '../../../../../lib/auth-middleware'
import { validateContentData } from '../../../../../lib/validation'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// GET: 콘텐츠 목록 조회 (관리자용)
export async function GET(request: NextRequest) {
  try {
    // 관리자 권한 검증
    const authResult = await requireAdmin(request)
    if (!authResult.isAuthenticated || !authResult.isAdmin) {
      return createAuthErrorResponse(authResult)
    }
    
    console.log('관리자 인증 성공:', authResult.userId)

    const { searchParams } = new URL(request.url)
    
    // 쿼리 파라미터 파싱
    const params: ContentListParams = {
      category: (searchParams.get('category') as ContentCategory) || undefined,
      author_name: searchParams.get('author') || undefined,
      is_published: searchParams.get('published') === 'true' ? true : 
                   searchParams.get('published') === 'false' ? false : undefined,
      featured: searchParams.get('featured') === 'true' ? true : undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      sort_by: (searchParams.get('sort') as 'created_at' | 'updated_at' | 'likes_count' | 'view_count' | 'title') || 'created_at',
      sort_order: (searchParams.get('order') as 'asc' | 'desc') || 'desc',
      search: searchParams.get('search') || undefined
    }

    // 기본 쿼리 구성 (Service Role Key 사용)
    let query = supabaseAdmin
      .from('contents')
      .select('*')

    // 필터링 적용
    if (params.category) {
      query = query.eq('category', params.category)
    }
    if (params.author_name) {
      query = query.ilike('author_name', `%${params.author_name}%`)
    }
    if (params.is_published !== undefined) {
      query = query.eq('is_published', params.is_published)
    }
    if (params.featured !== undefined) {
      query = query.eq('featured', params.featured)
    }
    if (params.search) {
      query = query.or(`title.ilike.%${params.search}%,content.ilike.%${params.search}%`)
    }

    // 정렬 적용
    query = query.order(params.sort_by!, { ascending: params.sort_order === 'asc' })

    // 페이지네이션 적용
    const from = (params.page! - 1) * params.limit!
    const to = from + params.limit! - 1
    query = query.range(from, to)

    const { data, error } = await query
    
    // 전체 개수 조회를 위한 별도 쿼리
    let countQuery = supabaseAdmin
      .from('contents')
      .select('*', { count: 'exact', head: true })
    
    // 같은 필터 조건 적용
    if (params.category) {
      countQuery = countQuery.eq('category', params.category)
    }
    if (params.author_name) {
      countQuery = countQuery.ilike('author_name', `%${params.author_name}%`)
    }
    if (params.is_published !== undefined) {
      countQuery = countQuery.eq('is_published', params.is_published)
    }
    if (params.featured !== undefined) {
      countQuery = countQuery.eq('featured', params.featured)
    }
    if (params.search) {
      countQuery = countQuery.or(`title.ilike.%${params.search}%,content.ilike.%${params.search}%`)
    }
    
    const { count } = await countQuery

    if (error) {
      console.error('콘텐츠 조회 오류:', error)
      return NextResponse.json({ error: '콘텐츠를 불러오는데 실패했습니다.' }, { status: 500 })
    }

    // 메타데이터 구성
    const totalPages = count ? Math.ceil(count / params.limit!) : 0
    const meta = {
      page: params.page!,
      limit: params.limit!,
      total: count || 0,
      totalPages,
      hasNext: params.page! < totalPages,
      hasPrev: params.page! > 1
    }

    return NextResponse.json({ 
      data, 
      meta,
      message: '콘텐츠 목록을 성공적으로 조회했습니다.' 
    })

  } catch (error) {
    console.error('API 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

// POST: 새 콘텐츠 생성
export async function POST(request: NextRequest) {
  try {
    // 관리자 권한 검증
    const authResult = await requireAdmin(request)
    if (!authResult.isAuthenticated || !authResult.isAdmin) {
      return createAuthErrorResponse(authResult)
    }
    
    console.log('관리자 인증 성공:', authResult.userId)

    const rawBody = await request.json()
    
    // 데이터 검증 및 sanitization
    const validation = validateContentData(rawBody)
    if (!validation.isValid) {
      return NextResponse.json({ 
        error: '입력 데이터가 올바르지 않습니다.',
        details: validation.errors
      }, { status: 400 })
    }
    
    const body = validation.sanitized as ContentCreateParams

    // 카테고리별 필수 필드 검증
    if (body.category === 'poetry' && (!body.original_text || !body.translation)) {
      return NextResponse.json({ 
        error: '한시는 원문과 번역이 필요합니다.' 
      }, { status: 400 })
    }
    // 사진/서화 카테고리의 image_url은 에디터를 통해 업로드할 수 있으므로 선택사항으로 변경
    // if ((body.category === 'photo' || body.category === 'calligraphy') && !body.image_url) {
    //   return NextResponse.json({ 
    //     error: '사진/서화작품은 이미지가 필요합니다.' 
    //   }, { status: 400 })
    // }
    if (body.category === 'video' && (!body.video_url || !body.video_platform)) {
      return NextResponse.json({ 
        error: '공연영상은 동영상 URL과 플랫폼 정보가 필요합니다.' 
      }, { status: 400 })
    }

    // slug 생성 (제목 기반)
    const slug = body.slug || body.title
      .toLowerCase()
      .replace(/[^a-z0-9가-힣\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50)

    // author_id가 없는 경우 author_name으로 작가 찾기 또는 생성
    let finalAuthorId = body.author_id
    let finalAuthorName = body.author_name
    
    if (!finalAuthorId && finalAuthorName) {
      // author_name으로 기존 작가 찾기
      const { data: existingAuthor } = await supabaseAdmin
        .from('authors')
        .select('id, name')
        .eq('name', finalAuthorName.trim())
        .single()
      
      if (existingAuthor) {
        finalAuthorId = existingAuthor.id
      } else {
        // 새 작가 생성
        const { data: newAuthor, error: authorError } = await supabaseAdmin
          .from('authors')
          .insert([{ name: finalAuthorName.trim() }])
          .select()
          .single()
        
        if (!authorError && newAuthor) {
          finalAuthorId = newAuthor.id
        }
      }
    }

    const insertData = {
      ...body,
      author_id: finalAuthorId,
      author_name: finalAuthorName,
      slug,
      is_published: body.is_published ?? false,
      featured: body.featured ?? false,
      likes_count: 0,
      view_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabaseAdmin
      .from('contents')
      .insert([insertData])
      .select()
      .single()

    if (error) {
      console.error('콘텐츠 생성 오류:', error)
      return NextResponse.json({ error: '콘텐츠 생성에 실패했습니다.' }, { status: 500 })
    }

    return NextResponse.json({ 
      data, 
      message: '콘텐츠가 성공적으로 생성되었습니다.' 
    }, { status: 201 })

  } catch (error) {
    console.error('API 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
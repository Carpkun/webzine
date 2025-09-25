// 관리자 콘텐츠 CRUD API 라우트
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ContentCreateParams, ContentListParams, ContentCategory } from '../../../../../lib/types'
import { requireAdmin, createAuthErrorResponse } from '../../../../../lib/auth-middleware'
import { validateContentData } from '../../../../../lib/validation'
import { generateTTSInBackground, shouldGenerateTTS } from '../../../../lib/ttsUtils'

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
    
    // 관리자 인증 로깅 제거 (성능 최적화)

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

    // 기본 쿼리 구성 (Service Role Key 사용) - 필요한 컬럼만 선택
    let query = supabaseAdmin
      .from('contents')
      .select(`
        id,
        title,
        category,
        author_name,
        author_id,
        is_published,
        featured,
        likes_count,
        view_count,
        created_at,
        updated_at,
        meta_description,
        slug,
        thumbnail_url
      `, { count: 'exact' })

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

    // 페이지네이션 적용 및 count를 함께 조회
    const from = (params.page! - 1) * params.limit!
    const to = from + params.limit! - 1
    query = query.range(from, to)

    // count와 data를 동시에 가져오도록 수정
    const { data, error, count } = await query

    if (error) {
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
    
    // 관리자 인증 로깅 제거 (성능 최적화)

    const rawBody = await request.json()
    
    // 데이터 검증 및 sanitization
    const validation = validateContentData(rawBody)
    if (!validation.isValid) {
      return NextResponse.json({ 
        error: '입력 데이터가 올바르지 않습니다.',
        details: validation.errors
      }, { status: 400 })
    }
    
    const validatedBody = validation.sanitized as ContentCreateParams
    
    // 데이터 정리: 빈 문자열을 null로 변환
    const body = {
      ...validatedBody,
      // 날짜 필드들 정리
      performance_date: validatedBody.performance_date === '' ? null : validatedBody.performance_date,
      tts_generated_at: validatedBody.tts_generated_at === '' ? null : validatedBody.tts_generated_at,
      // 기타 선택적 필드들 정리
      artwork_size: validatedBody.artwork_size === '' ? null : validatedBody.artwork_size,
      artwork_material: validatedBody.artwork_material === '' ? null : validatedBody.artwork_material,
      performance_venue: validatedBody.performance_venue === '' ? null : validatedBody.performance_venue,
      meta_description: validatedBody.meta_description === '' ? null : validatedBody.meta_description,
      thumbnail_url: validatedBody.thumbnail_url === '' ? null : validatedBody.thumbnail_url,
      image_url: validatedBody.image_url === '' ? null : validatedBody.image_url,
      video_url: validatedBody.video_url === '' ? null : validatedBody.video_url,
      tts_url: validatedBody.tts_url === '' ? null : validatedBody.tts_url,
      original_text: validatedBody.original_text === '' ? null : validatedBody.original_text,
      translation: validatedBody.translation === '' ? null : validatedBody.translation,
      // 숫자 필드들 정리
      tts_duration: validatedBody.tts_duration === 0 || validatedBody.tts_duration === undefined ? null : validatedBody.tts_duration,
      tts_file_size: validatedBody.tts_file_size === 0 || validatedBody.tts_file_size === undefined ? null : validatedBody.tts_file_size,
      tts_chunks_count: validatedBody.tts_chunks_count || 1,
    }

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
      return NextResponse.json({ error: '콘텐츠 생성에 실패했습니다.' }, { status: 500 })
    }

    // TTS 대상 콘텐츠인 경우 백그라운드에서 TTS 생성
    if (shouldGenerateTTS(data.category, data.content)) {
      generateTTSInBackground(data.id, data.content)
    }

    return NextResponse.json({ 
      data, 
      message: '콘텐츠가 성공적으로 생성되었습니다.' 
    }, { status: 201 })

  } catch (error) {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
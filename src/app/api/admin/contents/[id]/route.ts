// 관리자 개별 콘텐츠 CRUD API 라우트
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ContentUpdateParams } from '../../../../../../lib/types'
import { requireAdmin, createAuthErrorResponse } from '../../../../../../lib/auth-middleware'
import { generateTTSInBackground, shouldGenerateTTS, hasTextChanged } from '../../../../../lib/ttsUtils'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// GET: 특정 콘텐츠 조회 (관리자용)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    // 관리자 권한 검증
    const authResult = await requireAdmin(request)
    if (!authResult.isAuthenticated || !authResult.isAdmin) {
      return createAuthErrorResponse(authResult)
    }

    const { data, error } = await supabaseAdmin
      .from('contents')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: '콘텐츠를 찾을 수 없습니다.' }, { status: 404 })
    }

    return NextResponse.json({ 
      data,
      message: '콘텐츠를 성공적으로 조회했습니다.' 
    })

  } catch (error) {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

// PUT: 콘텐츠 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    // 관리자 권한 검증
    const authResult = await requireAdmin(request)
    if (!authResult.isAuthenticated || !authResult.isAdmin) {
      return createAuthErrorResponse(authResult)
    }

    const rawBody: Partial<ContentUpdateParams> = await request.json()
    
    // 데이터 정리: 빈 문자열을 null로 변환
    const body: Partial<ContentUpdateParams> = {
      ...rawBody,
      // 날짜 필드들 정리
      performance_date: rawBody.performance_date === '' ? null : rawBody.performance_date,
      tts_generated_at: rawBody.tts_generated_at === '' ? null : rawBody.tts_generated_at,
      // 기타 선택적 필드들 정리
      artwork_size: rawBody.artwork_size === '' ? null : rawBody.artwork_size,
      artwork_material: rawBody.artwork_material === '' ? null : rawBody.artwork_material,
      performance_venue: rawBody.performance_venue === '' ? null : rawBody.performance_venue,
      meta_description: rawBody.meta_description === '' ? null : rawBody.meta_description,
      thumbnail_url: rawBody.thumbnail_url === '' ? null : rawBody.thumbnail_url,
      image_url: rawBody.image_url === '' ? null : rawBody.image_url,
      video_url: rawBody.video_url === '' ? null : rawBody.video_url,
      tts_url: rawBody.tts_url === '' ? null : rawBody.tts_url,
      original_text: rawBody.original_text === '' ? null : rawBody.original_text,
      translation: rawBody.translation === '' ? null : rawBody.translation,
      // 숫자 필드들 정리
      tts_duration: rawBody.tts_duration === 0 || rawBody.tts_duration === undefined ? null : rawBody.tts_duration,
      tts_file_size: rawBody.tts_file_size === 0 || rawBody.tts_file_size === undefined ? null : rawBody.tts_file_size,
      tts_chunks_count: rawBody.tts_chunks_count || 1,
    }
    
    // 기존 콘텐츠 확인
    const { data: existingContent, error: fetchError } = await supabaseAdmin
      .from('contents')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existingContent) {
      return NextResponse.json({ error: '콘텐츠를 찾을 수 없습니다.' }, { status: 404 })
    }

    // 카테고리가 변경된 경우 필수 필드 검증
    const targetCategory = body.category || existingContent.category
    
    if (targetCategory === 'poetry') {
      const originalText = body.original_text !== undefined ? body.original_text : existingContent.original_text
      const translation = body.translation !== undefined ? body.translation : existingContent.translation
      
      if (!originalText || !translation) {
        return NextResponse.json({ 
          error: '한시는 원문과 번역이 필요합니다.' 
        }, { status: 400 })
      }
    }
    
    if ((targetCategory === 'photo' || targetCategory === 'calligraphy')) {
      const imageUrl = body.image_url !== undefined ? body.image_url : existingContent.image_url
      
      if (!imageUrl) {
        return NextResponse.json({ 
          error: '사진/서화작품은 이미지가 필요합니다.' 
        }, { status: 400 })
      }
    }
    
    if (targetCategory === 'video') {
      const videoUrl = body.video_url !== undefined ? body.video_url : existingContent.video_url
      const videoPlatform = body.video_platform !== undefined ? body.video_platform : existingContent.video_platform
      
      if (!videoUrl || !videoPlatform) {
        return NextResponse.json({ 
          error: '공연영상은 동영상 URL과 플랫폼 정보가 필요합니다.' 
        }, { status: 400 })
      }
    }

    // author_id 처리 (작가 정보가 변경된 경우)
    let finalAuthorId = body.author_id !== undefined ? body.author_id : existingContent.author_id
    let finalAuthorName = body.author_name !== undefined ? body.author_name : existingContent.author_name
    
    if (!finalAuthorId && finalAuthorName && body.author_name) {
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

    // slug 업데이트 (제목이 변경된 경우)
    const updateData: Record<string, unknown> = {
      ...body,
      author_id: finalAuthorId,
      author_name: finalAuthorName,
      updated_at: new Date().toISOString()
    }

    if (body.title && body.title !== existingContent.title) {
      updateData.slug = body.title
        .toLowerCase()
        .replace(/[^a-z0-9가-힣\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50)
    }

    const { data, error } = await supabaseAdmin
      .from('contents')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: '콘텐츠 수정에 실패했습니다.' }, { status: 500 })
    }

    // TTS 재생성 필요성 확인 및 처리
    const newContent = body.content !== undefined ? body.content : existingContent.content
    const newCategory = body.category !== undefined ? body.category : existingContent.category
    
    if (shouldGenerateTTS(newCategory, newContent)) {
      // 콘텐츠가 변경된 경우만 TTS 재생성
      if (body.content !== undefined && hasTextChanged(existingContent.content, newContent)) {
        // TTS 재생성 로깅 제거 (성능 최적화)
        generateTTSInBackground(id, newContent)
      }
    }

    return NextResponse.json({ 
      data,
      message: '콘텐츠가 성공적으로 수정되었습니다.' 
    })

  } catch (error) {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

// DELETE: 콘텐츠 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    // 관리자 권한 검증
    const authResult = await requireAdmin(request)
    if (!authResult.isAuthenticated || !authResult.isAdmin) {
      return createAuthErrorResponse(authResult)
    }

    // 기존 콘텐츠 확인 (작가 정보 포함)
    const { data: existingContent, error: fetchError } = await supabaseAdmin
      .from('contents')
      .select('title, author_id, author_name')
      .eq('id', id)
      .single()

    if (fetchError || !existingContent) {
      return NextResponse.json({ error: '콘텐츠를 찾을 수 없습니다.' }, { status: 404 })
    }

    // 콘텐츠 삭제 시작 로깅 제거 (성능 최적화)

    // 1. 해당 콘텐츠의 댓글 먼저 삭제
    const { error: commentsDeleteError } = await supabaseAdmin
      .from('comments')
      .delete()
      .eq('content_id', id)
    
    if (commentsDeleteError) {
      // 댓글 삭제 실패해도 콘텐츠 삭제는 계속 진행
    }

    // 2. 콘텐츠 삭제
    const { error: contentDeleteError } = await supabaseAdmin
      .from('contents')
      .delete()
      .eq('id', id)

    if (contentDeleteError) {
      return NextResponse.json({ error: '콘텐츠 삭제에 실패했습니다.' }, { status: 500 })
    }

    // 3. 작가의 다른 콘텐츠가 있는지 확인하고, 없으면 작가도 삭제
    if (existingContent.author_id) {
      const { data: remainingContents, error: countError } = await supabaseAdmin
        .from('contents')
        .select('id', { count: 'exact', head: true })
        .eq('author_id', existingContent.author_id)
      
      if (countError) {
        // 작가 콘텐츠 확인 실패
      } else {
        const remainingCount = remainingContents || 0
        
        if (remainingCount === 0) {
          // 작가의 마지막 콘텐츠였으므로 작가도 삭제
          const { error: authorDeleteError } = await supabaseAdmin
            .from('authors')
            .delete()
            .eq('id', existingContent.author_id)
          
          if (authorDeleteError) {
            // 작가 삭제 실패해도 콘텐츠는 이미 삭제되었으므로 성공 응답
          }
        }
      }
    }

    return NextResponse.json({ 
      message: `"${existingContent.title}" 콘텐츠가 성공적으로 삭제되었습니다.` 
    })

  } catch (error) {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

// PATCH: 콘텐츠 상태 변경 (공개/비공개/추천 등)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }
    
    const token = authHeader.split(' ')[1]
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }
    
    // 사용자 토큰으로 인증된 클라이언트 생성
    const supabaseWithAuth = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    })

    const body = await request.json()
    const { action, value } = body

    if (!action) {
      return NextResponse.json({ error: '작업 유형을 지정해주세요.' }, { status: 400 })
    }

    // 허용된 액션만 처리
    const allowedActions = ['toggle_published', 'toggle_featured', 'set_published', 'set_featured']
    if (!allowedActions.includes(action)) {
      return NextResponse.json({ error: '지원하지 않는 작업입니다.' }, { status: 400 })
    }

    // 현재 콘텐츠 상태 확인
    const { data: currentContent, error: fetchError } = await supabaseWithAuth
      .from('contents')
      .select('is_published, featured, title')
      .eq('id', id)
      .single()

    if (fetchError || !currentContent) {
      return NextResponse.json({ error: '콘텐츠를 찾을 수 없습니다.' }, { status: 404 })
    }

    // 업데이트할 데이터 구성
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    }

    switch (action) {
      case 'toggle_published':
        updateData.is_published = !currentContent.is_published
        break
      case 'toggle_featured':
        updateData.featured = !currentContent.featured
        break
      case 'set_published':
        updateData.is_published = Boolean(value)
        break
      case 'set_featured':
        updateData.featured = Boolean(value)
        break
    }

    const { data, error } = await supabaseWithAuth
      .from('contents')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: '상태 변경에 실패했습니다.' }, { status: 500 })
    }

    const actionMessages = {
      toggle_published: `"${currentContent.title}"의 공개 상태가 ${data.is_published ? '공개' : '비공개'}로 변경되었습니다.`,
      toggle_featured: `"${currentContent.title}"의 추천 상태가 ${data.featured ? '추천' : '일반'}으로 변경되었습니다.`,
      set_published: `"${currentContent.title}"의 공개 상태가 ${data.is_published ? '공개' : '비공개'}로 설정되었습니다.`,
      set_featured: `"${currentContent.title}"의 추천 상태가 ${data.featured ? '추천' : '일반'}으로 설정되었습니다.`
    }

    return NextResponse.json({ 
      data,
      message: actionMessages[action as keyof typeof actionMessages]
    })

  } catch (error) {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
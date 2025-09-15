// 관리자 개별 콘텐츠 CRUD API 라우트
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ContentUpdateParams } from '../../../../../../lib/types'

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

    const { data, error } = await supabaseWithAuth
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
    console.error('API 오류:', error)
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

    const body: Partial<ContentUpdateParams> = await request.json()
    
    // 기존 콘텐츠 확인
    const { data: existingContent, error: fetchError } = await supabaseWithAuth
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

    // slug 업데이트 (제목이 변경된 경우)
    const updateData: Record<string, unknown> = {
      ...body,
      updated_at: new Date().toISOString()
    }

    if (body.title && body.title !== existingContent.title) {
      updateData.slug = body.title
        .toLowerCase()
        .replace(/[^a-z0-9가-힣\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50)
    }

    const { data, error } = await supabaseWithAuth
      .from('contents')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('콘텐츠 수정 오류:', error)
      return NextResponse.json({ error: '콘텐츠 수정에 실패했습니다.' }, { status: 500 })
    }

    return NextResponse.json({ 
      data,
      message: '콘텐츠가 성공적으로 수정되었습니다.' 
    })

  } catch (error) {
    console.error('API 오류:', error)
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

    // 기존 콘텐츠 확인
    const { data: existingContent, error: fetchError } = await supabaseWithAuth
      .from('contents')
      .select('title')
      .eq('id', id)
      .single()

    if (fetchError || !existingContent) {
      return NextResponse.json({ error: '콘텐츠를 찾을 수 없습니다.' }, { status: 404 })
    }

    const { error } = await supabaseWithAuth
      .from('contents')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('콘텐츠 삭제 오류:', error)
      return NextResponse.json({ error: '콘텐츠 삭제에 실패했습니다.' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: `"${existingContent.title}" 콘텐츠가 성공적으로 삭제되었습니다.` 
    })

  } catch (error) {
    console.error('API 오류:', error)
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
      console.error('상태 변경 오류:', error)
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
    console.error('API 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
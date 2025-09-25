import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../../../../lib/supabase'

// 세션 ID 생성 함수
function generateSessionId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

// IP 주소 추출 함수 (좋아요 API와 동일)
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (cfConnectingIp) {
    return cfConnectingIp
  }
  
  if (realIp) {
    return realIp
  }
  
  return request.ip || 'unknown'
}

// 세션 기반 중복 방지를 위한 인메모리 캐시
const recentViews = new Map<string, number>()

// 조회수 중복 체크 (세션 기반, 24시간 유지)
function canCountView(sessionId: string, contentId: string): boolean {
  const key = `${sessionId}-${contentId}`
  const now = Date.now()
  const lastView = recentViews.get(key)
  
  // 24시간(86400000ms) 내 중복 카운트 방지
  if (lastView && now - lastView < 86400000) {
    return false
  }
  
  // 캐시 정리 (48시간 이상 된 항목 제거)
  for (const [cacheKey, timestamp] of recentViews.entries()) {
    if (now - timestamp > 172800000) { // 48시간
      recentViews.delete(cacheKey)
    }
  }
  
  return true
}

// 조회 기록
function recordView(sessionId: string, contentId: string): void {
  const key = `${sessionId}-${contentId}`
  recentViews.set(key, Date.now())
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const contentId = resolvedParams.id
    const clientIp = getClientIP(request)
    
    // 요청 본문에서 세션 ID 가져오기 (클라이언트에서 제공)
    let sessionId: string
    try {
      const body = await request.json()
      sessionId = body.sessionId || generateSessionId()
    } catch {
      // JSON 파싱 실패 시 새로운 세션 ID 생성
      sessionId = generateSessionId()
    }
    
    // 조회수 요청 로깅 제거 (성능 최적화)

    // 콘텐츠 존재 확인
    const { data: content, error: fetchError } = await supabase
      .from('contents')
      .select('id, title, view_count')
      .eq('id', contentId)
      .eq('is_published', true)
      .single()

    if (fetchError) {
      console.error('콘텐츠 조회 오류:', fetchError)
      return NextResponse.json(
        { error: 'Content not found', details: fetchError.message },
        { status: 404 }
      )
    }

    if (!content) {
      return NextResponse.json(
        { error: 'Content not found or not published' },
        { status: 404 }
      )
    }
    
    // 콘텐츠 확인 로깅 제거

    // 세션 기반 중복 방지 체크
    if (!canCountView(sessionId, contentId)) {
      // 중복 방지 로깅 제거
      return NextResponse.json({
        success: true,
        message: '이미 조회된 콘텐츠입니다',
        view_count: content.view_count,
        content_id: contentId,
        session_id: sessionId,
        counted: false
      })
    }

    // 업데이트 시도 로깅 제거
    
    // 조회수 증가 - 단순한 업데이트 (SQL 직접 사용 방식)
    const { error: updateError } = await supabase
      .from('contents')
      .update({ 
        view_count: content.view_count + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', contentId)
      
    // 업데이트 결과 로깅 제거
      
    if (updateError) {
      console.error('조회수 업데이트 오류:', updateError)
      return NextResponse.json(
        { error: 'Failed to update view count', details: updateError.message },
        { status: 500 }
      )
    }
    
    // 업데이트 후 조회수 확인 또는 기대값 사욥
    let finalViewCount = content.view_count + 1 // 기본적으로 기대값 사용
    
    try {
      // 업데이트된 내용 재조회 시도
      const { data: updatedContent, error: refetchError } = await supabase
        .from('contents')
        .select('view_count')
        .eq('id', contentId)
        .single()
        
      if (!refetchError && updatedContent) {
        // 재조회 성공 시 실제 값 사용
        finalViewCount = updatedContent.view_count
        // 재조회 성공 로깅 제거
      } else {
        // 재조회 실패 로깅 제거
      }
    } catch (error) {
      // 재조회 오류 로깅 제거
    }
    
    // 조회 기록
    recordView(sessionId, contentId)
    
    // 조회수 증가 완료 로깅 제거
    
    return NextResponse.json({
      success: true,
      message: '조회수가 증가되었습니다',
      view_count: finalViewCount,
      content_id: contentId,
      session_id: sessionId,
      counted: true
    })

  } catch (error) {
    console.error('조회수 API 오류:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

// OPTIONS 메서드 추가 (CORS 대응)
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    }
  )
}
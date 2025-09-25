import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../../../../lib/supabase'

// IP 주소 추출 함수
function getClientIP(request: NextRequest): string {
  // Vercel, Cloudflare 등에서 제공하는 헤더들 확인
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  
  if (forwarded) {
    // x-forwarded-for는 여러 IP가 콤마로 구분되어 있을 수 있음, 첫 번째가 실제 클라이언트 IP
    return forwarded.split(',')[0].trim()
  }
  
  if (cfConnectingIp) {
    return cfConnectingIp
  }
  
  if (realIp) {
    return realIp
  }
  
  // 로컬 개발 환경이나 fallback
  return request.ip || 'unknown'
}

// 간단한 인메모리 캐시 (실제 운영에서는 Redis 등 사용 권장)
const recentLikes = new Map<string, number>()

// IP별 좋아요 제한 확인 (1분 내 중복 방지)
function canLike(ip: string, contentId: string): boolean {
  const key = `${ip}-${contentId}`
  const now = Date.now()
  const lastLike = recentLikes.get(key)
  
  // 1분(60000ms) 내 중복 좋아요 방지
  if (lastLike && now - lastLike < 60000) {
    return false
  }
  
  // 캐시 정리 (5분 이상 된 항목 제거)
  for (const [cacheKey, timestamp] of recentLikes.entries()) {
    if (now - timestamp > 300000) { // 5분
      recentLikes.delete(cacheKey)
    }
  }
  
  return true
}

// 좋아요 기록
function recordLike(ip: string, contentId: string): void {
  const key = `${ip}-${contentId}`
  recentLikes.set(key, Date.now())
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const contentId = resolvedParams.id

    // IP 주소 추출
    const clientIp = getClientIP(request)
    
    console.log(`좋아요 요청: ContentID=${contentId}, IP=${clientIp}`)

    // 콘텐츠 존재 확인
    const { data: content, error: fetchError } = await supabase
      .from('contents')
      .select('id, title, likes_count')
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

    // IP 기반 중복 방지 체크
    if (!canLike(clientIp, contentId)) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded', 
          message: '잠시 후 다시 시도해주세요. (1분 내 중복 좋아요 방지)',
          likes_count: content.likes_count 
        },
        { status: 429 }
      )
    }

    // 좋아요 수 증가 (원자적 업데이트)
    const { data: updatedContent, error: updateError } = await supabase
      .from('contents')
      .update({ 
        likes_count: content.likes_count + 1 
      })
      .eq('id', contentId)
      .select('likes_count')
      .single()

    if (updateError) {
      console.error('좋아요 업데이트 오류:', updateError)
      return NextResponse.json(
        { error: 'Failed to update likes', details: updateError.message },
        { status: 500 }
      )
    }

    // 좋아요 기록
    recordLike(clientIp, contentId)

    console.log(`좋아요 완료: ContentID=${contentId}, 새로운 좋아요 수=${updatedContent.likes_count}`)

    return NextResponse.json({
      success: true,
      message: '좋아요가 추가되었습니다!',
      likes_count: updatedContent.likes_count,
      content_id: contentId
    })

  } catch (error) {
    console.error('좋아요 API 오류:', error)
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
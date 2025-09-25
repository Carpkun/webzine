// 관리자 전체 통계 API
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin, createAuthErrorResponse } from '../../../../../lib/auth-middleware'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    // 관리자 권한 검증
    const authResult = await requireAdmin(request)
    if (!authResult.isAuthenticated || !authResult.isAdmin) {
      return createAuthErrorResponse(authResult)
    }

    // 전체 통계를 병렬로 조회
    const [
      totalContentsResult,
      totalViewsResult,
      totalLikesResult,
      totalCommentsResult
    ] = await Promise.all([
      // 전체 콘텐츠 수
      supabaseAdmin
        .from('contents')
        .select('*', { count: 'exact', head: true }),
      
      // 총 조회수
      supabaseAdmin
        .from('contents')
        .select('view_count')
        .not('view_count', 'is', null),
      
      // 총 좋아요수  
      supabaseAdmin
        .from('contents')
        .select('likes_count')
        .not('likes_count', 'is', null),
      
      // 총 댓글수
      supabaseAdmin
        .from('comments')
        .select('*', { count: 'exact', head: true })
    ])

    // 에러 검사
    if (totalContentsResult.error) {
      console.error('총 콘텐츠 수 조회 오류:', totalContentsResult.error)
      return NextResponse.json({ error: '통계를 불러오는데 실패했습니다.' }, { status: 500 })
    }

    if (totalViewsResult.error) {
      console.error('총 조회수 조회 오류:', totalViewsResult.error)
      return NextResponse.json({ error: '통계를 불러오는데 실패했습니다.' }, { status: 500 })
    }

    if (totalLikesResult.error) {
      console.error('총 좋아요수 조회 오류:', totalLikesResult.error)
      return NextResponse.json({ error: '통계를 불러오는데 실패했습니다.' }, { status: 500 })
    }

    if (totalCommentsResult.error) {
      console.error('총 댓글수 조회 오류:', totalCommentsResult.error)
      return NextResponse.json({ error: '통계를 불러오는데 실패했습니다.' }, { status: 500 })
    }

    // 통계 계산
    const totalContents = totalContentsResult.count || 0
    const totalViews = totalViewsResult.data?.reduce((sum, item) => sum + (item.view_count || 0), 0) || 0
    const totalLikes = totalLikesResult.data?.reduce((sum, item) => sum + (item.likes_count || 0), 0) || 0
    const totalComments = totalCommentsResult.count || 0

    return NextResponse.json({
      data: {
        totalContents,
        totalViews,
        totalLikes,
        totalComments
      },
      message: '전체 통계를 성공적으로 조회했습니다.'
    })

  } catch (error) {
    console.error('전체 통계 조회 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
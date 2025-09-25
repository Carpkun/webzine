import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../../lib/supabase/server'
import { CommentsResponse } from '../../../../../../lib/types'

// GET - 신고된 댓글 목록 조회 (관리자 전용)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // 관리자 인증 확인 (임시로 스킵, 추후 관리자 권한 체크 로직 추가)
    // const { data: { user }, error: authError } = await supabase.auth.getUser()
    // if (authError || !user) {
    //   return NextResponse.json(
    //     { error: '관리자 로그인이 필요합니다.' },
    //     { status: 401 }
    //   )
    // }
    
    // 관리자 권한 확인
    // const { data: profile } = await supabase
    //   .from('user_profiles')
    //   .select('role')
    //   .eq('id', user.id)
    //   .single()
    
    // if (!profile || profile.role !== 'admin') {
    //   return NextResponse.json(
    //     { error: '관리자 권한이 필요합니다.' },
    //     { status: 403 }
    //   )
    // }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    // 신고된 댓글 조회 (삭제되지 않고 신고된 댓글만)
    const { data: comments, error: commentsError, count } = await supabase
      .from('comments')
      .select(`
        *,
        contents!inner(id, title, category)
      `, { count: 'exact' })
      .eq('is_reported', true)
      .eq('is_deleted', false)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (commentsError) {
      console.error('신고된 댓글 조회 오류:', commentsError)
      return NextResponse.json(
        { data: null, error: '신고된 댓글을 불러오는 중 오류가 발생했습니다.' } as CommentsResponse,
        { status: 500 }
      )
    }

    const totalCount = count || 0
    const response: CommentsResponse = {
      data: comments || [],
      error: null,
      count: totalCount,
      meta: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: offset + limit < totalCount,
        hasPrev: page > 1
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('신고된 댓글 조회 API 오류:', error)
    return NextResponse.json(
      { data: null, error: '신고된 댓글을 불러오는 중 오류가 발생했습니다.' } as CommentsResponse,
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../../../../lib/supabase/server'

// POST - 댓글 신고
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const { commentId } = await params
    const supabase = await createClient()
    
    // 인증 확인 (임시로 스킵, 추후 소셜 로그인 구현시 활성화)
    // const { data: { user }, error: authError } = await supabase.auth.getUser()
    // if (authError || !user) {
    //   return NextResponse.json(
    //     { error: '로그인이 필요합니다.' },
    //     { status: 401 }
    //   )
    // }

    // 댓글 존재 확인
    const { data: comment, error: commentError } = await supabase
      .from('comments')
      .select('*')
      .eq('id', commentId)
      .eq('is_deleted', false)
      .single()

    if (commentError || !comment) {
      return NextResponse.json(
        { error: '댓글을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 이미 신고된 댓글인지 확인
    if (comment.is_reported) {
      return NextResponse.json(
        { error: '이미 신고된 댓글입니다.' },
        { status: 400 }
      )
    }

    // 댓글 신고 처리
    const { error: updateError } = await supabase
      .from('comments')
      .update({ 
        is_reported: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', commentId)

    if (updateError) {
      console.error('댓글 신고 처리 실패:', updateError)
      return NextResponse.json(
        { error: '댓글 신고 처리 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: '댓글이 신고되었습니다. 관리자가 검토 후 조치하겠습니다.' },
      { status: 200 }
    )

  } catch (error) {
    console.error('댓글 신고 API 오류:', error)
    return NextResponse.json(
      { error: '댓글 신고 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
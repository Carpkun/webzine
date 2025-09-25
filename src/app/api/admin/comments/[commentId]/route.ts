import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../../lib/supabase/server'

// DELETE - 관리자가 댓글 강제 삭제 (소프트 삭제)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    const { commentId } = await params
    const supabase = await createClient()
    
    // 관리자 인증 확인 (임시로 스킵)
    // const { data: { user }, error: authError } = await supabase.auth.getUser()
    // if (authError || !user) {
    //   return NextResponse.json(
    //     { error: '관리자 로그인이 필요합니다.' },
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

    // 관리자 강제 삭제 (소프트 삭제)
    const { error: updateError } = await supabase
      .from('comments')
      .update({ 
        is_deleted: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', commentId)

    if (updateError) {
      console.error('관리자 댓글 삭제 실패:', updateError)
      return NextResponse.json(
        { error: '댓글 삭제 처리 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: '댓글이 삭제되었습니다.' },
      { status: 200 }
    )

  } catch (error) {
    console.error('관리자 댓글 삭제 API 오류:', error)
    return NextResponse.json(
      { error: '댓글 삭제 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
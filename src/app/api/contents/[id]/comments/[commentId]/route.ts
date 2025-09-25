import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createClient, createAdminClient } from '../../../../../../../lib/supabase/server'
import { CommentDeleteParams } from '../../../../../../../lib/types'
import { verifyAuth } from '../../../../../../../lib/auth-middleware'

// DELETE - 댓글 삭제 (소프트 삭제)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  console.log('=== DELETE API 시작 ===')  
  
  try {
    const { commentId } = await params
    console.log('1. 댓글 ID 파싱 성공:', commentId)
    
    // 일반 사용자 클라이언트 (댓글 조회용)
    const supabase = await createClient()
    // 관리자 클라이언트 (수정/삭제용)
    const supabaseAdmin = createAdminClient()
    console.log('2. Supabase 클라이언트 생성 성공')
    
    // JSON body 파싱
    let body: CommentDeleteParams
    try {
      const rawBody = await request.text()
      console.log('3. 원시 요청 본문:', rawBody)
      body = JSON.parse(rawBody)
      console.log('4. JSON 파싱 성공:', body)
    } catch (error) {
      console.error('JSON 파싱 오류:', error)
      return NextResponse.json(
        { error: '잘못된 요청 형식입니다: ' + (error as Error).message },
        { status: 400 }
      )
    }
    
    // 관리자 권한 확인
    const authResult = await verifyAuth(request)
    const isAdmin = authResult.isAdmin
    
    console.log('5. 인증 결과:', { 
      isAuthenticated: authResult.isAuthenticated, 
      isAdmin: isAdmin 
    })
    
    // 관리자가 아닌 경우 비밀번호 필수
    if (!isAdmin) {
      if (!body || !body.password || body.password.trim().length === 0) {
        console.log('6. 비밀번호 유효성 검사 실패')
        return NextResponse.json(
          { error: '비밀번호를 입력해주세요.' },
          { status: 400 }
        )
      }
      console.log('6. 비밀번호 유효성 검사 통과')
    } else {
      console.log('6. 관리자 권한으로 비밀번호 검증 스킵')
    }

    // 댓글 존재 확인
    console.log('6. 댓글 조회 시작')
    const { data: comment, error: commentError } = await supabase
      .from('comments')
      .select('id, content_id, user_id, user_name, user_email, user_avatar, body, created_at, updated_at, is_reported, is_deleted, password_hash')
      .eq('id', commentId)
      .eq('is_deleted', false)
      .single()

    console.log('7. 댓글 조회 결과:', { 
      found: !!comment, 
      error: commentError?.message,
      userName: comment?.user_name,
      hasPasswordHash: !!comment?.password_hash
    })

    if (commentError || !comment) {
      console.log('8. 댓글 조회 실패:', commentError)
      return NextResponse.json(
        { error: '댓글을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 관리자가 아닌 경우만 비밀번호 확인
    if (!isAdmin) {
      console.log('9. 비밀번호 비교 시작')
      console.log('   - 입력 비밀번호:', body.password)
      console.log('   - 저장된 해시:', comment.password_hash.substring(0, 20) + '...')
      
      let isPasswordValid = false
      try {
        isPasswordValid = await bcrypt.compare(body.password, comment.password_hash)
        console.log('10. 비밀번호 비교 결과:', isPasswordValid)
      } catch (error) {
        console.error('11. 비밀번호 확인 오류:', error)
        return NextResponse.json(
          { error: '비밀번호 확인 중 오류가 발생했습니다.' },
          { status: 500 }
        )
      }

      if (!isPasswordValid) {
        console.log('12. 비밀번호 비교 실패 - 인증 거부')
        return NextResponse.json(
          { error: '비밀번호가 일치하지 않습니다.' },
          { status: 401 }
        )
      }
      
      console.log('13. 비밀번호 비교 성공 - 삭제 진행')
    } else {
      console.log('9. 관리자 권한으로 비밀번호 검증 스킵 - 삭제 진행')
    }

    // 소프트 삭제 (is_deleted 플래그 설정) - 관리자 클라이언트 사용
    console.log('14. 관리자 권한으로 소프트 삭제 수행')
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('comments')
      .update({ 
        is_deleted: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', commentId)
      .select('id')
      .single()

    if (updateError) {
      console.error('댓글 삭제 실패:', updateError)
      return NextResponse.json(
        { error: '댓글 삭제 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    if (!updated) {
      return NextResponse.json(
        { error: '댓글을 찾을 수 없거나 삭제 권한이 없습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { message: '댓글이 삭제되었습니다.' },
      { status: 200 }
    )

  } catch (error) {
    console.error('댓글 삭제 API 오류:', error)
    return NextResponse.json(
      { error: '댓글 삭제 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
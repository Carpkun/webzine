import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { Comment, CommentCreateParams, CommentsResponse } from '../../../../../../lib/types'
import { validateAndSanitizeComment, validateAndSanitizeAuthor, validatePassword, sanitizeText } from '../../../../../../lib/validation'

// 스팸 방지 시스템
interface SpamCheckResult {
  isSpam: boolean
  reason?: string
}

// 금지된 단어 목록 (예시)
const BANNED_WORDS = [
  '스팸', '광고', '홍보', '도박', '수익보장',
  'fuck', 'shit', '병신', '씨발', '닥쳐',
  '보지', '자지', '같은걸 다', '주소:', 'http://', 'https://',
  '연락처', '전화번호', '핸드폰', '카카오톡', '이메일'
]

// 대용량 미리 작성된 댓글 방지 (단순 기준)
const REPEATED_CHAR_THRESHOLD = 10 // 동일 문자 연속 제한
const MIN_COMMENT_LENGTH = 5 // 최소 글자수
const MAX_SAME_COMMENTS_PER_IP = 3 // 동일 IP에서 지나칠게 빠른 댓글

// 스패며 체크 함수
function checkForSpam(content: string, clientIP: string): SpamCheckResult {
  const trimmedContent = content.trim().toLowerCase()
  
  // 1. 최소 글자수 검사
  if (trimmedContent.length < MIN_COMMENT_LENGTH) {
    return {
      isSpam: true,
      reason: `댓글은 최소 ${MIN_COMMENT_LENGTH}자 이상 작성해주세요.`
    }
  }
  
  // 2. 금지 단어 검사
  for (const word of BANNED_WORDS) {
    if (trimmedContent.includes(word.toLowerCase())) {
      return {
        isSpam: true,
        reason: '부적절한 내용이 포함되어 있습니다. 다시 작성해주세요.'
      }
    }
  }
  
  // 3. 동일 문자 반복 검사
  for (let i = 0; i < trimmedContent.length - REPEATED_CHAR_THRESHOLD; i++) {
    let repeatedCount = 1
    for (let j = i + 1; j < trimmedContent.length && j < i + REPEATED_CHAR_THRESHOLD + 1; j++) {
      if (trimmedContent[i] === trimmedContent[j]) {
        repeatedCount++
      } else {
        break
      }
    }
    
    if (repeatedCount > REPEATED_CHAR_THRESHOLD) {
      return {
        isSpam: true,
        reason: '비정상적인 패턴의 문자가 반복되고 있습니다.'
      }
    }
  }
  
  // 4. URL/링크 감지
  const urlPattern = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi
  if (urlPattern.test(trimmedContent)) {
    return {
      isSpam: true,
      reason: 'URL이나 링크를 포함한 댓글은 작성할 수 없습니다.'
    }
  }
  
  // 5. 전화번호 패턴 감지
  const phonePattern = /(\d{3}[.-]?\d{3,4}[.-]?\d{4})|(\d{2,3}[.-]?\d{3,4}[.-]?\d{4})/
  if (phonePattern.test(trimmedContent)) {
    return {
      isSpam: true,
      reason: '연락처 정보를 포함한 댓글은 작성할 수 없습니다.'
    }
  }
  
  // 스팸 아니믄
  return { isSpam: false }
}

import { createClient } from '../../../../../../lib/supabase/server'

// GET - 특정 콘텐츠의 댓글 목록 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contentId } = await params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const supabase = await createClient()

    // Supabase에서 댓글 조회 (삭제되지 않은 댓글만, password_hash 제외)
    const offset = (page - 1) * limit
    
    const { data: comments, error: commentsError, count } = await supabase
      .from('comments')
      .select('id, content_id, user_id, user_name, user_email, user_avatar, body, created_at, updated_at, is_reported, is_deleted', { count: 'exact' })
      .eq('content_id', contentId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (commentsError) {
      // 로깅 제거 (성능 최적화)
      return NextResponse.json(
        { data: null, error: '댓글을 불러오는 중 오류가 발생했습니다.' } as CommentsResponse,
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
    // 로깅 제거 (성능 최적화)
    return NextResponse.json(
      { data: null, error: '댓글을 불러오는 중 오류가 발생했습니다.' } as CommentsResponse,
      { status: 500 }
    )
  }
}

// POST - 새 댓글 작성
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contentId } = await params
    const rawBody = await request.json()
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

    // 1. 데이터 검증 및 sanitization
    const sanitizedUserName = validateAndSanitizeAuthor(rawBody.user_name, 20)
    if (!sanitizedUserName) {
      return NextResponse.json(
        { error: '사용자명이 올바르지 않습니다. (한글/영문/숫자만 허용, 2-20자)' },
        { status: 400 }
      )
    }

    const passwordValidation = validatePassword(rawBody.password)
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: passwordValidation.message },
        { status: 400 }
      )
    }

    const sanitizedContent = validateAndSanitizeComment(rawBody.body, 1000)
    if (!sanitizedContent) {
      return NextResponse.json(
        { error: '댓글 내용이 올바르지 않습니다. (5-1000자)' },
        { status: 400 }
      )
    }
    
    // sanitized 데이터로 body 재구성
    const body: CommentCreateParams = {
      user_name: sanitizedUserName,
      password: rawBody.password, // 비밀번호는 해시 전에 원본 사용
      body: sanitizedContent,
      user_email: rawBody.user_email ? sanitizeText(rawBody.user_email) : undefined
    }

    if (body.password.length > 50) {
      return NextResponse.json(
        { error: '비밀번호는 50자 이하로 입력해주세요.' },
        { status: 400 }
      )
    }

    if (body.body.length > 2000) {
      return NextResponse.json(
        { error: '댓글은 2000자 이하로 입력해주세요.' },
        { status: 400 }
      )
    }

    // 2. 스팸 방지 검사
    const spamCheck = checkForSpam(body.body, clientIP)
    if (spamCheck.isSpam) {
      return NextResponse.json(
        { error: spamCheck.reason },
        { status: 429 } // Too Many Requests
      )
    }

    const supabase = await createClient()
    
    // 2-1. 비밀번호 해시화 (bcrypt 사용)
    let hashedPassword: string
    try {
      hashedPassword = await bcrypt.hash(body.password, 10)
    } catch (error) {
      console.error('비밀번호 해시화 오류:', error)
      return NextResponse.json(
        { error: '비밀번호 처리 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }
    
    // 사용자 정보 설정
    const userData = {
      id: 'user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      name: body.user_name.trim(),
      email: body.user_name.trim().toLowerCase().replace(/\s+/g, '') + '@guest.local', // 임시 이메일
      avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(body.user_name.trim())}&background=random`
    }

    // Supabase에 댓글 삽입
    const { data: newComment, error: insertError } = await supabase
      .from('comments')
      .insert({
        content_id: contentId,
        user_id: userData.id,
        user_name: userData.name,
        user_email: userData.email,
        user_avatar: userData.avatar_url,
        body: body.body.trim(),
        password_hash: hashedPassword
      })
      .select('id, content_id, user_id, user_name, user_email, user_avatar, body, created_at, updated_at, is_reported, is_deleted')
      .single()

    if (insertError) {
      console.error('댓글 삽입 오류:', insertError)
      return NextResponse.json(
        { error: '댓글 작성 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { data: newComment, error: null },
      { status: 201 }
    )

  } catch (error) {
    console.error('댓글 작성 API 오류:', error)
    return NextResponse.json(
      { error: '댓글 작성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
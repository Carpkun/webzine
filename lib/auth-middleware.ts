/**
 * API 권한 검증 미들웨어
 * 관리자/일반사용자 권한 검증 강화
 */

import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export interface AuthResult {
  isAuthenticated: boolean
  isAdmin: boolean
  userId?: string
  error?: string
}

/**
 * API 요청에서 인증 정보 추출 및 검증
 */
export async function verifyAuth(request: NextRequest): Promise<AuthResult> {
  try {
    // Authorization 헤더에서 토큰 추출 시도 (Bearer 토큰 방식)
    const authHeader = request.headers.get('authorization')
    
    if (authHeader?.startsWith('Bearer ')) {
      // Bearer 토큰 인증 방식
      const token = authHeader.split(' ')[1]
      
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get() { return null },
          },
        }
      )
      
      const { data: { user }, error } = await supabase.auth.getUser(token)
      
      if (error || !user) {
        return {
          isAuthenticated: false,
          isAdmin: false,
          error: '인증 토큰이 유효하지 않습니다.'
        }
      }
      
      const isAdmin = checkAdminRole(user)
      
      return {
        isAuthenticated: true,
        isAdmin,
        userId: user.id
      }
    }
    
    // 쿠키 기반 인증 방식
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
        },
      }
    )

    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return {
        isAuthenticated: false,
        isAdmin: false,
        error: '인증되지 않은 사용자입니다.'
      }
    }

    // 관리자 권한 확인
    const isAdmin = checkAdminRole(user)

    return {
      isAuthenticated: true,
      isAdmin,
      userId: user.id
    }
  } catch (error) {
    console.error('Auth verification error:', error)
    return {
      isAuthenticated: false,
      isAdmin: false,
      error: '인증 검증 중 오류가 발생했습니다.'
    }
  }
}

/**
 * 관리자 역할 확인
 */
function checkAdminRole(user: any): boolean {
  // 환경변수에서 관리자 이메일 목록 확인
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(email => email.trim()) || []
  
  if (adminEmails.includes(user.email)) {
    return true
  }

  // 하드코딩된 관리자 이메일 (임시)
  const defaultAdminEmails = ['admin@chunchen-webzine.com', 'manager@chunchen-webzine.com']
  if (defaultAdminEmails.includes(user.email)) {
    return true
  }

  return false
}

/**
 * 관리자 권한 필수 검증
 */
export async function requireAdmin(request: NextRequest): Promise<AuthResult> {
  const authResult = await verifyAuth(request)
  
  if (!authResult.isAuthenticated) {
    return {
      ...authResult,
      error: '로그인이 필요합니다.'
    }
  }

  if (!authResult.isAdmin) {
    return {
      ...authResult,
      error: '관리자 권한이 필요합니다.'
    }
  }

  return authResult
}

/**
 * 인증된 사용자 검증 (로그인 필수)
 */
export async function requireAuth(request: NextRequest): Promise<AuthResult> {
  const authResult = await verifyAuth(request)
  
  if (!authResult.isAuthenticated) {
    return {
      ...authResult,
      error: '로그인이 필요합니다.'
    }
  }

  return authResult
}

/**
 * 자원 소유자 또는 관리자 권한 확인
 */
export async function requireOwnershipOrAdmin(
  request: NextRequest, 
  resourceUserId: string
): Promise<AuthResult> {
  const authResult = await verifyAuth(request)
  
  if (!authResult.isAuthenticated) {
    return {
      ...authResult,
      error: '로그인이 필요합니다.'
    }
  }

  // 관리자는 모든 자원에 접근 가능
  if (authResult.isAdmin) {
    return authResult
  }

  // 일반 사용자는 자신의 자원만 접근 가능
  if (authResult.userId !== resourceUserId) {
    return {
      ...authResult,
      error: '해당 자원에 대한 권한이 없습니다.'
    }
  }

  return authResult
}

/**
 * 권한 검증 실패 시 에러 응답 생성
 */
export function createAuthErrorResponse(authResult: AuthResult): NextResponse {
  const status = authResult.isAuthenticated ? 403 : 401
  
  return NextResponse.json(
    { 
      error: authResult.error || '권한이 없습니다.',
      code: status === 401 ? 'UNAUTHORIZED' : 'FORBIDDEN'
    }, 
    { status }
  )
}
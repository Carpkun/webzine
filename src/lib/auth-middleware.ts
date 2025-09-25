import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export interface AuthResult {
  isAuthenticated: boolean
  isAdmin: boolean
  userId?: string
  email?: string
  error?: string
}

export async function requireAdmin(request: NextRequest): Promise<AuthResult> {
  try {
    // Authorization 헤더 확인 (JWT 토큰)
    const authHeader = request.headers.get('authorization')
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null
    
    if (bearerToken) {
      // JWT 토큰으로 인증 시도
      const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(bearerToken)
      
      if (user && !error) {
        // 관리자 권한 확인 (이메일 기반)
        const adminEmails = process.env.ADMIN_EMAILS?.split(',') || []
        const userRole = user.user_metadata?.role
        const userEmail = user.email || ''
        
        const isAdmin = adminEmails.includes(userEmail) || userRole === 'admin'
        
        if (isAdmin) {
          return {
            isAuthenticated: true,
            isAdmin: true,
            userId: user.id,
            email: user.email || undefined
          }
        } else {
          return {
            isAuthenticated: true,
            isAdmin: false,
            userId: user.id,
            email: user.email || undefined,
            error: '관리자 권한이 필요합니다'
          }
        }
      }
    }
    
    // 쿠키 기반 인증 시도
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      return {
        isAuthenticated: false,
        isAdmin: false,
        error: '인증 오류가 발생했습니다'
      }
    }
    
    if (!session) {
      return {
        isAuthenticated: false,
        isAdmin: false,
        error: '로그인이 필요합니다'
      }
    }

    // 관리자 권한 확인 (이메일 기반 또는 user_metadata의 role 기반)
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || []
    const userRole = session.user.user_metadata?.role
    const userEmail = session.user.email || ''
    
    const isAdmin = adminEmails.includes(userEmail) || userRole === 'admin'
    
    if (!isAdmin) {
      return {
        isAuthenticated: true,
        isAdmin: false,
        userId: session.user.id,
        email: session.user.email || undefined,
        error: '관리자 권한이 필요합니다'
      }
    }
    
    return {
      isAuthenticated: true,
      isAdmin: true,
      userId: session.user.id,
      email: session.user.email || undefined
    }
    
  } catch (error) {
    return {
      isAuthenticated: false,
      isAdmin: false,
      error: '서버 오류가 발생했습니다'
    }
  }
}

export function createAuthErrorResponse(authResult: AuthResult): NextResponse {
  if (!authResult.isAuthenticated) {
    return NextResponse.json(
      { error: authResult.error || '인증이 필요합니다' }, 
      { status: 401 }
    )
  }
  
  if (!authResult.isAdmin) {
    return NextResponse.json(
      { error: authResult.error || '관리자 권한이 필요합니다' }, 
      { status: 403 }
    )
  }
  
  return NextResponse.json(
    { error: '알 수 없는 인증 오류입니다' }, 
    { status: 500 }
  )
}
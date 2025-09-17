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
    console.log('🔍 인증 미들웨어 시작')
    
    // Authorization 헤더 확인 (JWT 토큰)
    const authHeader = request.headers.get('authorization')
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null
    
    console.log('🔑 Authorization 헤더:', {
      hasAuthHeader: !!authHeader,
      hasBearerToken: !!bearerToken
    })
    
    if (bearerToken) {
      // JWT 토큰으로 인증 시도
      const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(bearerToken)
      
      console.log('🔐 JWT 토큰 인증 결과:', {
        hasUser: !!user,
        userEmail: user?.email,
        error: error?.message
      })
      
      if (user && !error) {
        // 관리자 권한 확인 (이메일 기반)
        const adminEmails = process.env.ADMIN_EMAILS?.split(',') || []
        const userRole = user.user_metadata?.role
        const userEmail = user.email || ''
        
        console.log('📝 관리자 권한 체크 (JWT):', {
          adminEmails,
          userEmail,
          userRole,
          userMetadata: user.user_metadata
        })
        
        const isAdmin = adminEmails.includes(userEmail) || userRole === 'admin'
        console.log('👑 관리자 여부 (JWT):', isAdmin)
        
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
    console.log('🍪 쿠키 스토어 가져옴:', !!cookieStore)
    
    // 쿠키 내용 확인
    const allCookies = cookieStore.getAll()
    console.log('🍪 모든 쿠키:', allCookies.map(c => ({ name: c.name, hasValue: !!c.value })))
    
    // Supabase 세션 쿠키 확인
    const sessionCookies = allCookies.filter(c => c.name.includes('supabase'))
    console.log('📊 Supabase 세션 쿠키:', sessionCookies.map(c => ({ name: c.name, hasValue: !!c.value })))
    
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    console.log('📊 Supabase 클라이언트 생성 완료')
    
    const { data: { session }, error } = await supabase.auth.getSession()
    console.log('💴 세션 가져오기 결과:', {
      hasSession: !!session,
      sessionUserId: session?.user?.id,
      sessionEmail: session?.user?.email,
      error: error?.message
    })
    
    if (error) {
      console.error('세션 가져오기 오류:', error)
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
    
    console.log('📝 관리자 권한 체크:', {
      adminEmails,
      userEmail,
      userRole,
      userMetadata: session.user.user_metadata
    })
    
    const isAdmin = adminEmails.includes(userEmail) || userRole === 'admin'
    console.log('👑 관리자 여부:', isAdmin)
    
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
    console.error('인증 미들웨어 오류:', error)
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
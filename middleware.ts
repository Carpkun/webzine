import { NextRequest, NextResponse } from 'next/server'

// Rate limiting을 위한 메모리 저장소 (프로덕션에서는 Redis 사용 권장)
const rateLimit = new Map<string, { count: number; resetTime: number }>()

// Rate limiting 설정
const RATE_LIMIT_CONFIG = {
  api: { requests: 100, window: 15 * 60 * 1000 }, // 15분에 100회
  admin: { requests: 50, window: 15 * 60 * 1000 }, // 15분에 50회
  comments: { requests: 10, window: 5 * 60 * 1000 }, // 5분에 10회
  upload: { requests: 20, window: 60 * 60 * 1000 }, // 1시간에 20회
}

/**
 * Rate limiting 검사
 */
function checkRateLimit(
  ip: string, 
  endpoint: keyof typeof RATE_LIMIT_CONFIG
): { allowed: boolean; resetTime?: number } {
  const config = RATE_LIMIT_CONFIG[endpoint]
  const key = `${endpoint}:${ip}`
  const now = Date.now()
  
  const current = rateLimit.get(key)
  
  if (!current || now > current.resetTime) {
    // 새로운 윈도우 시작
    rateLimit.set(key, {
      count: 1,
      resetTime: now + config.window
    })
    return { allowed: true }
  }
  
  if (current.count >= config.requests) {
    return { allowed: false, resetTime: current.resetTime }
  }
  
  // 카운트 증가
  current.count++
  rateLimit.set(key, current)
  
  return { allowed: true }
}

/**
 * 의심스러운 활동 감지
 */
function detectSuspiciousActivity(request: NextRequest): boolean {
  const userAgent = request.headers.get('user-agent') || ''
  const referer = request.headers.get('referer')
  
  // 봇/크롤러 감지 (허용된 봇 제외)
  const suspiciousBots = [
    'sqlmap', 'nikto', 'nmap', 'masscan', 'zap',
    'burp', 'w3af', 'acunetix', 'nessus'
  ]
  
  if (suspiciousBots.some(bot => userAgent.toLowerCase().includes(bot))) {
    return true
  }
  
  // User-Agent가 없는 경우 의심
  if (!userAgent || userAgent.length < 10) {
    return true
  }
  
  // 의심스러운 HTTP 헤더 패턴
  const suspiciousHeaders = ['x-scanner', 'x-penetration-test', 'x-hack-attempt']
  for (const header of suspiciousHeaders) {
    if (request.headers.get(header)) {
      return true
    }
  }
  
  return false
}

/**
 * 클라이언트 IP 주소 추출
 */
function getClientIP(request: NextRequest): string {
  // NextRequest에서 IP 추출 (Vercel/Edge Runtime 환경)
  const ip = (request as any)?.ip || 
         request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
         request.headers.get('x-real-ip') ||
         request.headers.get('x-client-ip') ||
         request.headers.get('cf-connecting-ip') || // Cloudflare
         request.headers.get('x-forwarded') ||
         'unknown'
  
  return ip
}

/**
 * 미들웨어 메인 함수
 */
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const clientIP = getClientIP(request)
  
  // 의심스러운 활동 감지
  if (detectSuspiciousActivity(request)) {
    console.log(`🚨 의심스러운 활동 감지: ${clientIP} - ${pathname}`)
    return new Response('Access Denied', { status: 403 })
  }
  
  // Rate limiting 적용
  if (pathname.startsWith('/api/')) {
    let endpoint: keyof typeof RATE_LIMIT_CONFIG = 'api'
    
    // 엔드포인트별 Rate limiting
    if (pathname.startsWith('/api/admin/')) {
      endpoint = 'admin'
    } else if (pathname.includes('/comments')) {
      endpoint = 'comments'
    } else if (pathname.startsWith('/api/upload')) {
      endpoint = 'upload'
    }
    
    const rateLimitResult = checkRateLimit(clientIP, endpoint)
    
    if (!rateLimitResult.allowed) {
      console.log(`⚠️ Rate limit exceeded: ${clientIP} - ${endpoint}`)
      
      const response = NextResponse.json(
        { 
          error: '요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
          code: 'RATE_LIMIT_EXCEEDED'
        },
        { status: 429 }
      )
      
      // Rate limiting 헤더 추가
      if (rateLimitResult.resetTime) {
        response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString())
        response.headers.set('Retry-After', '60') // 60초 후 재시도
      }
      
      return response
    }
  }
  
  // 관리자 페이지 접근 제어
  if (pathname.startsWith('/admin')) {
    // 개발 환경에서는 localhost만 허용 (선택사항)
    if (process.env.NODE_ENV === 'development') {
      const isLocalhost = clientIP === 'unknown' || 
                         clientIP === '127.0.0.1' || 
                         clientIP === '::1' ||
                         clientIP.startsWith('192.168.') ||
                         clientIP.startsWith('10.') ||
                         clientIP.startsWith('172.')
      
      if (!isLocalhost) {
        console.log(`🔒 관리자 페이지 접근 차단: ${clientIP}`)
        return NextResponse.redirect(new URL('/', request.url))
      }
    }
  }
  
  // 보안 헤더 추가 (next.config.js와 중복되지 않도록 API에만 적용)
  if (pathname.startsWith('/api/')) {
    const response = NextResponse.next()
    
    // API 전용 보안 헤더
    response.headers.set('X-API-Version', '1.0')
    response.headers.set('X-Request-ID', crypto.randomUUID())
    
    // 민감한 헤더 제거
    response.headers.delete('X-Powered-By')
    response.headers.delete('Server')
    
    return response
  }
  
  return NextResponse.next()
}

// 미들웨어 적용 경로 설정
export const config = {
  matcher: [
    // API 라우트
    '/api/:path*',
    // 관리자 페이지
    '/admin/:path*',
    // 정적 파일 제외
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|images/).*)',
  ]
}
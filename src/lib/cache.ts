/**
 * 캐싱 헬퍼 유틸리티
 */

export interface CacheConfig {
  maxAge: number // 초 단위
  staleWhileRevalidate?: number // 초 단위
  cdnMaxAge?: number // CDN 캐시 시간
}

/**
 * 캐시 설정별 표준 시간
 */
export const CACHE_TIMES = {
  // 매우 짧은 캐시 (1분) - 실시간성이 중요한 데이터
  VERY_SHORT: { maxAge: 60, staleWhileRevalidate: 300, cdnMaxAge: 60 },
  
  // 짧은 캐시 (3분) - 콘텐츠 목록 등
  SHORT: { maxAge: 180, staleWhileRevalidate: 900, cdnMaxAge: 180 },
  
  // 중간 캐시 (5분) - 작가별 콘텐츠 등
  MEDIUM: { maxAge: 300, staleWhileRevalidate: 1800, cdnMaxAge: 300 },
  
  // 긴 캐시 (10분) - 작가 정보 등 안정적인 데이터
  LONG: { maxAge: 600, staleWhileRevalidate: 3600, cdnMaxAge: 600 },
  
  // 매우 긴 캐시 (15분) - 통계 등 덜 자주 변경되는 데이터
  VERY_LONG: { maxAge: 900, staleWhileRevalidate: 3600, cdnMaxAge: 900 },
} as const

/**
 * 캐시 헤더를 Response에 적용
 */
export function applyCacheHeaders(response: Response, config: CacheConfig): void {
  const cacheControl = [
    'public',
    `s-maxage=${config.maxAge}`,
    config.staleWhileRevalidate ? `stale-while-revalidate=${config.staleWhileRevalidate}` : null
  ].filter(Boolean).join(', ')
  
  response.headers.set('Cache-Control', cacheControl)
  
  if (config.cdnMaxAge) {
    response.headers.set('CDN-Cache-Control', `public, s-maxage=${config.cdnMaxAge}`)
  }
}

/**
 * NextResponse에 캐시 헤더 적용
 */
export function withCache<T>(data: T, config: CacheConfig): Response {
  const response = new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' }
  })
  
  applyCacheHeaders(response, config)
  return response
}

/**
 * 캐시 키 생성 헬퍼
 */
export function generateCacheKey(prefix: string, params: Record<string, any>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}:${params[key]}`)
    .join('|')
  
  return `${prefix}:${sortedParams}`
}

/**
 * 메모리 캐시 (간단한 구현)
 */
class SimpleMemoryCache {
  private cache = new Map<string, { data: any; expires: number }>()
  
  set(key: string, data: any, ttlSeconds: number): void {
    const expires = Date.now() + (ttlSeconds * 1000)
    this.cache.set(key, { data, expires })
  }
  
  get(key: string): any | null {
    const item = this.cache.get(key)
    if (!item) return null
    
    if (Date.now() > item.expires) {
      this.cache.delete(key)
      return null
    }
    
    return item.data
  }
  
  delete(key: string): void {
    this.cache.delete(key)
  }
  
  clear(): void {
    this.cache.clear()
  }
  
  // 만료된 항목 정리
  cleanup(): void {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        this.cache.delete(key)
      }
    }
  }
}

export const memoryCache = new SimpleMemoryCache()

// 정기적으로 캐시 정리 (5분마다)
if (typeof window === 'undefined') { // 서버에서만 실행
  setInterval(() => {
    memoryCache.cleanup()
  }, 5 * 60 * 1000)
}
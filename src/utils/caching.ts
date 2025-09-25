/**
 * 캐싱 관련 유틸리티
 */

/**
 * 메모리 캐시 구현
 */
class MemoryCache {
  private cache = new Map<string, { data: unknown; timestamp: number; ttl: number }>()
  
  set(key: string, data: unknown, ttl: number = 5 * 60 * 1000) { // 기본 5분
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }
  
  get(key: string) {
    const item = this.cache.get(key)
    if (!item) return null
    
    const now = Date.now()
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return item.data
  }
  
  has(key: string) {
    return this.get(key) !== null
  }
  
  delete(key: string) {
    this.cache.delete(key)
  }
  
  clear() {
    this.cache.clear()
  }
  
  size() {
    return this.cache.size
  }
}

// 전역 메모리 캐시 인스턴스
export const memoryCache = new MemoryCache()

/**
 * 브라우저 로컬스토리지 캐시
 */
export class LocalStorageCache {
  constructor(private prefix: string = 'webzine_cache_') {}
  
  private getKey(key: string) {
    return `${this.prefix}${key}`
  }
  
  set(key: string, data: unknown, ttl: number = 30 * 60 * 1000) { // 기본 30분
    if (typeof window === 'undefined') return
    
    try {
      const item = {
        data,
        timestamp: Date.now(),
        ttl
      }
      localStorage.setItem(this.getKey(key), JSON.stringify(item))
    } catch (error) {
      console.warn('LocalStorage cache set failed:', error)
    }
  }
  
  get(key: string) {
    if (typeof window === 'undefined') return null
    
    try {
      const itemStr = localStorage.getItem(this.getKey(key))
      if (!itemStr) return null
      
      const item = JSON.parse(itemStr)
      const now = Date.now()
      
      if (now - item.timestamp > item.ttl) {
        localStorage.removeItem(this.getKey(key))
        return null
      }
      
      return item.data
    } catch (error) {
      console.warn('LocalStorage cache get failed:', error)
      return null
    }
  }
  
  has(key: string) {
    return this.get(key) !== null
  }
  
  delete(key: string) {
    if (typeof window === 'undefined') return
    localStorage.removeItem(this.getKey(key))
  }
  
  clear() {
    if (typeof window === 'undefined') return
    
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key)
      }
    })
  }
}

export const localStorageCache = new LocalStorageCache()

/**
 * 캐시된 fetch 함수
 */
export async function cachedFetch(
  url: string, 
  options: RequestInit = {}, 
  cacheOptions: {
    ttl?: number
    useMemory?: boolean
    useLocalStorage?: boolean
    key?: string
  } = {}
) {
  const {
    ttl = 5 * 60 * 1000, // 5분
    useMemory = true,
    useLocalStorage = false,
    key = url
  } = cacheOptions
  
  // 메모리 캐시에서 먼저 확인
  if (useMemory && memoryCache.has(key)) {
    console.log('📦 Memory cache hit:', key)
    return memoryCache.get(key)
  }
  
  // 로컬스토리지 캐시 확인
  if (useLocalStorage && localStorageCache.has(key)) {
    console.log('💾 LocalStorage cache hit:', key)
    const data = localStorageCache.get(key)
    
    // 메모리 캐시에도 저장
    if (useMemory) {
      memoryCache.set(key, data, ttl)
    }
    
    return data
  }
  
  // 캐시 미스 - 실제 fetch 실행
  console.log('🌐 Cache miss, fetching:', key)
  const response = await fetch(url, options)
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  
  const data = await response.json()
  
  // 캐시에 저장
  if (useMemory) {
    memoryCache.set(key, data, ttl)
  }
  
  if (useLocalStorage) {
    localStorageCache.set(key, data, ttl)
  }
  
  return data
}

/**
 * Supabase 쿼리 결과 캐싱
 */
export function createCacheKey(tableName: string, filters: Record<string, unknown> = {}) {
  const sortedFilters = Object.keys(filters)
    .sort()
    .reduce((obj, key) => {
      obj[key] = filters[key]
      return obj
    }, {} as Record<string, unknown>)
    
  return `${tableName}_${JSON.stringify(sortedFilters)}`
}

/**
 * 캐시 무효화 (특정 패턴)
 */
export function invalidateCache(pattern: string) {
  // 메모리 캐시 무효화
  const memoryKeys = Array.from((memoryCache as MemoryCache & { cache: Map<string, unknown> }).cache.keys())
  memoryKeys.forEach(key => {
    if (key.includes(pattern)) {
      memoryCache.delete(key)
    }
  })
  
  // 로컬스토리지 캐시 무효화
  if (typeof window !== 'undefined') {
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.includes(pattern)) {
        localStorage.removeItem(key)
      }
    })
  }
  
  console.log('🗑️ Cache invalidated for pattern:', pattern)
}

/**
 * 캐시 통계
 */
export function getCacheStats() {
  const memorySize = memoryCache.size()
  let localStorageSize = 0
  
  if (typeof window !== 'undefined') {
    const keys = Object.keys(localStorage)
    localStorageSize = keys.filter(key => key.startsWith('webzine_cache_')).length
  }
  
  return {
    memory: {
      size: memorySize,
      hitRate: 0 // 추후 구현
    },
    localStorage: {
      size: localStorageSize
    }
  }
}

/**
 * 캐시 예열 (사전 로딩)
 */
export async function warmupCache() {
  console.log('🔥 Cache warmup started')
  
  const criticalEndpoints = [
    '/api/contents?limit=12',
    '/api/contents?category=essay&limit=6',
    '/api/contents?category=poetry&limit=6',
    // 추가 중요 엔드포인트들
  ]
  
  const warmupPromises = criticalEndpoints.map(endpoint => 
    cachedFetch(endpoint, {}, {
      ttl: 10 * 60 * 1000, // 10분
      useMemory: true,
      useLocalStorage: true
    }).catch(error => {
      console.warn(`Warmup failed for ${endpoint}:`, error)
    })
  )
  
  await Promise.allSettled(warmupPromises)
  console.log('🔥 Cache warmup completed')
}

/**
 * 캐시 청소 (만료된 항목 제거)
 */
export function cleanupCache() {
  // 메모리 캐시는 자동으로 만료된 항목을 제거함
  
  // 로컬스토리지 캐시 청소
  if (typeof window === 'undefined') return
  
  const keys = Object.keys(localStorage)
  let cleaned = 0
  
  keys.forEach(key => {
    if (key.startsWith('webzine_cache_')) {
      try {
        const itemStr = localStorage.getItem(key)
        if (!itemStr) return
        
        const item = JSON.parse(itemStr)
        const now = Date.now()
        
        if (now - item.timestamp > item.ttl) {
          localStorage.removeItem(key)
          cleaned++
        }
      } catch {
        // 파싱 에러가 발생한 항목은 제거
        localStorage.removeItem(key)
        cleaned++
      }
    }
  })
  
  if (cleaned > 0) {
    console.log(`🧹 Cleaned up ${cleaned} expired cache items`)
  }
}

/**
 * 자동 캐시 청소 설정
 */
export function setupAutoCacheCleanup() {
  if (typeof window === 'undefined') return
  
  // 5분마다 캐시 청소
  const cleanupInterval = setInterval(cleanupCache, 5 * 60 * 1000)
  
  // 페이지 언로드 시 인터벌 정리
  window.addEventListener('beforeunload', () => {
    clearInterval(cleanupInterval)
  })
  
  return cleanupInterval
}
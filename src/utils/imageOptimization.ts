/**
 * 이미지 최적화 관련 유틸리티 함수들
 */

/**
 * 이미지 URL이 유효한지 확인
 */
export function isValidImageUrl(url: string | null): boolean {
  if (!url) return false
  
  // 더미 URL 체크
  if (url.includes('example.com') || url.includes('placeholder') || url.includes('dummy')) {
    return false
  }
  
  // 기본적인 이미지 확장자 체크
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
  const hasImageExtension = imageExtensions.some(ext => 
    url.toLowerCase().includes(ext)
  )
  
  // URL 형태 체크
  const isValidUrl = /^https?:\/\/.+/.test(url)
  
  return isValidUrl && (hasImageExtension || url.includes('image') || url.includes('photo'))
}

/**
 * 이미지가 내부(최적화 가능) 또는 외부(최적화 불가능) 이미지인지 확인
 */
export function isInternalImage(url: string | null): boolean {
  if (!url) return false
  
  // Next.js에서 최적화 가능한 도메인들 (next.config.js의 remotePatterns에 정의된 도메인들)
  const optimizableHosts = [
    'oeeznxdrubsutvezyhxi.supabase.co', // Supabase storage
    'localhost',
    '127.0.0.1'
  ]
  
  try {
    const urlObj = new URL(url)
    return optimizableHosts.some(host => urlObj.hostname === host || urlObj.hostname.includes(host))
  } catch {
    return false
  }
}

/**
 * Next.js Image 컴포넌트를 위한 이미지 props 생성
 * 외부 이미지의 경우 unoptimized 속성을 추가
 */
export function getImageProps(
  src: string | null,
  alt: string,
  width: number = 800,
  height: number = 600
) {
  if (!isValidImageUrl(src)) {
    return null
  }
  
  const isInternal = isInternalImage(src)
  
  const baseProps = {
    src: src!,
    alt,
    width,
    height,
    sizes: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
  }
  
  if (isInternal) {
    // 내부 이미지: Next.js 최적화 사용
    return {
      ...baseProps,
      quality: 85,
      placeholder: 'blur' as const,
      blurDataURL: generateBlurDataUrl(width, height)
    }
  } else {
    // 외부 이미지: 최적화 비활성화
    return {
      ...baseProps,
      unoptimized: true,
      priority: false
    }
  }
}

/**
 * 블러 플레이스홀더 데이터 URL 생성
 */
export function generateBlurDataUrl(width: number = 10, height: number = 10): string {
  // SVG 기반 블러 플레이스홀더 생성
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#e5e7eb;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#f3f4f6;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)" />
    </svg>
  `
  
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
}

/**
 * 이미지 로딩 상태 관리를 위한 커스텀 훅 타입
 */
export interface ImageLoadState {
  loaded: boolean
  error: boolean
  loading: boolean
}

/**
 * 이미지 최적화를 위한 size 계산
 */
export function calculateOptimalImageSize(
  containerWidth: number,
  containerHeight: number,
  devicePixelRatio: number = window.devicePixelRatio || 1
): { width: number; height: number } {
  const width = Math.ceil(containerWidth * devicePixelRatio)
  const height = Math.ceil(containerHeight * devicePixelRatio)
  
  // 최대 크기 제한 (대역폭 절약)
  const maxWidth = 1920
  const maxHeight = 1080
  
  return {
    width: Math.min(width, maxWidth),
    height: Math.min(height, maxHeight)
  }
}

/**
 * 반응형 이미지를 위한 sizes 속성 생성
 */
export function generateResponsiveSizes(breakpoints: {
  mobile?: string
  tablet?: string
  desktop?: string
} = {}): string {
  const {
    mobile = '100vw',
    tablet = '50vw',
    desktop = '33vw'
  } = breakpoints
  
  return [
    `(max-width: 768px) ${mobile}`,
    `(max-width: 1024px) ${tablet}`,
    desktop
  ].join(', ')
}

/**
 * 이미지 포맷 감지 및 WebP 지원 확인
 */
export async function checkWebPSupport(): Promise<boolean> {
  if (typeof window === 'undefined') return false
  
  return new Promise((resolve) => {
    const webP = new Image()
    webP.onload = webP.onerror = function () {
      resolve(webP.height === 2)
    }
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA'
  })
}

/**
 * 이미지 프리로딩
 */
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = reject
    img.src = src
  })
}

/**
 * 여러 이미지 프리로딩
 */
export async function preloadImages(srcs: string[]): Promise<void[]> {
  const validSrcs = srcs.filter(isValidImageUrl)
  return Promise.all(validSrcs.map(preloadImage))
}

/**
 * 이미지 lazy loading을 위한 Intersection Observer 설정
 */
export function createImageObserver(
  callback: (entry: IntersectionObserverEntry) => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver {
  const defaultOptions: IntersectionObserverInit = {
    root: null,
    rootMargin: '50px 0px',
    threshold: 0.1,
    ...options
  }
  
  return new IntersectionObserver((entries) => {
    entries.forEach(callback)
  }, defaultOptions)
}

/**
 * 비디오 플랫폼에서 썸네일 URL 추출
 */
export function getVideoThumbnailUrl(videoUrl: string | null, platform: string): string | null {
  if (!videoUrl) return null
  
  try {
    if (platform === 'youtube') {
      // YouTube URL에서 비디오 ID 추출
      const videoId = extractYouTubeVideoId(videoUrl)
      if (videoId) {
        // 고화질 썸네일 우선 시도 (maxresdefault -> hqdefault -> mqdefault -> default)
        return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
      }
    } else if (platform === 'vimeo') {
      // Vimeo는 API를 통해서만 썸네일을 가져올 수 있으므로
      // 여기서는 기본 처리만 하고, 실제로는 서버에서 API 호출 필요
      const videoId = extractVimeoVideoId(videoUrl)
      if (videoId) {
        // Vimeo 썸네일은 API 호출이 필요하므로 null 반환
        // 추후 서버사이드에서 처리하거나 프록시 API를 통해 처리
        return null
      }
    }
  } catch (error) {
    console.warn('Failed to extract video thumbnail:', error)
  }
  
  return null
}

/**
 * YouTube URL에서 비디오 ID 추출
 */
function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/,
    /youtube\.com\/embed\/([^"&?\/ ]{11})/,
    /youtube\.com\/v\/([^"&?\/ ]{11})/,
    /youtube\.com\/watch\?v=([^"&?\/ ]{11})/,
    /youtu\.be\/([^"&?\/ ]{11})/
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }
  
  return null
}

/**
 * Vimeo URL에서 비디오 ID 추출
 */
function extractVimeoVideoId(url: string): string | null {
  const patterns = [
    /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)/,
    /player\.vimeo\.com\/video\/(\d+)/
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) {
      // 마지막 그룹이 비디오 ID
      return match[match.length - 1]
    }
  }
  
  return null
}

/**
 * 비디오 썸네일 이미지의 품질을 확인하고 fallback 제공
 */
export async function getOptimalVideoThumbnail(videoUrl: string | null, platform: string): Promise<string | null> {
  if (!videoUrl || platform !== 'youtube') return null
  
  const videoId = extractYouTubeVideoId(videoUrl)
  if (!videoId) return null
  
  // YouTube 썸네일 품질 순서: maxresdefault > hqdefault > mqdefault > default
  const thumbnailQualities = [
    'maxresdefault', // 1920x1080 (최고 품질, 모든 영상에 없을 수 있음)
    'hqdefault',     // 480x360 (고품질)
    'mqdefault',     // 320x180 (중간 품질)
    'default'        // 120x90 (기본 품질)
  ]
  
  // 서버사이드에서는 실제로 이미지 존재 여부를 확인할 수 있지만
  // 클라이언트에서는 첫 번째 옵션을 반환
  return `https://img.youtube.com/vi/${videoId}/${thumbnailQualities[0]}.jpg`
}

/**
 * 이미지 에러 처리를 위한 fallback URL 생성
 */
export function getFallbackImageUrl(
  category: 'essay' | 'poetry' | 'photo' | 'calligraphy' | 'video',
  width: number = 400,
  height: number = 300
): string {
  const categoryColors = {
    essay: '#3B82F6',
    poetry: '#8B5CF6',
    photo: '#10B981',
    calligraphy: '#F59E0B',
    video: '#EF4444'
  }
  
  const categoryIcons = {
    essay: '📝',
    poetry: '📜',
    photo: '📸',
    calligraphy: '🖼️',
    video: '🎬'
  }
  
  const color = categoryColors[category]
  const icon = categoryIcons[category]
  
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${color}20;stop-opacity:1" />
          <stop offset="100%" style="stop-color:${color}10;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)" />
      <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" 
            font-size="${Math.min(width, height) / 4}" fill="${color}">
        ${icon}
      </text>
    </svg>
  `
  
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
}
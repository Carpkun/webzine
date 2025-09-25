/**
 * 폰트 최적화 관련 유틸리티
 */

/**
 * 한국어 텍스트에 최적화된 폰트 스택
 */
export const koreanFontStack = {
  sans: [
    'var(--font-geist-sans)',
    'Malgun Gothic',
    '맑은 고딕',
    'Apple SD Gothic Neo',
    'Apple SD 산돌고딕 Neo',
    'Noto Sans KR',
    'Roboto',
    'Helvetica Neue',
    'Helvetica',
    'Arial',
    'sans-serif'
  ].join(', '),
  
  serif: [
    'Noto Serif KR',
    'Georgia',
    'Times New Roman',
    'serif'
  ].join(', '),
  
  mono: [
    'var(--font-geist-mono)',
    'SFMono-Regular',
    'Menlo',
    'Monaco',
    'Consolas',
    'Liberation Mono',
    'Courier New',
    'monospace'
  ].join(', ')
}

/**
 * 폰트 프리로딩을 위한 링크 태그 생성
 */
export function generateFontPreloadLinks() {
  return [
    // Geist Sans - 주요 weights만 프리로드
    {
      rel: 'preload',
      href: '/fonts/geist-sans-400.woff2',
      as: 'font',
      type: 'font/woff2',
      crossOrigin: 'anonymous'
    },
    {
      rel: 'preload', 
      href: '/fonts/geist-sans-600.woff2',
      as: 'font',
      type: 'font/woff2',
      crossOrigin: 'anonymous'
    },
    // 한국어 웹폰트 (CDN에서)
    {
      rel: 'preconnect',
      href: 'https://fonts.googleapis.com'
    },
    {
      rel: 'preconnect',
      href: 'https://fonts.gstatic.com',
      crossOrigin: 'anonymous'
    }
  ]
}

/**
 * 폰트 로딩 최적화를 위한 CSS
 */
export const fontOptimizationCSS = `
  /* 폰트 로딩 최적화 */
  @font-face {
    font-family: 'System Font';
    font-style: normal;
    font-weight: 300 900;
    font-display: swap;
    src: local('system-ui'), local('-apple-system'), local('BlinkMacSystemFont');
    unicode-range: U+0020-007F;
  }

  /* 한국어 폰트 fallback */
  @font-face {
    font-family: 'Korean Fallback';
    font-style: normal;
    font-weight: 400;
    font-display: swap;
    src: local('Malgun Gothic'), local('맑은 고딕'), local('Apple SD Gothic Neo');
    unicode-range: U+1100-11FF, U+3130-318F, U+AC00-D7AF;
  }

  /* 텍스트 렌더링 최적화 */
  body {
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    font-feature-settings: 'kern' 1;
  }

  /* 폰트 크기 조정 방지 */
  html {
    -webkit-text-size-adjust: 100%;
    -moz-text-size-adjust: 100%;
    -ms-text-size-adjust: 100%;
    text-size-adjust: 100%;
  }

  /* 로딩 중 레이아웃 시프트 방지 */
  .font-loading {
    visibility: hidden;
  }

  .font-loaded {
    visibility: visible;
  }
`

/**
 * 폰트 로딩 상태 감지
 */
export class FontLoadingObserver {
  private loadedFonts = new Set<string>()
  private callbacks = new Set<() => void>()

  constructor() {
    if (typeof document !== 'undefined') {
      this.initFontLoadingDetection()
    }
  }

  private async initFontLoadingDetection() {
    if (!document.fonts) return

    // 주요 폰트들 체크
    const fontsToCheck = [
      'Geist Sans',
      'Geist Mono'
    ]

    for (const fontFamily of fontsToCheck) {
      try {
        await document.fonts.load(`400 16px "${fontFamily}"`)
        this.loadedFonts.add(fontFamily)
      } catch (error) {
        console.warn(`Failed to load font: ${fontFamily}`, error)
      }
    }

    // 모든 폰트가 로드되면 콜백 실행
    if (this.loadedFonts.size === fontsToCheck.length) {
      this.callbacks.forEach(callback => callback())
      document.documentElement.classList.add('fonts-loaded')
    }

    // 폰트 로딩 이벤트 리스너
    document.fonts.addEventListener('loadingdone', () => {
      document.documentElement.classList.add('fonts-loaded')
      this.callbacks.forEach(callback => callback())
    })
  }

  onFontsLoaded(callback: () => void) {
    this.callbacks.add(callback)
    
    // 이미 로드된 경우 즉시 실행
    if (document.documentElement.classList.contains('fonts-loaded')) {
      callback()
    }
  }

  static getInstance(): FontLoadingObserver {
    if (typeof window !== 'undefined') {
      // @ts-expect-error - Global window extension for font loading observer
      if (!window.__fontLoadingObserver) {
        // @ts-expect-error - Global window extension for font loading observer
        window.__fontLoadingObserver = new FontLoadingObserver()
      }
      // @ts-expect-error - Global window extension for font loading observer
      return window.__fontLoadingObserver
    }
    return new FontLoadingObserver()
  }
}

/**
 * 폰트 로딩 성능 측정
 */
export function measureFontLoadingPerformance() {
  if (typeof performance === 'undefined' || !performance.mark) return

  performance.mark('font-loading-start')

  const observer = FontLoadingObserver.getInstance()
  observer.onFontsLoaded(() => {
    performance.mark('font-loading-end')
    
    try {
      performance.measure('font-loading-duration', 'font-loading-start', 'font-loading-end')
      const measure = performance.getEntriesByName('font-loading-duration')[0]
      
      if (measure) {
        console.log(`Font loading took: ${measure.duration.toFixed(2)}ms`)
      }
    } catch (error) {
      console.warn('Font loading measurement failed:', error)
    }
  })
}

/**
 * 폰트 최적화를 위한 preconnect 태그들
 */
export const fontPreconnectTags = [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' }
]
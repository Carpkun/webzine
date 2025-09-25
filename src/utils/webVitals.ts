'use client'

import { onCLS, onINP, onFCP, onLCP, onTTFB, Metric } from 'web-vitals'

/**
 * Core Web Vitals 성능 지표 타입
 */
export interface WebVitalsMetrics {
  CLS: number | null // Cumulative Layout Shift
  INP: number | null // Interaction to Next Paint (replaces FID)  
  FCP: number | null // First Contentful Paint
  LCP: number | null // Largest Contentful Paint
  TTFB: number | null // Time to First Byte
}

/**
 * 성능 지표 등급
 */
export type PerformanceGrade = 'good' | 'needs-improvement' | 'poor'

/**
 * Web Vitals 임계값 설정
 */
export const WEB_VITALS_THRESHOLDS = {
  CLS: { good: 0.1, poor: 0.25 },
  INP: { good: 200, poor: 500 },
  FCP: { good: 1800, poor: 3000 },
  LCP: { good: 2500, poor: 4000 },
  TTFB: { good: 800, poor: 1800 }
} as const

/**
 * Web Vitals 측정 클래스
 */
export class WebVitalsMonitor {
  private metrics: WebVitalsMetrics = {
    CLS: null,
    INP: null,
    FCP: null,
    LCP: null,
    TTFB: null
  }

  private callbacks: Array<(metrics: WebVitalsMetrics) => void> = []
  private initialized = false

  constructor() {
    this.initializeMetrics()
  }

  private initializeMetrics() {
    if (this.initialized || typeof window === 'undefined') return
    this.initialized = true

    // Core Web Vitals 측정 시작
    onCLS(this.handleMetric.bind(this))
    onINP(this.handleMetric.bind(this))
    onFCP(this.handleMetric.bind(this))
    onLCP(this.handleMetric.bind(this))
    onTTFB(this.handleMetric.bind(this))
  }

  private handleMetric(metric: Metric) {
    const metricName = metric.name as keyof WebVitalsMetrics
    this.metrics[metricName] = metric.value

    // 디버그 로그
    console.log(`📊 ${metric.name}:`, {
      value: metric.value,
      rating: this.getMetricRating(metric.name, metric.value),
      id: metric.id,
      delta: metric.delta
    })

    // 콜백 실행
    this.callbacks.forEach(callback => callback({ ...this.metrics }))

    // 분석 도구로 전송
    this.sendToAnalytics(metric)
  }

  /**
   * 메트릭 등급 계산
   */
  public getMetricRating(metricName: string, value: number): PerformanceGrade {
    const threshold = WEB_VITALS_THRESHOLDS[metricName as keyof typeof WEB_VITALS_THRESHOLDS]
    if (!threshold) return 'good'

    if (value <= threshold.good) return 'good'
    if (value <= threshold.poor) return 'needs-improvement'
    return 'poor'
  }

  /**
   * 분석 도구로 메트릭 전송
   */
  private sendToAnalytics(metric: Metric) {
    // Google Analytics 4로 전송
    if (typeof gtag !== 'undefined') {
      gtag('event', metric.name, {
        event_category: 'Web Vitals',
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        metric_id: metric.id,
        metric_value: metric.value,
        metric_delta: metric.delta,
        custom_parameter_1: this.getMetricRating(metric.name, metric.value)
      })
    }

    // 커스텀 분석 서버로 전송 (선택적)
    if (process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT) {
      fetch(process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: metric.name,
          value: metric.value,
          rating: this.getMetricRating(metric.name, metric.value),
          id: metric.id,
          delta: metric.delta,
          url: window.location.href,
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
      connectionType: (navigator as Navigator & { connection?: { effectiveType?: string } }).connection?.effectiveType || 'unknown'
        })
      }).catch(error => {
        console.warn('Failed to send analytics:', error)
      })
    }
  }

  /**
   * 메트릭 업데이트 콜백 등록
   */
  public onMetricsUpdate(callback: (metrics: WebVitalsMetrics) => void) {
    this.callbacks.push(callback)
    
    // 이미 수집된 메트릭이 있다면 즉시 콜백 실행
    if (Object.values(this.metrics).some(value => value !== null)) {
      callback({ ...this.metrics })
    }
  }

  /**
   * 현재 메트릭 반환
   */
  public getMetrics(): WebVitalsMetrics {
    return { ...this.metrics }
  }

  /**
   * 성능 요약 보고서 생성
   */
  public generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      metrics: {} as Record<string, { value: number | null; rating: PerformanceGrade }>
    }

    Object.entries(this.metrics).forEach(([key, value]) => {
      report.metrics[key] = {
        value,
        rating: value !== null ? this.getMetricRating(key, value) : 'good'
      }
    })

    return report
  }

  /**
   * 싱글톤 인스턴스
   */
  static getInstance(): WebVitalsMonitor {
    if (typeof window !== 'undefined') {
      // @ts-expect-error - Global window extension for web vitals monitor
      if (!window.__webVitalsMonitor) {
        // @ts-expect-error - Global window extension for web vitals monitor
        window.__webVitalsMonitor = new WebVitalsMonitor()
      }
      // @ts-expect-error - Global window extension for web vitals monitor
      return window.__webVitalsMonitor
    }
    return new WebVitalsMonitor()
  }
}

/**
 * 성능 개선 제안 생성
 */
export function generatePerformanceRecommendations(metrics: WebVitalsMetrics) {
  const recommendations: string[] = []

  if (metrics.LCP !== null && metrics.LCP > 2500) {
    recommendations.push('이미지 최적화 및 지연 로딩 구현')
    recommendations.push('서버 응답 시간 개선')
    recommendations.push('리소스 프리로딩 활용')
  }

  if (metrics.INP !== null && metrics.INP > 200) {
    recommendations.push('JavaScript 코드 분할 구현')
    recommendations.push('메인 스레드 블로킹 최소화')
    recommendations.push('Third-party 스크립트 최적화')
  }

  if (metrics.CLS !== null && metrics.CLS > 0.1) {
    recommendations.push('이미지 크기 속성 명시')
    recommendations.push('폰트 로딩 최적화')
    recommendations.push('동적 콘텐츠 삽입 최소화')
  }

  if (metrics.FCP !== null && metrics.FCP > 1800) {
    recommendations.push('Critical CSS 인라인화')
    recommendations.push('불필요한 리소스 제거')
    recommendations.push('CDN 활용')
  }

  if (metrics.TTFB !== null && metrics.TTFB > 800) {
    recommendations.push('서버 성능 최적화')
    recommendations.push('캐싱 전략 개선')
    recommendations.push('데이터베이스 쿼리 최적화')
  }

  return recommendations
}

/**
 * Web Vitals 대시보드 데이터
 */
export function createVitalsDashboardData(metrics: WebVitalsMetrics) {
  return Object.entries(metrics).map(([name, value]) => ({
    name,
    value: value || 0,
    rating: value !== null ? WebVitalsMonitor.prototype.getMetricRating(name, value) : 'good',
    threshold: WEB_VITALS_THRESHOLDS[name as keyof typeof WEB_VITALS_THRESHOLDS],
    description: getMetricDescription(name)
  }))
}

/**
 * 메트릭 설명
 */
function getMetricDescription(metricName: string): string {
  const descriptions = {
    CLS: '페이지 로딩 중 예상치 못한 레이아웃 변화를 측정합니다.',
    FID: '사용자가 페이지와 처음 상호작용할 때까지의 지연 시간을 측정합니다.',
    FCP: '페이지가 로드되기 시작한 후 콘텐츠가 처음 나타나는 시간을 측정합니다.',
    LCP: '페이지의 주요 콘텐츠가 로드되는 시간을 측정합니다.',
    TTFB: '브라우저가 서버로부터 첫 번째 바이트를 받는 시간을 측정합니다.'
  }
  return descriptions[metricName as keyof typeof descriptions] || ''
}

/**
 * 페이지 로드 시 Web Vitals 초기화
 */
export function initWebVitals() {
  if (typeof window === 'undefined') return

  const monitor = WebVitalsMonitor.getInstance()
  
  // 개발 환경에서만 콘솔 로그 출력
  if (process.env.NODE_ENV === 'development') {
    monitor.onMetricsUpdate((metrics) => {
      console.table(metrics)
    })
  }

  return monitor
}
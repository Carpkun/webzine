'use client'

import { useEffect } from 'react'
import { initWebVitals } from '../utils/webVitals'

/**
 * Web Vitals 초기화를 위한 Provider 컴포넌트
 */
export default function WebVitalsProvider() {
  useEffect(() => {
    // 클라이언트에서만 Web Vitals 초기화
    initWebVitals()
  }, [])

  // 이 컴포넌트는 UI를 렌더링하지 않음
  return null
}
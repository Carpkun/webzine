'use client'

import { useEffect } from 'react'

interface ResourceHintsProps {
  // 프리로드할 API 엔드포인트들
  apiEndpoints?: string[]
  // 프리로드할 이미지들
  images?: string[]
  // 페이지별 특별한 리소스들
  customResources?: Array<{
    href: string
    rel: 'prefetch' | 'preload' | 'dns-prefetch' | 'preconnect'
    as?: string
    type?: string
  }>
}

export default function ResourceHints({ 
  apiEndpoints = [], 
  images = [], 
  customResources = [] 
}: ResourceHintsProps) {
  useEffect(() => {
    // API 엔드포인트 프리페치
    apiEndpoints.forEach(endpoint => {
      const link = document.createElement('link')
      link.rel = 'prefetch'
      link.href = endpoint
      document.head.appendChild(link)
    })

    // 이미지 프리로드
    images.forEach(imageSrc => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.href = imageSrc
      link.as = 'image'
      document.head.appendChild(link)
    })

    // 사용자 정의 리소스
    customResources.forEach(resource => {
      const link = document.createElement('link')
      link.rel = resource.rel
      link.href = resource.href
      if (resource.as) link.setAttribute('as', resource.as)
      if (resource.type) link.type = resource.type
      document.head.appendChild(link)
    })

    // 컴포넌트 언마운트 시 정리
    return () => {
      // 동적으로 추가한 링크들 제거
      const dynamicLinks = document.querySelectorAll('link[data-dynamic-resource]')
      dynamicLinks.forEach(link => link.remove())
    }
  }, [apiEndpoints, images, customResources])

  return null // 렌더링할 컴포넌트 없음
}
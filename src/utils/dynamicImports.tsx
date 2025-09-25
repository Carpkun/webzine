'use client'

import dynamic from 'next/dynamic'
import { ComponentType } from 'react'

/**
 * 지연 로딩을 위한 동적 임포트 설정
 */
interface DynamicImportOptions {
  loading?: ComponentType<unknown>
  ssr?: boolean
}

// 주요 컴포넌트들의 동적 임포트
export const DynamicContentGrid = dynamic(
  () => import('../components/ContentGrid'),
  {
    loading: () => (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    )
  }
)

export const DynamicRelatedContents = dynamic(
  () => import('../components/RelatedContents'),
  {
    loading: () => (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-32 bg-gray-200 rounded-lg mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4 mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    )
  }
)

export const DynamicSearchSuggestions = dynamic(
  () => import('../components/SearchSuggestions'),
  {
    loading: () => <div className="animate-pulse h-20 bg-gray-100 rounded"></div>
  }
)

export const DynamicPoetryToggle = dynamic(
  () => import('../components/PoetryToggle'),
  {
    loading: () => (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-32"></div>
        <div className="h-40 bg-gray-200 rounded"></div>
      </div>
    )
  }
)

export const DynamicAdminLoginForm = dynamic(
  () => import('../components/AdminLoginForm'),
  {
    loading: () => (
      <div className="animate-pulse space-y-4 p-6">
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
        <div className="h-10 bg-gray-200 rounded w-20"></div>
      </div>
    )
  }
)

/**
 * 지연 로딩 임포트 헬퍼
 */
export function createLazyImport<T extends ComponentType<unknown>>(
  importFunc: () => Promise<{ default: T }>,
  options: DynamicImportOptions = {}
) {
  return dynamic(importFunc, {
    loading: options.loading
  })
}

/**
 * 조건부 지연 로딩
 */
export function conditionalLazyImport<T extends ComponentType<unknown>>(
  condition: boolean,
  importFunc: () => Promise<{ default: T }>,
  fallback: ComponentType<unknown>
) {
  if (condition) {
    return dynamic(importFunc)
  }
  return fallback
}

/**
 * 인터섹션 옵저버 기반 지연 로딩
 */
export function createIntersectionLazyImport<T extends ComponentType<unknown>>(
  importFunc: () => Promise<{ default: T }>
) {
  return dynamic(importFunc, {
    loading: () => <div className="animate-pulse h-20 bg-gray-100 rounded"></div>
  })
}

/**
 * 미디어 쿼리 기반 지연 로딩
 */
export function createResponsiveLazyImport<T extends ComponentType<unknown>>(
  mobileImport: () => Promise<{ default: T }>,
  desktopImport: () => Promise<{ default: T }>
) {
  if (typeof window !== 'undefined' && window.innerWidth < 768) {
    return dynamic(mobileImport)
  }
  return dynamic(desktopImport)
}
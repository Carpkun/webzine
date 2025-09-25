'use client'

import { Suspense, ReactNode } from 'react'
import SkeletonCard from './SkeletonCard'

interface LazyWrapperProps {
  children: ReactNode
  fallback?: ReactNode
  className?: string
}

/**
 * 지연 로딩 컴포넌트를 위한 래퍼
 */
export default function LazyWrapper({ 
  children, 
  fallback, 
  className = '' 
}: LazyWrapperProps) {
  const defaultFallback = (
    <div className={`animate-pulse ${className}`}>
      <SkeletonCard />
    </div>
  )

  return (
    <Suspense fallback={fallback || defaultFallback}>
      {children}
    </Suspense>
  )
}
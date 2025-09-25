'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navigation from './Navigation'
import { AuthStatus } from './auth/AuthStatus'

export default function Header() {
  const [isDarkMode, setIsDarkMode] = useState(true) // 기본값을 true로 설정
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // 다크모드 상태 초기화 및 적용
  useEffect(() => {
    // 클라이언트 사이드에서만 실행
    if (typeof window === 'undefined') return
    
    const savedTheme = localStorage.getItem('theme')
    
    // 저장된 테마가 있으면 사용, 없으면 다크모드를 기본값으로 설정
    const shouldBeDark = savedTheme ? savedTheme === 'dark' : true
    
    // 다크모드 초기화 로깅 제거 (성능 최적화)
    
    setIsDarkMode(shouldBeDark)
    
    if (shouldBeDark) {
      document.documentElement.classList.add('dark')
      if (!savedTheme) {
        localStorage.setItem('theme', 'dark') // 초기 설정 저장
        // 다크모드 기본값 저장 로깅 제거
      }
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  // 다크모드 토글 (더 강력한 방식)
  const toggleDarkMode = () => {
    // 개발 모드 로깅 제거 (성능 최적화)
    const newDarkMode = !isDarkMode
    
    // 상태 업데이트
    setIsDarkMode(newDarkMode)
    
    // DOM 클래스 강제 업데이트
    const htmlElement = document.documentElement
    
    if (newDarkMode) {
      htmlElement.classList.remove('light') // 기존 light 클래스 제거
      htmlElement.classList.add('dark')
      htmlElement.setAttribute('data-theme', 'dark')
      localStorage.setItem('theme', 'dark')
    } else {
      htmlElement.classList.remove('dark') // 기존 dark 클래스 제거
      htmlElement.classList.add('light')
      htmlElement.setAttribute('data-theme', 'light')
      localStorage.setItem('theme', 'light')
    }
  }

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* 로고 */}
          <div className="flex-shrink-0">
            <Link href="/" aria-label="홈으로 이동" className="block group">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                춘천답기
              </h1>
              <p className="text-xs text-gray-600 dark:text-gray-400 hidden sm:block">
                춘천문화원 회원 창작물 아카이브
              </p>
            </Link>
          </div>

          {/* 데스크톱 네비게이션 */}
          <div className="hidden md:block">
            <Navigation />
          </div>

          {/* 우측 버튼들 */}
          <div className="flex items-center space-x-4">
            {/* 인증 상태 */}
            <AuthStatus />
            
            {/* 모바일 메뉴 버튼 */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="모바일 메뉴 토글"
            >
              <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* 모바일 네비게이션 */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 border-t border-gray-200 dark:border-gray-700">
              <Navigation isMobile={true} onItemClick={() => setIsMobileMenuOpen(false)} />
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
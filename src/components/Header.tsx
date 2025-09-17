'use client'

import { useState, useEffect } from 'react'
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
    
    console.log('다크모드 초기화:', { savedTheme, shouldBeDark })
    
    setIsDarkMode(shouldBeDark)
    
    if (shouldBeDark) {
      document.documentElement.classList.add('dark')
      if (!savedTheme) {
        localStorage.setItem('theme', 'dark') // 초기 설정 저장
        console.log('다크모드 기본값 저장됨')
      }
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  // 다크모드 토글 (더 강력한 방식)
  const toggleDarkMode = () => {
    console.log('=== 다크모드 토글 시작 ===')
    console.log('현재 상태:', isDarkMode)
    console.log('현재 HTML 클래스:', document.documentElement.className)
    
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
      console.log('다크모드 활성화 완료')
    } else {
      htmlElement.classList.remove('dark') // 기존 dark 클래스 제거
      htmlElement.classList.add('light')
      htmlElement.setAttribute('data-theme', 'light')
      localStorage.setItem('theme', 'light')
      console.log('라이트모드 활성화 완료')
    }
    
    console.log('변경 후 HTML 클래스:', document.documentElement.className)
    console.log('변경 후 data-theme:', document.documentElement.getAttribute('data-theme'))
    console.log('=== 다크모드 토글 완료 ===')
  }

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* 로고 */}
          <div className="flex-shrink-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              춘천답기
            </h1>
            <p className="text-xs text-gray-600 dark:text-gray-400 hidden sm:block">
              춘천문화원 회원 창작물 아카이브
            </p>
          </div>

          {/* 데스크톱 네비게이션 */}
          <div className="hidden md:block">
            <Navigation />
          </div>

          {/* 우측 버튼들 */}
          <div className="flex items-center space-x-4">
            {/* 인증 상태 */}
            <AuthStatus />
            
            {/* 다크모드 토글 */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="다크모드 토글"
            >
              {isDarkMode ? (
                <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>

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
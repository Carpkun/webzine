'use client'

import Link from 'next/link'
import { useSearchParams, usePathname } from 'next/navigation'
import { useAuth } from '../lib/auth-context'

interface NavigationProps {
  isMobile?: boolean
  onItemClick?: () => void
}

const navigationItems = [
  { name: '전체', href: '/', category: 'all', icon: '📚' },
  { name: '수필', href: '/category/essay', category: 'essay', icon: '📝' },
  { name: '한시', href: '/category/poetry', category: 'poetry', icon: '📜' },
  { name: '사진', href: '/category/photo', category: 'photo', icon: '📸' },
  { name: '서화', href: '/category/calligraphy', category: 'calligraphy', icon: '🖼️' },
  { name: '영상', href: '/category/video', category: 'video', icon: '🎬' },
]

export default function Navigation({ isMobile = false, onItemClick }: NavigationProps) {
  const pathname = usePathname()
  const { isAdmin } = useAuth()
  
  // 현재 활성 카테고리 판단
  const getCurrentCategory = () => {
    if (pathname === '/') return 'all'
    if (pathname.startsWith('/category/')) {
      return pathname.split('/')[2] // /category/essay -> essay
    }
    return 'all'
  }
  
  const currentCategory = getCurrentCategory()
  
  return (
    <nav className={isMobile ? 'flex flex-col space-y-1' : 'flex space-x-8'}>
      {navigationItems.map((item) => {
        const isActive = currentCategory === item.category
        
        return (
          <Link
            key={item.category}
            href={item.href}
            onClick={() => {
              console.log(`🔗 Navigation click: ${item.name} (${item.href})`)
              onItemClick?.()
            }}
            className={`
              flex items-center space-x-2 transition-colors duration-200
              ${isMobile 
                ? `block px-3 py-2 rounded-md text-base font-medium ${isActive
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`
                : `text-sm font-medium pb-4 border-b-2 ${isActive
                    ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                  }`
              }
            `}
          >
            <span className="text-base">{item.icon}</span>
            <span>{item.name}</span>
          </Link>
        )
      })}
      
      {/* 관리자 전용 링크 */}
      {isAdmin && (
        <Link
          href="/admin"
          onClick={onItemClick}
          className={`
            flex items-center space-x-2 transition-colors duration-200
            ${isMobile 
              ? 'block px-3 py-2 rounded-md text-base font-medium text-red-700 dark:text-red-300 hover:text-red-900 dark:hover:text-red-100 hover:bg-red-50 dark:hover:bg-red-900/30 border-t border-gray-200 dark:border-gray-700 mt-2 pt-3'
              : 'text-sm font-medium pb-4 border-b-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 border-transparent hover:border-red-300 dark:hover:border-red-600'
            }
          `}
        >
          <span className="text-base">🔒</span>
          <span>관리자</span>
        </Link>
      )}
    </nav>
  )
}
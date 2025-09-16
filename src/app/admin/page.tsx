'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { AdminOnly } from '../../lib/auth-context'
import { useAuth } from '../../lib/auth-context'
import { ContentCategory, Content, ContentCreateParams } from '../../../lib/types'
import { adminAPI } from '../../../lib/api'

// 관리자 컴포넌트들 동적 임포트
import dynamic from 'next/dynamic'

const CategoryManager = dynamic(() => import('../../components/admin/CategoryManager'), { ssr: false })
const ContentList = dynamic(() => import('../../components/admin/ContentList'), { ssr: false })
const ContentForm = dynamic(() => import('../../components/admin/ContentForm'), { ssr: false })
const MediaLibrary = dynamic(() => import('../../components/media/MediaLibrary'), { ssr: false })
const ReportedCommentsManager = dynamic(() => import('../../components/admin/ReportedCommentsManager'), { ssr: false })

type ViewMode = 'dashboard' | 'manage' | 'create' | 'edit' | 'media' | 'comments'

export default function AdminPage() {
  const { user, signOut } = useAuth()
  
  // 뷰 상태 관리
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard')
  const [selectedCategory, setSelectedCategory] = useState<ContentCategory | 'all'>('all')
  const [editingContent, setEditingContent] = useState<Content | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  // 강제 새로고침 함수
  const forceRefresh = () => {
    console.log('AdminPage: forceRefresh 호출')
    setRefreshTrigger(prev => {
      const newTrigger = Date.now() // 고유한 값 사용
      console.log('forceRefresh: refreshTrigger 업데이트:', prev, '->', newTrigger)
      return newTrigger
    })
  }

  // 메시지 자동 제거
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [message])

  const handleLogout = async () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      await signOut()
    }
  }

  // 뷰 변경 핸들러
  const handleViewChange = (view: ViewMode, category?: ContentCategory | 'all') => {
    setCurrentView(view)
    if (category !== undefined) {
      setSelectedCategory(category)
    }
    setEditingContent(null)
  }

  // 카테고리 선택 핸들러
  const handleCategorySelect = (category: ContentCategory | 'all') => {
    console.log('AdminPage: 카테고리 선택:', category)
    setSelectedCategory(category)
    setCurrentView('manage')
    // 카테고리 변경 시도 데이터 새로고침
    forceRefresh()
  }

  // 콘텐츠 생성 핸들러
  const handleCreateContent = async (data: ContentCreateParams) => {
    setLoading(true)
    try {
      const response = await adminAPI.createContent(data)
      
      const result = await response.json()
      
      if (response.ok) {
        setMessage({ type: 'success', text: result.message || '콘텐츠가 성공적으로 생성되었습니다.' })
        // 새로 생성한 콘텐츠의 카테고리로 필터링
        setSelectedCategory(data.category)
        setCurrentView('manage')
        // 강제 새로고침
        forceRefresh()
      } else {
        setMessage({ type: 'error', text: result.error || '콘텐츠 생성에 실패했습니다.' })
      }
    } catch {
      setMessage({ type: 'error', text: '네트워크 오류가 발생했습니다.' })
    } finally {
      setLoading(false)
    }
  }

  // 콘텐츠 수정 핸들러
  const handleEditContent = (content: Content) => {
    setEditingContent(content)
    setCurrentView('edit')
  }

  // 콘텐츠 업데이트 핸들러
  const handleUpdateContent = async (data: ContentCreateParams & { id?: string }) => {
    if (!data.id) {
      setMessage({ type: 'error', text: '콘텐츠 ID가 없습니다.' });
      setLoading(false);
      return;
    }
    setLoading(true)
    try {
      const response = await adminAPI.updateContent(data.id, data)
      
      const result = await response.json()
      
      if (response.ok) {
        setMessage({ type: 'success', text: result.message || '콘텐츠가 성공적으로 수정되었습니다.' })
        // 수정한 콘텐츠의 카테고리로 필터링
        setSelectedCategory(data.category)
        setCurrentView('manage')
        setEditingContent(null)
        // 강제 새로고침
        forceRefresh()
      } else {
        setMessage({ type: 'error', text: result.error || '콘텐츠 수정에 실패했습니다.' })
      }
    } catch {
      setMessage({ type: 'error', text: '네트워크 오류가 발생했습니다.' })
    } finally {
      setLoading(false)
    }
  }

  // 콘텐츠 삭제 핸들러
  const handleDeleteContent = async (id: string) => {
    setLoading(true)
    try {
      const response = await adminAPI.deleteContent(id)
      
      const result = await response.json()
      
      if (response.ok) {
        setMessage({ type: 'success', text: result.message || '콘텐츠가 성공적으로 삭제되었습니다.' })
        // 강제 새로고침
        forceRefresh()
      } else {
        setMessage({ type: 'error', text: result.error || '콘텐츠 삭제에 실패했습니다.' })
      }
    } catch {
      setMessage({ type: 'error', text: '네트워크 오류가 발생했습니다.' })
    } finally {
      setLoading(false)
    }
  }

  // 상태 변경 핸들러
  const handleStatusChange = async (id: string, action: 'toggle_published' | 'toggle_featured') => {
    try {
      const response = await adminAPI.updateContentStatus(id, action)
      
      const result = await response.json()
      
      if (response.ok) {
        setMessage({ type: 'success', text: result.message })
        // 강제 새로고침
        forceRefresh()
      } else {
        setMessage({ type: 'error', text: result.error || '상태 변경에 실패했습니다.' })
      }
    } catch {
      setMessage({ type: 'error', text: '네트워크 오류가 발생했습니다.' })
    }
  }

  // 현재 뷰에 따른 제목
  const getViewTitle = () => {
    switch (currentView) {
      case 'dashboard': return '관리자 대시보드'
      case 'manage': return selectedCategory === 'all' ? '전체 콘텐츠 관리' : `${getCategoryLabel(selectedCategory)} 관리`
      case 'create': return '새 콘텐츠 작성'
      case 'edit': return '콘텐츠 수정'
      case 'media': return '미디어 라이브러리'
      case 'comments': return '댓글 관리'
      default: return '관리자 대시보드'
    }
  }

  // 카테고리 라벨 조회
  const getCategoryLabel = (category: ContentCategory) => {
    const labels = {
      essay: '수필',
      poetry: '한시',
      photo: '사진',
      calligraphy: '서화',
      video: '공연영상'
    }
    return labels[category]
  }

  return (
    <AdminOnly>
      {/* 관리자 페이지 헤더 */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* 로고 및 제목 */}
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="text-sm font-medium">웹진 홈</span>
              </Link>
              <div className="text-gray-300 dark:text-gray-600">|</div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">{getViewTitle()}</h1>
            </div>
            
            {/* 사용자 정보 및 로그아웃 */}
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">{user?.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>로그아웃</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 네비게이션 바 */}
      <div className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4">
          <div className="flex space-x-1 py-2">
            <button
              onClick={() => handleViewChange('dashboard')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                currentView === 'dashboard'
                  ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-gray-800'
              }`}
            >
              🏠 대시보드
            </button>
            <button
              onClick={() => handleViewChange('manage')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                currentView === 'manage'
                  ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-gray-800'
              }`}
            >
              📋 콘텐츠 관리
            </button>
            <button
              onClick={() => handleViewChange('create')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                currentView === 'create'
                  ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-gray-800'
              }`}
            >
              ✏️ 새 작성
            </button>
            <button
              onClick={() => handleViewChange('media')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                currentView === 'media'
                  ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-gray-800'
              }`}
            >
              📷 미디어 관리
            </button>
            <button
              onClick={() => handleViewChange('comments')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                currentView === 'comments'
                  ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-gray-800'
              }`}
            >
              💬 댓글 관리
            </button>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        {/* 메시지 표시 */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
          }`}>
            <div className="flex items-center">
              <span className="mr-2">
                {message.type === 'success' ? '✅' : '❌'}
              </span>
              {message.text}
            </div>
          </div>
        )}

        {/* 로딩 오버레이 */}
        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 flex items-center space-x-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="text-gray-900 dark:text-white">처리 중...</span>
            </div>
          </div>
        )}

        {/* 뷰별 컨텐츠 */}
        {currentView === 'dashboard' && (
          <div className="max-w-6xl mx-auto">
            {/* 카테고리 관리자 */}
            <CategoryManager 
              key={`category-manager-${refreshTrigger}`}
              onCategorySelect={handleCategorySelect}
              selectedCategory={selectedCategory}
              refreshTrigger={refreshTrigger}
            />
          </div>
        )}

        {currentView === 'manage' && (
          <div className="max-w-6xl mx-auto">
            {/* 브레드크럼 */}
            <div className="mb-6 flex items-center justify-between">
              <nav className="flex" aria-label="Breadcrumb">
                <ol className="inline-flex items-center space-x-1 md:space-x-3">
                  <li className="inline-flex items-center">
                    <button
                      onClick={() => handleViewChange('dashboard')}
                      className="inline-flex items-center text-sm font-medium text-gray-700 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-500"
                    >
                      🏠 대시보드
                    </button>
                  </li>
                  <li>
                    <div className="flex items-center">
                      <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="ml-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                        {selectedCategory === 'all' ? '전체 콘텐츠' : getCategoryLabel(selectedCategory)}
                      </span>
                    </div>
                  </li>
                </ol>
              </nav>
              
              <button
                onClick={() => handleViewChange('create')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                ✏️ 새 콘텐츠 작성
              </button>
            </div>
            
            {/* 콘텐츠 목록 */}
            <ContentList
              key={`content-list-${refreshTrigger}-${selectedCategory}`}
              onEdit={handleEditContent}
              onDelete={handleDeleteContent}
              onStatusChange={handleStatusChange}
              refreshTrigger={refreshTrigger}
              initialCategory={selectedCategory}
            />
          </div>
        )}

        {currentView === 'create' && (
          <div className="max-w-4xl mx-auto">
            {/* 브레드크럼 */}
            <nav className="flex mb-6" aria-label="Breadcrumb">
              <ol className="inline-flex items-center space-x-1 md:space-x-3">
                <li className="inline-flex items-center">
                  <button
                    onClick={() => handleViewChange('dashboard')}
                    className="inline-flex items-center text-sm font-medium text-gray-700 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-500"
                  >
                    🏠 대시보드
                  </button>
                </li>
                <li>
                  <div className="flex items-center">
                    <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="ml-1 text-sm font-medium text-gray-500 dark:text-gray-400">새 콘텐츠 작성</span>
                  </div>
                </li>
              </ol>
            </nav>

            {/* 콘텐츠 폼 */}
            <ContentForm
              mode="create"
              onSubmit={handleCreateContent}
              onCancel={() => handleViewChange('dashboard')}
              loading={loading}
            />
          </div>
        )}

        {currentView === 'media' && (
          <div className="max-w-7xl mx-auto">
            {/* 브레드크럼 */}
            <nav className="flex mb-6" aria-label="Breadcrumb">
              <ol className="inline-flex items-center space-x-1 md:space-x-3">
                <li className="inline-flex items-center">
                  <button
                    onClick={() => handleViewChange('dashboard')}
                    className="inline-flex items-center text-sm font-medium text-gray-700 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-500"
                  >
                    🏠 대시보드
                  </button>
                </li>
                <li>
                  <div className="flex items-center">
                    <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="ml-1 text-sm font-medium text-gray-500 dark:text-gray-400">미디어 라이브러리</span>
                  </div>
                </li>
              </ol>
            </nav>

            {/* 미디어 라이브러리 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <MediaLibrary
                key={`media-library-${refreshTrigger}`}
                multiSelect={false}
                accept={{
                  'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
                  'video/*': ['.mp4', '.webm', '.ogg']
                }}
                category="admin"
              />
            </div>
          </div>
        )}

        {currentView === 'edit' && editingContent && (
          <div className="max-w-4xl mx-auto">
            {/* 브레드크럼 */}
            <nav className="flex mb-6" aria-label="Breadcrumb">
              <ol className="inline-flex items-center space-x-1 md:space-x-3">
                <li className="inline-flex items-center">
                  <button
                    onClick={() => handleViewChange('dashboard')}
                    className="inline-flex items-center text-sm font-medium text-gray-700 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-500"
                  >
                    🏠 대시보드
                  </button>
                </li>
                <li>
                  <div className="flex items-center">
                    <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    <button
                      onClick={() => handleViewChange('manage')}
                      className="ml-1 text-sm font-medium text-gray-700 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-500"
                    >
                      콘텐츠 관리
                    </button>
                  </div>
                </li>
                <li>
                  <div className="flex items-center">
                    <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="ml-1 text-sm font-medium text-gray-500 dark:text-gray-400 truncate max-w-xs">
                      {editingContent.title} 수정
                    </span>
                  </div>
                </li>
              </ol>
            </nav>

            {/* 콘텐츠 폼 */}
            <ContentForm
              mode="edit"
              initialData={editingContent}
              onSubmit={handleUpdateContent}
              onCancel={() => handleViewChange('manage')}
              loading={loading}
            />
          </div>
        )}

        {currentView === 'comments' && (
          <div className="max-w-6xl mx-auto">
            {/* 브레드크럼 */}
            <nav className="flex mb-6" aria-label="Breadcrumb">
              <ol className="inline-flex items-center space-x-1 md:space-x-3">
                <li className="inline-flex items-center">
                  <button
                    onClick={() => handleViewChange('dashboard')}
                    className="inline-flex items-center text-sm font-medium text-gray-700 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-500"
                  >
                    🏠 대시보드
                  </button>
                </li>
                <li>
                  <div className="flex items-center">
                    <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="ml-1 text-sm font-medium text-gray-500 dark:text-gray-400">댓글 관리</span>
                  </div>
                </li>
              </ol>
            </nav>

            {/* 신고된 댓글 관리자 */}
            <ReportedCommentsManager key={`comments-manager-${refreshTrigger}`} />
          </div>
        )}
      </div>
    </AdminOnly>
  )
}

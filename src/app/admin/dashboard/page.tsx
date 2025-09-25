'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { AdminOnly } from '../../../lib/auth-context'
import { useAuth } from '../../../lib/auth-context'
import { ContentCategory, Content, ContentCreateParams } from '../../../../lib/types'
import { adminAPI } from '../../../../lib/api'

// 관리자 컴포넌트들 동적 임포트
import dynamic from 'next/dynamic'

const CategoryManager = dynamic(() => import('../../../components/admin/CategoryManager'), { ssr: false })
const ContentList = dynamic(() => import('../../../components/admin/ContentList'), { ssr: false })
const ContentForm = dynamic(() => import('../../../components/admin/ContentForm'), { ssr: false })
const MediaLibrary = dynamic(() => import('../../../components/media/MediaLibrary'), { ssr: false })
const ReportedCommentsManager = dynamic(() => import('../../../components/admin/ReportedCommentsManager'), { ssr: false })
const AuthorManager = dynamic(() => import('../../../components/admin/AuthorManager'), { ssr: false })

type ViewMode = 'dashboard' | 'manage' | 'create' | 'edit' | 'media' | 'comments' | 'authors'

export default function AdminDashboardPage() {
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
    setRefreshTrigger(prev => {
      const newTrigger = Date.now() // 고유한 값 사용
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
    setSelectedCategory(category)
    setCurrentView('manage')
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
        setSelectedCategory(data.category)
        setCurrentView('manage')
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
        setSelectedCategory(data.category)
        setCurrentView('manage')
        setEditingContent(null)
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
  const handleStatusChange = async (id: string, action: 'toggle_published') => {
    try {
      const response = await adminAPI.updateContentStatus(id, action)
      
      const result = await response.json()
      
      if (response.ok) {
        setMessage({ type: 'success', text: result.message })
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
      case 'authors': return '작가 관리'
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
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        {/* 헤더 */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center gap-4">
                <Link
                  href="/"
                  className="text-lg font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  🌸 춘천 웹진
                </Link>
                <span className="text-gray-400 dark:text-gray-600">|</span>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {getViewTitle()}
                </h1>
              </div>
              
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {user?.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                >
                  로그아웃
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* 메인 컨텐츠 */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 로딩 오버레이 */}
          {loading && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 flex items-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="text-gray-900 dark:text-white">처리 중...</span>
              </div>
            </div>
          )}

          {/* 메시지 표시 */}
          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300'
                : 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
            }`}>
              <div className="flex items-center justify-between">
                <span>{message.text}</span>
                <button
                  onClick={() => setMessage(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {/* 네비게이션 메뉴 */}
          <nav className="mb-8">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleViewChange('dashboard')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentView === 'dashboard'
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                }`}
              >
                📊 대시보드
              </button>
              
              <button
                onClick={() => handleViewChange('manage', 'all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentView === 'manage'
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                }`}
              >
                📝 콘텐츠 관리
              </button>
              
              <button
                onClick={() => handleViewChange('create')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentView === 'create'
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                }`}
              >
                ✏️ 새 글 작성
              </button>
              
              <button
                onClick={() => handleViewChange('media')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentView === 'media'
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                }`}
              >
                🖼️ 미디어
              </button>
              
              <button
                onClick={() => handleViewChange('comments')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentView === 'comments'
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                }`}
              >
                💬 댓글 관리
              </button>
              
              <button
                onClick={() => handleViewChange('authors')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentView === 'authors'
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                }`}
              >
                👥 작가 관리
              </button>
            </div>
          </nav>

          {/* 뷰별 콘텐츠 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            {currentView === 'dashboard' && (
              <div className="p-6">
                <CategoryManager onCategorySelect={handleCategorySelect} />
              </div>
            )}
            
            {currentView === 'manage' && (
              <div className="p-6">
                <ContentList
                  category={selectedCategory}
                  onEdit={handleEditContent}
                  onDelete={handleDeleteContent}
                  onStatusChange={handleStatusChange}
                  refreshTrigger={refreshTrigger}
                />
              </div>
            )}
            
            {currentView === 'create' && (
              <div className="p-6">
                <ContentForm 
                  mode="create"
                  onSubmit={handleCreateContent}
                  onCancel={() => handleViewChange('dashboard')}
                  loading={loading}
                />
              </div>
            )}
            
            {currentView === 'edit' && editingContent && (
              <div className="p-6">
                <ContentForm
                  mode="edit"
                  initialData={editingContent}
                  onSubmit={handleUpdateContent}
                  onCancel={() => {
                    setEditingContent(null)
                    handleViewChange('manage')
                  }}
                  loading={loading}
                />
              </div>
            )}
            
            {currentView === 'media' && (
              <div className="p-6">
                <MediaLibrary onSelect={() => {}} />
              </div>
            )}
            
            {currentView === 'comments' && (
              <div className="p-6">
                <ReportedCommentsManager />
              </div>
            )}
            
            {currentView === 'authors' && (
              <div className="p-6">
                <AuthorManager />
              </div>
            )}
          </div>
        </main>
      </div>
    </AdminOnly>
  )
}
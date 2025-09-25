'use client'

import { useState, useEffect, useCallback, useRef, useMemo, memo } from 'react'
import { Content, ContentCategory, ContentListParams, PaginatedContentsResponse } from '../../../lib/types'
import { adminAPI } from '../../../lib/api'

interface ContentListProps {
  onEdit: (content: Content) => void
  onDelete: (id: string) => void
  onStatusChange: (id: string, action: 'toggle_published') => void
  refreshTrigger?: number
  initialCategory?: ContentCategory | 'all'
}

const CATEGORIES: { value: ContentCategory | 'all'; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'essay', label: '수필' },
  { value: 'poetry', label: '한시' },
  { value: 'photo', label: '사진' },
  { value: 'calligraphy', label: '서화' },
  { value: 'video', label: '공연영상' },
]

const STATUS_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'published', label: '공개' },
  { value: 'draft', label: '비공개' },
]

const SORT_OPTIONS = [
  { value: 'created_at', label: '생성일' },
  { value: 'updated_at', label: '수정일' },
  { value: 'title', label: '제목' },
  { value: 'likes_count', label: '좋아요' },
  { value: 'view_count', label: '조회수' },
]

const ContentList = memo(function ContentList({
  onEdit, 
  onDelete, 
  onStatusChange,
  refreshTrigger = 0,
  initialCategory
}: ContentListProps) {
  const [contents, setContents] = useState<Content[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // 필터링 및 검색 상태
  const [filters, setFilters] = useState<ContentListParams>({
    page: 1,
    limit: 10,
    sort_by: 'created_at',
    sort_order: 'desc',
    category: initialCategory && initialCategory !== 'all' ? initialCategory : undefined,
    is_published: undefined,
    search: ''
  })
  

  // 페이지네이션 메타데이터
  const [meta, setMeta] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  })

  // 선택된 항목들
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)
  
  // 사용자가 직접 필터를 변경했는지 추적
  const [userChangedFilter, setUserChangedFilter] = useState(false)
  
  // 최신 refreshTrigger 값 추적
  const refreshTriggerRef = useRef(refreshTrigger)
  useEffect(() => {
    refreshTriggerRef.current = refreshTrigger
    // refreshTrigger 변경 시 사용자 변경 플래그 리셋 (새로운 콘텐츠 생성 등)
    if (refreshTrigger > 0) {
      setUserChangedFilter(false)
    }
  }, [refreshTrigger])

  // 콘텐츠 목록 로드
  const loadContents = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams()
      
      // 필터 파라미터 구성
      if (filters.category && filters.category !== 'all') params.set('category', filters.category)
      if (filters.is_published !== undefined) params.set('published', filters.is_published.toString())
      if (filters.search) params.set('search', filters.search)
      if (filters.page) params.set('page', filters.page.toString())
      if (filters.limit) params.set('limit', filters.limit.toString())
      if (filters.sort_by) params.set('sort', filters.sort_by)
      if (filters.sort_order) params.set('order', filters.sort_order)
      
      // 캠시 무효화를 위한 타임스탬프 추가 (필요시만)
      if (refreshTrigger > 0) {
        params.set('_refresh', refreshTrigger.toString())
      }

      const response = await adminAPI.getContents(params)
      
      if (!response.ok) {
        throw new Error('콘텐츠를 불러오는데 실패했습니다.')
      }

      const result: PaginatedContentsResponse = await response.json()
      
      if (result.data) {
        setContents([...result.data])
        setMeta(result.meta || {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }, [filters, refreshTrigger])

  // 컴포넌트 마운트 및 필터 변경 시 데이터 로드
  useEffect(() => {
    loadContents()
  }, [loadContents])

  // initialCategory가 변경될 때 필터 업데이트 (사용자 변경 우선)
  useEffect(() => {
    // 사용자가 직접 필터를 변경한 경우 initialCategory 무시
    if (userChangedFilter) {
      return
    }
    
    const targetCategory = initialCategory && initialCategory !== 'all' ? initialCategory : undefined
    const currentCategory = filters.category
    
    // 실제로 변경이 있을 때만 업데이트
    if (targetCategory !== currentCategory) {
      // 기존 데이터 초기화
      setContents([])
      setLoading(true)
      
      // 필터 업데이트
      setFilters(prev => ({
        ...prev,
        category: targetCategory,
        page: 1 // 첫 페이지로 리셋
      }))
    }
  }, [initialCategory, filters.category, userChangedFilter])

  // 필터 변경 핸들러
  const handleFilterChange = (key: keyof ContentListParams, value: unknown) => {
    // 사용자가 카테곤리 필터를 변경한 경우 플래그 설정
    if (key === 'category') {
      setUserChangedFilter(true)
      setContents([])
      setLoading(true)
    }
    
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key === 'page' ? value : 1 // 페이지 외의 필터 변경 시 첫 페이지로
    }))
    setSelectedIds([])
    setSelectAll(false)
  }

  // 검색 핸들러
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const searchQuery = formData.get('search') as string
    handleFilterChange('search', searchQuery.trim())
  }

  // 전체 선택/해제
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([])
    } else {
      setSelectedIds(contents.map(content => content.id))
    }
    setSelectAll(!selectAll)
  }

  // 개별 선택/해제
  const handleSelectItem = (id: string) => {
    setSelectedIds(prev => {
      const newSelected = prev.includes(id) 
        ? prev.filter(selectedId => selectedId !== id)
        : [...prev, id]
      
      setSelectAll(newSelected.length === contents.length)
      return newSelected
    })
  }

  // 일괄 상태 변경
  const handleBulkStatusChange = async (action: 'publish' | 'unpublish') => {
    if (selectedIds.length === 0) {
      alert('선택된 항목이 없습니다.')
      return
    }

    const actionText = {
      publish: '공개',
      unpublish: '비공개'
    }[action]

    if (!confirm(`선택된 ${selectedIds.length}개 항목을 ${actionText}로 변경하시갌습니까?`)) {
      return
    }

    try {
      const promises = selectedIds.map(id => {
        const value = action === 'publish'
        return adminAPI.updateContentStatus(id, 'set_published', value)
      })

      await Promise.all(promises)
      
      alert(`${selectedIds.length}개 항목이 성공적으로 ${actionText}로 변경되었습니다.`)
      setSelectedIds([])
      setSelectAll(false)
      loadContents()
    } catch {
      alert('일괄 변경 중 오류가 발생했습니다.')
    }
  }

  // 일괄 삭제 (개별 삭제를 순차적으로 수행)
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) {
      alert('선택된 항목이 없습니다.')
      return
    }

    const selectedContents = contents.filter(content => selectedIds.includes(content.id))
    const contentTitles = selectedContents.map(content => `\"${content.title}\"`).slice(0, 3)
    const titlePreview = contentTitles.join(', ') + (selectedContents.length > 3 ? ` 외 ${selectedContents.length - 3}개` : '')

    if (!confirm(`선택된 ${selectedIds.length}개 콘텐츠를 삭제하시걠습니까?\\n\\n${titlePreview}\\n\\n이 작업은 되돌릴 수 없으며, 관련 댓글과 작가 데이터도 함께 삭제될 수 있습니다.`)) {
      return
    }

    let successCount = 0
    let errorCount = 0
    const errors: string[] = []

    try {
      // 각 콘텐츠를 순차적으로 삭제
      for (const contentId of selectedIds) {
        try {
          const response = await adminAPI.deleteContent(contentId)
          const result = await response.json()
          
          if (response.ok) {
            successCount++
          } else {
            errorCount++
            const content = selectedContents.find(c => c.id === contentId)
            errors.push(`"${content?.title || contentId}": ${result.error || '삭제 실패'}`)
          }
        } catch (error) {
          errorCount++
          const content = selectedContents.find(c => c.id === contentId)
          errors.push(`"${content?.title || contentId}": 네트워크 오류`)
        }
      }

      // 결과 메시지 표시
      let message = `${successCount}개 콘텐츠가 성공적으로 삭제되었습니다.`
      if (errorCount > 0) {
        message += `\n\n${errorCount}개 항목에서 오류가 발생했습니다:`
        message += '\n' + errors.slice(0, 3).join('\n')
        if (errors.length > 3) {
          message += `\n... 외 ${errors.length - 3}개`
        }
      }
      
      alert(message)
      setSelectedIds([])
      setSelectAll(false)
      loadContents()
    } catch (error) {
      alert('일괄 삭제 중 예상치 못한 오류가 발생했습니다.')
    }
  }

  // 콘텐츠 삭제 확인
  const handleDeleteClick = (content: Content) => {
    if (confirm(`"${content.title}" 콘텐츠를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) {
      onDelete(content.id)
    }
  }

  // 날짜 포매팅 - 24시간 형식
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false // 24시간 형식 사용
    })
  }

  // 카테고리 아이콘
  const getCategoryIcon = (category: ContentCategory) => {
    const icons = {
      essay: '📝',
      poetry: '🎋',
      photo: '📷',
      calligraphy: '🖌️',
      video: '🎥'
    }
    return icons[category]
  }

  if (loading && contents.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600 dark:text-gray-400">로딩 중...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 필터 및 검색 바 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* 카테고리 필터 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              카테고리
            </label>
            <select
              value={filters.category || 'all'}
              onChange={(e) => handleFilterChange('category', e.target.value === 'all' ? undefined : e.target.value as ContentCategory)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              {CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* 상태 필터 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              상태
            </label>
            <select
              value={
                filters.is_published === true ? 'published' : 
                filters.is_published === false ? 'draft' : 'all'
              }
              onChange={(e) => {
                const value = e.target.value
                if (value === 'all') {
                  handleFilterChange('is_published', undefined)
                } else if (value === 'published') {
                  handleFilterChange('is_published', true)
                } else if (value === 'draft') {
                  handleFilterChange('is_published', false)
                }
              }}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              {STATUS_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* 정렬 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              정렬
            </label>
            <select
              value={filters.sort_by || 'created_at'}
              onChange={(e) => handleFilterChange('sort_by', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              {SORT_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* 정렬 순서 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              순서
            </label>
            <select
              value={filters.sort_order || 'desc'}
              onChange={(e) => handleFilterChange('sort_order', e.target.value as 'asc' | 'desc')}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="desc">내림차순</option>
              <option value="asc">오름차순</option>
            </select>
          </div>
        </div>

        {/* 검색 */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            name="search"
            type="text"
            defaultValue={filters.search}
            placeholder="제목, 내용, 작성자로 검색..."
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            검색
          </button>
          <button
            type="button"
            onClick={() => handleFilterChange('search', '')}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            초기화
          </button>
        </form>
      </div>

      {/* 일괄 작업 버튼 */}
      {selectedIds.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
              {selectedIds.length}개 항목 선택됨
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkStatusChange('publish')}
                className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
              >
                공개
              </button>
              <button
                onClick={() => handleBulkStatusChange('unpublish')}
                className="px-3 py-1.5 text-xs font-medium text-white bg-gray-600 rounded-md hover:bg-gray-700"
              >
                비공개
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 콘텐츠 목록 테이블 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {contents.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 dark:text-gray-500 text-4xl mb-4">📄</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {filters.search || filters.category ? '검색 결과가 없습니다' : '콘텐츠가 없습니다'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {filters.search || filters.category 
                ? '다른 조건으로 검색해보세요.' 
                : '새 콘텐츠를 작성해보세요.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-fixed">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="w-8 px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </th>
                  <th className="w-72 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    제목
                  </th>
                  <th className="w-24 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    카테고리
                  </th>
                  <th className="w-20 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    작성자
                  </th>
                  <th className="w-24 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="w-20 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    통계
                  </th>
                  <th className="w-32 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    작성일
                  </th>
                  <th className="w-32 px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {contents.map((content) => (
                  <tr key={content.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(content.id)}
                        onChange={() => handleSelectItem(content.id)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-start">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {content.title}
                          </p>
                          {content.meta_description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                              {content.meta_description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                        {getCategoryIcon(content.category)} {CATEGORIES.find(cat => cat.value === content.category)?.label}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {content.author_name}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <div className="flex gap-1">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          content.is_published 
                            ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200' 
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                        }`}>
                          {content.is_published ? '공개' : '비공개'}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <div className="text-xs">
                        <div>👀 {content.view_count}</div>
                        <div>❤️ {content.likes_count}</div>
                        <div>💬 {content.comments_count || 0}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(content.created_at)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onStatusChange(content.id, 'toggle_published')}
                          className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium cursor-pointer ${
                            content.is_published
                              ? 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                              : 'text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300'
                          }`}
                          title={content.is_published ? '비공개로 변경' : '공개로 변경'}
                        >
                          {content.is_published ? '🚫' : '✅'}
                        </button>
                        <button
                          onClick={() => onEdit(content)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 px-2 py-1 rounded text-xs cursor-pointer"
                          title="수정"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteClick(content)}
                          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 px-2 py-1 rounded text-xs cursor-pointer"
                          title="삭제"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 페이지네이션 */}
        {meta.totalPages > 1 && (
          <div className="bg-white dark:bg-gray-800 px-4 py-3 border-t border-gray-200 dark:border-gray-700 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handleFilterChange('page', Math.max(1, meta.page - 1))}
                  disabled={!meta.hasPrev}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  이전
                </button>
                <button
                  onClick={() => handleFilterChange('page', Math.min(meta.totalPages, meta.page + 1))}
                  disabled={!meta.hasNext}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  다음
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    전체 <span className="font-medium">{meta.total}</span>개 중{' '}
                    <span className="font-medium">{((meta.page - 1) * meta.limit) + 1}</span>
                    -{' '}
                    <span className="font-medium">{Math.min(meta.page * meta.limit, meta.total)}</span>개 표시
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => handleFilterChange('page', Math.max(1, meta.page - 1))}
                      disabled={!meta.hasPrev}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">이전</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    {/* 페이지 번호들 */}
                    {(() => {
                      const pageNumbers: number[] = []
                      const totalPages = meta.totalPages
                      const currentPage = meta.page
                      
                      // 페이지 번호 범위 계산
                      let startPage = Math.max(1, currentPage - 2)
                      let endPage = Math.min(totalPages, currentPage + 2)
                      
                      // 5개 페이지 번호를 보여주기 위한 조정
                      if (endPage - startPage < 4) {
                        if (startPage === 1) {
                          endPage = Math.min(totalPages, startPage + 4)
                        } else if (endPage === totalPages) {
                          startPage = Math.max(1, endPage - 4)
                        }
                      }
                      
                      // 중복 제거를 위해 Set 사용
                      for (let i = startPage; i <= endPage; i++) {
                        if (!pageNumbers.includes(i)) {
                          pageNumbers.push(i)
                        }
                      }
                      
                      return pageNumbers.map((pageNum) => (
                        <button
                          key={`page-${pageNum}`}
                          onClick={() => handleFilterChange('page', pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            pageNum === currentPage
                              ? 'z-10 bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-600 dark:text-blue-400'
                              : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600'
                          }`}
                        >
                          {pageNum}
                        </button>
                      ))
                    })()}

                    <button
                      onClick={() => handleFilterChange('page', Math.min(meta.totalPages, meta.page + 1))}
                      disabled={!meta.hasNext}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">다음</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}
    </div>
  )
})

export default ContentList

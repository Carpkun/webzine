'use client'

import React, { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'

// FileUploader를 동적 로딩으로 최적화 (관리자 전용)
const FileUploader = dynamic(() => import('../upload/FileUploader'), {
  ssr: false,
  loading: () => (
    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center animate-pulse">
      <div className="h-12 w-12 bg-gray-300 dark:bg-gray-600 rounded mx-auto mb-4" />
      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-48 mx-auto mb-2" />
      <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-32 mx-auto" />
    </div>
  )
})

interface MediaItem {
  name: string
  url: string
  type: string
  size?: number
  created_at?: string
  updated_at?: string
}

interface UploadedFile {
  url: string
  fileName: string
  originalName: string
  type: string
  size: number
  category: string
}

interface MediaLibraryProps {
  onSelectMedia?: (media: MediaItem) => void
  selectedMedia?: MediaItem[]
  multiSelect?: boolean
  accept?: {
    'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    'video/*': ['.mp4', '.webm', '.ogg']
  }
  category?: string
  className?: string
}

export default function MediaLibrary({
  onSelectMedia,
  selectedMedia = [],
  multiSelect = false,
  accept = { 'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'] },
  category = 'general',
  className = ''
}: MediaLibraryProps) {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedItems, setSelectedItems] = useState<MediaItem[]>(selectedMedia)

  // 미디어 목록 조회
  const fetchMediaItems = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        category,
        limit: '50',
        offset: '0'
      })

      const response = await fetch(`/api/upload?${params}`)
      
      if (!response.ok) {
        throw new Error('미디어 목록을 불러올 수 없습니다')
      }

      const result = await response.json()
      setMediaItems(result.data || [])

    } catch (error) {
      console.error('미디어 목록 조회 실패:', error)
      setError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }, [category])

  // 컴포넌트 마운트시 미디어 목록 로드
  useEffect(() => {
    fetchMediaItems()
  }, [fetchMediaItems])

  // 파일 업로드 완료 핸들러
  const handleUploadComplete = (files: UploadedFile[]) => {
    // 업로드된 파일을 미디어 아이템 형태로 변환
    const newMediaItems: MediaItem[] = files.map(file => ({
      name: file.originalName,
      url: file.url,
      type: file.type,
      size: file.size,
      created_at: new Date().toISOString()
    }))

    setMediaItems(prev => [...newMediaItems, ...prev])
  }

  // 미디어 선택 핸들러
  const handleSelectMedia = (item: MediaItem) => {
    if (multiSelect) {
      const isSelected = selectedItems.some(selected => selected.url === item.url)
      let newSelection: MediaItem[]
      
      if (isSelected) {
        newSelection = selectedItems.filter(selected => selected.url !== item.url)
      } else {
        newSelection = [...selectedItems, item]
      }
      
      setSelectedItems(newSelection)
      onSelectMedia?.(item) // 개별 아이템 선택 알림
    } else {
      setSelectedItems([item])
      onSelectMedia?.(item)
    }
  }

  // 미디어 삭제
  const handleDeleteMedia = async (item: MediaItem) => {
    if (!confirm(`"${item.name}"을(를) 삭제하시겠습니까?`)) return

    try {
      const fileName = new URL(item.url).pathname.split('/').pop()
      
      const response = await fetch(`/api/upload?fileName=${fileName}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('삭제 실패')
      }

      setMediaItems(prev => prev.filter(media => media.url !== item.url))
      setSelectedItems(prev => prev.filter(selected => selected.url !== item.url))

    } catch (error) {
      console.error('미디어 삭제 실패:', error)
      alert('미디어 삭제 중 오류가 발생했습니다')
    }
  }

  // 검색 필터링
  const filteredItems = mediaItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // 파일 크기 포맷팅
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // 미디어 아이템 렌더링
  const renderMediaItem = (item: MediaItem) => {
    const isSelected = selectedItems.some(selected => selected.url === item.url)

    return (
      <div
        key={item.url}
        className={`
          relative group cursor-pointer rounded-lg overflow-hidden transition-all
          ${isSelected 
            ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-white dark:ring-offset-gray-800' 
            : 'hover:shadow-md'
          }
        `}
        onClick={() => handleSelectMedia(item)}
      >
        <div className="aspect-square bg-gray-100 dark:bg-gray-800">
          {item.type === 'image' ? (
            <img
              src={item.url}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          ) : item.type === 'video' ? (
            <div className="w-full h-full flex items-center justify-center bg-gray-900">
              <svg className="h-12 w-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="h-12 w-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>

        {/* 선택 표시 */}
        {isSelected && (
          <div className="absolute top-2 left-2 bg-blue-500 text-white rounded-full p-1">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}

        {/* 삭제 버튼 */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleDeleteMedia(item)
          }}
          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L10 9.586 7.707 7.293a1 1 0 00-1.414 1.414L8.586 11l-2.293 2.293a1 1 0 101.414 1.414L10 12.414l2.293 2.293a1 1 0 001.414-1.414L11.414 11l2.293-2.293z" clipRule="evenodd" />
          </svg>
        </button>

        {/* 파일 정보 */}
        <div className="p-2 bg-white dark:bg-gray-800">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate" title={item.name}>
            {item.name}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {formatFileSize(item.size)} • {item.type}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">미디어 라이브러리</h2>
        
        <div className="flex items-center gap-2">
          {/* 검색 */}
          <div className="relative">
            <input
              type="text"
              placeholder="미디어 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
            <svg className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* 보기 모드 토글 */}
          <div className="flex border border-gray-300 dark:border-gray-600 rounded-md">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'text-gray-600 dark:text-gray-400'}`}
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'text-gray-600 dark:text-gray-400'}`}
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 파일 업로드 섹션 */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
        <h3 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-4">새 미디어 업로드</h3>
        <FileUploader
          onUploadComplete={handleUploadComplete}
          accept={accept}
          category={category}
          maxFiles={10}
        />
      </div>

      {/* 미디어 목록 */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={fetchMediaItems}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            다시 시도
          </button>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="mt-4 text-sm font-medium text-gray-900 dark:text-gray-100">미디어가 없습니다</h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {searchTerm ? '검색 조건과 일치하는 미디어가 없습니다' : '새 미디어를 업로드해보세요'}
          </p>
        </div>
      ) : (
        <div className={`
          ${viewMode === 'grid' 
            ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4' 
            : 'space-y-2'
          }
        `}>
          {filteredItems.map(renderMediaItem)}
        </div>
      )}

      {/* 선택된 항목 정보 */}
      {selectedItems.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {selectedItems.length}개 항목 선택됨
          </p>
        </div>
      )}
    </div>
  )
}
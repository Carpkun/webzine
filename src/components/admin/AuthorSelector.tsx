'use client'

import { useState, useEffect } from 'react'
import { Author } from '../../../lib/types'
import { adminAPI } from '../../../lib/api'

interface AuthorSelectorProps {
  selectedAuthorId?: string | null
  selectedAuthorName?: string
  onAuthorSelect: (authorId: string | null, authorName: string) => void
  onNavigateToAuthors?: () => void
  error?: string
}

export default function AuthorSelector({ 
  selectedAuthorId, 
  selectedAuthorName = '', 
  onAuthorSelect,
  onNavigateToAuthors,
  error 
}: AuthorSelectorProps) {
  const [authors, setAuthors] = useState<Author[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newAuthorName, setNewAuthorName] = useState('')
  const [createLoading, setCreateLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // 작가 목록 조회
  const fetchAuthors = async () => {
    try {
      const response = await adminAPI.getAuthors()
      if (response.ok) {
        const data = await response.json()
        setAuthors(data || [])
      } else {
        // 인증 실패 등의 경우 빈 배열로 설정
        setAuthors([])
      }
    } catch (error) {
      console.error('작가 목록 조회 실패:', error)
      setAuthors([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAuthors()
  }, [])

  // 새 작가 생성
  const handleCreateAuthor = async () => {
    if (!newAuthorName.trim()) {
      return
    }

    setCreateLoading(true)
    try {
      const response = await adminAPI.createAuthor({ name: newAuthorName.trim() })

      if (response.ok) {
        const newAuthor = await response.json()
        setAuthors(prev => [...prev, newAuthor])
        onAuthorSelect(newAuthor.id, newAuthor.name)
        setNewAuthorName('')
        setShowCreateForm(false)
      }
    } catch (error) {
      console.error('작가 생성 실패:', error)
    } finally {
      setCreateLoading(false)
    }
  }

  // 작가 선택 핸들러
  const handleSelectChange = (value: string) => {
    if (value === '') {
      onAuthorSelect(null, '')
    } else if (value === 'create_new') {
      setShowCreateForm(true)
    } else {
      const selectedAuthor = authors.find(author => author.id === value)
      if (selectedAuthor) {
        onAuthorSelect(selectedAuthor.id, selectedAuthor.name)
      }
    }
  }

  // 검색된 작가 목록
  const filteredAuthors = authors.filter(author =>
    author.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          작성자 *
        </label>
        <div className="animate-pulse">
          <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded-md"></div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        작성자 *
      </label>
      
      {authors.length === 0 ? (
        /* 작가가 없을 때 작가 관리로 안내 */
        <div className="border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
          <div className="text-gray-400 dark:text-gray-500 text-4xl mb-3">📄</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            등록된 작가가 없습니다
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            콘텐츠를 작성하기 전에 작가를 먼저 등록해주세요.
          </p>
          {onNavigateToAuthors && (
            <button
              onClick={onNavigateToAuthors}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              👤 작가 관리로 이동
            </button>
          )}
        </div>
      ) : !showCreateForm ? (
        <>
          {/* 작가 선택 드롭다운 */}
          <select
            value={selectedAuthorId || ''}
            onChange={(e) => handleSelectChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">작가를 선택해주세요</option>
            {filteredAuthors.map(author => (
              <option key={author.id} value={author.id}>
                {author.name}
              </option>
            ))}
            <option value="create_new" className="font-semibold text-blue-600">
              ➥ 새 작가 등록
            </option>
          </select>

          {/* 검색 기능 */}
          {authors.length > 10 && (
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="작가명으로 검색..."
              className="mt-2 w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          )}
        </>
      ) : (
        /* 새 작가 생성 폼 */
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={newAuthorName}
              onChange={(e) => setNewAuthorName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newAuthorName.trim() && !createLoading) {
                  handleCreateAuthor()
                }
              }}
              placeholder="새 작가명을 입력하세요"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              autoFocus
            />
            <button
              type="button"
              onClick={handleCreateAuthor}
              disabled={createLoading || !newAuthorName.trim()}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createLoading ? '등록중...' : '등록'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCreateForm(false)
                setNewAuthorName('')
              }}
              className="px-4 py-2 bg-gray-500 text-white text-sm rounded-md hover:bg-gray-600"
            >
              취소
            </button>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            새 작가를 등록하면 자동으로 선택됩니다.
          </p>
        </div>
      )}

      {/* 선택된 작가 정보 */}
      {selectedAuthorId && !showCreateForm && (
        <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-800 dark:text-blue-200">
              ✓ 선택됨: <strong>{selectedAuthorName}</strong>
            </span>
            <button
              type="button"
              onClick={() => onAuthorSelect(null, '')}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm"
            >
              선택 해제
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {/* 작가 통계 */}
      {authors.length > 0 && !showCreateForm && (
        <div className="mt-2 flex items-center justify-between">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            총 {authors.length}명의 작가가 등록되어 있습니다.
          </p>
          {onNavigateToAuthors && (
            <button
              onClick={onNavigateToAuthors}
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
            >
              작가 관리
            </button>
          )}
        </div>
      )}
    </div>
  )
}
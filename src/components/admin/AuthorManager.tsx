'use client'

import { useState, useEffect } from 'react'
import { Author } from '../../../lib/types'
import Image from 'next/image'
import AuthorImageUpload from './AuthorImageUpload'
import { useAuth } from '../../lib/auth-context'

interface AuthorManagerProps {
  refreshTrigger?: number
}

export default function AuthorManager({ refreshTrigger = 0 }: AuthorManagerProps) {
  const { session } = useAuth()
  const [authors, setAuthors] = useState<Author[]>([])
  const [loading, setLoading] = useState(true)
  const [editingAuthor, setEditingAuthor] = useState<Author | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    profile_image_url: ''
  })
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // 작가 목록 조회
  const fetchAuthors = async () => {
    try {
      setLoading(true)
      // 작가 목록 조회 시작
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }
      
      const response = await fetch('/api/admin/authors', {
        credentials: 'include',
        headers
      })
      // API 응답 수신
      if (response.ok) {
        const data = await response.json()
        setAuthors(data)
      } else {
        setMessage({ type: 'error', text: '작가 목록을 불러올 수 없습니다.' })
      }
    } catch (error) {
      // 작가 목록 조회 오류
      setMessage({ type: 'error', text: '작가 목록을 불러올 수 없습니다.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAuthors()
  }, [refreshTrigger])

  // 폼 초기화
  const resetForm = () => {
    setFormData({
      name: '',
      bio: '',
      profile_image_url: ''
    })
    setEditingAuthor(null)
    setShowCreateForm(false)
  }

  // 작가 생성/수정
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      setMessage({ type: 'error', text: '작가명을 입력해주세요.' })
      return
    }

    try {
      const url = editingAuthor 
        ? `/api/authors/${editingAuthor.id}` 
        : '/api/admin/authors'
      
      const method = editingAuthor ? 'PUT' : 'POST'
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }
      
      const response = await fetch(url, {
        method,
        headers,
        credentials: 'include',
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: editingAuthor ? '작가 정보가 수정되었습니다.' : '새 작가가 등록되었습니다.' 
        })
        resetForm()
        fetchAuthors()
      } else {
        setMessage({ type: 'error', text: result.error || '작업에 실패했습니다.' })
      }
    } catch (error) {
      // 작가 저장 오류
      setMessage({ type: 'error', text: '네트워크 오류가 발생했습니다.' })
    }
  }

  // 작가 삭제
  const handleDelete = async (author: Author) => {
    if (!confirm(`'${author.name}' 작가를 삭제하시겠습니까?\n\n⚠️ 주의: 해당 작가의 작품들과의 연결은 유지되지만, 작가 상세 정보가 삭제됩니다.`)) {
      return
    }

    try {
      const response = await fetch(`/api/authors/${author.id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      const result = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: '작가가 삭제되었습니다.' })
        fetchAuthors()
      } else {
        setMessage({ type: 'error', text: result.error || '삭제에 실패했습니다.' })
      }
    } catch (error) {
      // 작가 삭제 오류
      setMessage({ type: 'error', text: '네트워크 오류가 발생했습니다.' })
    }
  }

  // 편집 시작
  const startEdit = (author: Author) => {
    setFormData({
      name: author.name,
      bio: author.bio || '',
      profile_image_url: author.profile_image_url || ''
    })
    setEditingAuthor(author)
    setShowCreateForm(true)
  }

  // 메시지 자동 제거
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [message])

  // 업로드 메시지 자동 제거
  useEffect(() => {
    if (uploadMessage) {
      const timer = setTimeout(() => setUploadMessage(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [uploadMessage])

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* 헤더 */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            👤 작가 관리
          </h2>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            {showCreateForm ? '📋 목록 보기' : '➕ 새 작가 등록'}
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* 메시지 표시 */}
        {message && (
          <div className={`mb-4 p-3 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
          }`}>
            <div className="flex items-center text-sm">
              <span className="mr-2">{message.type === 'success' ? '✅' : '❌'}</span>
              {message.text}
            </div>
          </div>
        )}

        {/* 업로드 메시지 표시 */}
        {uploadMessage && (
          <div className={`mb-4 p-3 rounded-lg ${
            uploadMessage.type === 'success'
              ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
          }`}>
            <div className="flex items-center text-sm">
              <span className="mr-2">{uploadMessage.type === 'success' ? '📤' : '❌'}</span>
              {uploadMessage.text}
            </div>
          </div>
        )}

        {/* 작가 등록/수정 폼 */}
        {showCreateForm && (
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {editingAuthor ? '작가 정보 수정' : '새 작가 등록'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  작가명 *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="작가명을 입력하세요"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  작가 소개
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="작가에 대한 간단한 소개를 입력하세요"
                />
              </div>
              
              {/* 프로필 이미지 업로드 */}
              <AuthorImageUpload
                currentImageUrl={formData.profile_image_url}
                onImageUrlChange={(url) => setFormData(prev => ({ ...prev, profile_image_url: url }))}
                onUploadStart={() => {
                  setUploadMessage({ type: 'success', text: '이미지 업로드를 시작합니다...' })
                }}
                onUploadComplete={(file) => {
                  setUploadMessage({ type: 'success', text: `이미지 업로드가 완료되었습니다: ${file.originalName}` })
                  setTimeout(() => setUploadMessage(null), 3000)
                }}
                onUploadError={(error) => {
                  setUploadMessage({ type: 'error', text: error })
                  setTimeout(() => setUploadMessage(null), 5000)
                }}
              />
              
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                >
                  {editingAuthor ? '수정' : '등록'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 bg-gray-500 text-white text-sm font-medium rounded-md hover:bg-gray-600 transition-colors"
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 작가 목록 */}
        {!showCreateForm && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                총 {authors.length}명의 작가가 등록되어 있습니다.
              </p>
            </div>

            {authors.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">👤</div>
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                  등록된 작가가 없습니다
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  새 작가를 등록해보세요.
                </p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                >
                  ➕ 새 작가 등록
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {authors.map((author) => (
                  <div key={author.id} className="flex items-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                    {/* 프로필 이미지 */}
                    <div className="flex-shrink-0 mr-4">
                      {author.profile_image_url ? (
                        <div className="relative w-12 h-12 rounded-full overflow-hidden">
                          <Image
                            src={author.profile_image_url}
                            alt={`${author.name} 프로필`}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-lg font-bold">
                            {author.name.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* 작가 정보 */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {author.name}
                      </h3>
                      {author.bio && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                          {author.bio}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                        등록일: {new Date(author.created_at).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                    
                    {/* 액션 버튼 */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => startEdit(author)}
                        className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        title="수정"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(author)}
                        className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        title="삭제"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
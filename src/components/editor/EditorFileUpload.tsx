'use client'

import React, { useState, useRef } from 'react'

interface UploadedFile {
  url: string
  fileName: string
  originalName: string
  type: string
  size: number
  category: string
}

interface EditorFileUploadProps {
  onUploadComplete: (file: UploadedFile) => void
  onClose: () => void
  category?: string
  accept?: string
  maxSize?: number // bytes
  className?: string
}

export default function EditorFileUpload({
  onUploadComplete,
  onClose,
  category = 'editor',
  accept = 'image/*',
  maxSize = 10 * 1024 * 1024, // 10MB for editor
  className = ''
}: EditorFileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 파일 업로드 함수
  const uploadFile = async (file: File): Promise<UploadedFile> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('category', category)

    // 임시 토큰 (실제로는 인증 시스템에서 가져와야 함)
    const token = 'temp-admin-token'

    // 진행률 시뮬레이션을 위한 XMLHttpRequest 사용
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100)
          setUploadProgress(progress)
        }
      })

      xhr.addEventListener('load', () => {
        if (xhr.status === 201) {
          try {
            const result = JSON.parse(xhr.responseText)
            resolve(result.data)
          } catch (error) {
            reject(new Error('응답 파싱 실패'))
          }
        } else {
          try {
            const errorData = JSON.parse(xhr.responseText)
            reject(new Error(errorData.error || '업로드 실패'))
          } catch {
            reject(new Error(`HTTP ${xhr.status}: 업로드 실패`))
          }
        }
      })

      xhr.addEventListener('error', () => {
        reject(new Error('네트워크 오류'))
      })

      xhr.open('POST', '/api/upload')
      xhr.setRequestHeader('Authorization', `Bearer ${token}`)
      xhr.send(formData)
    })
  }

  // 파일 검증
  const validateFile = (file: File): string | null => {
    // 크기 검증
    if (file.size > maxSize) {
      return `파일 크기가 너무 큽니다. 최대 ${Math.round(maxSize / 1024 / 1024)}MB까지 업로드 가능합니다.`
    }

    // 타입 검증
    const acceptedTypes = accept.split(',').map(type => type.trim())
    const isAccepted = acceptedTypes.some(acceptedType => {
      if (acceptedType === 'image/*') {
        return file.type.startsWith('image/')
      } else if (acceptedType === 'video/*') {
        return file.type.startsWith('video/')
      } else {
        return file.type === acceptedType || file.name.toLowerCase().endsWith(acceptedType.replace('*', ''))
      }
    })

    if (!isAccepted) {
      return `지원하지 않는 파일 형식입니다. 허용된 형식: ${accept}`
    }

    return null
  }

  // 파일 처리 함수
  const handleFile = async (file: File) => {
    setError(null)
    setUploadProgress(0)

    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setUploading(true)

    try {
      const result = await uploadFile(file)
      onUploadComplete(result)
      onClose() // 성공시 모달 닫기
    } catch (error) {
      console.error('파일 업로드 실패:', error)
      setError(error instanceof Error ? error.message : '업로드 중 오류가 발생했습니다')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  // 파일 선택 핸들러
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFile(file)
    }
  }

  // 드래그 앤 드롭 핸들러
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFile(files[0]) // 첫 번째 파일만 처리
    }
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full mx-4 ${className}`}>
      {/* 헤더 */}
      <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          파일 업로드
        </h3>
        <button
          onClick={onClose}
          disabled={uploading}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-50"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* 콘텐츠 */}
      <div className="p-4">
        {!uploading ? (
          <>
            {/* 드롭존 */}
            <div
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className={`
                border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                ${dragOver 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }
              `}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={accept}
                onChange={handleFileSelect}
                className="hidden"
              />

              <svg
                className="mx-auto h-12 w-12 text-gray-400 mb-4"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              <p className="text-gray-600 dark:text-gray-400 mb-2">
                <span className="font-medium text-blue-600 dark:text-blue-400">파일을 선택</span>하거나 
                드래그해서 업로드하세요
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                최대 {Math.round(maxSize / 1024 / 1024)}MB, {accept}
              </p>
            </div>

            {/* 오류 메시지 */}
            {error && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}
          </>
        ) : (
          /* 업로드 진행 중 */
          <div className="space-y-4">
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                <span>업로드 중...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 푸터 */}
      <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onClose}
          disabled={uploading}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {uploading ? '업로드 중...' : '취소'}
        </button>
      </div>
    </div>
  )
}
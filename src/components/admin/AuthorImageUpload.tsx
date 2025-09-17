'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'

interface AuthorImageUploadProps {
  currentImageUrl?: string
  onImageUrlChange: (url: string) => void
  onUploadStart?: () => void
  onUploadComplete?: (file: { originalName: string; url: string }) => void
  onUploadError?: (error: string) => void
}

export default function AuthorImageUpload({
  currentImageUrl = '',
  onImageUrlChange,
  onUploadStart,
  onUploadComplete,
  onUploadError
}: AuthorImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 파일 검증
  const validateFile = (file: File): string | null => {
    // 파일 크기 제한: 5MB
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return '파일 크기는 5MB 이하여야 합니다.'
    }

    // 이미지 파일 타입 확인
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return '지원되는 이미지 형식: JPG, PNG, WebP'
    }

    return null
  }

  // 이미지 리사이즈
  const resizeImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = document.createElement('img') // HTMLImageElement 직접 생성

      img.onload = () => {
        // 최대 크기 설정
        const maxWidth = 400
        const maxHeight = 400
        
        let { width, height } = img
        
        // 비율 유지하면서 크기 조정
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height
            height = maxHeight
          }
        }

        canvas.width = width
        canvas.height = height

        if (!ctx) {
          reject(new Error('Canvas context를 생성할 수 없습니다.'))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('이미지 압축에 실패했습니다.'))
            }
          },
          'image/jpeg',
          0.85 // 압축 품질
        )
      }

      img.onerror = () => reject(new Error('이미지를 로드할 수 없습니다.'))
      img.src = URL.createObjectURL(file)
    })
  }

  // 파일 업로드
  const handleFileUpload = async (file: File) => {
    const error = validateFile(file)
    if (error) {
      onUploadError?.(error)
      return
    }

    setUploading(true)
    onUploadStart?.()

    try {
      // 이미지 리사이즈
      const resizedBlob = await resizeImage(file)
      
      // FormData 생성
      const formData = new FormData()
      formData.append('file', resizedBlob, file.name)
      formData.append('category', 'author-profiles')

      // 업로드 API 호출
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || `업로드 실패 (${response.status}): ${response.statusText}`
        throw new Error(errorMessage)
      }

      const result = await response.json()
      
      if (result.success && result.data?.url) {
        onImageUrlChange(result.data.url)
        onUploadComplete?.({
          originalName: result.data.originalName || file.name,
          url: result.data.url
        })
      } else {
        throw new Error(result.error || '업로드된 파일의 URL을 받지 못했습니다.')
      }
    } catch (error) {
      console.error('업로드 실패:', error)
      onUploadError?.(error instanceof Error ? error.message : '업로드 중 오류가 발생했습니다.')
    } finally {
      setUploading(false)
    }
  }

  // 드래그 앤 드롭 핸들러
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0])
    }
  }

  // 파일 선택 핸들러
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0])
    }
  }

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        프로필 이미지
      </label>
      
      {/* 현재 이미지 표시 */}
      {currentImageUrl && (
        <div className="relative w-32 h-32 mx-auto mb-4">
          <Image
            src={currentImageUrl}
            alt="작가 프로필 미리보기"
            fill
            className="object-cover rounded-full border-4 border-gray-200 dark:border-gray-600"
            unoptimized
          />
          <button
            type="button"
            onClick={() => onImageUrlChange('')}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 transition-colors"
            title="이미지 제거"
          >
            ×
          </button>
        </div>
      )}

      {/* 업로드 영역 */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {uploading ? (
          <div className="space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400">업로드 중...</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-4xl">📸</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p className="font-medium mb-1">프로필 이미지 업로드</p>
              <p>이미지를 드래그하거나 클릭하여 선택하세요</p>
              <p className="text-xs mt-2">
                최대 5MB, JPG/PNG/WebP 형식<br />
                권장 크기: 400x400px 이하
              </p>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={uploading}
        />
      </div>

      {/* 수동 URL 입력 (옵션) */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
          또는 이미지 URL 직접 입력
        </label>
        <input
          type="url"
          value={currentImageUrl}
          onChange={(e) => onImageUrlChange(e.target.value)}
          placeholder="https://example.com/image.jpg"
          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        />
      </div>
    </div>
  )
}
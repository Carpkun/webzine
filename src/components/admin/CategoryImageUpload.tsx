'use client'

import React, { useState, useRef } from 'react'
import { ImageExifData } from '../../../lib/types'

interface UploadedFile {
  url: string
  fileName: string
  originalName: string
  type: string
  size: number
  category: string
  exifData?: ImageExifData | null
}

interface CategoryImageUploadProps {
  category: 'photo' | 'calligraphy'
  currentImageUrl?: string
  onImageUrlChange: (url: string) => void
  onUploadStart?: () => void
  onUploadComplete?: (file: UploadedFile) => void
  onUploadError?: (error: string) => void
  onExifExtracted?: (exifData: ImageExifData | null) => void
  className?: string
}

export default function CategoryImageUpload({
  category,
  currentImageUrl = '',
  onImageUrlChange,
  onUploadStart,
  onUploadComplete,
  onUploadError,
  onExifExtracted,
  className = ''
}: CategoryImageUploadProps) {
  const [inputMode, setInputMode] = useState<'url' | 'upload'>('url')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const categoryLabels = {
    photo: '사진',
    calligraphy: '서화'
  }

  // 파일 업로드 함수
  const uploadFile = async (file: File): Promise<UploadedFile> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('category', `category-${category}`) // 카테고리별 폴더 구분

    // 임시 토큰 (실제로는 인증 시스템에서 가져와야 함)
    const token = 'temp-admin-token'

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

  // EXIF 정보 추출 함수
  const extractExifData = async (file: File): Promise<ImageExifData | null> => {
    try {
      // 사진 카테고리일 때만 EXIF 추출
      if (category !== 'photo') {
        return null
      }

      // exifr 라이브러리를 동적 임포트로 번들 크기 최적화
      const { parse } = await import('exifr')
      
      const rawExif = await parse(file, {
        pick: [
          'Make', 'Model', 'LensModel', 'LensInfo',
          'ISO', 'FNumber', 'ExposureTime', 'FocalLength',
          'DateTimeOriginal', 'DateTime',
          'GPSLatitude', 'GPSLongitude'
        ]
      })

      if (rawExif) {
        const exifData: ImageExifData = {}

        // 카메라 정보
        if (rawExif.Make && rawExif.Model) {
          exifData.camera = `${rawExif.Make} ${rawExif.Model}`
        } else if (rawExif.Model) {
          exifData.camera = rawExif.Model
        }

        // 렌즈 정보
        if (rawExif.LensModel) {
          exifData.lens = rawExif.LensModel
        } else if (rawExif.LensInfo) {
          exifData.lens = Array.isArray(rawExif.LensInfo) 
            ? rawExif.LensInfo.join('mm-') + 'mm' 
            : rawExif.LensInfo
        }

        // 촬영 설정
        if (rawExif.ISO) exifData.iso = rawExif.ISO
        if (rawExif.FNumber) exifData.aperture = `f/${rawExif.FNumber}`
        if (rawExif.ExposureTime) {
          if (rawExif.ExposureTime >= 1) {
            exifData.shutterSpeed = `${rawExif.ExposureTime}s`
          } else {
            const denominator = Math.round(1 / rawExif.ExposureTime)
            exifData.shutterSpeed = `1/${denominator}s`
          }
        }
        if (rawExif.FocalLength) exifData.focalLength = `${rawExif.FocalLength}mm`

        // 촬영일시
        if (rawExif.DateTimeOriginal) {
          exifData.dateTime = rawExif.DateTimeOriginal.toISOString()
        } else if (rawExif.DateTime) {
          exifData.dateTime = rawExif.DateTime.toISOString()
        }

        // GPS 정보
        if (rawExif.GPSLatitude && rawExif.GPSLongitude) {
          exifData.gps = {
            latitude: rawExif.GPSLatitude,
            longitude: rawExif.GPSLongitude
          }
        }

        return Object.keys(exifData).length > 0 ? exifData : null
      }

      return null
    } catch (error) {
      console.error('EXIF 추출 오류:', error)
      return null
    }
  }

  // 파일 검증
  const validateFile = (file: File): string | null => {
    // 이미지 파일만 허용
    if (!file.type.startsWith('image/')) {
      return '이미지 파일만 업로드 가능합니다.'
    }

    // 크기 제한 (20MB)
    const maxSize = 20 * 1024 * 1024
    if (file.size > maxSize) {
      return `파일 크기가 너무 큽니다. 최대 20MB까지 업로드 가능합니다.`
    }

    return null
  }

  // 파일 처리 함수
  const handleFile = async (file: File) => {
    const validationError = validateFile(file)
    if (validationError) {
      onUploadError?.(validationError)
      return
    }

    setUploading(true)
    setUploadProgress(0)
    onUploadStart?.()

    try {
      // EXIF 정보 추출 (사진 카테고리일 때만)
      const exifData = await extractExifData(file)
      
      // 파일 업로드
      const result = await uploadFile(file)
      
      // EXIF 정보를 result에 추가
      const resultWithExif = {
        ...result,
        exifData
      }
      
      onImageUrlChange(result.url)
      onUploadComplete?.(resultWithExif)
      
      // EXIF 정보 콜백 호출
      if (category === 'photo' && onExifExtracted) {
        onExifExtracted(exifData)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '업로드 중 오류가 발생했습니다'
      onUploadError?.(errorMessage)
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
      handleFile(files[0])
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 입력 방식 선택 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          {categoryLabels[category]} 이미지 (선택사항)
        </label>
        
        <div className="flex gap-4 mb-4">
          <button
            type="button"
            onClick={() => setInputMode('url')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              inputMode === 'url'
                ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            🔗 URL 입력
          </button>
          <button
            type="button"
            onClick={() => setInputMode('upload')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              inputMode === 'upload'
                ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            📤 파일 업로드
          </button>
        </div>
      </div>

      {/* URL 입력 모드 */}
      {inputMode === 'url' && (
        <div>
          <input
            type="url"
            value={currentImageUrl}
            onChange={(e) => onImageUrlChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="이미지 URL을 입력하세요"
            disabled={uploading}
          />
        </div>
      )}

      {/* 파일 업로드 모드 */}
      {inputMode === 'upload' && (
        <div>
          {!uploading ? (
            <div
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className={`
                border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
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
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              <svg
                className="mx-auto h-8 w-8 text-gray-400 mb-2"
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

              <p className="text-gray-600 dark:text-gray-400 text-sm">
                <span className="font-medium text-blue-600 dark:text-blue-400">파일을 선택</span>하거나 
                드래그해서 업로드하세요
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                최대 20MB, JPG, PNG, GIF, WebP
              </p>
            </div>
          ) : (
            // 업로드 진행 중
            <div className="space-y-2">
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">업로드 중...</span>
              </div>
              
              <div>
                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                  <span>진행률</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div
                    className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 이미지 미리보기 */}
      {currentImageUrl && (
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">미리보기</p>
          <div className="relative">
            <img
              src={currentImageUrl}
              alt="미리보기"
              className="max-w-full max-h-48 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600"
              onError={(e) => {
                e.currentTarget.src = '/api/placeholder/300/200?text=이미지 로드 실패'
              }}
            />
            <button
              type="button"
              onClick={() => onImageUrlChange('')}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
              title="이미지 제거"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
'use client'

import React, { useState, useCallback, useRef } from 'react'
import { useDropzone } from 'react-dropzone'

interface UploadedFile {
  url: string
  fileName: string
  originalName: string
  type: string
  size: number
  category: string
}

interface FileUploaderProps {
  onUploadComplete?: (files: UploadedFile[]) => void
  accept?: {
    'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    'video/*': ['.mp4', '.webm', '.ogg']
  }
  maxFiles?: number
  maxSize?: number // bytes
  category?: string
  className?: string
}

export default function FileUploader({
  onUploadComplete,
  accept = { 'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'] },
  maxFiles = 5,
  maxSize = 50 * 1024 * 1024, // 50MB
  category = 'general',
  className = ''
}: FileUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [error, setError] = useState<string | null>(null)
  
  const abortControllerRef = useRef<AbortController | null>(null)

  const uploadFile = async (file: File): Promise<UploadedFile> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('category', category)

    // 임시 토큰 (실제로는 인증 시스템에서 가져와야 함)
    const token = 'temp-admin-token'

    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData,
      signal: abortControllerRef.current?.signal
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || '업로드 실패')
    }

    const result = await response.json()
    return result.data
  }

  const onDrop = useCallback(async (acceptedFiles: File[], rejectedFiles: any[]) => {
    setError(null)
    
    // 파일 검증 오류 처리
    if (rejectedFiles.length > 0) {
      const errors = rejectedFiles.map(rejected => 
        rejected.errors.map((err: any) => err.message).join(', ')
      ).join('; ')
      setError(`파일 검증 실패: ${errors}`)
      return
    }

    if (acceptedFiles.length === 0) return

    setUploading(true)
    abortControllerRef.current = new AbortController()

    try {
      const uploadPromises = acceptedFiles.map(async (file) => {
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }))
        
        try {
          const result = await uploadFile(file)
          setUploadProgress(prev => ({ ...prev, [file.name]: 100 }))
          return result
        } catch (error) {
          setUploadProgress(prev => ({ ...prev, [file.name]: -1 })) // 실패 표시
          throw error
        }
      })

      const results = await Promise.all(uploadPromises)
      const successfulUploads = results.filter(Boolean)
      
      setUploadedFiles(prev => [...prev, ...successfulUploads])
      onUploadComplete?.(successfulUploads)

      // 진행률 리셋
      setTimeout(() => {
        setUploadProgress({})
      }, 2000)

    } catch (error) {
      console.error('업로드 오류:', error)
      setError(error instanceof Error ? error.message : '업로드 중 오류가 발생했습니다')
    } finally {
      setUploading(false)
      abortControllerRef.current = null
    }
  }, [category, onUploadComplete])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles,
    maxSize,
    disabled: uploading
  })

  const cancelUpload = () => {
    abortControllerRef.current?.abort()
    setUploading(false)
    setUploadProgress({})
  }

  const removeFile = (fileName: string) => {
    setUploadedFiles(prev => prev.filter(file => file.fileName !== fileName))
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 드롭존 */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragActive 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }
          ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="space-y-2">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
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
          
          {isDragActive ? (
            <p className="text-blue-600 dark:text-blue-400">파일을 여기에 놓으세요...</p>
          ) : (
            <div>
              <p className="text-gray-600 dark:text-gray-400">
                <span className="font-medium text-blue-600 dark:text-blue-400">파일을 선택</span>하거나 
                드래그해서 업로드하세요
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                {Object.values(accept).flat().join(', ')} (최대 {maxFiles}개, {Math.round(maxSize / 1024 / 1024)}MB)
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 오류 메시지 */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600 dark:text-red-300 dark:hover:text-red-100"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 업로드 진행률 */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">업로드 진행률</h4>
            {uploading && (
              <button
                onClick={cancelUpload}
                className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
              >
                취소
              </button>
            )}
          </div>
          
          {Object.entries(uploadProgress).map(([fileName, progress]) => (
            <div key={fileName} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400 truncate">{fileName}</span>
                <span className="text-gray-500 dark:text-gray-500">
                  {progress === -1 ? '실패' : `${progress}%`}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    progress === -1 
                      ? 'bg-red-500' 
                      : progress === 100 
                        ? 'bg-green-500' 
                        : 'bg-blue-500'
                  }`}
                  style={{ width: `${Math.max(0, progress)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 업로드된 파일 목록 */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">업로드 완료</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {uploadedFiles.map((file) => (
              <div key={file.fileName} className="relative group">
                <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                  {file.type === 'image' ? (
                    <img
                      src={file.url}
                      alt={file.originalName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="h-8 w-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => removeFile(file.fileName)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 truncate" title={file.originalName}>
                  {file.originalName}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
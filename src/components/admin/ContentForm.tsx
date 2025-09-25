'use client'

import { useState } from 'react'
import { ContentCategory, ContentCreateParams, Content, VideoPlatform, ImageExifData, TTSStatus } from '../../../lib/types'
import TiptapEditor from '../editor/TiptapEditor'
import CategoryImageUpload from './CategoryImageUpload'
import AuthorSelector from './AuthorSelector'

interface ContentFormProps {
  mode: 'create' | 'edit'
  initialData?: Content
  onSubmit: (data: ContentCreateParams & { id?: string }) => Promise<void>
  onCancel: () => void
  onNavigateToAuthors?: () => void
  loading?: boolean
}

const CATEGORIES: { value: ContentCategory; label: string; description: string }[] = [
  { value: 'essay', label: '수필', description: '일상의 단상과 성찰을 담은 수필 작품' },
  { value: 'poetry', label: '한시', description: '전통 한시와 현대적 번역' },
  { value: 'photo', label: '사진', description: '춘천의 아름다운 순간들' },
  { value: 'calligraphy', label: '서화', description: '전통 서예와 그림 작품' },
  { value: 'video', label: '공연영상', description: '문화 공연과 예술 영상' },
]

const VIDEO_PLATFORMS: { value: VideoPlatform; label: string }[] = [
  { value: 'youtube', label: 'YouTube' },
  { value: 'vimeo', label: 'Vimeo' },
  { value: 'other', label: '기타' },
]

export default function ContentForm({ 
  mode, 
  initialData, 
  onSubmit, 
  onCancel,
  onNavigateToAuthors,
  loading = false 
}: ContentFormProps) {
  const [formData, setFormData] = useState<ContentCreateParams & { id?: string; author_id?: string | null }>({
    id: initialData?.id,
    title: initialData?.title || '',
    content: initialData?.content || '',
    category: initialData?.category || 'essay',
    author_name: initialData?.author_name || '',
    author_id: initialData?.author_id || null,
    is_published: initialData?.is_published ?? true, // 기본값을 true로 설정
    featured: false, // 추천 기능 제거
    meta_description: initialData?.meta_description || '',
    thumbnail_url: initialData?.thumbnail_url || '',
    
    // 카테고리별 필드
    original_text: initialData?.original_text || '',
    translation: initialData?.translation || '',
    image_url: initialData?.image_url || '',
    image_exif: initialData?.image_exif || null,
    video_url: initialData?.video_url || '',
    video_platform: initialData?.video_platform || 'youtube',
    
    // TTS 관련 필드
    tts_url: initialData?.tts_url || '',
    tts_duration: initialData?.tts_duration || undefined,
    tts_generated_at: initialData?.tts_generated_at || '',
    tts_file_size: initialData?.tts_file_size || undefined,
    tts_chunks_count: initialData?.tts_chunks_count || 1,
    tts_status: initialData?.tts_status || 'pending',
    
    // 서화 작품 관련 필드
    artwork_size: initialData?.artwork_size || '',
    artwork_material: initialData?.artwork_material || '',
    
    // 공연 관련 필드
    performance_date: initialData?.performance_date || '',
    performance_venue: initialData?.performance_venue || '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // 폼 데이터 변경 핸들러
  const handleChange = (field: keyof ContentCreateParams, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // 에러 클리어
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  // 폼 검증
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // 기본 필수 필드 검증
    if (!formData.title.trim()) {
      newErrors.title = '제목을 입력해주세요.'
    }
    if (!formData.content.trim()) {
      newErrors.content = '내용을 입력해주세요.'
    }
    if (!formData.author_id && !formData.author_name.trim()) {
      newErrors.author_name = '작성자를 선택해주세요.'
    }

    // 카테고리별 필수 필드 검증
    switch (formData.category) {
      case 'poetry':
        if (!formData.original_text?.trim()) {
          newErrors.original_text = '한시 원문을 입력해주세요.'
        }
        if (!formData.translation?.trim()) {
          newErrors.translation = '한시 번역을 입력해주세요.'
        }
        break
      case 'photo':
      case 'calligraphy':
        // image_url은 선택사항으로 변경 - 에디터로 업로드할 수 있으므로
        // 이미지 URL 필수 검증 제거
        break
      case 'video':
        if (!formData.video_url?.trim()) {
          newErrors.video_url = '동영상 URL을 입력해주세요.'
        }
        if (!formData.video_platform) {
          newErrors.video_platform = '동영상 플랫폼을 선택해주세요.'
        }
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 폼 제출 핸들러
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      // 데이터 정리: 빈 문자열을 null로 변환 (날짜 필드들)
      const cleanedData = {
        ...formData,
        performance_date: formData.performance_date?.trim() || null,
        tts_generated_at: formData.tts_generated_at?.trim() || null,
        // 숫자 필드들도 undefined로 변환
        tts_duration: formData.tts_duration || undefined,
        tts_file_size: formData.tts_file_size || undefined,
        tts_chunks_count: formData.tts_chunks_count || 1,
      }
      
      if (mode === 'edit') {
        await onSubmit(cleanedData)
      } else {
        const { id, ...createData } = cleanedData
        await onSubmit(createData)
      }
    } catch (error) {
      console.error('폼 제출 오류:', error)
    }
  }

  return (
    <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {mode === 'create' ? '새 콘텐츠 작성' : '콘텐츠 수정'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* 업로드 메시지 표시 */}
        {uploadMessage && (
          <div className={`p-3 rounded-lg ${
            uploadMessage.type === 'success' 
              ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
          }`}>
            <div className="flex items-center text-sm">
              <span className="mr-2">
                {uploadMessage.type === 'success' ? '📤' : '❌'}
              </span>
              {uploadMessage.text}
            </div>
          </div>
        )}
        {/* 기본 정보 섹션 */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">기본 정보</h3>
          
          {/* 카테고리 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              카테고리 *
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value as ContentCategory)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              {CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label} - {cat.description}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.category}</p>
            )}
          </div>

          {/* 제목 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              제목 *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="콘텐츠 제목을 입력하세요"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.title}</p>
            )}
          </div>

          {/* 작성자 선택 */}
          <AuthorSelector
            selectedAuthorId={formData.author_id}
            selectedAuthorName={formData.author_name}
            onAuthorSelect={(authorId, authorName) => {
              setFormData(prev => ({
                ...prev,
                author_id: authorId,
                author_name: authorName
              }))
              
              // 에러 클리어
              if (errors.author_name) {
                setErrors(prev => {
                  const newErrors = { ...prev }
                  delete newErrors.author_name
                  return newErrors
                })
              }
            }}
            onNavigateToAuthors={onNavigateToAuthors}
            error={errors.author_name}
          />
        </div>

        {/* 카테고리별 특화 필드 */}
        {formData.category === 'poetry' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">한시 정보</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                한시 원문 *
              </label>
              <textarea
                value={formData.original_text || ''}
                onChange={(e) => handleChange('original_text', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="한시 원문을 입력하세요"
              />
              {errors.original_text && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.original_text}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                번역/해석 *
              </label>
              <textarea
                value={formData.translation || ''}
                onChange={(e) => handleChange('translation', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="한시 번역 또는 해석을 입력하세요"
              />
              {errors.translation && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.translation}</p>
              )}
            </div>
          </div>
        )}

        {(formData.category === 'photo' || formData.category === 'calligraphy') && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {formData.category === 'photo' ? '사진 정보' : '서화 정보'}
            </h3>
            
            <CategoryImageUpload
              category={formData.category as 'photo' | 'calligraphy'}
              currentImageUrl={formData.image_url || ''}
              onImageUrlChange={(url) => handleChange('image_url', url)}
              onUploadStart={() => {
                setUploadMessage({ type: 'success', text: '파일 업로드를 시작합니다...' })
              }}
              onUploadComplete={(file) => {
                setUploadMessage({ type: 'success', text: `이미지 업로드가 완료되었습니다: ${file.originalName}` })
                setTimeout(() => setUploadMessage(null), 3000)
              }}
              onUploadError={(error) => {
                setUploadMessage({ type: 'error', text: error })
                setTimeout(() => setUploadMessage(null), 5000)
              }}
              onExifExtracted={(exifData) => {
                // EXIF 정보를 formData에 저장
                if (formData.category === 'photo') {
                  handleChange('image_exif', exifData)
                  if (exifData) {
                    setUploadMessage({ type: 'success', text: 'EXIF 촬영 정보가 자동으로 추출되었습니다.' })
                    setTimeout(() => setUploadMessage(null), 3000)
                  }
                }
              }}
            />
            
            {errors.image_url && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.image_url}</p>
            )}
            
            {/* 서화 작품 매체별 추가 필드 */}
            {formData.category === 'calligraphy' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    작품 크기
                  </label>
                  <input
                    type="text"
                    value={formData.artwork_size || ''}
                    onChange={(e) => handleChange('artwork_size', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="예: 50cm × 70cm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    사용 재료
                  </label>
                  <input
                    type="text"
                    value={formData.artwork_material || ''}
                    onChange={(e) => handleChange('artwork_material', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="예: 한지, 묵, 붓"
                  />
                </div>
              </>
            )}
          </div>
        )}

        {formData.category === 'video' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">공연영상 정보</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                동영상 URL *
              </label>
              <input
                type="url"
                value={formData.video_url || ''}
                onChange={(e) => handleChange('video_url', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="YouTube, Vimeo 등의 동영상 URL을 입력하세요"
              />
              {errors.video_url && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.video_url}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                플랫폼 *
              </label>
              <select
                value={formData.video_platform || 'youtube'}
                onChange={(e) => handleChange('video_platform', e.target.value as VideoPlatform)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                {VIDEO_PLATFORMS.map(platform => (
                  <option key={platform.value} value={platform.value}>
                    {platform.label}
                  </option>
                ))}
              </select>
              {errors.video_platform && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.video_platform}</p>
              )}
            </div>
            
            {/* 공연 추가 정보 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                공연 일자
              </label>
              <input
                type="date"
                value={formData.performance_date || ''}
                onChange={(e) => handleChange('performance_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                공연 장소
              </label>
              <input
                type="text"
                value={formData.performance_venue || ''}
                onChange={(e) => handleChange('performance_venue', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="예: 천천문화예술아덜, 국립극장 등"
              />
            </div>
          </div>
        )}

        {/* 본문 내용 - WYSIWYG 에디터 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            본문 내용 *
          </label>
          <TiptapEditor
            content={formData.content}
            onChange={(content) => handleChange('content', content)}
            placeholder="콘텐츠 본문을 입력하세요..."
            className="min-h-[300px]"
            category={formData.category}
          />
          {errors.content && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.content}</p>
          )}
        </div>

        {/* 추가 설정 */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">추가 설정</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              썸네일 이미지 URL
            </label>
            <input
              type="url"
              value={formData.thumbnail_url || ''}
              onChange={(e) => handleChange('thumbnail_url', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="썸네일 이미지 URL (선택사항)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              메타 설명
            </label>
            <textarea
              value={formData.meta_description || ''}
              onChange={(e) => handleChange('meta_description', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="검색 엔진용 설명 (선택사항)"
            />
          </div>

          {/* 공개 설정 - 기본적으로 활성화, 숨겨진 필드 */}
          <input type="hidden" name="featured" value="false" />
          
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_published}
                onChange={(e) => handleChange('is_published', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                즉시 공개
              </span>
            </label>
          </div>
        </div>

        {/* 버튼 그룹 */}
        <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '처리 중...' : (mode === 'create' ? '작성하기' : '수정하기')}
          </button>
        </div>
      </form>
    </div>
  )
}
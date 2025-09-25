import DOMPurify from 'isomorphic-dompurify'
import { ContentCreateParams, ContentCategory } from './types'

export interface ValidationResult {
  isValid: boolean
  errors?: string[]
  sanitized?: Partial<ContentCreateParams>
}

// HTML 내용 sanitization
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'target']
  })
}

// 파일명 sanitization
export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9가-힣._-]/g, '')
    .substring(0, 255)
}

// 파일 타입 검증
export function validateFileType(mimeType: string, allowedTypes: string[]): boolean {
  return allowedTypes.includes(mimeType)
}

// 콘텐츠 데이터 검증 및 sanitization
export function validateContentData(data: any): ValidationResult {
  const errors: string[] = []
  const sanitized: Partial<ContentCreateParams> = {}

  // 필수 필드 검증
  if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
    errors.push('제목은 필수입니다')
  } else {
    sanitized.title = data.title.trim().substring(0, 200)
  }

  if (!data.content || typeof data.content !== 'string' || data.content.trim().length === 0) {
    errors.push('내용은 필수입니다')
  } else {
    sanitized.content = sanitizeHtml(data.content)
  }

  if (!data.category || !isValidCategory(data.category)) {
    errors.push('올바른 카테고리를 선택해주세요')
  } else {
    sanitized.category = data.category as ContentCategory
  }

  // 선택적 필드 처리
  if (data.author_name && typeof data.author_name === 'string') {
    sanitized.author_name = data.author_name.trim().substring(0, 100)
  }

  if (data.author_id && typeof data.author_id === 'string') {
    sanitized.author_id = data.author_id
  }

  if (data.excerpt && typeof data.excerpt === 'string') {
    sanitized.excerpt = data.excerpt.trim().substring(0, 500)
  }

  if (data.slug && typeof data.slug === 'string') {
    sanitized.slug = data.slug.trim().substring(0, 100)
  }

  // 불린 필드들
  if (typeof data.is_published === 'boolean') {
    sanitized.is_published = data.is_published
  }

  if (typeof data.featured === 'boolean') {
    sanitized.featured = data.featured
  }

  if (typeof data.allow_comments === 'boolean') {
    sanitized.allow_comments = data.allow_comments
  }

  // 카테고리별 특수 필드
  if (data.original_text && typeof data.original_text === 'string') {
    sanitized.original_text = data.original_text.trim()
  }

  if (data.translation && typeof data.translation === 'string') {
    sanitized.translation = data.translation.trim()
  }

  if (data.image_url && typeof data.image_url === 'string') {
    sanitized.image_url = data.image_url.trim()
  }

  if (data.video_url && typeof data.video_url === 'string') {
    sanitized.video_url = data.video_url.trim()
  }

  if (data.video_platform && typeof data.video_platform === 'string') {
    sanitized.video_platform = data.video_platform.trim()
  }

  // 메타데이터
  if (data.tags && Array.isArray(data.tags)) {
    sanitized.tags = data.tags
      .filter(tag => typeof tag === 'string')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
      .slice(0, 10) // 최대 10개 태그
  }

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
    sanitized
  }
}

// 카테고리 검증
function isValidCategory(category: string): boolean {
  const validCategories: ContentCategory[] = ['poetry', 'essay', 'novel', 'photo', 'calligraphy', 'video']
  return validCategories.includes(category as ContentCategory)
}

// 이메일 검증
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// URL 검증
export function validateUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}
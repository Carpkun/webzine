/**
 * 입력 데이터 검증 및 Sanitization 유틸리티
 * XSS 공격 방지 및 데이터 무결성 보장
 */

import DOMPurify from 'isomorphic-dompurify'
import validator from 'validator'

// 허용된 HTML 태그와 속성
const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'blockquote', 'a', 'img'
]

const ALLOWED_ATTRIBUTES = {
  'a': ['href', 'title'],
  'img': ['src', 'alt', 'title', 'width', 'height'],
  '*': ['class']
}

/**
 * HTML 콘텐츠 sanitization (XSS 방지)
 */
export function sanitizeHTML(html: string): string {
  if (!html || typeof html !== 'string') {
    return ''
  }

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: Object.keys(ALLOWED_ATTRIBUTES).reduce((acc, tag) => {
      if (tag === '*') {
        acc.push(...ALLOWED_ATTRIBUTES[tag])
      } else {
        acc.push(...ALLOWED_ATTRIBUTES[tag as keyof typeof ALLOWED_ATTRIBUTES])
      }
      return acc
    }, [] as string[]),
    ALLOW_DATA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
    SANITIZE_DOM: true,
    SANITIZE_NAMED_PROPS: true
  })
}

/**
 * 텍스트 콘텐츠 sanitization (HTML 태그 제거)
 */
export function sanitizeText(text: string): string {
  if (!text || typeof text !== 'string') {
    return ''
  }

  // HTML 태그 완전 제거
  return DOMPurify.sanitize(text, { 
    ALLOWED_TAGS: [], 
    ALLOWED_ATTR: [] 
  }).trim()
}

/**
 * 이메일 주소 검증 및 sanitization
 */
export function validateAndSanitizeEmail(email: string): string | null {
  if (!email || typeof email !== 'string') {
    return null
  }

  const sanitized = sanitizeText(email.toLowerCase().trim())
  
  if (!validator.isEmail(sanitized)) {
    return null
  }

  return sanitized
}

/**
 * URL 검증 및 sanitization
 */
export function validateAndSanitizeURL(url: string, allowedProtocols: string[] = ['http', 'https']): string | null {
  if (!url || typeof url !== 'string') {
    return null
  }

  const sanitized = sanitizeText(url.trim())
  
  if (!validator.isURL(sanitized, { 
    protocols: allowedProtocols,
    require_protocol: true,
    require_valid_protocol: true
  })) {
    return null
  }

  return sanitized
}

/**
 * 콘텐츠 제목 검증 및 sanitization
 */
export function validateAndSanitizeTitle(title: string, maxLength: number = 200): string | null {
  if (!title || typeof title !== 'string') {
    return null
  }

  const sanitized = sanitizeText(title).trim()
  
  if (sanitized.length === 0 || sanitized.length > maxLength) {
    return null
  }

  return sanitized
}

/**
 * 작성자명 검증 및 sanitization
 */
export function validateAndSanitizeAuthor(author: string, maxLength: number = 50): string | null {
  if (!author || typeof author !== 'string') {
    return null
  }

  const sanitized = sanitizeText(author).trim()
  
  if (sanitized.length === 0 || sanitized.length > maxLength) {
    return null
  }

  // 특수문자 제한 (한글, 영문, 숫자, 공백만 허용)
  if (!/^[가-힣a-zA-Z0-9\s]+$/.test(sanitized)) {
    return null
  }

  return sanitized
}

/**
 * 댓글 내용 검증 및 sanitization
 */
export function validateAndSanitizeComment(content: string, maxLength: number = 1000): string | null {
  if (!content || typeof content !== 'string') {
    return null
  }

  const sanitized = sanitizeText(content).trim()
  
  if (sanitized.length === 0 || sanitized.length > maxLength) {
    return null
  }

  return sanitized
}

/**
 * 파일명 sanitization
 */
export function sanitizeFileName(fileName: string): string {
  if (!fileName || typeof fileName !== 'string') {
    return 'unnamed'
  }

  // 위험한 문자 제거 및 정규화
  return fileName
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '') // 위험한 문자 제거
    .replace(/\.\./g, '.') // 경로 순회 공격 방지
    .replace(/\s+/g, '_') // 공백을 언더스코어로 변경
    .toLowerCase()
    .substring(0, 100) // 최대 길이 제한
}

/**
 * 카테고리 검증
 */
export function validateCategory(category: string): boolean {
  const validCategories = ['essay', 'poetry', 'photo', 'calligraphy', 'video']
  return validCategories.includes(category)
}

/**
 * 비밀번호 강도 검증 (댓글용)
 */
export function validatePassword(password: string): { isValid: boolean; message?: string } {
  if (!password || typeof password !== 'string') {
    return { isValid: false, message: '비밀번호를 입력해주세요.' }
  }

  if (password.length < 4) {
    return { isValid: false, message: '비밀번호는 최소 4자 이상이어야 합니다.' }
  }

  if (password.length > 50) {
    return { isValid: false, message: '비밀번호는 최대 50자까지 입력 가능합니다.' }
  }

  return { isValid: true }
}

/**
 * 파일 MIME 타입 검증
 */
export function validateFileType(mimeType: string, allowedTypes: string[]): boolean {
  return allowedTypes.includes(mimeType.toLowerCase())
}

/**
 * SQL Injection 방지를 위한 문자열 이스케이프
 */
export function escapeSQLString(str: string): string {
  if (!str || typeof str !== 'string') {
    return ''
  }

  // 작은따옴표 이스케이프
  return str.replace(/'/g, "''")
}

/**
 * 통합 콘텐츠 검증 함수
 */
export function validateContentData(data: any): { 
  isValid: boolean; 
  errors: string[]; 
  sanitized?: any 
} {
  const errors: string[] = []
  const sanitized: any = {}

  // 제목 검증
  const title = validateAndSanitizeTitle(data.title)
  if (!title) {
    errors.push('제목이 올바르지 않습니다. (1-200자)')
  } else {
    sanitized.title = title
  }

  // 내용 검증 (HTML 허용)
  if (!data.content || typeof data.content !== 'string') {
    errors.push('내용을 입력해주세요.')
  } else {
    sanitized.content = sanitizeHTML(data.content)
    if (sanitized.content.length === 0) {
      errors.push('내용이 비어있습니다.')
    }
  }

  // 작성자 검증
  const author = validateAndSanitizeAuthor(data.author_name)
  if (!author) {
    errors.push('작성자명이 올바르지 않습니다. (한글/영문/숫자만 허용, 1-50자)')
  } else {
    sanitized.author_name = author
  }

  // 카테고리 검증
  if (!validateCategory(data.category)) {
    errors.push('올바르지 않은 카테고리입니다.')
  } else {
    sanitized.category = data.category
  }

  // 이메일 검증 (선택사항)
  if (data.author_email) {
    const email = validateAndSanitizeEmail(data.author_email)
    if (!email) {
      errors.push('올바르지 않은 이메일 형식입니다.')
    } else {
      sanitized.author_email = email
    }
  }

  // URL 필드 검증 (선택사항)
  if (data.image_url) {
    const imageUrl = validateAndSanitizeURL(data.image_url)
    if (!imageUrl) {
      errors.push('올바르지 않은 이미지 URL입니다.')
    } else {
      sanitized.image_url = imageUrl
    }
  }

  if (data.video_url) {
    const videoUrl = validateAndSanitizeURL(data.video_url)
    if (!videoUrl) {
      errors.push('올바르지 않은 동영상 URL입니다.')
    } else {
      sanitized.video_url = videoUrl
    }
  }

  // 한시 필드 검증
  if (data.category === 'poetry') {
    if (data.original_text) {
      sanitized.original_text = sanitizeHTML(data.original_text)
    }
    if (data.translation) {
      sanitized.translation = sanitizeHTML(data.translation)
    }
  }

  // 기타 텍스트 필드
  if (data.video_platform) {
    sanitized.video_platform = sanitizeText(data.video_platform)
  }

  // Boolean 필드
  if (typeof data.is_published === 'boolean') {
    sanitized.is_published = data.is_published
  }
  if (typeof data.featured === 'boolean') {
    sanitized.featured = data.featured
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: errors.length === 0 ? sanitized : undefined
  }
}
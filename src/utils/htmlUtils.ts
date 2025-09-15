/**
 * HTML 콘텐츠를 순수 텍스트로 변환하는 유틸리티 함수들
 */

/**
 * HTML 태그를 제거하고 순수 텍스트만 추출합니다.
 * @param html HTML 문자열
 * @returns 순수 텍스트
 */
export function stripHtmlTags(html: string): string {
  if (!html) return ''
  
  // HTML 태그 제거
  let text = html.replace(/<[^>]*>/g, '')
  
  // HTML 엔티티 디코딩
  text = text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&nbsp;/g, ' ')
  
  // 여러 공백을 하나로 변환
  text = text.replace(/\s+/g, ' ')
  
  // 앞뒤 공백 제거
  return text.trim()
}

/**
 * HTML 콘텐츠에서 미리보기 텍스트를 생성합니다.
 * @param html HTML 문자열
 * @param maxLength 최대 길이 (기본값: 150)
 * @returns 미리보기 텍스트
 */
export function generatePreviewText(html: string, maxLength: number = 150): string {
  const plainText = stripHtmlTags(html)
  
  if (plainText.length <= maxLength) {
    return plainText
  }
  
  // 단어 경계에서 자르기
  const truncated = plainText.substring(0, maxLength)
  const lastSpaceIndex = truncated.lastIndexOf(' ')
  
  if (lastSpaceIndex > maxLength * 0.8) {
    return truncated.substring(0, lastSpaceIndex) + '...'
  }
  
  return truncated + '...'
}

/**
 * HTML에서 첫 번째 이미지 URL을 추출합니다.
 * @param html HTML 문자열
 * @returns 이미지 URL 또는 null
 */
export function extractFirstImage(html: string): string | null {
  if (!html) return null
  
  const imgRegex = /<img[^>]+src\s*=\s*["']([^"']+)["']/i
  const match = html.match(imgRegex)
  
  return match ? match[1] : null
}

/**
 * HTML에서 텍스트 길이를 계산합니다 (태그는 제외)
 * @param html HTML 문자열
 * @returns 텍스트 길이
 */
export function getTextLength(html: string): number {
  return stripHtmlTags(html).length
}

/**
 * HTML 콘텐츠가 비어있는지 확인합니다.
 * @param html HTML 문자열
 * @returns 비어있으면 true
 */
export function isEmptyContent(html: string): boolean {
  if (!html) return true
  
  const plainText = stripHtmlTags(html)
  return plainText.length === 0
}

/**
 * HTML에서 링크들을 추출합니다.
 * @param html HTML 문자열
 * @returns 링크 URL 배열
 */
export function extractLinks(html: string): string[] {
  if (!html) return []
  
  const linkRegex = /<a[^>]+href\s*=\s*["']([^"']+)["']/gi
  const links: string[] = []
  let match
  
  while ((match = linkRegex.exec(html)) !== null) {
    links.push(match[1])
  }
  
  return links
}

/**
 * HTML 콘텐츠의 첫 번째 문단을 추출합니다.
 * @param html HTML 문자열
 * @returns 첫 번째 문단 텍스트
 */
export function extractFirstParagraph(html: string): string {
  if (!html) return ''
  
  // <p> 태그 내용 추출
  const pRegex = /<p[^>]*>(.*?)<\/p>/i
  const match = html.match(pRegex)
  
  if (match) {
    return stripHtmlTags(match[1]).trim()
  }
  
  // <p> 태그가 없으면 전체에서 첫 번째 줄바꿈까지
  const plainText = stripHtmlTags(html)
  const firstLine = plainText.split('\n')[0]
  
  return firstLine.trim()
}
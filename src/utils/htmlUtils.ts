/**
 * HTML 콘텐츠를 순수 텍스트로 변환하는 유틸리티 함수들
 */

/**
 * HTML 엔터티를 디코딩합니다.
 * @param text 엔터티가 포함된 문자열
 * @returns 디코딩된 문자열
 */
function decodeHTMLEntities(text: string): string {
  const entities: { [key: string]: string } = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>'
    // 필요한 다른 엔터티들을 여기에 추가할 수 있습니다.
    // 예를 들어, " -> &quot;, ' -> &#x27; 등
  };

  let decodedText = text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&nbsp;/g, ' ');

  // &#dddd; 또는 &#xhhhh; 형태의 숫자 엔터티 디코딩
  decodedText = decodedText.replace(/&#([0-9]+);/g, (match, dec) => String.fromCharCode(dec));
  decodedText = decodedText.replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)));

  return decodedText;
}

/**
 * HTML 태그를 제거하고 순수 텍스트만 추출합니다.
 * @param html HTML 문자열
 * @returns 순수 텍스트
 */
export function stripHtmlTags(html: string): string {
  if (!html) return ''
  
  // HTML 태그 제거
  let text = html.replace(/<[^>]*>/g, '')
  
  // HTML 엔티티 디코딩 (기본)
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
 * HTML 태그 제거 및 모든 HTML 엔터티를 디코딩하여 순수 텍스트로 변환합니다.
 * 메인 페이지 미리보기용으로 사용하기 적합합니다.
 * @param html HTML 문자열
 * @returns 모든 엔터티가 디코딩된 순수 텍스트
 */
export function stripHtmlAndDecodeEntities(html: string): string {
  if (!html) return ''
  
  // HTML 태그 제거
  let text = html.replace(/<[^>]*>/g, '')
  
  // 모든 HTML 엔터티 디코딩 (DOM 없이)
  text = decodeHTMLEntities(text)
  
  // 여러 공백을 하나로 변환
  text = text.replace(/\s+/g, ' ')
  
  // 앞뒤 공백 제거
  return text.trim()
}

/**
 * TTS에 적합하도록 HTML 태그와 엔터티를 제거하고 깔끔한 텍스트만 남깁니다.
 * TTS 음성 합성에 방해가 될 수 있는 특수 문자와 중복 공백을 정리합니다.
 * @param html HTML 문자열
 * @returns TTS에 적합한 깔끔한 텍스트
 */
export function cleanTextForTTS(html: string): string {
  if (!html) return ''
  
  // 먼저 모든 HTML 태그와 엔터티 제거
  let text = stripHtmlAndDecodeEntities(html)
  
  // TTS에 방해될 수 있는 특수 문자 처리
  text = text
    // 여러 개의 구두점 연속 사용 정리 (예: '!!!' -> '!')
    .replace(/([!?.])+/g, '$1')
    // 불필요한 심볼 제거 또는 변환
    .replace(/[\*\#\@\~\`\|\^]/g, '')
    // 괄호 안의 내용은 유지하되 TTS 발음을 위해 공백 추가
    .replace(/(\()([^)]*)(\))/g, ' $1 $2 $3 ')
    // 숫자와 단위 사이에 공백 추가 (예: '100kg' -> '100 kg')
    .replace(/(\d+)([a-zA-Z가-힣]+)/g, '$1 $2')
  
  // 중복 공백 제거 및 정리
  text = text.replace(/\s+/g, ' ').trim()
  
  return text
}

/**
 * HTML 콘텐츠에서 미리보기 텍스트를 생성합니다.
 * 모든 HTML 엔터티를 디코딩하고 지정된 길이로 잘라서 반환합니다.
 * @param html HTML 문자열
 * @param maxLength 최대 길이 (기본값: 150)
 * @returns 미리보기 텍스트
 */
export function generatePreviewText(html: string, maxLength: number = 150): string {
  // 향상된 함수를 사용하여 모든 엔터티 디코딩
  const plainText = stripHtmlAndDecodeEntities(html)
  
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
    return stripHtmlAndDecodeEntities(match[1]).trim()
  }
  
  // <p> 태그가 없으면 전체에서 첫 번째 줄바꿈까지
  const plainText = stripHtmlAndDecodeEntities(html)
  const firstLine = plainText.split('\n')[0]
  
  return firstLine.trim()
}

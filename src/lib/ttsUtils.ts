// TTS 백그라운드 생성 유틸리티 함수
import { cleanTextForTTS } from '../utils/htmlUtils'

/**
 * 백그라운드에서 TTS 파일을 생성합니다.
 * 이 함수는 콘텐츠 생성/수정 시 자동으로 호출되어 TTS 파일을 미리 생성합니다.
 */
export async function generateTTSInBackground(contentId: string, text: string) {
  try {
    // HTML 태그와 엔터티 제거 및 TTS에 적합하게 정리
    const cleanText = cleanTextForTTS(text)
    
    // 텍스트가 너무 짧으면 TTS 생성하지 않음
    if (cleanText.length < 50) {
      return false
    }
    
    // 백그라운드 TTS 생성 시작
    
    // 논블로킹 방식으로 TTS 생성 요청
    fetch('/api/tts/cached', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contentId,
        text: cleanText
      }),
    }).then(async (response) => {
      if (response.ok) {
        const result = await response.json()
        // TTS 생성 완료
      } else {
        const error = await response.json()
        // TTS 생성 실패
      }
    }).catch(error => {
      // TTS 생성 네트워크 오류
    })
    
    return true
  } catch (error) {
    // TTS 생성 오류
    return false
  }
}

/**
 * 에세이 콘텐츠인지 확인하여 TTS 생성이 필요한지 판단합니다.
 */
export function shouldGenerateTTS(category: string, content: string): boolean {
  // 에세이 카테고리만 TTS 생성
  if (category !== 'essay') {
    return false
  }
  
  // HTML 태그와 엔터티 제거 후 텍스트 길이 확인
  const cleanText = cleanTextForTTS(content)
  
  // 최소 50글자 이상일 때만 TTS 생성
  return cleanText.length >= 50
}

/**
 * 텍스트 변경 여부를 확인합니다.
 * 콘텐츠 수정 시 텍스트가 실제로 변경되었을 때만 TTS를 재생성합니다.
 */
export function hasTextChanged(oldText: string, newText: string): boolean {
  const cleanOldText = cleanTextForTTS(oldText)
  const cleanNewText = cleanTextForTTS(newText)
  
  return cleanOldText !== cleanNewText
}

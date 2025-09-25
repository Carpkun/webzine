import { supabase } from '../../lib/supabase'
import { Content, ContentCategory } from '../../lib/types'

/**
 * ID로 개별 콘텐츠를 조회합니다
 */
export async function getContentById(id: string): Promise<Content | null> {
  const { data, error } = await supabase
    .from('contents')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    return null
  }

  return data
}

/**
 * 특정 카테고리에서 관련 콘텐츠를 가져옵니다 (현재 콘텐츠 제외)
 */
export async function getRelatedContents(
  category: ContentCategory, 
  currentContentId: string,
  limit: number = 3
): Promise<Content[]> {
  const { data, error } = await supabase
    .from('contents')
    .select('*')
    .eq('category', category)
    .neq('id', currentContentId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    return []
  }

  return data || []
}

/**
 * 조회수를 증가시킵니다
 */
export async function incrementViewCount(id: string): Promise<void> {
  try {
    // 현재 조회수를 가져옴
    const { data: current, error: fetchError } = await supabase
      .from('contents')
      .select('view_count')
      .eq('id', id)
      .single()

    if (fetchError) {
      return
    }

    // 조회수를 1 증가
    const { error: updateError } = await supabase
      .from('contents')
      .update({ view_count: (current.view_count || 0) + 1 })
      .eq('id', id)

    if (updateError) {
      // Update error occurred
    }
  } catch (error) {
    // Error incrementing view count
  }
}

/**
 * 좋아요를 토글합니다 (실제 구현에서는 사용자 인증이 필요함)
 */
export async function toggleLike(id: string): Promise<boolean> {
  try {
    // 현재 좋아요 수를 가져옴
    const { data: current, error: fetchError } = await supabase
      .from('contents')
      .select('likes_count')
      .eq('id', id)
      .single()

    if (fetchError) throw fetchError

    // 좋아요 수를 증가 (실제 구현에서는 사용자별 좋아요 상태 관리 필요)
    const { error: updateError } = await supabase
      .from('contents')
      .update({ likes_count: (current.likes_count || 0) + 1 })
      .eq('id', id)

    if (updateError) throw updateError

    return true
  } catch (error) {
    return false
  }
}

/**
 * 카테고리 한국어 이름을 반환합니다
 */
export function getCategoryDisplayName(category: ContentCategory): string {
  const categoryNames = {
    essay: '수필',
    poetry: '한시',
    photo: '사진',
    calligraphy: '서화',
    video: '영상'
  }
  
  return categoryNames[category] || category
}

/**
 * 카테고리 아이콘을 반환합니다
 */
export function getCategoryIcon(category: ContentCategory): string {
  const categoryIcons = {
    essay: '📝',
    poetry: '📜',
    photo: '📸',
    calligraphy: '🖼️',
    video: '🎬'
  }
  
  return categoryIcons[category] || '📄'
}

/**
 * 콘텐츠 타입을 확인하는 타입 가드 함수들
 */
export function isEssayContent(content: Content): content is Content & { category: 'essay' } {
  return content.category === 'essay'
}

export function isPoetryContent(content: Content): content is Content & { category: 'poetry' } {
  return content.category === 'poetry'
}

export function isPhotoContent(content: Content): content is Content & { category: 'photo' } {
  return content.category === 'photo'
}

export function isCalligraphyContent(content: Content): content is Content & { category: 'calligraphy' } {
  return content.category === 'calligraphy'
}

export function isVideoContent(content: Content): content is Content & { category: 'video' } {
  return content.category === 'video'
}

/**
 * YouTube URL에서 비디오 ID를 추출합니다
 */
export function getYouTubeVideoId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  const match = url.match(regExp)
  return (match && match[2].length === 11) ? match[2] : null
}
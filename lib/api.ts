// API 호출을 위한 유틸리티 함수들
import { supabase } from './supabase'

// 인증이 필요한 API 호출을 위한 fetch 래퍼
export const authenticatedFetch = async (url: string, options?: RequestInit) => {
  // 현재 세션에서 액세스 토큰 가져오기
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session?.access_token) {
    throw new Error('로그인이 필요합니다.')
  }

  // Authorization 헤더 추가 + 캐시 무효화
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    ...(options?.headers || {})
  }

  return fetch(url, {
    ...options,
    headers,
    cache: 'no-store', // 브라우저 캐시 완전 비활성화
  })
}

// 관리자 API 호출 헬퍼 함수들
export const adminAPI = {
  // 콘텐츠 목록 조회
  getContents: (params?: URLSearchParams) => {
    const url = params 
      ? `/api/admin/contents?${params.toString()}`
      : '/api/admin/contents'
    return authenticatedFetch(url)
  },

  // 콘텐츠 생성
  createContent: (data: unknown) => {
    return authenticatedFetch('/api/admin/contents', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  // 콘텐츠 수정
  updateContent: (id: string, data: unknown) => {
    return authenticatedFetch(`/api/admin/contents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  },

  // 콘텐츠 삭제
  deleteContent: (id: string) => {
    return authenticatedFetch(`/api/admin/contents/${id}`, {
      method: 'DELETE'
    })
  },

  // 콘텐츠 상태 변경
  updateContentStatus: (id: string, action: string, value?: unknown) => {
    return authenticatedFetch(`/api/admin/contents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ action, value })
    })
  }
}
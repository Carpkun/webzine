// API 호출을 위한 유틸리티 함수들
import { supabase } from './supabase'

// 인증이 필요한 API 호출을 위한 fetch 래퍼
export const authenticatedFetch = async (url: string, options?: RequestInit) => {
  // 현재 세션에서 액세스 토큰 가져오기
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  
  if (!session?.access_token) {
    throw new Error('로그인이 필요합니다.')
  }

  // Authorization 헤더 추가 + 적절한 캠시 정책
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
    // GET 요청에만 조건부 캠시 허용
    ...((!options?.method || options.method === 'GET') ? {
      'Cache-Control': 'private, max-age=30'
    } : {
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }),
    ...(options?.headers || {})
  }

  return fetch(url, {
    ...options,
    headers,
    // GET 요청에만 짧은 캠시 허용
    cache: (!options?.method || options.method === 'GET') ? 'default' : 'no-store',
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
  },

  // 작가 목록 조회
  getAuthors: () => {
    return authenticatedFetch('/api/admin/authors')
  },

  // 작가 생성
  createAuthor: (data: { name: string; bio?: string; profile_image_url?: string }) => {
    return authenticatedFetch('/api/admin/authors', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  // 전체 통계 조회
  getOverallStats: () => {
    return authenticatedFetch('/api/admin/stats')
  }
}

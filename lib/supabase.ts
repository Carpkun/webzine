import { createClient, Session } from '@supabase/supabase-js'
import { Database } from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 타입이 적용된 Supabase 클라이언트
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Client-Info': 'webzine-app'
    }
  },
  realtime: {
    params: {
      eventsPerSecond: 2
    }
  }
})

// 타입 안전성을 위한 헬퍼 함수
export const getContentsTable = () => supabase.from('contents')

// ===== 인증 관련 함수 =====

// 관리자 계정 정보
export const ADMIN_EMAIL = 'cccc@cccc.or.kr'
export const ADMIN_PASSWORD = 'ansghk2025@$'

// 이메일/비밀번호 로그인
export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

// 로그아웃
export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

// 현재 사용자 가져오기
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}

// 관리자 권한 확인
export const isAdmin = (userEmail?: string) => {
  return userEmail === ADMIN_EMAIL
}

// 세션 상태 변경 감지
export const onAuthStateChange = (callback: (event: string, session: Session | null) => void) => {
  return supabase.auth.onAuthStateChange(callback)
}

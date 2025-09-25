'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase, isAdmin } from '../../lib/supabase'
import AdminLoginForm from '../components/AdminLoginForm'

// 인증 컨텍스트 타입 정의
interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  isAdmin: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<{ error: Error | null }>
}

// 컨텍스트 생성
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// 커스텀 훅
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// 인증 프로바이더 컴포넌트
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 초기 세션 확인
    const getInitialSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) {
        console.error('세션 확인 오류:', error)
      } else {
        setSession(session)
        setUser(session?.user ?? null)
      }
      setLoading(false)
    }

    getInitialSession()

    // 인증 상태 변경 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('인증 상태 변경:', event, session?.user?.email)
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    // 클린업
    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  // 로그인 함수
  const signIn = async (email: string, password: string) => {
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      console.error('로그인 오류:', error.message)
    } else {
      console.log('로그인 성공:', data.user?.email)
    }
    
    setLoading(false)
    return { error }
  }

  // 로그아웃 함수
  const signOut = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('로그아웃 오류:', error.message)
    } else {
      console.log('로그아웃 성공')
      setUser(null)
      setSession(null)
    }
    
    setLoading(false)
    return { error }
  }

  // 관리자 권한 확인
  const isUserAdmin = isAdmin(user?.email)

  const value: AuthContextType = {
    user,
    session,
    loading,
    isAdmin: isUserAdmin,
    signIn,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// 관리자 전용 컴포넌트 래퍼
export const AdminOnly = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, isAdmin } = useAuth()

  // 로딩 중일 때
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">로딩 중...</p>
        </div>
      </div>
    )
  }

  // 로그인되지 않았거나 관리자가 아닐 때 로그인 폼 표시
  if (!user || !isAdmin) {
    return <AdminLoginForm />
  }

  // 관리자로 로그인되었을 때 자식 컴포넌트 렌더링
  return <>{children}</>
}

// 로그인 필수 컴포넌트 래퍼
export const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="flex items-center justify-center p-4">로딩 중...</div>
  }

  if (!user) {
    return <div className="flex items-center justify-center p-4">로그인이 필요합니다.</div>
  }

  return <>{children}</>
}
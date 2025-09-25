'use client'

import { useState } from 'react'
import { useAuth } from '../../lib/auth-context'
import { LoginForm } from './LoginForm'
import { Modal } from '../ui/Modal'

export const AuthStatus = () => {
  const { user, isAdmin, signOut, loading } = useAuth()
  const [showLoginForm, setShowLoginForm] = useState(false)

  const handleSignOut = async () => {
    const { error } = await signOut()
    if (error) {
      console.error('로그아웃 오류:', error)
    }
  }

  const handleLoginSuccess = () => {
    setShowLoginForm(false)
  }

  const handleLoginCancel = () => {
    setShowLoginForm(false)
  }

  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-gray-600">
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600"></div>
        <span className="text-sm">인증 확인 중...</span>
      </div>
    )
  }

  if (!user) {
    return (
      <>
        <button
          onClick={() => setShowLoginForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
        >
          관리자 로그인
        </button>

        <Modal 
          isOpen={showLoginForm} 
          onClose={handleLoginCancel}
          className="animate-in fade-in-0 zoom-in-95 duration-300"
        >
          <LoginForm
            onSuccess={handleLoginSuccess}
            onCancel={handleLoginCancel}
          />
        </Modal>
      </>
    )
  }

  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {user.email?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900">
              {user.email}
            </span>
            {isAdmin && (
              <span className="text-xs text-blue-600 font-medium">관리자</span>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={handleSignOut}
        disabled={loading}
        className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
      >
        로그아웃
      </button>
    </div>
  )
}
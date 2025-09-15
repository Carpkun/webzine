'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { Content } from '../../lib/types'

interface ContentContextType {
  // 콘텐츠 상태 업데이트
  updateContentLikes: (contentId: string, newLikesCount: number) => void
  updateContentViews: (contentId: string, newViewCount: number) => void
  
  // 개별 콘텐츠 상태 추적
  getContentStats: (contentId: string) => { likes_count?: number; view_count?: number } | null
  
  // 전체 콘텐츠 목록 업데이트 (메인 페이지용)
  updateContentsInList: (updater: (contents: Content[]) => Content[]) => void
  setContentsList: (contents: Content[]) => void
  contentsList: Content[]
}

const ContentContext = createContext<ContentContextType | undefined>(undefined)

interface ContentProviderProps {
  children: ReactNode
}

export function ContentProvider({ children }: ContentProviderProps) {
  // 개별 콘텐츠 상태 추적 (contentId -> stats)
  const [contentStats, setContentStats] = useState<Record<string, { likes_count: number; view_count: number }>>({})
  
  // 메인 페이지의 콘텐츠 목록
  const [contentsList, setContentsList] = useState<Content[]>([])
  
  // 좋아요 수 업데이트
  const updateContentLikes = useCallback((contentId: string, newLikesCount: number) => {
    console.log(`🔄 콘텐츠 ${contentId} 좋아요 업데이트: ${newLikesCount}`)
    
    // 개별 상태 업데이트
    setContentStats(prev => ({
      ...prev,
      [contentId]: {
        ...prev[contentId],
        likes_count: newLikesCount,
        view_count: prev[contentId]?.view_count || 0
      }
    }))
    
    // 목록 상태 업데이트
    setContentsList(prev => 
      prev.map(content => 
        content.id === contentId 
          ? { ...content, likes_count: newLikesCount }
          : content
      )
    )
  }, [])
  
  // 조회수 업데이트
  const updateContentViews = useCallback((contentId: string, newViewCount: number) => {
    console.log(`🔄 콘텐츠 ${contentId} 조회수 업데이트: ${newViewCount}`)
    
    // 개별 상태 업데이트
    setContentStats(prev => ({
      ...prev,
      [contentId]: {
        ...prev[contentId],
        view_count: newViewCount,
        likes_count: prev[contentId]?.likes_count || 0
      }
    }))
    
    // 목록 상태 업데이트
    setContentsList(prev => 
      prev.map(content => 
        content.id === contentId 
          ? { ...content, view_count: newViewCount }
          : content
      )
    )
  }, [])
  
  // 개별 콘텐츠 상태 조회
  const getContentStats = useCallback((contentId: string) => {
    return contentStats[contentId] || null
  }, [contentStats])
  
  // 콘텐츠 목록 업데이트 함수
  const updateContentsInList = useCallback((updater: (contents: Content[]) => Content[]) => {
    setContentsList(prev => updater(prev))
  }, [])
  
  const value: ContentContextType = {
    updateContentLikes,
    updateContentViews,
    getContentStats,
    updateContentsInList,
    setContentsList,
    contentsList
  }
  
  return (
    <ContentContext.Provider value={value}>
      {children}
    </ContentContext.Provider>
  )
}

export function useContentContext() {
  const context = useContext(ContentContext)
  if (context === undefined) {
    throw new Error('useContentContext must be used within a ContentProvider')
  }
  return context
}
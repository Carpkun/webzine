'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Content, ContentCategory } from '../lib/types'
import { getRelatedContents, getCategoryDisplayName, getCategoryIcon } from '../lib/contentUtils'
import ContentCard from './ContentCard'

interface RelatedContentsProps {
  category: ContentCategory
  currentContentId: string
  limit?: number
}

export default function RelatedContents({ 
  category, 
  currentContentId, 
  limit = 3 
}: RelatedContentsProps) {
  const [relatedContents, setRelatedContents] = useState<Content[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchRelatedContents() {
      try {
        setLoading(true)
        setError(null)
        
        const contents = await getRelatedContents(category, currentContentId, limit)
        setRelatedContents(contents)
      } catch (err) {
        setError('관련 작품을 불러오는 중 오류가 발생했습니다.')
        console.error('Error fetching related contents:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchRelatedContents()
  }, [category, currentContentId, limit])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <span className="text-xl">{getCategoryIcon(category)}</span>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            관련 {getCategoryDisplayName(category)} 작품
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: limit }).map((_, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-pulse">
              <div className="h-48 bg-gray-200 dark:bg-gray-700"></div>
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <span className="text-xl">{getCategoryIcon(category)}</span>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            관련 {getCategoryDisplayName(category)} 작품
          </h2>
        </div>
        
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (relatedContents.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <span className="text-xl">{getCategoryIcon(category)}</span>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            관련 {getCategoryDisplayName(category)} 작품
          </h2>
        </div>
        
        <div className="text-center py-8">
          <div className="text-4xl mb-4">{getCategoryIcon(category)}</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            관련 작품이 없습니다
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            이 카테고리에 다른 작품이 아직 없습니다.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{getCategoryIcon(category)}</span>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            관련 {getCategoryDisplayName(category)} 작품
          </h2>
        </div>
        
        <Link
          href={`/?category=${category}`}
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium flex items-center gap-1 transition-colors"
        >
          더 보기
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {relatedContents.map((content) => (
          <ContentCard 
            key={content.id} 
            content={content}
            showCategory={false} // 같은 카테고리이므로 카테고리 표시하지 않음
          />
        ))}
      </div>
    </div>
  )
}
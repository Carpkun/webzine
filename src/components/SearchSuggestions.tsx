'use client'

import { useState, useEffect, useCallback } from 'react'
import { Content } from '../lib/types'
import { getCategoryDisplayName, getCategoryIcon } from '../lib/contentUtils'

interface SearchSuggestionsProps {
  query: string
  contents: Content[]
  onSuggestionClick: (suggestion: string) => void
  onContentClick: (contentId: string) => void
  className?: string
}

interface SearchSuggestion {
  type: 'content' | 'category' | 'author' | 'keyword'
  value: string
  label: string
  count?: number
  content?: Content
}

export default function SearchSuggestions({
  query,
  contents,
  onSuggestionClick,
  onContentClick,
  className = ''
}: SearchSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])

  const generateSuggestions = useCallback(() => {
    if (!query || query.trim().length < 2) {
      setSuggestions([])
      return
    }

    const queryLower = query.toLowerCase().trim()
    const newSuggestions: SearchSuggestion[] = []

    // 콘텐츠 제목 매칭
    const matchingContents = contents.filter(content =>
      content.title.toLowerCase().includes(queryLower) ||
      content.content.toLowerCase().includes(queryLower)
    ).slice(0, 3)

    matchingContents.forEach(content => {
      newSuggestions.push({
        type: 'content',
        value: content.title,
        label: content.title,
        content
      })
    })

    // 카테고리 제안
    const categories = ['essay', 'poetry', 'photo', 'calligraphy', 'video'] as const
    categories.forEach(category => {
      const categoryName = getCategoryDisplayName(category)
      if (categoryName.toLowerCase().includes(queryLower)) {
        const categoryContents = contents.filter(c => c.category === category)
        if (categoryContents.length > 0) {
          newSuggestions.push({
            type: 'category',
            value: category,
            label: `${getCategoryIcon(category)} ${categoryName}`,
            count: categoryContents.length
          })
        }
      }
    })

    // 작성자 제안
    const authors = [...new Set(contents.map(c => c.author_name).filter(Boolean))]
    const matchingAuthors = authors.filter(author =>
      author.toLowerCase().includes(queryLower)
    ).slice(0, 2)

    matchingAuthors.forEach(author => {
      const authorContents = contents.filter(c => c.author_name === author)
      newSuggestions.push({
        type: 'author',
        value: author,
        label: `${author} 작품`,
        count: authorContents.length
      })
    })

    // 키워드 제안 (일반적인 검색어)
    const keywords = ['봄', '가을', '추억', '자연', '사랑', '희망', '여행', '일상']
    const matchingKeywords = keywords.filter(keyword =>
      keyword.includes(queryLower) && keyword !== queryLower
    ).slice(0, 2)

    matchingKeywords.forEach(keyword => {
      newSuggestions.push({
        type: 'keyword',
        value: keyword,
        label: `"${keyword}" 검색`
      })
    })

    setSuggestions(newSuggestions.slice(0, 6))
  }, [query, contents])

  useEffect(() => {
    const timer = setTimeout(() => {
      generateSuggestions()
    }, 200)

    return () => clearTimeout(timer)
  }, [generateSuggestions])

  if (suggestions.length === 0) {
    return null
  }

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    if (suggestion.type === 'content' && suggestion.content) {
      onContentClick(suggestion.content.id)
    } else if (suggestion.type === 'category') {
      // 카테고리 필터로 이동
      window.location.href = `/?category=${suggestion.value}`
    } else {
      onSuggestionClick(suggestion.value)
    }
  }

  return (
    <div className={`absolute top-full left-0 right-0 z-50 mt-1 ${className}`}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="max-h-80 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.type}-${index}`}
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-600 last:border-b-0 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {/* 타입별 아이콘 */}
                  <div className="text-gray-400 dark:text-gray-500">
                    {suggestion.type === 'content' && '📄'}
                    {suggestion.type === 'category' && suggestion.value}
                    {suggestion.type === 'author' && '👤'}
                    {suggestion.type === 'keyword' && '🔍'}
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {suggestion.type === 'category' ? (
                        <span dangerouslySetInnerHTML={{ __html: suggestion.label }} />
                      ) : (
                        suggestion.label
                      )}
                    </div>
                    {suggestion.content && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {getCategoryDisplayName(suggestion.content.category)} • {suggestion.content.author_name}
                      </div>
                    )}
                  </div>
                </div>
                
                {suggestion.count !== undefined && (
                  <div className="text-xs text-gray-400 dark:text-gray-500">
                    {suggestion.count}개
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
        
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Enter 키를 눌러 &quot;{query}&quot; 검색
          </p>
        </div>
      </div>
    </div>
  )
}
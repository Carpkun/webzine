'use client'

import { useState, useEffect, useRef, KeyboardEvent } from 'react'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  debounceMs?: number
  onSubmit?: (value: string) => void
  showSuggestions?: boolean
  ariaLabel?: string
}

export default function SearchBar({ 
  value, 
  onChange, 
  placeholder = "제목이나 내용으로 검색...",
  debounceMs = 300,
  onSubmit,
  showSuggestions = false,
  ariaLabel = "콘텐츠 검색"
}: SearchBarProps) {
  const [localValue, setLocalValue] = useState(value)
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // 디바운스 효과
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue)
      }
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [localValue, onChange, value, debounceMs])

  // 외부에서 value가 변경될 때 동기화
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  const handleClear = () => {
    setLocalValue('')
    onChange('')
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onSubmit?.(localValue)
    } else if (e.key === 'Escape') {
      handleClear()
    }
  }

  const handleFocus = () => {
    setIsFocused(true)
  }

  const handleBlur = () => {
    // 지연으로 블러 처리 (마우스 클릭 이벤트를 위해)
    setTimeout(() => {
      setIsFocused(false)
    }, 150)
  }

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg 
          className="h-5 w-5 text-gray-400" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
          />
        </svg>
      </div>
      
      <input
        ref={inputRef}
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        aria-label={ariaLabel}
        aria-describedby={localValue ? 'search-clear-button' : undefined}
        role="searchbox"
        autoComplete="off"
        className={`
          block w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 
          rounded-lg leading-5 bg-white dark:bg-gray-800 
          text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          transition-all duration-200
          ${isFocused && showSuggestions ? 'rounded-b-none' : ''}
        `}
      />
      
      {localValue && (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          <button
            id="search-clear-button"
            onClick={handleClear}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="검색어 지우기"
            tabIndex={0}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
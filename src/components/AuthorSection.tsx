'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface Author {
  id: string
  name: string
  bio?: string
  profile_image_url?: string
  created_at: string
}

interface AuthorSectionProps {
  authorId: string | null
  authorName: string
  currentContentId?: string // 현재 콘텐츠 ID (제외용)
}

export default function AuthorSection({ authorId, authorName, currentContentId }: AuthorSectionProps) {
  const [author, setAuthor] = useState<Author | null>(null)
  const [authorWorks, setAuthorWorks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAuthorData = async () => {
      if (!authorId) {
        // authorId가 없으면 author_name만으로 검색
        setAuthor({
          id: '',
          name: authorName,
          created_at: new Date().toISOString()
        })
        setLoading(false)
        return
      }

      try {
        // 작가 정보 조회
        const authorResponse = await fetch(`/api/authors/${authorId}`)
        if (authorResponse.ok) {
          const authorData = await authorResponse.json()
          setAuthor(authorData)

          // 작가의 다른 작품들 조회 (최대 3개)
          const worksResponse = await fetch(`/api/authors/${authorId}/contents?limit=4`) // 현재 콘텐츠 제외를 위해 4개 가져오기
          if (worksResponse.ok) {
            const worksData = await worksResponse.json()
            let works = worksData.contents || []
            
            // 현재 콘텐츠 제외
            if (currentContentId) {
              works = works.filter((work: any) => work.id !== currentContentId)
            }
            
            // 최대 3개로 제한
            setAuthorWorks(works.slice(0, 3))
          }
        } else {
          setAuthor({
            id: '',
            name: authorName,
            created_at: new Date().toISOString()
          })
        }
      } catch (err) {
        console.error('작가 정보 조회 실패:', err)
        setError('작가 정보를 불러올 수 없습니다.')
        setAuthor({
          id: '',
          name: authorName,
          created_at: new Date().toISOString()
        })
      } finally {
        setLoading(false)
      }
    }

    fetchAuthorData()
  }, [authorId, authorName])

  if (loading) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
          <div>
            <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-32 mb-2"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-48"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !author) {
    return null
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        👤 작가 소개
      </h3>
      
      <div className="flex flex-col sm:flex-row gap-4">
        {/* 작가 프로필 */}
        <div className="flex items-center gap-4 flex-1">
          {/* 프로필 이미지 */}
          <div className="flex-shrink-0">
            {author.profile_image_url ? (
              <div className="relative w-16 h-16 rounded-full overflow-hidden">
                <Image
                  src={author.profile_image_url}
                  alt={`${author.name} 작가`}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xl font-bold">
                  {author.name.charAt(0)}
                </span>
              </div>
            )}
          </div>
          
          {/* 작가 정보 */}
          <div className="flex-1 min-w-0">
            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              {author.name}
            </h4>
            
            {author.bio ? (
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed line-clamp-2">
                {author.bio}
              </p>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                춘천답기에 작품을 기고하는 작가입니다.
              </p>
            )}
          </div>
        </div>
        
        {/* 작가 페이지 이동 버튼 */}
        {author.id && (
          <div className="flex-shrink-0">
            <Link
              href={`/author/${author.id}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              작가 페이지
            </Link>
          </div>
        )}
      </div>
      
      {/* 작가의 다른 작품들 */}
      {authorWorks.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">
            {author.name} 작가의 다른 작품
          </h4>
          <div className="space-y-2">
            {authorWorks.slice(0, 3).map((work: any) => (
              <Link
                key={work.id}
                href={`/content/${work.id}`}
                className="block p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h5 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                      {work.title}
                    </h5>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(work.created_at).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                  <div className="flex-shrink-0 ml-3">
                    <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          
          {author.id && (
            <div className="mt-4">
              <Link
                href={`/author/${author.id}`}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
              >
                → {author.name} 작가의 모든 작품 보기
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
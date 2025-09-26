'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import ResourceHints from './ResourceHints'
import { Content } from '../lib/types'
import { 
  isEssayContent, 
  isPoetryContent, 
  isPhotoContent, 
  isCalligraphyContent, 
  isVideoContent,
  getCategoryDisplayName,
  getCategoryIcon,
  getYouTubeVideoId,
  // incrementViewCount,
  // toggleLike
} from '../lib/contentUtils'
import { useContentContext } from '../contexts/ContentContext'
import { useInView } from 'react-intersection-observer'
import PoetryToggle from './PoetryToggle'
import LikeButton from './LikeButton'
import {
  isValidImageUrl,
  // getImageProps,
  // getFallbackImageUrl,
  generateResponsiveSizes
} from '../utils/imageOptimization'

// 성능 최적화를 위한 동적 임포트
const TTSPlayer = dynamic(() => import('./TTSPlayer'), {
  ssr: false,
  loading: () => <div className="animate-pulse h-10 bg-gray-200 dark:bg-gray-700 rounded" />
})

const CommentSection = dynamic(() => import('./comments/CommentSection'), {
  ssr: false,
  loading: () => (
    <div className="animate-pulse">
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-4" />
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
      </div>
    </div>
  )
})

const PhotoExifInfo = dynamic(() => import('./PhotoExifInfo'), {
  ssr: false,
  loading: () => (
    <div className="animate-pulse mb-6">
      <div className="bg-gray-200 dark:bg-gray-700 rounded-lg p-4">
        <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-24 mb-3" />
        <div className="grid grid-cols-2 gap-2">
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded" />
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4" />
        </div>
      </div>
    </div>
  )
})

// AuthorSection을 Intersection Observer 기반 지연 로딩으로 최적화
const LazyAuthorSection = dynamic(() => import('./AuthorSection'), {
  ssr: false,
  loading: () => (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 animate-pulse border border-gray-200 dark:border-gray-700">
      <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-32 mb-4" />
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-gray-300 dark:bg-gray-700 rounded-full" />
        <div className="flex-1">
          <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-32 mb-2" />
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-48" />
        </div>
      </div>
    </div>
  )
})

interface ContentDetailProps {
  content: Content
}

export default function ContentDetail({ content }: ContentDetailProps) {
  const { updateContentViews } = useContentContext()
  const [imageError, setImageError] = useState(false)
  
  // AuthorSection 지연 로딩을 위한 Intersection Observer
  const { ref: authorRef, inView: authorInView } = useInView({
    threshold: 0.1,
    rootMargin: '100px 0px',
    triggerOnce: true // 한 번만 로드
  })
  
  // 더미 URL 감지 함수
  const isDummyUrl = (url: string | null) => {
    if (!url) return true
    return url.includes('example.com') || url.includes('placeholder') || url.includes('dummy')
  }

  // 페이지 로드시 조회수 증가 (세션 기반 중복 방지)
  useEffect(() => {
    let isMounted = true // cleanup을 위한 플래그
    
    const incrementView = async () => {
      try {
        // 이미 처리된 콘텐츠인지 확인 (중복 방지)
        const viewedKey = `viewed_${content.id}`
        if (sessionStorage.getItem(viewedKey)) {
          return // 이미 조회수가 증가한 콘텐츠
        }
        
        // 세션 스토리지에서 세션 ID 가져오기 또는 생성
        let sessionId = sessionStorage.getItem('webzine_session_id')
        if (!sessionId) {
          sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36)
          sessionStorage.setItem('webzine_session_id', sessionId)
        }
        
        const response = await fetch(`/api/contents/${content.id}/view`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sessionId })
        })
        
        if (!isMounted) return // 컴포넌트가 언마운트된 경우
        
        if (response.ok) {
          const result = await response.json()
          
          // 조회수가 실제로 증가한 경우에만 세션에 기록
          if (result.counted) {
            sessionStorage.setItem(viewedKey, 'true')
            
            // Context에 조회수 업데이트 반영
            if (result.view_count !== undefined) {
              updateContentViews(content.id, result.view_count)
            }
          }
        }
      } catch (error) {
        // 에러 로깅 제거 (성능 최적화)
      }
    }
    
    const timeoutId = setTimeout(incrementView, 100) // 약간의 지연으로 중복 호출 방지
    
    return () => {
      isMounted = false
      clearTimeout(timeoutId)
    }
  }, [content.id, updateContentViews])


  // 공유 기능
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: content.title,
          text: content.description || `${getCategoryDisplayName(content.category)} 작품`,
          url: window.location.href,
        })
      } catch (err) {
        console.log('Error sharing:', err)
      }
    } else {
      // 폴백: 클립보드에 복사
      try {
        await navigator.clipboard.writeText(window.location.href)
        alert('링크가 클립보드에 복사되었습니다.')
      } catch (err) {
        console.log('Error copying to clipboard:', err)
      }
    }
  }

  return (
    <>
      {/* 리소스 프리로딩 */}
      <ResourceHints 
        apiEndpoints={[
          content.author_id ? `/api/authors/${content.author_id}` : undefined,
          content.author_id ? `/api/authors/${content.author_id}/contents?limit=4` : undefined,
          `/api/contents/${content.id}/comments`,
        ].filter(Boolean) as string[]}
        images={[
          content.image_url && isValidImageUrl(content.image_url) ? content.image_url : undefined,
          content.thumbnail_url ? content.thumbnail_url : undefined
        ].filter(Boolean) as string[]}
        customResources={[
          {
            href: `/category/${content.category}`,
            rel: 'prefetch'
          }
        ]}
      />
      
      {/* 히어로 섹션 - 제목만 표시 */}
      <section className="bg-gradient-to-b from-indigo-900 via-purple-900 to-gray-900 text-white py-16 lg:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              {content.title}
            </h1>
            <div className="flex items-center justify-center gap-4 text-sm text-gray-300">
              <time dateTime={content.created_at}>
                {new Date(content.created_at).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </time>
              <span>•</span>
              <span>조회 {content.view_count || 0}회</span>
            </div>
          </div>
        </div>
      </section>
      
      <article className="max-w-4xl mx-auto">
        {/* 헤더 - 내비게이션 및 메타 정보 */}
        <header className="mb-8 px-4 sm:px-6 lg:px-8 mt-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">{getCategoryIcon(content.category)}</span>
            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
              {getCategoryDisplayName(content.category)}
            </span>
          </div>
        
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-6">
            <span>
              작성자: {content.author_id ? (
                <Link 
                  href={`/author/${content.author_id}`}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors"
                >
                  {content.author_name || '익명'}
                </Link>
              ) : (
                <span className="font-medium">{content.author_name || '익명'}</span>
              )}
            </span>
            <span>•</span>
            <span>
              {new Date(content.created_at).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
            <span>•</span>
            <span>조회 {content.view_count || 0}회</span>
          </div>
          
          {content.description && (
            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
              {content.description}
            </p>
          )}
      </header>

        {/* 카테고리별 콘텐츠 렌더링 */}
        <div className="mb-8 px-4 sm:px-6 lg:px-8">
        {isEssayContent(content) && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              {/* TTS 음성 재생 기능 - 본문 위쪽 별도 라인 */}
              <div className="flex justify-end mb-4">
                <TTSPlayer
                  text={content.content}
                  contentId={content.id}
                  className=""
                />
              </div>
              
              <div 
                className="prose prose-lg prose-slate dark:prose-invert max-w-none leading-relaxed content-display"
                dangerouslySetInnerHTML={{ __html: content.content }}
              />
              
              {/* 콘텐츠 표시용 스타일 */}
              <style jsx>{`
                :global(.content-display p) {
                  margin: 0.75rem 0 !important;
                  line-height: 1.6 !important;
                  min-height: 1.6em !important;
                }
                
                :global(.content-display p:empty) {
                  margin: 0.75rem 0 !important;
                  line-height: 1.6 !important;
                  min-height: 1.6em !important;
                  display: block !important;
                }
                
                :global(.content-display p:empty::before) {
                  content: "";
                  display: inline-block;
                  width: 0;
                  height: 1.6em;
                }
                
                :global(.content-display p:first-child) {
                  margin-top: 0 !important;
                }
                
                :global(.content-display p:last-child) {
                  margin-bottom: 0 !important;
                }
                
                :global(.content-display br) {
                  display: block;
                  margin: 0.25rem 0;
                  content: "";
                  line-height: 1.6;
                }
              `}</style>
            </div>
          </div>
        )}

        {isPoetryContent(content) && <PoetryToggle content={content} />}

        {isPhotoContent(content) && (
          <div className="space-y-6">
            <div className="relative">
              {!imageError && isValidImageUrl(content.image_url) ? (
                <div className="relative aspect-[4/3] w-full max-w-4xl mx-auto cursor-zoom-in">
                  <Image
                    src={content.image_url!}
                    alt={`${content.title} - ${content.author_name} 작품`}
                    fill
                    className="object-contain rounded-lg shadow-lg"
                    sizes={generateResponsiveSizes({
                      mobile: '100vw',
                      tablet: '90vw',
                      desktop: '80vw'
                    })}
                    quality={85}
                    priority={false}
                    placeholder="blur"
                    blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD//gA7Q1JFQVRPUjogZ2QtanBlZyB2MS4wICh1c2luZyBJSkcgSlBFRyB2ODApLCBxdWFsaXR5ID0gODUK/9sAhAAQERU="
                    onError={() => setImageError(true)}
                    onClick={() => {
                      // 이미지 확대 기능 (실제 구현에서는 모달이나 lightbox 사용)
                      window.open(content.image_url, '_blank')
                    }}
                  />
                </div>
              ) : (
                <div className="w-full aspect-[4/3] bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📸</div>
                    <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">사진 작품</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {content.image_url ? '이미지를 불러올 수 없습니다' : '이미지 준비 중...'}
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            {/* EXIF 정보 표시 - 이미지와 작품 설명 사이에 배치 */}
            <PhotoExifInfo
              imageUrl={content.image_url!}
              existingExifData={content.image_exif}
              className="mb-6"
            />
            
            {content.content && (
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">작품 설명</h3>
                <div 
                  className="prose prose-gray dark:prose-invert max-w-none content-display"
                  dangerouslySetInnerHTML={{ __html: content.content }}
                />
              </div>
            )}
          </div>
        )}

        {isCalligraphyContent(content) && (
          <div className="space-y-6">
            <div className="relative">
              {!imageError && content.image_url && !isDummyUrl(content.image_url) ? (
                <Image
                  src={content.image_url}
                  alt={content.title}
                  width={800}
                  height={600}
                  className="w-full rounded-lg shadow-lg cursor-zoom-in"
                  onClick={() => {
                    // 이미지 확대 기능 (실제 구현에서는 모달이나 lightbox 사용)
                    window.open(content.image_url, '_blank')
                  }}
                  quality={85}
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 80vw, 70vw"
                  placeholder="blur"
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD//gA7Q1JFQVRPUjogZ2QtanBlZyB2MS4wICh1c2luZyBJSkcgSlBFRyB2ODApLCBxdWFsaXR5ID0gODUK/9sAhAAQERU="
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-full h-96 bg-gradient-to-br from-amber-50 to-orange-100 dark:from-gray-800 dark:to-gray-900 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🖼️</div>
                    <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">서화 작품</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {isDummyUrl(content.image_url) ? '이미지 준비 중...' : '이미지를 불러올 수 없습니다'}
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            {content.content && (
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">작품 해설</h3>
                <div 
                  className="prose prose-gray dark:prose-invert max-w-none content-display"
                  dangerouslySetInnerHTML={{ __html: content.content }}
                />
              </div>
            )}
          </div>
        )}

        {isVideoContent(content) && (
          <div className="space-y-6">
            {content.video_url && (
              <div className="aspect-video">
                {getYouTubeVideoId(content.video_url) ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${getYouTubeVideoId(content.video_url)}`}
                    title={content.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full rounded-lg"
                  />
                ) : (
                  <video
                    src={content.video_url}
                    controls
                    className="w-full h-full rounded-lg"
                  >
                    브라우저가 비디오를 지원하지 않습니다.
                  </video>
                )}
              </div>
            )}
            
            {/* 서화 작품 정보 */}
            {(content.artwork_size || content.artwork_material) && (
              <div className="bg-amber-50 dark:bg-amber-900/10 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
                <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-3">작품 정보</h4>
                <div className="space-y-2 text-sm">
                  {content.artwork_size && (
                    <div className="flex items-center gap-2">
                      <span className="text-amber-600 dark:text-amber-300 font-medium">크기:</span>
                      <span className="text-gray-700 dark:text-gray-300">{content.artwork_size}</span>
                    </div>
                  )}
                  {content.artwork_material && (
                    <div className="flex items-center gap-2">
                      <span className="text-amber-600 dark:text-amber-300 font-medium">재료:</span>
                      <span className="text-gray-700 dark:text-gray-300">{content.artwork_material}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* 공연 정보 */}
            {(content.performance_date || content.performance_venue) && (
              <div className="bg-purple-50 dark:bg-purple-900/10 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-3">공연 정보</h4>
                <div className="space-y-2 text-sm">
                  {content.performance_date && (
                    <div className="flex items-center gap-2">
                      <span className="text-purple-600 dark:text-purple-300 font-medium">공연 일자:</span>
                      <span className="text-gray-700 dark:text-gray-300">
                        {new Date(content.performance_date).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  )}
                  {content.performance_venue && (
                    <div className="flex items-center gap-2">
                      <span className="text-purple-600 dark:text-purple-300 font-medium">공연 장소:</span>
                      <span className="text-gray-700 dark:text-gray-300">{content.performance_venue}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {content.content && (
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">작품 소개</h3>
                <div 
                  className="prose prose-gray dark:prose-invert max-w-none content-display"
                  dangerouslySetInnerHTML={{ __html: content.content }}
                />
              </div>
            )}
          </div>
        )}
      </div>

        {/* 액션 버튼들 */}
        <div className="flex items-center justify-between py-6 border-t border-gray-200 dark:border-gray-700 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <LikeButton 
              contentId={content.id}
              initialLikesCount={content.likes_count || 0}
              size="lg"
            />
          </div>
          
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 rounded-lg font-medium transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
            공유
          </button>
        </div>
        
        {/* 작가 소개 섹션 - Intersection Observer 기반 지연 로딩 */}
        <div ref={authorRef} className="mt-8 px-4 sm:px-6 lg:px-8">
          {authorInView && (
            <LazyAuthorSection 
              authorId={content.author_id}
              authorName={content.author_name || '익명'}
              currentContentId={content.id}
            />
          )}
        </div>
      
        {/* 댓글 섹션 */}
        <CommentSection 
          contentId={content.id} 
          className="mt-8 px-4 sm:px-6 lg:px-8"
        />
      </article>
    </>
  )
}
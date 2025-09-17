import { memo, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Content, 
  isPoetryContent, 
  isPhotoContent, 
  isCalligraphyContent, 
  isVideoContent 
} from '../../lib/types'
import CategoryIcon, { categoryConfig } from './CategoryIcon'
import {
  isValidImageUrl,
  getImageProps,
  getFallbackImageUrl,
  generateResponsiveSizes,
  getVideoThumbnailUrl
} from '../utils/imageOptimization'
import { generatePreviewText, stripHtmlTags } from '../utils/htmlUtils'

interface ServerContentCardProps {
  content: Content
  priority?: boolean
  showCategory?: boolean
}

function ServerContentCard({ content, showCategory = true }: ServerContentCardProps) {
  const categoryStyle = useMemo(() => categoryConfig[content.category], [content.category])
  
  // 서버 사이드에서는 원본 stats 사용 (실시간 업데이트 없음)
  const currentLikesCount = content.likes_count
  const currentViewCount = content.view_count
  
  // 내용 미리보기 생성 (카테고리별로 다르게)
  const previewText = useMemo(() => {
    if (isPoetryContent(content) && content.translation) {
      // 한시의 경우 번역문을 사용하되 HTML 태그 제거
      const cleanTranslation = stripHtmlTags(content.translation)
      return cleanTranslation.split('\n')[0] + (cleanTranslation.split('\n').length > 1 ? '...' : '')
    }
    
    // 일반 콘텐츠의 경우 HTML 태그를 제거하고 미리보기 생성
    return generatePreviewText(content.content, 150)
  }, [content])

  // 특화 정보 렌더링
  const renderSpecialInfo = () => {
    if (isPoetryContent(content)) {
      return (
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          <span className="inline-flex items-center">
            📜 원문/번역 완비
          </span>
        </div>
      )
    }

    if (isPhotoContent(content) && content.image_exif) {
      try {
        const exif = typeof content.image_exif === 'string' 
          ? JSON.parse(content.image_exif) 
          : content.image_exif
        return (
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            <span className="inline-flex items-center">
              📸 {exif.camera || '카메라 정보'} | {exif.settings?.iso ? `ISO ${exif.settings.iso}` : 'EXIF 포함'}
            </span>
          </div>
        )
      } catch {
        return (
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            📸 EXIF 정보 포함
          </div>
        )
      }
    }

    if (isCalligraphyContent(content)) {
      return (
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          <span className="inline-flex items-center">
            🖼️ 고화질 이미지
          </span>
        </div>
      )
    }

    if (isVideoContent(content)) {
      return (
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          <span className="inline-flex items-center">
            🎬 {content.video_platform === 'youtube' ? 'YouTube' : content.video_platform} 영상
          </span>
        </div>
      )
    }

    return null
  }

  // 썸네일 이미지 결정 및 최적화
  const getThumbnailInfo = () => {
    let imageUrl = null
    
    // 사진, 서화 콘텐츠의 이미지 URL
    if (isPhotoContent(content) || isCalligraphyContent(content)) {
      imageUrl = content.image_url
    }
    // 비디오 콘텐츠의 썸네일 URL 추출
    else if (isVideoContent(content) && content.video_url && content.video_platform) {
      imageUrl = getVideoThumbnailUrl(content.video_url, content.video_platform)
    }
    
    const isValid = isValidImageUrl(imageUrl)
    const fallbackUrl = getFallbackImageUrl(content.category, 400, 300)
    
    return {
      hasImage: isValid,
      imageUrl: isValid ? imageUrl : fallbackUrl,
      isOptimized: isValid
    }
  }

  const thumbnailInfo = getThumbnailInfo()
  
  // 이미지 최적화 props 생성 (fill과 호환되도록 width/height 제거)
  const imageProps = useMemo(() => {
    if (thumbnailInfo.isOptimized) {
      const props = getImageProps(
        thumbnailInfo.imageUrl,
        content.title,
        400,
        300
      )
      if (props) {
        // fill 속성과 충돌하는 width, height 제거
        const { width, height, ...restProps } = props
        return restProps
      }
    }
    return null
  }, [thumbnailInfo, content.title])

  return (
    <Link href={`/content/${content.id}`}>
      <article className={`
        group cursor-pointer h-full
        bg-white dark:bg-gray-800 
        rounded-xl shadow-sm hover:shadow-lg
        border ${categoryStyle.borderColor}
        transition-all duration-300 ease-in-out
        hover:scale-[1.02] hover:-translate-y-1
        overflow-hidden
      `}>
        {/* 썸네일 또는 카테고리 아이콘 영역 */}
        <div className="relative h-48 overflow-hidden">
          {thumbnailInfo.hasImage && imageProps ? (
            <div className="relative w-full h-full">
              <Image
                {...imageProps}
                alt={`${content.title} - ${content.author_name}`}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes={generateResponsiveSizes({
                  mobile: '100vw',
                  tablet: '50vw',
                  desktop: '33vw'
                })}
              />
            </div>
          ) : (
            <div className="relative w-full h-full">
              {thumbnailInfo.isOptimized ? (
                <div className="w-full h-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <div className="text-gray-400 dark:text-gray-500">
                    <CategoryIcon 
                      category={content.category} 
                      size="lg" 
                      showLabel={false} 
                    />
                    <p className="text-xs mt-2 text-center">이미지 로딩 중</p>
                  </div>
                </div>
              ) : (
                <>
                  <Image
                    src={thumbnailInfo.imageUrl}
                    alt={`${content.title} - 기본 이미지`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <div className={`
                    absolute inset-0 flex items-center justify-center
                    ${categoryStyle.bgColor} bg-opacity-20
                    group-hover:bg-opacity-10 transition-all
                  `}>
                    <CategoryIcon 
                      category={content.category} 
                      size="xl" 
                      showLabel={false} 
                      className="text-white drop-shadow-lg"
                    />
                  </div>
                </>
              )}
            </div>
          )}
          
          {/* 카테고리 배지 */}
          {showCategory && (
            <div className="absolute top-3 left-3">
              <div className={`
                px-2 py-1 rounded-full text-xs font-medium
                ${categoryStyle.bgColor} ${categoryStyle.textColor}
                backdrop-blur-sm bg-opacity-90
                group-hover:scale-105 transition-transform
              `}>
                <CategoryIcon 
                  category={content.category} 
                  size="sm" 
                  showLabel={true} 
                  className="inline"
                />
              </div>
            </div>
          )}
        </div>
        
        {/* 콘텐츠 정보 */}
        <div className="p-4 flex flex-col h-[calc(100%-192px)]">
          <div className="flex-1">
            {/* 제목 */}
            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {content.title}
            </h3>
            
            {/* 작가 */}
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span className="font-medium">{content.author_name || '익명'}</span>
            </div>
            
            {/* 미리보기 텍스트 */}
            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed mb-3">
              {previewText}
            </p>
            
            {/* 특화 정보 */}
            {renderSpecialInfo()}
          </div>
          
          {/* 하단 메타 정보 */}
          <div className="flex items-center justify-between pt-3 mt-auto border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {currentViewCount}
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {currentLikesCount}
              </span>
            </div>
            
            <time className="text-xs text-gray-500 dark:text-gray-400">
              {new Date(content.created_at).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </time>
          </div>
        </div>
      </article>
    </Link>
  )
}

export default memo(ServerContentCard)
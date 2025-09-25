import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Header from '../../../components/Header'
import Footer from '../../../components/Footer'
import ContentDetail from '../../../components/ContentDetail'
import { DynamicRelatedContents } from '../../../utils/dynamicImports'
import { getContentById, getCategoryDisplayName, getCategoryIcon } from '../../../lib/contentUtils'
// import { generateArticleStructuredData, generateBreadcrumbStructuredData } from '../../../lib/seo'
import BackButton from '../../../components/BackButton'

interface ContentPageProps {
  params: Promise<{ id: string }>
}

// 메타데이터 생성
export async function generateMetadata({ params }: ContentPageProps): Promise<Metadata> {
  const { id } = await params
  const content = await getContentById(id)

  if (!content) {
    return {
      title: '콘텐츠를 찾을 수 없습니다',
      description: '요청하신 콘텐츠를 찾을 수 없습니다. 다른 작품들을 둘러보세요.',
      robots: {
        index: false,
        follow: true,
      },
    }
  }

  const categoryName = getCategoryDisplayName(content.category)
  const authorName = content.author_name || '익명'
  const contentPreview = content.content ? content.content.substring(0, 150).replace(/\n/g, ' ') : ''
  const fullDescription = content.description || 
    `${categoryName} 작품 "${content.title}". ${authorName} 작가의 아름다운 작품을 감상해보세요. ${contentPreview}`

  // 이미지 URL 처리
  const imageUrl = content.image_url || '/images/og-default.jpg'
  const canonicalUrl = `/content/${content.id}`

  return {
    title: `${content.title} - ${categoryName}`,
    description: fullDescription,
    keywords: [
      content.title,
      categoryName,
      authorName,
      '춘천답기',
      '춘천문화원',
      '웹진',
      '창작물',
      '문학',
      '예술'
    ],
    authors: [{ name: authorName }],
    creator: authorName,
    publisher: '춘천문화원',
    robots: {
      index: content.is_published,
      follow: true,
      googleBot: {
        index: content.is_published,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      type: 'article',
      locale: 'ko_KR',
      url: canonicalUrl,
      title: content.title,
      description: fullDescription,
      siteName: '춘천답기 웹진',
      publishedTime: content.created_at,
      modifiedTime: content.updated_at,
      authors: [authorName],
      section: categoryName,
      tags: [content.title, categoryName, authorName, '춘천문화원', '창작물'],
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${content.title} - ${categoryName} 작품 by ${authorName}`,
        }
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: content.title,
      description: fullDescription,
      images: [imageUrl],
      creator: '@chunchen_webzine',
    },
    alternates: {
      canonical: canonicalUrl,
    },
    category: '문화예술',
  }
}

export default async function ContentPage({ params }: ContentPageProps) {
  const { id } = await params
  const content = await getContentById(id)

  if (!content) {
    notFound()
  }

  // 구조화 데이터 생성
  // const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://ccdg.kr'
  // const categoryName = getCategoryDisplayName(content.category)
  
  /*
  const articleStructuredData = generateArticleStructuredData(
    content,
    baseUrl, 
    categoryName
  )
  
  const breadcrumbs = [
    { name: '홈', url: '/' },
    { name: categoryName, url: `/?category=${content.category}` },
    { name: content.title, url: `/content/${content.id}` }
  ]
  
  const breadcrumbStructuredData = generateBreadcrumbStructuredData(
    breadcrumbs,
    baseUrl
  )
  */

  return (
    <>
      {/* JSON-LD 구조화 데이터 - 임시 주석 */}
      {/*
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleStructuredData)
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbStructuredData)
        }}
      />
      */}
      
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* 헤더 */}
      <Header />

      {/* 메인 콘텐츠 */}
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* 브레드크럼 네비게이션 */}
          <nav className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-8">
            <Link 
              href="/" 
              className="hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
            >
              홈
            </Link>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <Link 
              href={`/?category=${content.category}`}
              className="hover:text-gray-900 dark:hover:text-gray-200 transition-colors flex items-center gap-1"
            >
              <span>{getCategoryIcon(content.category)}</span>
              {getCategoryDisplayName(content.category)}
            </Link>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-gray-900 dark:text-gray-200 font-medium">
              {content.title}
            </span>
          </nav>

          {/* 뒤로가기 버튼 */}
          <BackButton />

          {/* 콘텐츠 상세 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 md:p-8 mb-12">
            <ContentDetail content={content} />
          </div>

          {/* 관련 콘텐츠 - 지연 로딩 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 md:p-8">
            <DynamicRelatedContents 
              category={content.category}
              currentContentId={content.id}
              limit={3}
            />
          </div>
        </div>
      </main>

        {/* 푸터 */}
        <Footer />
      </div>
    </>
  )
}

import { Content, ContentCategory } from './types'
import { getCategoryDisplayName } from '../src/lib/contentUtils'

/**
 * 웹사이트 기본 구조화 데이터 (Organization + WebSite)
 */
export function generateWebsiteStructuredData(baseUrl: string) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${baseUrl}/#organization`,
        "name": "춘천문화원",
        "url": baseUrl,
        "logo": {
          "@type": "ImageObject",
          "url": `${baseUrl}/images/logo.png`,
          "width": 200,
          "height": 60
        },
        "description": "춘천 지역의 문화예술 발전을 위해 노력하는 문화원입니다.",
        "address": {
          "@type": "PostalAddress",
          "addressCountry": "KR",
          "addressRegion": "강원도",
          "addressLocality": "춘천시"
        },
        "sameAs": [
          "https://chunchen.or.kr"
        ]
      },
      {
        "@type": "WebSite",
        "@id": `${baseUrl}/#website`,
        "url": baseUrl,
        "name": "춘천답기 웹진",
        "description": "춘천문화원 회원들의 수필, 한시, 사진, 서화, 영상 등 다양한 창작물을 디지털로 보존하고 공유하는 웹진입니다.",
        "publisher": {
          "@id": `${baseUrl}/#organization`
        },
        "inLanguage": "ko-KR",
        "potentialAction": {
          "@type": "SearchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": `${baseUrl}/?search={search_term_string}`
          },
          "query-input": "required name=search_term_string"
        }
      }
    ]
  }
}

/**
 * 콘텐츠 상세 페이지 구조화 데이터 (Article)
 */
export function generateArticleStructuredData(
  content: Content, 
  baseUrl: string,
  categoryName: string
) {
  const authorName = content.author_name || '익명'
  const imageUrl = content.image_url || `${baseUrl}/images/og-default.jpg`
  
  return {
    "@context": "https://schema.org",
    "@type": getSchemaType(content.category),
    "headline": content.title,
    "description": content.description || `${categoryName} 작품 - ${content.title}`,
    "image": {
      "@type": "ImageObject",
      "url": imageUrl,
      "width": 1200,
      "height": 630
    },
    "author": {
      "@type": "Person",
      "name": authorName,
      "url": `${baseUrl}/?author=${encodeURIComponent(authorName)}`
    },
    "publisher": {
      "@type": "Organization",
      "name": "춘천문화원",
      "logo": {
        "@type": "ImageObject",
        "url": `${baseUrl}/images/logo.png`
      }
    },
    "datePublished": content.created_at,
    "dateModified": content.updated_at,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `${baseUrl}/content/${content.id}`
    },
    "url": `${baseUrl}/content/${content.id}`,
    "inLanguage": "ko-KR",
    "genre": categoryName,
    "about": {
      "@type": "Thing",
      "name": categoryName,
      "description": getCategoryDescription(content.category)
    },
    "keywords": [content.title, categoryName, authorName, "춘천문화원", "창작물", "문화예술"],
    "interactionStatistic": [
      {
        "@type": "InteractionCounter",
        "interactionType": "https://schema.org/ViewAction",
        "userInteractionCount": content.view_count || 0
      },
      {
        "@type": "InteractionCounter", 
        "interactionType": "https://schema.org/LikeAction",
        "userInteractionCount": content.likes_count || 0
      }
    ]
  }
}

/**
 * 콘텐츠 목록 페이지 구조화 데이터 (CollectionPage)
 */
export function generateCollectionStructuredData(
  contents: Content[],
  baseUrl: string,
  category?: ContentCategory,
  totalCount?: number
) {
  const categoryName = category ? getCategoryDisplayName(category) : '전체 작품'
  
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": `${categoryName} - 춘천답기 웹진`,
    "description": `춘천문화원의 ${categoryName} 컬렉션입니다.`,
    "url": category ? `${baseUrl}/?category=${category}` : baseUrl,
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": totalCount || contents.length,
      "itemListElement": contents.map((content, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": getSchemaType(content.category),
          "@id": `${baseUrl}/content/${content.id}`,
          "name": content.title,
          "author": {
            "@type": "Person",
            "name": content.author_name || '익명'
          },
          "datePublished": content.created_at,
          "genre": getCategoryDisplayName(content.category),
          "image": content.image_url || `${baseUrl}/images/og-default.jpg`
        }
      }))
    }
  }
}

/**
 * 카테고리별 Schema.org 타입 매핑
 */
function getSchemaType(category: ContentCategory): string {
  const typeMapping = {
    essay: 'Article',
    poetry: 'CreativeWork',
    photo: 'Photograph',
    calligraphy: 'VisualArtwork',
    video: 'VideoObject'
  }
  return typeMapping[category] || 'CreativeWork'
}

/**
 * 카테고리별 설명
 */
function getCategoryDescription(category: ContentCategory): string {
  const descriptions = {
    essay: '춘천 지역 작가들의 수필 작품',
    poetry: '전통 한시와 현대적 해석',
    photo: '춘천의 아름다운 풍경과 일상을 담은 사진',
    calligraphy: '전통 서화와 현대적 감각의 조화',
    video: '춘천 지역 문화예술 공연 영상'
  }
  return descriptions[category] || '춘천문화원의 창작물'
}

/**
 * BreadcrumbList 구조화 데이터
 */
export function generateBreadcrumbStructuredData(
  breadcrumbs: Array<{ name: string; url: string }>,
  baseUrl: string
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": crumb.name,
      "item": `${baseUrl}${crumb.url}`
    }))
  }
}

/**
 * FAQ 구조화 데이터 (관리자 페이지용)
 */
export function generateFAQStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "춘천답기 웹진은 무엇인가요?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "춘천답기는 춘천문화원 회원들의 다양한 창작물(수필, 한시, 사진, 서화, 영상)을 디지털로 보존하고 공유하는 온라인 웹진입니다."
        }
      },
      {
        "@type": "Question", 
        "name": "어떤 종류의 작품을 볼 수 있나요?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "수필, 한시, 사진, 서화작품, 공연영상 등 5개 카테고리의 다양한 문화예술 창작물을 감상할 수 있습니다."
        }
      },
      {
        "@type": "Question",
        "name": "작품에 좋아요나 댓글을 남길 수 있나요?",
        "acceptedAnswer": {
          "@type": "Answer", 
          "text": "네, 모든 작품에 좋아요를 누를 수 있고, 작품에 대한 감상과 의견을 댓글로 남길 수 있습니다."
        }
      }
    ]
  }
}
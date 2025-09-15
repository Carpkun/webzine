import { notFound } from 'next/navigation'
import { ContentCategory } from "../../../../lib/types";
import CategoryPageClient from './CategoryPageClient'

interface CategoryPageProps {
  params: Promise<{
    slug: string
  }>
}

// 유효한 카테고리와 표시명 매핑
const categoryMap: Record<string, { category: ContentCategory; displayName: string; icon: string; description: string }> = {
  essay: { 
    category: 'essay', 
    displayName: '수필', 
    icon: '📝',
    description: '마음을 담아 써내려간 수필 작품들'
  },
  poetry: { 
    category: 'poetry', 
    displayName: '한시', 
    icon: '📜',
    description: '전통의 아름다움이 담긴 한시 작품들'
  },
  photo: { 
    category: 'photo', 
    displayName: '사진', 
    icon: '📸',
    description: '순간의 아름다움을 포착한 사진 작품들'
  },
  calligraphy: { 
    category: 'calligraphy', 
    displayName: '서화', 
    icon: '🖼️',
    description: '붓끝에 담긴 정성과 예술 작품들'
  },
  video: { 
    category: 'video', 
    displayName: '영상', 
    icon: '🎬',
    description: '움직이는 이야기가 담긴 영상 작품들'
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params
  
  // 유효한 카테고리인지 확인
  if (!categoryMap[slug]) {
    notFound()
  }
  
  const categoryInfo = categoryMap[slug]
  
  return <CategoryPageClient categoryInfo={categoryInfo} />
}

// 정적 경로 생성 (선택사항)
export async function generateStaticParams() {
  return [
    { slug: 'essay' },
    { slug: 'poetry' },
    { slug: 'photo' },
    { slug: 'calligraphy' },
    { slug: 'video' },
  ]
}

// 메타데이터 생성
export async function generateMetadata({ params }: CategoryPageProps) {
  const { slug } = await params
  const categoryInfo = categoryMap[slug]
  
  if (!categoryInfo) {
    return {
      title: '페이지를 찾을 수 없습니다',
    }
  }
  
  return {
    title: `${categoryInfo.displayName} - 춘천답기 웹진`,
    description: categoryInfo.description,
  }
}

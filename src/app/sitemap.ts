import { MetadataRoute } from 'next'
import { supabase } from '../../lib/supabase'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://chunchen-webzine.vercel.app'
  
  // 기본 정적 페이지들
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/category/essay`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/category/poetry`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/category/photo`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/category/calligraphy`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/category/video`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ]

  try {
    // 공개된 콘텐츠들 가져오기
    const { data: contents, error } = await supabase
      .from('contents')
      .select('id, created_at, updated_at')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(1000) // 최대 1000개로 제한

    if (error) {
      console.error('콘텐츠 조회 오류:', error)
      return staticPages
    }

    // 콘텐츠 페이지들을 sitemap에 추가
    const contentPages: MetadataRoute.Sitemap = (contents || []).map((content) => ({
      url: `${baseUrl}/content/${content.id}`,
      lastModified: new Date(content.updated_at || content.created_at),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

    return [...staticPages, ...contentPages]
  } catch (error) {
    console.error('Sitemap 생성 오류:', error)
    return staticPages
  }
}
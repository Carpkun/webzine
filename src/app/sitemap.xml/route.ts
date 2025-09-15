import { NextResponse } from 'next/server'
// import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ccdg.kr'
    const currentDate = new Date().toISOString()

    // 정적 페이지 URL들
    const staticPages = [
      {
        url: baseUrl,
        lastmod: currentDate,
        changefreq: 'daily',
        priority: 1.0
      },
      {
        url: `${baseUrl}/?category=essay`,
        lastmod: currentDate,
        changefreq: 'weekly',
        priority: 0.8
      },
      {
        url: `${baseUrl}/?category=poetry`,
        lastmod: currentDate,
        changefreq: 'weekly',
        priority: 0.8
      },
      {
        url: `${baseUrl}/?category=photo`,
        lastmod: currentDate,
        changefreq: 'weekly',
        priority: 0.8
      },
      {
        url: `${baseUrl}/?category=calligraphy`,
        lastmod: currentDate,
        changefreq: 'weekly',
        priority: 0.8
      },
      {
        url: `${baseUrl}/?category=video`,
        lastmod: currentDate,
        changefreq: 'weekly',
        priority: 0.8
      }
    ]

    // 모든 URL (임시로 정적 페이지만 사용)
    const allPages = staticPages

    // XML 사이트맵 생성
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${allPages.map(page => `  <url>
    <loc>${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`

    return new NextResponse(sitemap, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600', // 1시간 캐시
      },
    })

  } catch (error) {
    console.error('Error generating sitemap:', error)
    return new NextResponse('Error generating sitemap', { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
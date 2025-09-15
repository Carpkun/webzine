import { NextResponse } from 'next/server'

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ccdg.kr'
  
  const robotsTxt = `# 춘천답기 웹진 Robots.txt
User-agent: *
Allow: /

# 검색 엔진이 접근하면 안 되는 경로
Disallow: /admin/
Disallow: /api/
Disallow: /auth/
Disallow: /_next/
Disallow: /static/

# 사이트맵 위치
Sitemap: ${baseUrl}/sitemap.xml

# 크롤링 속도 제한 (선택적)
Crawl-delay: 1

# 주요 검색엔진별 설정
User-agent: Googlebot
Allow: /
Crawl-delay: 1

User-agent: Bingbot
Allow: /
Crawl-delay: 1

User-agent: NaverBot
Allow: /
Crawl-delay: 1

User-agent: DaumAdIndexBot
Allow: /
Crawl-delay: 1`

  return new NextResponse(robotsTxt, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400', // 24시간 캐시
    },
  })
}

export const dynamic = 'force-dynamic'
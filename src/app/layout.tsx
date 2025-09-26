import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../lib/auth-context";
import { ContentProvider } from "../contexts/ContentContext";
import { generateWebsiteStructuredData } from "../../lib/seo";
import WebVitalsProvider from "../components/WebVitalsProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap", // font-display: swap 추가
  fallback: ["system-ui", "arial", "sans-serif"],
  preload: true,
  adjustFontFallback: true,
  weight: ['400', '500', '600', '700'], // 사용할 웨이트만 명시
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  fallback: ["'Courier New'", "monospace"],
  preload: true,
  adjustFontFallback: true,
  weight: ['400', '500'], // 사용할 웨이트만 명시
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: {
    default: '춘천답기 웹진 | 춘천문화원 회원 창작물 아카이브',
    template: '%s | 춘천답기 웹진'
  },
  description: '춘천문화원 회원들의 수필, 한시, 사진, 서화, 영상 등 다양한 창작물을 디지털로 보존하고 공유하는 웹진입니다. 춘천 지역 문화예술의 아름다움을 만나보세요.',
  keywords: [
    '춘천답기', '춘천문화원', '웹진', '디지털 아카이브',
    '수필', '한시', '사진', '서화', '영상',
    '창작물', '문학', '예술', '문화',
    '춘천', '강원도', '대한민국', '한국 문화'
  ],
  authors: [{ name: '춘천문화원', url: 'https://chunchen.or.kr' }],
  creator: '춘천문화원',
  publisher: '춘천문화원',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: '/',
    title: '춘천답기 웹진',
    description: '춘천문화원 회원들의 창작물 디지털 아카이브',
    siteName: '춘천답기 웹진',
    images: [
      {
        url: '/images/og-default.jpg',
        width: 1200,
        height: 630,
        alt: '춘천답기 웹진 - 춘천문화원 창작물 아카이브',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '춘천답기 웹진',
    description: '춘천문화원 회원들의 창작물 디지털 아카이브',
    images: ['/images/og-default.jpg'],
    creator: '@chunchen_webzine',
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
    other: {
      'naver-site-verification': process.env.NEXT_PUBLIC_NAVER_VERIFICATION || '',
    },
  },
  alternates: {
    canonical: '/',
  },
  category: '문화예술',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 기본 구조화 데이터 생성
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const websiteStructuredData = generateWebsiteStructuredData(baseUrl)

  return (
    <html lang="ko">
      <head>
        {/* 리소스 프리로딩 및 DNS 프리페치 */}
        <link rel="preconnect" href="https://oeeznxdrubsutvezyhxi.supabase.co" />
        <link rel="dns-prefetch" href="https://oeeznxdrubsutvezyhxi.supabase.co" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* 중요한 API 엔드포인트 프리로드 */}
        <link rel="prefetch" href="/api/contents/simple" />
        <link rel="prefetch" href="/api/contents/stats" />
        
        {/* JSON-LD 기본 구조화 데이터 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteStructuredData)
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <ContentProvider>
            <WebVitalsProvider />
            {children}
          </ContentProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

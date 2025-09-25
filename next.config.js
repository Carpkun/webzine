/** @type {import('next').NextConfig} */
const nextConfig = {
  // 이미지 최적화 설정
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'oeeznxdrubsutvezyhxi.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**'
      }
    ],
    deviceSizes: [320, 420, 768, 1024, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;"
  },

  // 보안 헤더 설정
  async headers() {
    return [
      {
        // 모든 페이지에 적용
        source: '/(.*)',
        headers: [
          // XSS 공격 방지
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          // MIME 스니핑 방지
          {
            key: 'X-Content-Type-Options', 
            value: 'nosniff'
          },
          // 클릭재킹 방지
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          // 참조자 정책
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          // 권한 정책
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), location=(), payment=(), usb=(), magnetometer=(), gyroscope=(), speaker=(), vibrate=(), fullscreen=(self), display-capture=()'
          }
        ]
      },
      {
        // API 라우트에만 적용
        source: '/api/(.*)',
        headers: [
          // CORS 헤더
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NODE_ENV === 'production' 
              ? 'https://chunchen-webzine.com' 
              : 'http://localhost:3000'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization'
          },
          {
            key: 'Access-Control-Max-Age',
            value: '86400'
          },
          // API 보안 헤더
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow'
          }
        ]
      },
      {
        // 정적 파일에 캐시 헤더 적용
        source: '/images/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      }
    ]
  },

  // Content Security Policy 설정
  async rewrites() {
    return []
  },

  // 개발 환경 설정
  eslint: {
    ignoreDuringBuilds: true
  },
  typescript: {
    ignoreBuildErrors: true
  },


  serverExternalPackages: ['bcryptjs'],

  // 웹팩 설정
  webpack: (config, { isServer }) => {
    // 클라이언트 사이드에서 서버 전용 모듈 제외
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }

    return config
  }
}

module.exports = nextConfig
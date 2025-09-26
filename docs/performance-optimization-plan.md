# 🚀 춘천답기 웹진 성능 종합 분석 및 최적화 계획

**작성일:** 2025년 9월 26일  
**분석 도구:** PageSpeed Insights, Next.js Build Analyzer  
**현재 버전:** Next.js 15.5.3  

## 📊 현재 성능 상황 분석

### 1. **주요 성능 문제점 발견**

**🔍 분석 결과:**
- **로딩 시간**: 메인 페이지 초기 로딩 1.2초 (개선 필요)
- **번들 크기**: 콘텐츠 상세 페이지 First Load JS 177kB (큰 편)
- **작가 섹션 로딩**: 2번의 연속 API 호출로 인한 긴 로딩 시간
- **이미지 최적화**: `unoptimized` 속성 남용으로 최적화 기회 상실

### 2. **PageSpeed Insights 분석 결과**

- **실제 사용자 데이터**: CrUX 데이터 부족 (트래픽 증가 필요)
- **성능 진단**: Core Web Vitals 개선 필요
- **주요 지적사항**: 
  - 큰 JavaScript 번들
  - 이미지 최적화 미적용
  - 리소스 로딩 순서 비효율

### 3. **번들 분석 결과**

```
Route (app)                    Size    First Load JS
├ ○ /                         8.98 kB    161 kB
├ ƒ /content/[id]            20.5 kB    177 kB  ← 최적화 필요
├ ● /category/[slug]         5.95 kB    158 kB
└ + First Load JS shared     102 kB
```

## 🎯 단계별 최적화 계획 및 체크리스트

---

## **1단계: 즉시 개선 가능한 항목** ⏱️ *1-2일 소요*

### 🚨 **우선순위 1: 작가 섹션 로딩 최적화**

**문제점:** AuthorSection 컴포넌트에서 2번의 연속 API 호출로 인한 로딩 지연

#### ✅ 체크리스트

- [ ] **API 통합 방식 구현**
  - [ ] `/api/authors/[id]` 엔드포인트에 `include=contents` 파라미터 추가
  - [ ] 작가 정보와 작품 목록을 한 번에 반환하도록 수정
  - [ ] AuthorSection 컴포넌트에서 단일 API 호출로 변경

```typescript
// 목표: 단일 API 호출
const response = await fetch(`/api/authors/${authorId}?include=contents&limit=4`)
```

- [ ] **병렬 처리 최적화 (대안)**
  - [ ] Promise.all을 사용하여 두 API를 동시 호출
  - [ ] 로딩 상태 개선으로 사용자 경험 향상

```typescript
const [authorData, worksData] = await Promise.all([
  fetch(`/api/authors/${authorId}`),
  fetch(`/api/authors/${authorId}/contents?limit=4`)
])
```

- [ ] **테스트 및 검증**
  - [ ] 로딩 시간 측정 (목표: 2초 → 1초)
  - [ ] 에러 처리 개선

**예상 개선 효과:** 로딩 시간 50% 단축

### 🖼️ **우선순위 2: 이미지 최적화 수정**

**문제점:** 모든 이미지에 `unoptimized` 속성 적용으로 Next.js 최적화 미활용

#### ✅ 체크리스트

- [ ] **Next.js Image 최적화 활성화**
  - [ ] ContentDetail.tsx에서 `unoptimized` 속성 제거
  - [ ] 적절한 `sizes` 속성 설정
  - [ ] `quality`, `placeholder`, `blurDataURL` 속성 추가

```typescript
<Image
  src={content.image_url!}
  alt={`${content.title} - ${content.author_name} 작품`}
  fill
  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 80vw, 70vw"
  quality={85}
  priority={false}
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>
```

- [ ] **이미지 최적화 유틸리티 활용**
  - [ ] `imageOptimization.ts` 유틸리티 함수들 적극 활용
  - [ ] `getImageProps` 함수를 통한 자동 최적화 설정
  - [ ] WebP 포맷 지원 확인 및 적용

- [ ] **블러 플레이스홀더 구현**
  - [ ] `generateBlurDataUrl` 함수 활용
  - [ ] 카테고리별 fallback 이미지 적용

- [ ] **테스트**
  - [ ] 이미지 로딩 속도 측정
  - [ ] 다양한 디바이스에서 반응형 테스트

**예상 개선 효과:** 이미지 로딩 시간 30-40% 단축

---

## **2단계: 번들 크기 최적화** ⏱️ *2-3일 소요*

### 📦 **코드 스플리팅 개선**

**목표:** 콘텐츠 상세 페이지 177kB → 120-130kB

#### ✅ 체크리스트

- [ ] **동적 임포트 적용**
  - [ ] TTSPlayer 컴포넌트 동적 로딩
  - [ ] CommentSection 컴포넌트 동적 로딩
  - [ ] PhotoExifInfo 컴포넌트 동적 로딩

```typescript
const TTSPlayer = dynamic(() => import('./TTSPlayer'), {
  ssr: false,
  loading: () => <div className="animate-pulse h-10 bg-gray-200 rounded" />
})
```

- [ ] **TipTap 에디터 최적화**
  - [ ] 관리자 페이지에서만 로드되도록 분리
  - [ ] 필요한 확장만 선택적 임포트

- [ ] **컴포넌트 지연 로딩**
  - [ ] AuthorSection을 뷰포트에 들어올 때만 로드
  - [ ] Intersection Observer 활용

**예상 개선 효과:** 번들 크기 25-30% 감소

### 🗂️ **라이브러리 최적화**

#### ✅ 체크리스트

- [ ] **의존성 검토 및 정리**
  - [ ] `@google-cloud/text-to-speech`: 서버 전용으로 이동
  - [ ] `browser-image-compression`: 필요시에만 동적 로드
  - [ ] `react-dropzone`: 관리자 페이지 전용으로 분리

- [ ] **Tree Shaking 최적화**
  - [ ] lodash 등 유틸리티 라이브러리 개별 함수 임포트
  - [ ] 사용하지 않는 exports 제거

- [ ] **번들 분석기 활용**
  - [ ] `@next/bundle-analyzer` 설정 완료
  - [ ] 주기적인 번들 크기 모니터링 체계 구축

---

## **3단계: 데이터 로딩 최적화** ⏱️ *3-4일 소요*

### ⚡ **API 응답 최적화**

#### ✅ 체크리스트

- [ ] **Supabase 쿼리 최적화**
  - [ ] 필요한 필드만 선택하도록 `.select()` 수정
  - [ ] 불필요한 조인 제거
  - [ ] 인덱스 활용도 검토

```sql
-- 현재
.select('*')
-- 최적화 후
.select('id, title, content, category, author_name, created_at, view_count, likes_count')
```

- [ ] **페이지네이션 최적화**
  - [ ] 커서 기반 페이지네이션 도입 검토
  - [ ] 무한 스크롤 구현으로 UX 개선

- [ ] **데이터베이스 성능 점검**
  - [ ] Supabase 어드바이저 권장사항 적용
  - [ ] RLS 정책 최적화 (성능 개선 확인됨)

### 🗄️ **캐싱 전략 구현**

#### ✅ 체크리스트

- [ ] **API 레벨 캐싱**
  - [ ] Next.js 13+ App Router 캐싱 활용
  - [ ] `Cache-Control` 헤더 적절히 설정
  - [ ] `revalidate` 옵션으로 ISR 구현

```typescript
export const revalidate = 300 // 5분마다 재검증
```

- [ ] **클라이언트 사이드 캐싱**
  - [ ] SWR 또는 React Query 도입 검토
  - [ ] 브라우저 캐시 활용 최적화

- [ ] **CDN 캐싱 최적화**
  - [ ] Vercel Edge Network 활용
  - [ ] 정적 자원 캐시 정책 개선

**예상 개선 효과:** 재방문시 로딩 시간 70% 단축

---

## **4단계: 고급 최적화** ⏱️ *1주 소요*

### 🏃‍♂️ **프리로딩 및 지연 로딩**

#### ✅ 체크리스트

- [ ] **리소스 프리로드 구현**
  - [ ] Supabase 연결 프리커넥트 설정
  - [ ] DNS 프리페치 적용
  - [ ] 중요한 API 엔드포인트 프리로드

```html
<link rel="preconnect" href="https://oeeznxdrubsutvezyhxi.supabase.co" />
<link rel="dns-prefetch" href="https://oeeznxdrubsutvezyhxi.supabase.co" />
```

- [ ] **Intersection Observer 기반 최적화**
  - [ ] 뷰포트 진입시 콘텐츠 로딩
  - [ ] 이미지 지연 로딩 개선
  - [ ] 작가 섹션 지연 로딩

- [ ] **폰트 최적화**
  - [ ] Google Fonts 최적화 설정 확인
  - [ ] font-display: swap 적용
  - [ ] 폰트 서브셋 최적화

### 📊 **성능 모니터링 구현**

#### ✅ 체크리스트

- [ ] **Web Vitals 측정**
  - [ ] LCP, FID, CLS 측정 구현
  - [ ] 실시간 성능 데이터 수집

```typescript
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

function sendToAnalytics(metric) {
  // 분석 서버로 전송
  console.log(metric.name, metric.value)
}
```

- [ ] **성능 대시보드 구축**
  - [ ] 성능 지표 시각화
  - [ ] 알림 시스템 구축
  - [ ] 정기적인 성능 리포트 생성

- [ ] **A/B 테스트 환경 구축**
  - [ ] 최적화 효과 검증을 위한 테스트 환경
  - [ ] 사용자 그룹별 성능 비교

---

## **5단계: Vercel 배포 최적화** ⏱️ *1-2일 소요*

### 🌐 **CDN 및 압축 설정**

#### ✅ 체크리스트

- [ ] **vercel.json 설정 최적화**
  - [ ] 정적 파일 캐시 정책 설정
  - [ ] 헤더 설정 최적화
  - [ ] 빌드 최적화 설정

```json
{
  "headers": [
    {
      "source": "/_next/static/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=300, s-maxage=300"
        }
      ]
    }
  ]
}
```

- [ ] **Edge Functions 활용**
  - [ ] Vercel Edge Functions로 이미지 최적화 구현
  - [ ] API 응답 캐싱 Edge Function
  - [ ] 지리적 최적화 및 Edge Runtime 활용

- [ ] **배포 파이프라인 최적화**
  - [ ] Vercel 빌드 설정 최적화
  - [ ] 프리뷰 배포 활용
  - [ ] 자동 롤백 전략 수립

### 🔒 **보안 및 SEO 최적화**

#### ✅ 체크리스트

- [ ] **보안 헤더 강화**
  - [ ] CSP (Content Security Policy) 설정
  - [ ] HSTS 헤더 설정
  - [ ] 보안 헤더 검증

- [ ] **SEO 최적화**
  - [ ] 메타데이터 최적화
  - [ ] 구조화 데이터 개선
  - [ ] sitemap.xml 최적화

---

## 📈 **예상 성능 개선 효과**

| 지표 | 현재 | 목표 | 개선률 |
|------|------|------|--------|
| **First Load JS** | 177kB | 120kB | -32% |
| **작가 섹션 로딩** | 2-3초 | 1초 | -60% |
| **이미지 로딩** | 평균 2초 | 0.8초 | -60% |
| **LCP (예상)** | 3.5초 | 2.0초 | -43% |
| **FID (예상)** | 150ms | 80ms | -47% |
| **CLS (목표)** | - | < 0.1 | - |
| **전체 번들 크기** | 102kB | 80kB | -22% |

## 🛠️ **구현 우선순위 및 일정**

### **Week 1: 긴급 개선** 🔥
- [ ] 작가 섹션 API 통합 또는 병렬 처리
- [ ] 이미지 최적화 수정 (`unoptimized` 제거)
- [ ] 기본 동적 임포트 적용 (TTSPlayer, CommentSection)

### **Week 2: 번들 최적화** 📦
- [ ] 코드 스플리팅 확장
- [ ] 불필요한 라이브러리 정리
- [ ] 캐싱 전략 구현 (API 레벨)

### **Week 3: 고급 최적화** ⚡
- [ ] 프리로딩 구현
- [ ] 성능 모니터링 구축
- [ ] Vercel 설정 최적화

## 🔧 **즉시 실행 가능한 우선순위 작업**

### 1. **AuthorSection.tsx 수정** (최우선)
```typescript
// 현재 문제가 있는 부분
const authorResponse = await fetch(`/api/authors/${authorId}`)
const worksResponse = await fetch(`/api/authors/${authorId}/contents?limit=4`)

// 즉시 적용 가능한 해결책
const [authorData, worksData] = await Promise.all([
  fetch(`/api/authors/${authorId}`),
  fetch(`/api/authors/${authorId}/contents?limit=4`)
])
```

### 2. **이미지 최적화 수정** (바로 다음)
```typescript
// ContentDetail.tsx, AuthorSection.tsx에서
<Image
  // unoptimized 제거하고 아래 속성 추가
  quality={85}
  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 80vw, 70vw"
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD//gA7Q1JFQVRPUjogZ2QtanBlZyB2MS4wICh1c2luZyBJSkcgSlBFRyB2ODApLCBxdWFsaXR5ID0gODUK/9sAhAAQERU="
/>
```

### 3. **동적 임포트 적용**
```typescript
// ContentDetail.tsx에서
const TTSPlayer = dynamic(() => import('./TTSPlayer'), {
  ssr: false,
  loading: () => <div className="animate-pulse h-10 bg-gray-200 rounded" />
})
```

## 📋 **성공 지표 및 측정 방법**

### **측정 도구**
- [ ] PageSpeed Insights 정기 측정
- [ ] Chrome DevTools Performance 탭 활용
- [ ] Web Vitals 확장 프로그램
- [ ] 사용자 피드백 수집

### **목표 지표**
- [ ] PageSpeed Insights 점수 80+ (모바일/데스크톱)
- [ ] LCP < 2.5초
- [ ] FID < 100ms
- [ ] CLS < 0.1
- [ ] 작가 섹션 로딩 < 1초

## 📝 **진행 상황 추적**

### **완료된 항목** ✅
- [x] 성능 분석 완료
- [x] 최적화 계획 수립
- [x] 체크리스트 작성

### **진행 중인 항목** 🔄
- [ ] 1단계 최적화 작업 시작 예정

### **향후 계획** 📅
- 2025.09.26: 계획 수립 완료
- 2025.09.27-28: 1단계 긴급 개선 작업
- 2025.09.29-10.01: 2단계 번들 최적화
- 2025.10.02-10.05: 3단계 데이터 로딩 최적화

---

**📞 문의사항이나 추가 분석이 필요한 경우 언제든 말씀해 주세요!**
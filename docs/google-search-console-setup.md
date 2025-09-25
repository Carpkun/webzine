# Google Search Console 설정 가이드

> **Day 6 작업**: 춘천답기 웹진 Google Search Console 연동

## 🎯 설정 목표

1. Google Search Console에 웹사이트 등록
2. 사이트맵 제출 및 색인 요청
3. 검색 성능 모니터링 설정
4. 검색엔진 최적화 개선사항 확인

---

## 📋 설정 단계

### 1단계: Google Search Console 접속
1. [Google Search Console](https://search.google.com/search-console) 접속
2. Google 계정으로 로그인

### 2단계: 속성 추가
1. "속성 추가" 클릭
2. **URL 접두사** 방식 선택: `https://ccdg.kr`
3. 도메인 소유권 확인 방법 선택

### 3단계: 소유권 확인 (HTML 태그 방식 권장)
```html
<!-- 다음 메타 태그를 layout.tsx의 <head> 섹션에 추가 -->
<meta name="google-site-verification" content="your-verification-code" />
```

**환경변수 설정:**
```bash
# .env.local 파일에 추가
NEXT_PUBLIC_GOOGLE_VERIFICATION=your-verification-code
```

### 4단계: 사이트맵 제출
1. Search Console → "색인" → "Sitemaps" 메뉴
2. 사이트맵 URL 입력: `https://ccdg.kr/sitemap.xml`
3. "제출" 클릭

### 5단계: robots.txt 확인
1. "색인" → "색인 적용 범위" 확인
2. robots.txt 파일 확인: `https://ccdg.kr/robots.txt`

---

## ✅ 현재 구현 상태

### ✅ 완료된 항목
- [x] 동적 sitemap.xml 생성 (`/sitemap.xml/route.ts`)
- [x] 동적 robots.txt 생성 (`/robots.txt/route.ts`)
- [x] SEO 메타데이터 최적화
- [x] 구조화 데이터 (JSON-LD) 구현
- [x] 환경변수 설정 준비

### 🔄 진행 필요
- [ ] 실제 도메인 연결 (현재는 localhost)
- [ ] Google 인증 코드 발급 및 적용
- [ ] Naver 웹마스터도구 연동
- [ ] 검색 성능 모니터링 설정

---

## 📊 예상 효과

### 검색엔진 노출
- Google 검색 결과에 웹진 콘텐츠 노출
- 구조화 데이터로 리치 스니펫 지원
- 카테고리별 검색 최적화

### 성능 모니터링
- 클릭률(CTR) 및 노출수 추적
- 검색 키워드 분석
- 색인 상태 모니터링

### SEO 개선
- Core Web Vitals 모니터링
- 모바일 친화성 확인
- 사이트 보안 이슈 알림

---

## 🚨 주의사항

1. **도메인 설정**: 실제 배포 후 도메인 연결 시 다시 설정 필요
2. **인증 코드**: 각 환경(개발/프로덕션)별로 별도 설정
3. **사이트맵 업데이트**: 새 콘텐츠 추가 시 자동으로 업데이트됨
4. **색인 시간**: Google 색인에는 보통 몇 시간~며칠 소요

---

## 🔗 관련 링크

- [Google Search Console](https://search.google.com/search-console)
- [Naver 웹마스터도구](https://searchadvisor.naver.com)
- [Google SEO 시작 가이드](https://developers.google.com/search/docs/beginner/seo-starter-guide)

---

*이 설정은 Day 16 배포 단계에서 실제 도메인 연결과 함께 완료될 예정입니다.*
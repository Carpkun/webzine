# 춘천 웹진 Vercel 배포 가이드

## 배포 전 확인사항

✅ **빌드 테스트 완료**: `npx next build` 성공  
✅ **SEO 설정 완료**: robots.ts, sitemap.ts 구성  
✅ **성능 최적화 완료**: 콘솔 로그 정리, API 호출 최적화  
✅ **다크모드 UI 정리**: 토글 버튼 제거, 기능 유지  

## Vercel 환경변수 설정

프로젝트 배포 시 다음 환경변수들을 Vercel 대시보드에서 설정해야 합니다:

### 필수 환경변수

```bash
# Node.js 환경
NODE_ENV=production

# Supabase 설정 (필수)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# 사이트 URL (Vercel이 자동 설정하지만 수동으로도 가능)
NEXT_PUBLIC_SITE_URL=https://your-vercel-domain.vercel.app
```

### 선택적 환경변수

```bash
# SEO 검증 코드
NEXT_PUBLIC_GOOGLE_VERIFICATION=your_google_verification_code
NEXT_PUBLIC_NAVER_VERIFICATION=your_naver_verification_code

# TTS 기능 (사용 시)
TTS_API_URL=your_tts_api_url
TTS_API_KEY=your_tts_api_key

# 성능 최적화
NEXT_PRIVATE_SKIP_VALIDATIONS=false
```

## 배포 단계

1. **GitHub 저장소 연결**
   - Vercel 대시보드에서 New Project 클릭
   - GitHub 저장소 선택 및 연결

2. **환경변수 설정**
   - Project Settings > Environment Variables
   - 위의 필수 환경변수들을 모두 입력

3. **배포 설정 확인**
   - Build Command: `next build`
   - Output Directory: `.next`
   - Install Command: `npm install`
   - Development Command: `next dev`

4. **배포 실행**
   - Deploy 버튼 클릭
   - 약 2-3분 후 배포 완료

## 배포 후 확인사항

- [ ] 사이트 접속 가능 확인
- [ ] Supabase 연결 상태 확인 (콘텐츠 로딩)
- [ ] 관리자 페이지 접속 확인 (`/admin/dashboard`)
- [ ] SEO 파일 접근 확인 (`/robots.txt`, `/sitemap.xml`)
- [ ] 성능 테스트 (페이지 로딩 속도)

## 빌드 설정 주의사항

- **Turbopack 사용 금지**: 현재 Turbopack에서 오류 발생하므로 일반 빌드 모드 사용
- `package.json`의 build 스크립트에서 `--turbopack` 플래그 제거 권장

## 문제 해결

### 빌드 오류 시
```bash
# 로컬에서 프로덕션 빌드 테스트
npx next build

# 타입 체크
npx tsc --noEmit
```

### 환경변수 관련 오류 시
- Vercel 대시보드에서 환경변수 재확인
- Supabase 프로젝트 설정 확인
- `.env.production.example` 파일 참고

## 지원되는 기능

✅ **콘텐츠 관리**: 글 작성, 수정, 삭제  
✅ **카테고리별 분류**: 에세이, 시, 사진, 소설, 기타  
✅ **사용자 인터랙션**: 좋아요, 조회수, 댓글  
✅ **관리자 기능**: 콘텐츠 관리, 댓글 관리, 통계  
✅ **SEO 최적화**: 사이트맵, 메타태그, robots.txt  
✅ **다크모드**: 자동 시스템 감지  
✅ **반응형 디자인**: 모바일, 태블릿, 데스크톱 대응  

배포가 완료되면 춘천 웹진이 전 세계에 공개됩니다! 🎉
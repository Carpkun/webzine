# 춘천답기 웹진 통합 개발 가이드

## 🚨 MCP(Model Context Protocol) 도구 적극 활용 지침

**이 프로젝트를 개발하는 AI 에이전트는 반드시 MCP 도구를 적극 활용해야 합니다.**

### ⭐ 핵심 개발 방향
춘천문화원의 웹진 '춘천답기'는 다음 핵심 가치와 방향으로 개발되어야 합니다:

1.  **문화 콘텐츠 특화**: 단순한 블로그가 아닌, 각 카테고리별 고유한 감상 경험을 제공하는 문화 전시 플랫폼
2.  **접근성 우선**: 다양한 연령대의 사용자가 모바일/데스크톱에서 쉽게 이용할 수 있는 직관적 UI/UX
3.  **지역 문화 아카이브**: 춘천 지역의 문화 자산을 체계적으로 보존하고 공유하는 디지털 아카이브
4.  **소통과 참여**: 창작자와 감상자 간의 활발한 소통을 위한 참여형 기능 제공
5.  **운영 효율성**: 관리자가 손쉽게 콘텐츠를 관리할 수 있는 효율적인 운영 시스템

### 필수 사항
- **모든 개발 작업에서 MCP 도구를 적극 활용해야 합니다**
- **복잡한 기능 구현 전에는 반드시 `analyze_task`, `plan_task`, `split_tasks` 도구를 사용하여 체계적으로 접근하세요**
- **개발 진행 상황을 `list_tasks`, `verify_task` 도구로 지속적으로 관리하세요**
- **Supabase 관련 작업에서는 반드시 Supabase MCP 도구들을 적극 활용해야 합니다**
- **GitHub 연동 시 새로운 프로젝트 정보를 반영해야 합니다**
- **이 규칙을 준수하지 않으면 개발 품질과 효율성이 심각하게 저하될 수 있습니다**

### MCP 도구 활용 워크플로우
1.  **분석 단계**: `analyze_task` → `reflect_task`로 요구사항 분석
2.  **계획 단계**: `plan_task` → `split_tasks`로 작업 분할
3.  **구현 단계**: `execute_task`로 단계별 구현
4.  **검증 단계**: `verify_task`로 품질 확인
5.  **관리 단계**: `list_tasks`, `update_task`로 진행 상황 추적

### 필수 MCP 도구 활용 방식
- **기능 구현 전**: `analyze_task` → `plan_task` → `split_tasks` 순서로 체계적 접근
- **개발 진행 중**: `list_tasks`, `execute_task`, `verify_task`로 지속적 진행 관리
- **기술 도입 전**: `resolve-library-id` → `get-library-docs`로 최신 문서 확인
- **복잡한 문제 해결**: `research_mode`, `process_thought`, `sequentialthinking` 활용
- **Supabase 작업**: `list_projects`, `execute_sql`, `apply_migration`, `generate_typescript_types` 등 Supabase MCP 도구 필수 활용

### 🗄️ Supabase MCP 도구 활용 가이드

**🚨 중요**: 모든 Supabase 관련 작업은 MCP 도구를 통해 수행해야 합니다. 직접 쿼리 작성이나 수동 작업은 금지됩니다.

#### 프로젝트 초기 설정 단계
1.  **프로젝트 확인**: `list_projects` → `get_project(oeeznxdrubsutvezyhxi)` 호출
2.  **기존 데이터 확인**: `list_tables(oeeznxdrubsutvezyhxi)` 로 현재 스키마 상태 파악
3.  **프로젝트 상태 점검**: `get_advisors(oeeznxdrubsutvezyhxi, 'security')` 로 보안 상태 확인
4.  **초기 타입 생성**: `generate_typescript_types(oeeznxdrubsutvezyhxi)` 실행

#### 데이터베이스 관리
- **프로젝트 조회**: `list_projects` → `get_project`로 프로젝트 정보 확인
- **테이블 관리**: `list_tables` → `execute_sql`로 스키마 확인 및 쿼리 실행
- **마이그레이션**: `apply_migration`으로 DDL 작업 수행 (직접 SQL 작성 금지)
- **타입 생성**: `generate_typescript_types`로 TypeScript 타입 자동 생성
- **데이터 조회/수정**: `execute_sql`로 데이터 CRUD 작업 수행

#### 개발 및 배포
- **Edge Function**: `deploy_edge_function`으로 서버리스 함수 배포
- **로그 모니터링**: `get_logs`로 서비스별 로그 확인
- **보안 검사**: `get_advisors`로 보안 및 성능 이슈 확인 (정기적 실행 필수)
- **프로젝트 모니터링**: 개발 중 주기적으로 프로젝트 상태 확인

#### API 키 및 URL 관리
- **API 키 조회**: `get_anon_key`로 익명 키 확인
- **프로젝트 URL**: `get_project_url`로 API URL 확인
- **연결 테스트**: MCP 도구로 API 연결 상태 상시 확인

---

## 1. 프로젝트 개요 및 배경

### 1.1. 프로젝트 정의
- **프로젝트명**: 춘천답기 웹진 플랫폼 (춘천문화원 공식 웹진 플랫폼)
- **목적**: 춘천문화원 회원 창작물을 온라인으로 전시하는 디지털 아카이브 웹진
- **기술스택**: Next.js (프론트엔드) + Supabase (백엔드/DB/인증) + Vercel (배포)
- **개발 기간**: 2025년 9월 9일 ~ 9월 22일 (14일간)
- **현재 진행**: Day 9 (2025년 9월 16일) - 진행률 약 71%
- **깃허브 레포지토리**: https://github.com/Carpkun/webzine.git
- **로컬 개발 서버**: http://localhost:3000
- **프로젝트 디렉토리**: `C:\Users\Moony\Documents\Workspace\webzine`
- **개발 환경**: Windows PowerShell 5.1

### 1.1.1. Supabase 프로젝트 정보
- **Project URL**: https://oeeznxdrubsutvezyhxi.supabase.co
- **API Key (Anon)**: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lZXpueGRydWJzdXR2ZXp5aHhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2Mjc0MzYsImV4cCI6MjA3MzIwMzQzNn0.7AyEo0FeLiEapdz71NdOZ0jnC-tRa4Q0eJ1_dABBSC8
- **Project ID**: oeeznxdrubsutvezyhxi
- **Database URL**: https://oeeznxdrubsutvezyhxi.supabase.co/rest/v1/
- **Auth URL**: https://oeeznxdrubsutvezyhxi.supabase.co/auth/v1
- **Storage URL**: https://oeeznxdrubsutvezyhxi.supabase.co/storage/v1

### 1.1.2. GitHub 리포지토리 정보
- **Username**: Carpkun
- **Email**: rcourse@hanmail.net
- **Repository URL**: https://github.com/Carpkun/webzine.git
- **Repository Status**: Day 1-9 완료된 핵심 기능(관리, 편집, 미디어) 모두 반영

### 1.1.3. 현재 개발 진행 상황
**완료된 작업 (Day 1-9)**:
- ✓ **Day 1**: Next.js 14 프로젝트 생성, TypeScript 및 Tailwind CSS 설정
- ✓ **Day 2**: Supabase 프로젝트 생성 및 연동, 데이터베이스 스키마 설계
- ✓ **Day 3**: 공통 레이아웃 컴포넌트, 헤더/네비게이션, 푸터, 메인 페이지
- ✓ **Day 4**: 관리자 로그인 페이지, 대시보드 기본 구조, 로그아웃 기능
- ✓ **Day 5**: 게시물 목록/상세 페이지, 카테고리별 필터링, 페이지네이션
- ✓ **Day 6**: 검색 기능, 고급 필터링 옵션, 태그 시스템
- ✓ **Day 7**: 관리자 CRUD 시스템 구현 (게시물 생성/수정/삭제, 상태 관리)
- ✓ **Day 8**: WYSIWYG 에디터(Tiptap) 통합 (커스터마이징, 이미지 삽입, HTML 렌더링)
- ✓ **Day 9**: Supabase Storage 기반 파일 업로드 및 미디어 관리 시스템

**다음 우선순위 작업**:
- 🔄 **Day 10**: 댓글 시스템 구현
- 🔄 **Day 11**: 보안 강화 및 사용자 관리
- 🔄 **Day 12**: 고급 관리자 기능

### 1.2. 프로젝트 배경
춘천문화원에서 연말에 500부 한정으로 발간하던 회원 소식지는 물리적, 시간적 제약으로 인해 그 효과가 제한적이었습니다. 본 프로젝트는 기존 오프라인 소식지를 디지털 웹진 '춘천답기'로 전환하여, 춘천 시민 및 회원의 창작물을 시공간 제약 없이 더 많은 대중에게 선보이고, 지속 가능한 디지털 문화 아카이브를 구축하며, 활발한 소통의 장을 마련하는 것을 목표로 합니다.

### 1.3. 프로젝트 목표
- **콘텐츠 확산**: 회원 창작물을 온라인으로 게시하여 접근성을 극대화하고 더 넓은 독자층을 확보한다
- **디지털 아카이빙**: 춘천의 문화 자산인 창작물을 체계적으로 분류하고 영구 보존하여 언제든 찾아볼 수 있는 디지털 아카이브를 구축한다
- **커뮤니티 활성화**: '좋아요', 댓글 등의 소통 기능을 통해 독자의 참여를 유도하고 창작자와 감상자 간의 유대감을 형성한다
- **운영 효율화**: 관리자가 손쉽게 콘텐츠를 등록하고 관리할 수 있는 효율적인 운영 시스템을 마련한다

### 1.4. 사용자 정의 (User Personas)

#### 1.4.1. 관리자 (춘천문화원 담당자)
- **목표**: 회원들의 작품을 손쉽게 웹진에 업로드하고, 카테고리별로 분류하며, 게시된 콘텐츠를 관리하고 싶다
- **특징**: IT 전문가는 아니지만, 기본적인 컴퓨터 활용(문서 작성, 이메일 등)이 가능하다. 직관적이고 간단한 관리 도구를 선호한다

#### 1.4.2. 일반 사용자 (웹진 방문자)
- **목표**: 춘천 지역 작가들의 다양한 작품(글, 그림, 사진, 영상 등)을 편안하게 감상하고 싶다. 마음에 드는 작품에는 응원의 표시를 남기고 싶다
- **특징**: 연령대가 다양하며, 주로 모바일 기기를 통해 접속한다. 깔끔하고 가독성 좋은 디자인을 선호한다

### 1.5. 핵심 기능 요구사항
- **5개 콘텐츠 카테고리**: 수필, 한시, 사진, 서화작품, 공연영상
- **반응형 웹 디자인**: PC/태블릿/모바일 대응 필수
- **사용자 참여**: 좋아요, 댓글 기능
- **관리자 기능**: Supabase 대시보드를 통한 콘텐츠 관리

#### 1.5.1. 카테고리별 상세 기능
웹진은 **수필, 한시, 사진, 서화작품, 공연영상**의 5개 대분류 카테고리로 구성된다.

| 카테고리 | 요구사항 | 사용자 경험(UX) 목표 |
| :--- | :--- | :--- |
| **수필** ✍️ | 1. 텍스트 기반 콘텐츠 등록 및 표시<br/>2. **TTS(Text-to-Speech) 기능 제공** ('음성으로 듣기' 버튼 포함) | 편안한 독서와 청취 경험 제공 |
| **한시** 📜 | 1. 한문 원문과 한글 번역문 동시 등록<br/>2. **원문과 번역문이 좌우로 나란히 표시되는 병렬 뷰(Side-by-Side View) 적용** | 원문의 운치와 번역의 의미를 함께 음미 |
| **사진** 📷 | 1. 고화질 이미지 업로드 및 표시<br/>2. 클릭 시 전체 화면 확대 기능<br/>3. **사진의 EXIF 정보(카메라, 조리개, 셔터속도 등) 자동 추출 및 표시** | 사진 작품의 기술적 정보까지 확인하는 전문성 |
| **서화작품** 🗒️ | 1. 고화질 이미지 업로드 및 표시<br/>2. **이미지 확대/축소(Zoom in/out) 기능**을 통해 세부 표현 감상 지원 | 붓 터치 하나까지 생생하게 느끼는 감상 경험 |
| **공연영상** 🎬 | 1. 유튜브, 비메오 등 외부 동영상 플랫폼 링크 등록<br/>2. **웹진 페이지 내에 영상이 삽입(임베드)되어 재생** | 외부 이동 없이 콘텐츠를 즐기는 몰입감 |

### 1.6. 공통 기능 요구사항
- **반응형 웹 디자인**: PC, 태블릿, 모바일 등 모든 기기에서 최적화된 화면을 제공해야 한다
- **검색 기능**: 제목, 내용, 작가 이름으로 원하는 콘텐츠를 검색할 수 있어야 한다
- **작가별 아카이브**: 작가 이름을 클릭하면 해당 작가의 모든 작품을 모아볼 수 있는 페이지로 이동해야 한다
- **SNS 공유**: 각 콘텐츠 페이지에 카카오톡, 페이스북 등으로 공유할 수 있는 버튼을 제공해야 한다

### 1.7. 비기능적 요구사항
- **성능**: 웹 페이지 로딩 속도는 3초 이내를 목표로 한다 (Next.js의 SSR/SSG 활용)
- **보안**: 사용자 개인정보(로그인 정보 등)는 안전하게 암호화되어야 하며, 모든 통신은 HTTPS를 사용한다 (Supabase 기본 기능 활용)
- **확장성**: 향후 새로운 카테고리나 기능(예: 온라인 전시회)을 추가하기 용이한 유연한 구조로 설계되어야 한다
- **검색엔진 최적화 (SEO)**: 모든 콘텐츠가 네이버, 구글 등 주요 검색엔진에 잘 노출되도록 SEO 기본 요소를 충실히 적용해야 한다

### 1.8. 사용자 참여 기능 요구사항
- **좋아요**: 사용자는 각 콘텐츠에 '좋아요'를 누를 수 있으며, 총 '좋아요' 수가 표시되어야 한다 (비로그인 사용자도 가능)
- **댓글**: 사용자는 각 콘텐츠에 댓글을 작성할 수 있다
  - 댓글 작성을 위해서는 간편 로그인(소셜 로그인 등)이 필요하다
  - 관리자는 부적절한 댓글을 삭제할 수 있어야 한다

### 1.9. 관리자 기능 요구사항
- **핵심 기능 개발 완료 (Day 7-9)**: 관리자 CRUD, WYSIWYG 에디터, 미디어 관리 시스템 등 핵심 운영 기능이 **모두 구현 완료**되었습니다.
- **WYSIWYG 에디터 통합**: 리치 텍스트 콘텐츠 작성을 위해 **Tiptap 에디터**가 성공적으로 통합 및 최적화되었습니다.
- **관리자 계정 정보**:
  - **ID**: cccc@cccc.or.kr
  - **PW**: ansghk2025@$
  - **권한**: 모든 콘텐츠에 대한 읽기/쓰기/삭제 권한
  - **설정 방법**: Supabase Auth를 통해 실제 데이터베이스에 계정 생성 (하드코딩 금지)
  - **MCP 도구 활용**: 관리자 계정 생성 시 `execute_sql` 또는 Supabase Auth API 사용
- **관리자 인터페이스 운영 방식**:
  - **(주요 수단)** 직관적인 Tiptap 에디터가 포함된 관리자 페이지(`/admin`)를 통해 콘텐츠를 관리합니다.
  - **(보조 수단)** 비상시 Supabase 대시보드의 테이블 에디터를 통해 직접 데이터를 관리할 수 있습니다.

### 1.10. 기술 스택 선정 사유

||| 구분 | 기술 | 선정 사유 |
||| :--- | :--- | :--- |
||| **프론트엔드** | **Next.js (최신 버전)** | 뛰어난 성능, SEO 최적화, 풍부한 React 생태계 활용, App Router 지원 |
||| **WYSIWYG 에디터** | **Tiptap** | 리치 텍스트 콘텐츠 작성, 이미지 삽입, 실시간 미리보기 지원. 성공적으로 통합 완료. |
||| **백엔드/DB/인증** | **Supabase** | 개발 시간 단축, 서버 관리 부담 없음, 인증/스토리지 등 통합 기능 제공 |
||| **배포** | **Vercel** | Next.js와의 완벽한 호환성, 손쉬은 배포 및 CI/CD 자동화 |

### 1.10.1. Next.js 최신 버전 사용 지침
- **버전 요구사항**: Next.js 14+ 이상 최신 버전 필수 사용
- **App Router 필수**: Pages Router 대신 App Router 사용
- **TypeScript 지원**: 전체 프로젝트에 TypeScript 적용
- **설치 명령어**: `npx create-next-app@latest --typescript --tailwind --eslint --app --src-dir`
- **주기적 업데이트**: 프로젝트 개발 중 주기적으로 최신 버전으로 업데이트

---

| 문서 버전 | 작성일 | 작성자 | 상태 |
| :--- | :--- | :--- | :--- |
| v4.0 | 2025-09-16 | AI Agent | 개발일정(Day 9 완료)에 맞춰 프로젝트 현황 및 완료된 기능 상세 반영 |
| v3.0 | 2025-09-12 | AI Agent (Project Restart) | 새로운 Supabase 프로젝트 및 GitHub 정보 반영, 개발 방향 정리 |
| v2.2 | 2025-09-09 | AI Agent (Supabase Config) | Supabase 프로젝트 정보 및 환경 설정 추가 |
| v2.1 | 2025-09-09 | AI Agent (MCP Enhanced) | Supabase MCP 및 관리자 계정 추가 |
| v2.0 | 2025-09-08 | AI Agent (Integrated) | 통합 완료 |
| v1.0 | 2025-09-05 | Gemini (AI Assistant) | 초안(Draft) |

---

## 2. 프로젝트 구조 규칙

### 디렉토리 구조

```
webzine/
├── pages/                    # Next.js 페이지
│   ├── api/                  # API 라우트
│   ├── category/             # 카테고리별 페이지
│   ├── author/               # 작가별 아카이브 페이지
│   └── admin/                # 관리자 페이지 (향후)
├── components/               # 재사용 컴포넌트
│   ├── layout/               # 레이아웃 컴포넌트
│   ├── category/             # 카테고리별 특화 컴포넌트
│   └── common/               # 공통 컴포넌트
├── lib/                      # 유틸리티 및 설정
│   ├── supabase.js          # Supabase 클라이언트 설정
│   │   └── createClient() 사용하여 클라이언트 인스턴스 생성
│   └── utils/               # 헬퍼 함수들
├── styles/                  # 스타일시트
└── public/                  # 정적 파일
```

### 파일 명명 규칙
- **페이지 파일**: kebab-case (예: `content-list.js`)
- **컴포넌트 파일**: PascalCase (예: `ContentCard.js`)
- **유틸리티 파일**: camelCase (예: `formatDate.js`)

---

## 3. 카테고리별 특화 기능 구현 규칙

### 수필 (Essay) 카테고리
- **TTS 기능 필수**: `react-speech-kit` 또는 Web Speech API 사용
- **음성 재생 버튼**: 각 수필 페이지에 '음성으로 듣기' 버튼 배치
- **텍스트 하이라이팅**: TTS 재생 중 현재 읽는 부분 시각적 표시

```javascript
// 수필 컴포넌트에 TTS 기능 필수 포함
const EssayContent = () => {
  const { speak, cancel, speaking } = useSpeechSynthesis();
  // TTS 구현 로직
}
```

### 한시 (Classical Poetry) 카테고리
- **병렬 뷰 필수**: 원문과 번역문을 좌우 분할하여 동시 표시
- **반응형 병렬 뷰**: 모바일에서는 상하 배치로 변경
- **데이터 구조**: `original_text`와 `translation` 필드 분리 저장

```javascript
// 한시 컴포넌트 레이아웃 필수 구조
<div className="poetry-container">
  <div className="original-text">원문</div>
  <div className="translation-text">번역문</div>
</div>
```

### 사진 (Photography) 카테고리
- **EXIF 정보 추출**: `exifr` 라이브러리 사용 필수
- **전체 화면 확대**: `react-image-gallery` 또는 `react-modal` 활용
- **EXIF 표시 항목**: 카메라 모델, ISO, 조리개, 셔터속도, 촬영일시

```javascript
// 사진 컴포넌트에 EXIF 정보 표시 필수
const PhotoContent = () => {
  const [exifData, setExifData] = useState(null);
  // EXIF 추출 및 표시 로직
}
```

### 서화작품 (Calligraphy/Painting) 카테고리  
- **줌 기능 필수**: `react-zoom-pan-pinch` 라이브러리 사용
- **고해상도 이미지 지원**: WebP 포맷 우선, JPEG 대체
- **줌 컨트롤**: 확대/축소 버튼과 마우스 휠/터치 제스처 모두 지원

```javascript
// 서화작품 컴포넌트에 줌 기능 필수 포함
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
const CalligraphyContent = () => {
  return (
    <TransformWrapper>
      <TransformComponent>
        {/* 작품 이미지 */}
      </TransformComponent>
    </TransformWrapper>
  );
}
```

### 공연영상 (Performance Video) 카테고리
- **임베드 재생 필수**: 외부 사이트 이동 없이 페이지 내 재생
- **지원 플랫폼**: YouTube, Vimeo 필수 지원
- **반응형 비디오**: `react-player` 라이브러리 사용 권장

```javascript
// 공연영상 컴포넌트에 임베드 플레이어 필수
import ReactPlayer from 'react-player';
const PerformanceVideo = () => {
  return (
    <ReactPlayer
      url={videoUrl}
      width="100%"
      height="auto"
      controls
    />
  );
}
```

---

## 4. UI/UX 디자인 규칙

### 반응형 디자인
- **브레이크포인트 정의**:
  - 모바일: `< 768px`
  - 태블릿: `768px - 1023px`  
  - 데스크톱: `>= 1024px`
- **CSS 프레임워크**: Tailwind CSS 사용 권장
- **모바일 우선 설계**: Mobile-first 접근법 적용

### 네비게이션 구조
- **메인 네비게이션**: 5개 카테고리 + 전체보기 + 검색
- **작가별 네비게이션**: 작가명 클릭 시 해당 작가의 전체 작품 목록 페이지로 이동
- **검색 기능**: 제목, 내용, 작가명으로 전체 콘텐츠 검색

### 콘텐츠 카드 디자인
- **썸네일 이미지**: 16:9 비율 유지 (없으면 카테고리 아이콘)
- **메타데이터 표시**: 제목, 작가명, 발행일, 좋아요 수
- **호버 효과**: 카드에 마우스 오버 시 살짝 떠오르는 효과

---

## 5. 데이터베이스 및 API 규칙

### Supabase 테이블 설계
- **테이블 생성 시 Supabase MCP 도구 활용 필수**
  - `list_tables`로 기존 테이블 현황 확인
  - `apply_migration`으로 DDL 작업 수행
  - `generate_typescript_types`로 타입 정의 자동 생성

- **contents 테이블 필수 필드**:
  ```sql
  - id (uuid, primary key)
  - title (text, not null)
  - content (text, not null)
  - category (text, not null) -- 'essay', 'poetry', 'photo', 'calligraphy', 'video'
  - author_name (text, not null)
  - created_at (timestamp)
  - likes_count (integer, default 0)
  - is_published (boolean, default false)
  ```

- **관리자 인증 설정**:
  - Supabase Auth를 통한 관리자 계정 실제 데이터베이스 등록 필수
  - **관리자 계정**: cccc@cccc.or.kr / ansghk2025@$
  - **계정 생성**: MCP 도구로 실제 데이터베이스에 계정 생성 (하드코딩 금지)
  - **권한 관리**: Supabase RLS(Row Level Security) 정책 설정
  - **보안 검사**: `get_advisors`로 정기적 보안 점검

- **환경 변수 설정 (.env.local)**:
  ```env
  NEXT_PUBLIC_SUPABASE_URL=https://oeeznxdrubsutvezyhxi.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lZXpueGRydWJzdXR2ZXp5aHhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2Mjc0MzYsImV4cCI6MjA3MzIwMzQzNn0.7AyEo0FeLiEapdz71NdOZ0jnC-tRa4Q0eJ1_dABBSC8
  ```

### 카테고리별 추가 필드
- **한시**: `original_text`, `translation`
- **사진/서화**: `image_url`, `image_exif`
- **공연영상**: `video_url`, `video_platform`

### API 엔드포인트 규칙
- **콘텐츠 목록**: `/api/contents?category={category}&page={page}`
- **콘텐츠 상세**: `/api/contents/{id}`
- **작가별 콘텐츠**: `/api/contents/author/{author_name}`
- **검색**: `/api/search?q={query}`
- **좋아요**: `/api/contents/{id}/like` (POST)

---

## 6. SEO 및 성능 최적화 규칙

### SEO 필수 요소
- **메타 태그**: 모든 페이지에 적절한 title, description, keywords 설정
- **Open Graph**: 각 콘텐츠에 OG 이미지, 제목, 설명 설정
- **구조화 데이터**: JSON-LD 형식으로 작품 정보 마크업
- **사이트맵**: Next.js sitemap 자동 생성

### 성능 최적화
- **이미지 최적화**: Next.js Image 컴포넌트 필수 사용
- **레이지 로딩**: 콘텐츠 목록에서 무한 스크롤 또는 페이지네이션
- **SSG/SSR**: 정적 콘텐츠는 SSG, 동적 콘텐츠는 SSR 적용
- **캐싱**: Supabase 데이터를 적절히 캐싱하여 로딩 속도 개선

---

## 7. 사용자 참여 기능 규칙

### 좋아요 시스템
- **비로그인 허용**: 로그인 없이 좋아요 가능 (IP 기반 중복 방지)
- **실시간 업데이트**: 좋아요 클릭 시 즉시 카운트 반영
- **UI 피드백**: 좋아요 버튼 클릭 시 애니메이션 효과

### 댓글 시스템
- **로그인 필수**: 소셜 로그인 (구글, 카카오) 필수
- **관리자 권한**: 부적절한 댓글 삭제 기능

---

## 8. 관리자 기능 규칙

### 콘텐츠 관리
- **1차 방법**: Tiptap 에디터가 통합된 `/admin` 페이지 사용
- **2차 방법**: Supabase 대시보드의 테이블 에디터 직접 사용
- **MCP 도구 활용**: `execute_sql`로 콘텐츠 CRUD 작업 수행
- **데이터 모니터링**: `list_tables`로 테이블 상태 확인
- **실제 데이터 저장**: 모든 콘텐츠는 하드코딩 대신 실제 데이터베이스에 저장
- **Markdown 지원**: 콘텐츠 본문은 Markdown 형식으로 작성/저장
- **이미지 업로드**: Supabase Storage 활용
- **로그 추적**: `get_logs`로 관리 작업 로그 모니터링

### 향후 관리자 페이지 구축 시
- **경로**: `/admin` 하위에 모든 관리 기능 배치
- **인증**: Supabase Auth를 통한 관리자 권한 확인
- **WYSIWYG 에디터**: **Tiptap** 에디터 사용

---

## 9. 금지 사항

### 절대 금지
- **일반적인 React/Next.js 지식 설명 금지**: 프로젝트 특화 규칙만 포함
- **카테고리별 특화 기능 생략 금지**: 각 카테고리의 고유 기능은 반드시 구현
- **반응형 디자인 생략 금지**: 모든 컴포넌트는 반드시 모바일 대응
- **Supabase 외 다른 백엔드 사용 금지**: 일관성 있는 기술 스택 유지

### 개발 시 주의사항
- **성능 최적화 무시 금지**: 3초 이내 로딩 속도 목표 준수
- **SEO 설정 누락 금지**: 모든 페이지에 적절한 메타 태그 필수
- **CORS 설정 누락 금지**: Supabase API 호출 시 CORS 정책 준수
- **보안 설정 무시 금지**: 환경 변수로 API 키 관리 필수
- **환경 변수 노출 금지**: .env.local 파일을 .gitignore에 포함하여 Git 커밋에서 제외

---

## 0. 개발 환경 초기 설정 가이드

### 0.1. 프로젝트 시작 전 체크리스트
개발을 시작하기 전에 반드시 다음 단계들을 MCP 도구로 수행해야 합니다:

1. **Supabase 프로젝트 연결 확인**:
   ```
   list_projects
   get_project("oeeznxdrubsutvezyhxi")
   ```

2. **데이터베이스 상태 확인**:
   ```
   list_tables("oeeznxdrubsutvezyhxi")
   ```

3. **보안 및 성능 체크**:
   ```
   get_advisors("oeeznxdrubsutvezyhxi", "security")
   get_advisors("oeeznxdrubsutvezyhxi", "performance")
   ```

4. **GitHub 리포지토리 준비**:
   - Repository URL: https://github.com/Carpkun/webzine.git
   - 현재 빈 리포지토리 상태이므로 초기 코드 푸시 필요

5. **개발 환경 확인**:
   - 운영체제: Windows 10/11
   - Shell: PowerShell 5.1
   - Node.js 및 npm 설치 확인

### 0.2. 새로운 프로젝트 설정 시 주의사항

- **기존 프로젝트와의 차이점**: 새로운 Supabase Project ID `oeeznxdrubsutvezyhxi` 사용
- **환경 변수 업데이트**: `.env.local` 파일에 새로운 API 키 반영 필수
- **GitHub 연동**: Carpkun/webzine 리포지토리로 코드 관리
- **MCP 도구 우선**: 모든 Supabase 작업은 우선 MCP 도구를 통해서 수행

### 0.3. 더미 데이터 및 테스트 데이터 관리 규칙

**🚨 중요**: 주의
- **하드코딩 금지**: 더미 데이터를 코드에 하드코딩하지 말고 반드시 실제 데이터베이스에 저장
- **MCP 도구 활용**: `execute_sql`로 더미 데이터 삽입 또는 `apply_migration`으로 시드 데이터 생성
- **카테고리별 테스트**: 각 카테고리(수필, 한시, 사진, 서화작품, 공연영상)의 특화 기능 테스트를 위한 실제 데이터 필수

#### 더미 데이터 생성 단계
1. **테이블 생성 후** 즉시 MCP 도구로 더미 데이터 삽입
2. **카테고리별 샘플 데이터** 각 10개씩 생성
   - 수필: TTS 기능 테스트용 긴 텍스트
   - 한시: 원문과 번역문 병렬 표시 테스트용
   - 사진: EXIF 정보 테스트용 이미지 URL
   - 서화작품: 줄 기능 테스트용 고해상도 이미지
   - 공연영상: YouTube/Vimeo 임베드 테스트용 URL
3. **데이터 검증**: 생성 후 `execute_sql`로 데이터 조회 및 확인

---

## 10. 백그라운드 개발 환경 및 테스트 규칙

### 10.1. 개발 서버 실행 규칙

#### 기본 실행 방법
- **개발 서버는 포그라운드에서 실행**하는 것을 기본으로 합니다
- **`npm run dev` 명령어로 개발 서버 시작**
- **Hot Reload 기능을 활용하여 실시간 변경사항 반영**

#### 개발 서버 실행 명령어

```powershell
# 기본 개발 서버 실행
npm run dev

# 특정 포트로 실행 (필요 시)
npm run dev -- -p 3001
```

#### 개발 서버 상태 모니터링

- **서버 상태 확인**: http://localhost:3000에서 웹사이트 로딩 여부 확인
- **빌드 로그 모니터링**: 터미널에서 실시간 로그 확인
- **포트 충돌 시 대응**: Next.js가 자동으로 다른 포트 할당
- **메모리 사용량 모니터링**: 개발 중 서버 성능 상태 확인

### 10.2. Git 워크플로우 자동화

#### 커밋 및 푸시 자동화

```bash
# 기본 Git 워크플로우
git add .
git commit -m "작업내용: 상세한 설명"
git push origin main

# 원격 레포지토리 설정 (최초 1회만)
git remote add origin https://github.com/Carpkun/webzine.git
git branch -M main
git push -u origin main
```

#### 커밋 메시지 규칙
- **한글로 작성**: "일차: 기능명 구현 완료"
- **상세 내용 포함**: 구현된 기능, 수정된 파일, 및 주요 변경사항 기술
- **이모지와 체크리스트**: 가독성을 위해 이모지와 체크리스트 활용

### 10.3. 테스트 자동화 및 모니터링

#### 상시 모니터링 대상
- **웹사이트 로딩 상태**: http://localhost:3000 접속 가능 여부
- **카테고리별 페이지**: /essay, /poetry, /photo, /calligraphy, /video 정상 작동
- **검색 기능**: /search 페이지 정상 작동
- **데이터베이스 연동**: Supabase 연결 및 데이터 로딩 상태

#### 자동 테스트 스크립트

```powershell
# 기본 테스트 스위트
$testUrls = @(
    "http://localhost:3000",
    "http://localhost:3000/essay",
    "http://localhost:3000/poetry",
    "http://localhost:3000/photo",
    "http://localhost:3000/calligraphy",
    "http://localhost:3000/video",
    "http://localhost:3000/search"
)

foreach ($url in $testUrls) {
    try {
        $response = Invoke-WebRequest -Uri $url -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ $url - OK" -ForegroundColor Green
        } else {
            Write-Host "⚠️ $url - Status: $($response.StatusCode)" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "❌ $url - Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}
```

### 10.4. 성능 모니터링

#### 주요 성능 지표
- **페이지 로딩 시간**: 3초 이내 목표
- **First Contentful Paint (FCP)**: 1.5초 이내
- **Time to Interactive (TTI)**: 3초 이내
- **Cumulative Layout Shift (CLS)**: 0.1 이하

#### 성능 테스트 도구
- **Lighthouse**: Chrome DevTools의 Lighthouse 탭 활용
- **Web Vitals**: Chrome 익스텐션 또는 web-vitals 라이브러리
- **Bundle Analyzer**: Next.js Bundle Analyzer로 번들 크기 분석

### 10.5. 오류 처리 및 디버깅

#### 로그 모니터링
- **개발 서버 로그**: 터미널에서 실시간 로그 확인
- **브라우저 콘솔**: F12 개발자 도구의 Console 탭
- **Supabase 로그**: Supabase 대시보드의 로그 탭

#### 주요 오류 패턴 및 해결법

| 오류 유형 | 증상 | 해결방법 |
|:---|:---|:---|
| **Supabase 연결 실패** | 데이터 로딩 안됨 | `.env.local` 환경변수 확인, 데이터베이스 스키마 실행 |
| **이미지 로딩 오류** | 이미지 표시 안됨 | `next.config.js`에 이미지 도메인 추가 |
| **타입 오류** | TypeScript 컴파일 에러 | `lib/types.ts`에서 인터페이스 정의 확인 |
| **빌드 오류** | 사이트 접속 불가 | 서버/클라이언트 컴포넌트 분리 확인 |

### 10.6. 백그라운드 프로세스 관리

#### 프로세스 상태 확인
```powershell
# Node.js 프로세스 확인
Get-Process | Where-Object {$_.ProcessName -like "*node*"}

# 포트 3000 사용 중인 프로세스 확인
netstat -ano | findstr :3000
```

#### 프로세스 종료 및 재시작
```powershell
# 특정 포트 프로세스 종료
$processId = (netstat -ano | findstr :3000 | ForEach-Object { ($_ -split "\s+")[-1] })[0]
if ($processId) {
    Stop-Process -Id $processId -Force
    Write-Host "포트 3000 프로세스 종료" -ForegroundColor Yellow
}

# 개발 서버 재시작
Start-Process powershell -ArgumentList "-Command", "cd 'C:\Users\Moony\Documents\Workspace\webzine'; npm run dev" -WindowStyle Hidden
Write-Host "개발 서버 백그라운드에서 재시작" -ForegroundColor Green
```

---

## 11. AI 개발자 의사결정 가이드

### MCP 도구별 상세 활용법

#### 개발 계획 단계
- **`analyze_task`**: 새로운 기능 구현 요청 시 반드시 사용
- **`plan_task`**: 3개 이상의 단계가 필요한 복잡한 작업에 활용
- **`split_tasks`**: 대규모 기능(예: 카테고리별 페이지 전체) 개발 시 필수

#### 개발 진행 단계  
- **`execute_task`**: 각 세분화된 작업의 구현 지침 확인
- **`verify_task`**: 기능 구현 완료 후 품질 검증 필수
- **`list_tasks`**: 전체 개발 진행 상황 주기적 확인

#### 기술 조사 단계
- **`resolve-library-id`**: React, Next.js 라이브러리 사용 전 ID 확인
- **`get-library-docs`**: 라이브러리 최신 문서 및 베스트 프랙티스 학습
- **`research_mode`**: 복잡한 기술 문제 또는 새로운 사양 조사

#### Supabase 작업 단계
- **프로젝트 설정**: `list_projects` → `get_project`로 프로젝트 확인
- **Project ID 고정 값**: oeeznxdrubsutvezyhxi (모든 MCP 도구에서 사용)
- **데이터베이스 관리**: `list_tables` → `execute_sql` → `apply_migration` 순서 활용
- **타입 생성**: `generate_typescript_types`로 타입 정의 자동 생성
- **보안 및 성능**: `get_advisors`로 정기 점검
- **로그 모니터링**: `get_logs`로 서비스 상태 확인

#### 사고 과정 단계
- **`process_thought`**: 기능 설계 및 아키텍처 결정 시 활용
- **`sequentialthinking`**: 복잡한 문제 해결을 위한 단계별 사고

### 금지 사항 (중요)
- **MCP 도구 미사용 금지**: 복잡한 기능 구현 시 MCP 도구 없이 직접 구현 절대 금지
- **Supabase MCP 미사용 금지**: Supabase 관련 작업 시 Supabase MCP 도구 없이 직접 쿼리 작성 절대 금지
- **하드코딩 금지**: 더미 데이터, 관리자 계정 정보 등을 코드에 하드코딩하지 말고 반드시 실제 데이터베이스에 저장
- **단순 추측 금지**: 상세 기술 문서를 확인하지 않고 일반적인 지식만으로 구현 금지
- **작업 검증 생략 금지**: `verify_task` 없이 기능 구현 완료 선언 금지
- **관리자 인증 생략 금지**: 관리자 계정 설정 없이 관리 기능 구현 금지

### 우선순위 판단
1. **카테고리별 특화 기능** > 일반적인 웹 기능
2. **사용자 경험** > 개발 편의성
3. **성능 최적화** > 화려한 디자인
4. **SEO 최적화** > 복잡한 상호작용

### 기술적 의사결정
- **라이브러리 선택**: 프로젝트 요구사항에 맞는 검증된 라이브러리 우선
- **컴포넌트 설계**: 카테고리별 특화 기능을 고려한 확장 가능한 구조
- **데이터 구조**: 5개 카테고리의 다양한 요구사항을 수용하는 유연한 스키마

### 예외 상황 처리
- **이미지 로딩 실패**: 기본 카테고리 아이콘으로 대체
- **동영상 재생 실패**: 원본 링크로 이동하는 버튼 제공
- **TTS 지원 없는 브라우저**: 안내 메시지 표시 후 텍스트만 제공

---

## 12. 핵심 구현 사항 (Day 7-8 최우선)

### 12.1. 관리자 CRUD 시스템 (Day 7)
```typescript
// 예상 구현 구조
interface AdminCRUD {
  createPost(data: PostData): Promise<Post>
  updatePost(id: string, data: Partial<PostData>): Promise<Post>
  deletePost(id: string): Promise<void>
  getPosts(filters: PostFilters): Promise<Post[]>
  manageCategories(): CategoryManager
}

// 필수 구현 기능
- 카테고리별 게시물 CRUD 인터페이스
- 게시물 생성/수정/삭제 기능
- 카테고리 관리 시스템
- 게시물 상태 관리 (공개/비공개/예약발행)
```

### 12.2. WYSIWYG 에디터 (Day 8)
```typescript
// Tiptap 에디터 통합 완료
interface TiptapEditorFeatures {
  richTextFormatting: true    // 리치 텍스트 포맷팅
  imageInsertion: true        // 이미지 삽입 기능
  linkManagement: true        // 링크 관리
  htmlMarkdownExport: true    // HTML/Markdown 내보내기
  realtimePreview: true       // 실시간 미리보기
}

// 완료 사항
- Tiptap 에디터 선택 및 완전 통합 완료
- 커스텀 툴바, 다크모드, 반응형 디자인 적용 완료
- URL 기반 및 미디어 라이브러리 연동 이미지 삽입 기능 구현 완료
- HTML 콘텐츠 렌더링 시스템 구현 완료
```

### 12.3. 파일 업로드 및 미디어 관리 (Day 9)
```typescript
// Supabase Storage 기반 파일 시스템 구현 완료
interface MediaManager {
  uploadFile(file: File, bucket: string): Promise<string>
  deleteFile(path: string): Promise<void>
  listFiles(bucket: string): Promise<FileObject[]>
  getPublicUrl(path: string): string
}

// 완료 사항
- Supabase Storage 파일 업로드/삭제 API (`/api/upload`) 완벽 구현
- 드래그 앤 드롭 파일 업로더 및 미디어 라이브러리 인터페이스 완벽 구현
- Tiptap 에디터와 미디어 라이브러리 연동 완벽 구현
- 관리자 페이지 내 전용 미디어 관리 메뉴 추가 완료
```

---

## 13. 리스크 관리 및 대응 방안

### 13.1. 이전에 식별된 고위험 요소 (✅ 모두 해결됨)
- **관리자 CRUD 시스템 구현 지연**: ✅ 해결됨. Day 7에 최우선으로 개발하여 완벽히 구현 완료.
- **WYSIWYG 에디터 통합 복잡성**: ✅ 해결됨. Day 8에 안정적인 Tiptap 라이브러리를 선택하여 성공적으로 통합 완료.
- **파일 업로드와 에디터 연동 이슈**: ✅ 해결됨. Day 9에 Supabase Storage 기반 미디어 시스템을 구축하고 에디터와 완벽하게 연동 완료.

### 13.2. 성공적인 대응 방안 수행
- **Day 7-9에 핵심 기능 집중**: 우선순위 재조정을 통해 관리자 핵심 기능을 조기에 확보.
- **검증된 라이브러리 사용**: Tiptap 등 안정화된 솔루션을 채택하여 개발 리스크 최소화.
- **최소 기능부터 점진적 확장**: 각 기능을 단계별로 구현하고 검증하여 안정성을 확보.
- **MCP 도구 적극 활용**: 체계적인 분석, 계획, 실행, 검증 단계를 거쳐 프로젝트를 관리.

### 13.3. 품질 보증 방안
- **단계별 검증**: 각 기능 완성 후 `verify_task`로 품질 확인
- **실제 데이터 테스트**: 하드코딩 대신 실제 데이터베이스 데이터로 테스트
- **보안 점검**: Supabase MCP의 `get_advisors`로 정기 보안 검사
- **성능 모니터링**: 3초 이내 로딩 속도 목표 달성 확인

### 13.4. 일정 관리 원칙
- **우선순위 엄수**: Day 7-9 관리자 시스템을 최우선으로 구현 완료
- **PWA 기능 후순위**: Day 13으로 이동하여 필수 기능 우선 구현 전략 유지
- **실용성 강화**: 관리자가 실제로 웹진을 운영할 수 있는 완전한 환경 구축 완료
- **유연한 일정 조정**: 핵심 기능 완성을 위해 부가 기능은 시간 허용 시 구현하는 원칙 유지

---

## 📝 업데이트 내역 (v4.0 - 개발일정 반영판)

### 주요 변경사항 (2025년 9월 16일)
1. **개발 기간 및 진행 상황 업데이트**:
   - 현재 진행: Day 9 (2025년 9월 16일) - 진행률 약 71%
   - Day 1-9 완료된 작업(관리자 CRUD, WYSIWYG, 미디어 시스템) 상세 반영

2. **기술 스택 및 도구 추가**:
   - WYSIWYG 에디터: Tiptap으로 확정 및 통합 완료 명시

3. **개발 우선순위 갱신**:
   - 다음 우선순위 작업으로 Day 10(댓글 시스템) 명시

4. **관리자 기능 및 리스크 관리 현황 변경**:
   - 관리자 핵심 기능 요구사항을 '완료' 상태로 변경
   - 기존 리스크들이 성공적으로 '해결됨'을 명시

5. **문서 버전 및 날짜 업데이트**:
   - 문서 버전을 v4.0으로 올리고, 최종 수정일을 2025년 9월 16일로 변경

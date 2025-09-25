# 춘천답기 웹진 - contents 테이블 스키마 설계

## 📋 설계 개요
- **테이블명**: contents
- **목적**: 5개 카테고리(수필, 한시, 사진, 서화작품, 공연영상)의 콘텐츠를 통합 관리
- **설계 원칙**: 확장성, 성능 최적화, 카테고리별 특화 지원

## 🏗️ 테이블 구조

### 기본 필드 (모든 카테고리 공통)
| 필드명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | 고유 식별자 |
| `title` | TEXT | NOT NULL | 제목 |
| `content` | TEXT | NOT NULL | 본문 내용 |
| `category` | TEXT | NOT NULL, CHECK 제약 | 카테고리 (essay, poetry, photo, calligraphy, video) |
| `author_name` | TEXT | NOT NULL | 작가명 |
| `created_at` | TIMESTAMP WITH TIME ZONE | DEFAULT CURRENT_TIMESTAMP | 생성일시 |
| `updated_at` | TIMESTAMP WITH TIME ZONE | DEFAULT CURRENT_TIMESTAMP | 수정일시 (자동 업데이트) |
| `likes_count` | INTEGER | DEFAULT 0, CHECK >= 0 | 좋아요 수 |
| `is_published` | BOOLEAN | DEFAULT false | 공개 여부 |

### 카테고리별 특화 필드

#### 한시(Poetry) 전용 필드
| 필드명 | 타입 | 설명 |
|--------|------|------|
| `original_text` | TEXT | 한문 원문 (필수) |
| `translation` | TEXT | 한글 번역문 (필수) |

#### 사진(Photo) / 서화작품(Calligraphy) 전용 필드
| 필드명 | 타입 | 설명 |
|--------|------|------|
| `image_url` | TEXT | 이미지 URL (필수) |
| `image_exif` | JSONB | EXIF 정보 (사진 전용, JSON 형태) |

#### 공연영상(Video) 전용 필드
| 필드명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| `video_url` | TEXT | 필수 | 동영상 URL |
| `video_platform` | TEXT | CHECK (youtube, vimeo, other) | 플랫폼 구분 |

### SEO 및 메타데이터 필드
| 필드명 | 타입 | 설명 |
|--------|------|------|
| `meta_description` | TEXT | SEO 설명 |
| `meta_keywords` | TEXT[] | 키워드 배열 |
| `slug` | TEXT | URL 슬러그 (UNIQUE) |
| `thumbnail_url` | TEXT | 썸네일 이미지 URL |

### 추가 정보 필드
| 필드명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| `view_count` | INTEGER | DEFAULT 0, CHECK >= 0 | 조회수 |
| `featured` | BOOLEAN | DEFAULT false | 추천 콘텐츠 여부 |

## 🚀 성능 최적화

### 인덱스 구성
1. **기본 인덱스**
   - `idx_contents_category`: 카테고리별 필터링
   - `idx_contents_author_name`: 작가별 검색
   - `idx_contents_created_at`: 최신순 정렬
   - `idx_contents_is_published`: 공개 상태 필터링

2. **복합 인덱스**
   - `idx_contents_category_published`: 카테고리 + 공개 상태 조합 쿼리
   - `idx_contents_featured`: 추천 콘텐츠 필터링 (부분 인덱스)

3. **검색 최적화**
   - `idx_contents_fts`: 전문 검색 (GIN 인덱스)
   - 제목, 내용, 작가명에 가중치 적용 (A, B, C 순)

### Full Text Search 지원
- PostgreSQL GIN 인덱스 활용
- 한국어 텍스트 검색 지원
- 필드별 가중치: 제목(A) > 내용(B) > 작가명(C)

## 🔒 보안 및 권한 관리

### RLS (Row Level Security) 정책
1. **공개 콘텐츠 조회**: `is_published = true`인 콘텐츠는 모든 사용자 조회 가능
2. **관리자 전체 권한**: `cccc@cccc.or.kr` 계정은 모든 작업 가능
3. **비공개 콘텐츠**: 관리자만 조회 가능

### 데이터 무결성
- 카테고리별 CHECK 제약조건으로 유효한 값만 허용
- 트리거 함수를 통한 카테고리별 필수 필드 검증
- `updated_at` 자동 업데이트 트리거

## 🎯 카테고리별 유효성 검사

### 자동 검증 규칙
1. **한시(poetry)**: `original_text`, `translation` 필수
2. **사진/서화작품(photo/calligraphy)**: `image_url` 필수
3. **공연영상(video)**: `video_url` 필수

### 에러 메시지
- 한국어로 명확한 오류 메시지 제공
- 카테고리별 필수 필드 누락 시 구체적 안내

## 📊 확장성 고려사항

### 향후 확장 가능 요소
1. **새 카테고리 추가**: CHECK 제약조건 수정으로 간단히 추가 가능
2. **메타데이터 확장**: JSONB 필드 활용으로 유연한 데이터 구조
3. **다국어 지원**: 별도 테이블 구조로 확장 가능
4. **태그 시스템**: `meta_keywords` 배열 필드 활용

### 성능 모니터링
- 인덱스 사용률 추적
- 쿼리 성능 분석
- 디스크 사용량 모니터링

## 🔄 마이그레이션 전략

### 버전 관리
- 파일명: `001_create_contents_table.sql`
- 향후 스키마 변경 시 순차적 번호 부여
- 롤백 스크립트 별도 관리

### 안전한 배포
- 트랜잭션 단위로 실행
- 백업 후 마이그레이션 실행
- 단계별 검증 후 다음 단계 진행

## 📈 예상 데이터 볼륨

### 초기 예상치
- 수필: 월 10-20개 게시물
- 한시: 월 5-10개 게시물  
- 사진: 월 20-30개 게시물
- 서화작품: 월 10-15개 게시물
- 공연영상: 월 3-5개 게시물

### 연간 총 예상: 약 600-960개 콘텐츠

이 스키마는 향후 3-5년간 안정적으로 운영할 수 있도록 설계되었습니다.
// 춘천답기 웹진 - TypeScript 타입 정의
// 데이터베이스 스키마 기반 자동 생성 타입

// ===== 데이터베이스 테이블 타입 =====

// Authors 테이블 - 작가 정보
export interface Author {
  id: string; // UUID
  name: string;
  bio?: string | null;
  profile_image_url?: string | null;
  created_at: string; // ISO 날짜 문자열
  updated_at: string; // ISO 날짜 문자열
}

// Contents 테이블 - 메인 콘텐츠
export interface Content {
  // 기본 필드
  id: string; // UUID
  title: string;
  content: string;
  category: ContentCategory;
  author_name: string;
  author_id?: string | null; // 작가 ID (authors 테이블 참조)
  created_at: string; // ISO 날짜 문자열
  updated_at: string; // ISO 날짜 문자열
  likes_count: number;
  is_published: boolean;

  // 카테고리별 특화 필드 (nullable)
  original_text?: string | null; // 한시 전용
  translation?: string | null; // 한시 전용
  image_url?: string | null; // 사진/서화 전용
  image_exif?: ImageExifData | null; // 사진 전용 (JSONB)
  video_url?: string | null; // 공연영상 전용
  video_platform?: VideoPlatform | null; // 공연영상 전용

  // SEO 및 메타데이터
  meta_description?: string | null;
  meta_keywords?: string[] | null;
  slug?: string | null;
  thumbnail_url?: string | null;

  // 추가 정보
  view_count: number;
  comments_count: number; // 댓글 수
  featured: boolean;
  additional_data?: Record<string, unknown>; // JSONB 필드
  
  // 기타
  description?: string; // 선택적 설명 필드
}

// ===== 열거형 타입 =====

// 콘텐츠 카테고리
export type ContentCategory = 'essay' | 'poetry' | 'photo' | 'calligraphy' | 'video';

// 비디오 플랫폼
export type VideoPlatform = 'youtube' | 'vimeo' | 'other';

// ===== 복합 타입 =====

// EXIF 데이터 구조 (사진용)
export interface ImageExifData {
  camera?: string;
  lens?: string;
  iso?: number;
  aperture?: string;
  shutterSpeed?: string;
  focalLength?: string;
  dateTime?: string;
  gps?: {
    latitude?: number;
    longitude?: number;
  };
  [key: string]: unknown; // 추가 EXIF 데이터
}

// ===== 카테고리별 특화 타입 =====

// 수필 콘텐츠
export interface EssayContent extends Omit<Content, 'category'> {
  category: 'essay';
  // 수필은 기본 필드만 필요
}

// 한시 콘텐츠
export interface PoetryContent extends Omit<Content, 'category'> {
  category: 'poetry';
  original_text: string; // 필수
  translation: string; // 필수
}

// 사진 콘텐츠
export interface PhotoContent extends Omit<Content, 'category'> {
  category: 'photo';
  image_url: string; // 필수
  image_exif?: ImageExifData | null; // 선택
}

// 서화작품 콘텐츠
export interface CalligraphyContent extends Omit<Content, 'category'> {
  category: 'calligraphy';
  image_url: string; // 필수
}

// 공연영상 콘텐츠
export interface VideoContent extends Omit<Content, 'category'> {
  category: 'video';
  video_url: string; // 필수
  video_platform: VideoPlatform;
}

// ===== 유니온 타입 =====

// 카테고리별 특화된 콘텐츠 타입
export type SpecificContent = 
  | EssayContent 
  | PoetryContent 
  | PhotoContent 
  | CalligraphyContent 
  | VideoContent;

// ===== API 응답 타입 =====

// 단일 콘텐츠 응답
export interface ContentResponse {
  data: Content | null;
  error: string | null;
}

// 콘텐츠 목록 응답
export interface ContentsResponse {
  data: Content[] | null;
  error: string | null;
  count?: number;
}

// 페이지네이션 메타데이터
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// 페이지네이션이 포함된 콘텐츠 응답
export interface PaginatedContentsResponse extends ContentsResponse {
  meta?: PaginationMeta;
}

// ===== 쿼리 파라미터 타입 =====

// 콘텐츠 목록 조회 파라미터
export interface ContentListParams {
  category?: ContentCategory;
  author_name?: string;
  is_published?: boolean;
  featured?: boolean;
  page?: number;
  limit?: number;
  sort_by?: 'created_at' | 'updated_at' | 'likes_count' | 'view_count' | 'title';
  sort_order?: 'asc' | 'desc';
  search?: string;
}

// 콘텐츠 생성/수정 파라미터
export interface ContentCreateParams {
  title: string;
  content: string;
  category: ContentCategory;
  author_name: string;
  author_id?: string | null; // 작가 ID (선택사항)
  is_published?: boolean;
  
  // 카테고리별 필드
  original_text?: string;
  translation?: string;
  image_url?: string;
  image_exif?: ImageExifData;
  video_url?: string;
  video_platform?: VideoPlatform;
  
  // SEO 필드
  meta_description?: string;
  meta_keywords?: string[];
  slug?: string;
  thumbnail_url?: string;
  featured?: boolean;
}

export interface ContentUpdateParams extends Partial<ContentCreateParams> {
  id: string;
}

// ===== 타입 가드 함수 =====

// 콘텐츠 카테고리 확인
export function isContentCategory(value: string): value is ContentCategory {
  return ['essay', 'poetry', 'photo', 'calligraphy', 'video'].includes(value);
}

// 비디오 플랫폼 확인  
export function isVideoPlatform(value: string): value is VideoPlatform {
  return ['youtube', 'vimeo', 'other'].includes(value);
}

// 특정 카테고리 콘텐츠 타입 가드
export function isEssayContent(content: Content): content is EssayContent {
  return content.category === 'essay';
}

export function isPoetryContent(content: Content): content is PoetryContent {
  return content.category === 'poetry' && 
         content.original_text !== null && 
         content.translation !== null;
}

export function isPhotoContent(content: Content): content is PhotoContent {
  return content.category === 'photo' && content.image_url !== null;
}

export function isCalligraphyContent(content: Content): content is CalligraphyContent {
  return content.category === 'calligraphy' && content.image_url !== null;
}

export function isVideoContent(content: Content): content is VideoContent {
  return content.category === 'video' && 
         content.video_url !== null && 
         content.video_platform !== null;
}

// ===== 유틸리티 타입 =====

// 공개된 콘텐츠만
export type PublishedContent = Content & { is_published: true };

// 관리자용 콘텐츠 (모든 필드 접근 가능)
export type AdminContent = Content;

// 클라이언트용 콘텐츠 (민감한 정보 제외)
export type ClientContent = Omit<Content, 'is_published'> & {
  is_published?: boolean; // 선택적으로 만들어서 공개 여부를 숨길 수 있음
};

// ===== 검색 관련 타입 =====

// 검색 결과
export interface SearchResult {
  contents: Content[];
  total: number;
  query: string;
  categories: ContentCategory[];
}

// 검색 파라미터
export interface SearchParams {
  query: string;
  categories?: ContentCategory[];
  author?: string;
  page?: number;
  limit?: number;
}

// ===== 카테고리 정보 타입 =====

// 카테고리 메타데이터
export interface CategoryInfo {
  id: ContentCategory;
  name: string;
  description: string;
  icon: string;
  color: string;
}

// 카테고리별 통계
export interface CategoryStats {
  category: ContentCategory;
  total_count: number;
  published_count: number;
  featured_count: number;
  latest_content?: Content;
}

// ===== Supabase 관련 타입 =====

// Supabase 데이터베이스 타입
export interface Database {
  public: {
    Tables: {
      authors: {
        Row: Author;
        Insert: Omit<Author, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Author, 'id' | 'created_at'>> & {
          updated_at?: string;
        };
      };
      contents: {
        Row: Content;
        Insert: Omit<Content, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Content, 'id' | 'created_at'>> & {
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      content_category: ContentCategory;
      video_platform: VideoPlatform;
    };
  };
}

// ===== 에러 타입 =====

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface ValidationError extends ApiError {
  field: string;
  value: unknown;
}

// ===== 댓글 시스템 타입 =====

// 댓글 기본 타입
export interface Comment {
  id: string;
  content_id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  user_avatar?: string;
  body: string;
  created_at: string;
  updated_at: string;
  is_reported: boolean;
  is_deleted: boolean;
  password_hash: string; // 댓글 작성자 비밀번호 해시
}

// 댓글 생성 파라미터
export interface CommentCreateParams {
  content_id: string;
  user_name: string;
  password: string;
  body: string;
}

// 댓글 수정 파라미터
export interface CommentUpdateParams {
  body: string;
  password: string; // 인증용 비밀번호
}

// 댓글 삭제 파라미터
export interface CommentDeleteParams {
  password: string; // 인증용 비밀번호
}

// 비밀번호 확인 파라미터
export interface CommentAuthParams {
  comment_id: string;
  password: string;
}

// 사용자 타입
export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  provider?: string;
}

// 댓글 목록 조회 파라미터
export interface CommentListParams {
  content_id: string;
  page?: number;
  limit?: number;
  include_deleted?: boolean; // 관리자용
}

// 댓글 응답 타입
export interface CommentResponse {
  data: Comment | null;
  error: string | null;
}

// 댓글 목록 응답
export interface CommentsResponse {
  data: Comment[] | null;
  error: string | null;
  count?: number;
  meta?: PaginationMeta;
}


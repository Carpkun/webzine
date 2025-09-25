-- 춘천답기 웹진 contents 테이블 생성 마이그레이션
-- 5개 카테고리 지원: essay(수필), poetry(한시), photo(사진), calligraphy(서화작품), video(공연영상)

-- 1. 테이블 생성
CREATE TABLE IF NOT EXISTS contents (
    -- 기본 필드
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('essay', 'poetry', 'photo', 'calligraphy', 'video')),
    author_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    likes_count INTEGER DEFAULT 0 CHECK (likes_count >= 0),
    is_published BOOLEAN DEFAULT false,
    
    -- 카테고리별 특화 필드 (한시)
    original_text TEXT,  -- 한시 원문
    translation TEXT,    -- 한시 번역문
    
    -- 카테고리별 특화 필드 (사진/서화작품)
    image_url TEXT,      -- 이미지 URL
    image_exif JSONB,    -- EXIF 정보 (사진용)
    
    -- 카테고리별 특화 필드 (공연영상)
    video_url TEXT,      -- 동영상 URL
    video_platform TEXT CHECK (video_platform IN ('youtube', 'vimeo', 'other') OR video_platform IS NULL),
    
    -- SEO 및 메타데이터
    meta_description TEXT,    -- SEO 설명
    meta_keywords TEXT[],     -- 키워드 배열
    slug TEXT UNIQUE,         -- URL 슬러그
    thumbnail_url TEXT,       -- 썸네일 이미지 URL
    
    -- 추가 정보
    view_count INTEGER DEFAULT 0 CHECK (view_count >= 0),
    featured BOOLEAN DEFAULT false  -- 추천 콘텐츠 여부
);

-- 2. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_contents_category ON contents(category);
CREATE INDEX IF NOT EXISTS idx_contents_author_name ON contents(author_name);
CREATE INDEX IF NOT EXISTS idx_contents_created_at ON contents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contents_is_published ON contents(is_published);
CREATE INDEX IF NOT EXISTS idx_contents_featured ON contents(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_contents_category_published ON contents(category, is_published);
CREATE INDEX IF NOT EXISTS idx_contents_slug ON contents(slug) WHERE slug IS NOT NULL;

-- 3. Full Text Search 인덱스 (검색 최적화)
CREATE INDEX IF NOT EXISTS idx_contents_fts ON contents 
USING gin((
    setweight(to_tsvector('korean', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('korean', coalesce(content, '')), 'B') ||
    setweight(to_tsvector('korean', coalesce(author_name, '')), 'C')
));

-- 4. 트리거 함수 생성 (updated_at 자동 업데이트)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 5. 트리거 생성
DROP TRIGGER IF EXISTS update_contents_updated_at ON contents;
CREATE TRIGGER update_contents_updated_at
    BEFORE UPDATE ON contents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. RLS (Row Level Security) 정책 설정
ALTER TABLE contents ENABLE ROW LEVEL SECURITY;

-- 공개된 콘텐츠는 모든 사용자가 읽기 가능
CREATE POLICY "Published contents are viewable by everyone" ON contents
    FOR SELECT USING (is_published = true);

-- 관리자는 모든 작업 가능 (auth.uid()가 관리자인 경우)
CREATE POLICY "Admins can do everything" ON contents
    FOR ALL USING (
        auth.jwt() ->> 'email' = 'cccc@cccc.or.kr'
    );

-- 비공개 콘텐츠도 관리자만 접근 가능
CREATE POLICY "Only admins can view unpublished contents" ON contents
    FOR SELECT USING (
        is_published = false AND auth.jwt() ->> 'email' = 'cccc@cccc.or.kr'
    );

-- 7. 테이블 코멘트 추가
COMMENT ON TABLE contents IS '춘천답기 웹진 메인 콘텐츠 테이블 - 5개 카테고리 지원';
COMMENT ON COLUMN contents.category IS '콘텐츠 카테고리: essay, poetry, photo, calligraphy, video';
COMMENT ON COLUMN contents.original_text IS '한시 카테고리 전용: 원문';
COMMENT ON COLUMN contents.translation IS '한시 카테고리 전용: 번역문';
COMMENT ON COLUMN contents.image_url IS '사진/서화작품 카테고리 전용: 이미지 URL';
COMMENT ON COLUMN contents.image_exif IS '사진 카테고리 전용: EXIF 정보 (JSON)';
COMMENT ON COLUMN contents.video_url IS '공연영상 카테고리 전용: 동영상 URL';
COMMENT ON COLUMN contents.video_platform IS '공연영상 카테고리 전용: 플랫폼 (youtube, vimeo, other)';

-- 8. 유효성 검사 함수 (카테고리별 필수 필드 확인)
CREATE OR REPLACE FUNCTION validate_content_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- 한시 카테고리는 original_text와 translation 필수
    IF NEW.category = 'poetry' THEN
        IF NEW.original_text IS NULL OR NEW.translation IS NULL THEN
            RAISE EXCEPTION '한시 카테고리는 원문(original_text)과 번역문(translation)이 필수입니다.';
        END IF;
    END IF;
    
    -- 사진/서화작품 카테고리는 image_url 필수
    IF NEW.category IN ('photo', 'calligraphy') THEN
        IF NEW.image_url IS NULL THEN
            RAISE EXCEPTION '사진/서화작품 카테고리는 이미지 URL(image_url)이 필수입니다.';
        END IF;
    END IF;
    
    -- 공연영상 카테고리는 video_url 필수
    IF NEW.category = 'video' THEN
        IF NEW.video_url IS NULL THEN
            RAISE EXCEPTION '공연영상 카테고리는 동영상 URL(video_url)이 필수입니다.';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 9. 유효성 검사 트리거 생성
DROP TRIGGER IF EXISTS validate_contents_fields ON contents;
CREATE TRIGGER validate_contents_fields
    BEFORE INSERT OR UPDATE ON contents
    FOR EACH ROW
    EXECUTE FUNCTION validate_content_fields();
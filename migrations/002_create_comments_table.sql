-- 춘천답기 웹진 comments 테이블 생성 마이그레이션
-- 댓글 시스템 지원

-- 1. 테이블 생성
CREATE TABLE IF NOT EXISTS comments (
    -- 기본 필드
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    user_avatar TEXT,
    body TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_reported BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    
    -- 외래키 제약조건
    CONSTRAINT fk_comments_content_id 
        FOREIGN KEY (content_id) 
        REFERENCES contents(id) 
        ON DELETE CASCADE
);

-- 2. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_comments_content_id ON comments(content_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_is_deleted ON comments(is_deleted);
CREATE INDEX IF NOT EXISTS idx_comments_is_reported ON comments(is_reported);
CREATE INDEX IF NOT EXISTS idx_comments_content_active ON comments(content_id, is_deleted) WHERE is_deleted = false;

-- 3. 트리거 생성 (updated_at 자동 업데이트)
DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
CREATE TRIGGER update_comments_updated_at
    BEFORE UPDATE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. RLS (Row Level Security) 정책 설정
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- 삭제되지 않은 댓글은 모든 사용자가 읽기 가능
CREATE POLICY "Comments are viewable by everyone" ON comments
    FOR SELECT USING (is_deleted = false);

-- 댓글 작성은 모든 사용자 가능 (임시로 - 추후 인증 구현시 수정)
CREATE POLICY "Anyone can create comments" ON comments
    FOR INSERT WITH CHECK (true);

-- 본인의 댓글만 수정/삭제 가능 (임시로 모든 사용자 허용 - 추후 인증 구현시 수정)
CREATE POLICY "Anyone can update their own comments" ON comments
    FOR UPDATE USING (true);

-- 관리자는 모든 댓글에 대한 모든 작업 가능
CREATE POLICY "Admins can do everything on comments" ON comments
    FOR ALL USING (
        auth.jwt() ->> 'email' = 'cccc@cccc.or.kr'
    );

-- 신고된 댓글도 관리자만 볼 수 있음
CREATE POLICY "Admins can view reported comments" ON comments
    FOR SELECT USING (
        is_reported = true AND auth.jwt() ->> 'email' = 'cccc@cccc.or.kr'
    );

-- 5. 테이블 코멘트 추가
COMMENT ON TABLE comments IS '춘천답기 웹진 댓글 테이블';
COMMENT ON COLUMN comments.content_id IS '콘텐츠 ID (외래키)';
COMMENT ON COLUMN comments.user_id IS '사용자 ID';
COMMENT ON COLUMN comments.user_name IS '사용자 이름';
COMMENT ON COLUMN comments.user_email IS '사용자 이메일';
COMMENT ON COLUMN comments.user_avatar IS '사용자 아바타 URL';
COMMENT ON COLUMN comments.body IS '댓글 내용';
COMMENT ON COLUMN comments.is_reported IS '신고 여부';
COMMENT ON COLUMN comments.is_deleted IS '삭제 여부 (소프트 삭제)';
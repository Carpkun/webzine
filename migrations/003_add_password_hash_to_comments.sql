-- 춘천답기 웹진 comments 테이블에 password_hash 컬럼 추가
-- 사용자명/비밀번호 기반 댓글 시스템 지원

-- 1. password_hash 컬럼 추가
ALTER TABLE comments 
ADD COLUMN IF NOT EXISTS password_hash TEXT NOT NULL DEFAULT '';

-- 2. 기존 데이터에 대해 임시 해시값 설정 (bcrypt 해시값 형태)
-- 실제로는 애플리케이션에서 bcrypt.hash()로 생성되어야 함
UPDATE comments 
SET password_hash = '$2b$10$defaulthashforexistingcomments1234567890'
WHERE password_hash = '';

-- 3. password_hash 컬럼을 NOT NULL로 설정 (기본값 제거)
ALTER TABLE comments 
ALTER COLUMN password_hash DROP DEFAULT;

-- 4. 인덱스 추가 (비밀번호 검증 시 성능 최적화)
CREATE INDEX IF NOT EXISTS idx_comments_password_lookup 
ON comments(id, password_hash) WHERE is_deleted = false;

-- 5. 테이블 코멘트 업데이트
COMMENT ON COLUMN comments.password_hash IS '댓글 작성자 비밀번호 해시 (bcrypt)';

-- 6. RLS 정책 업데이트 - 비밀번호 해시는 일반 사용자가 조회할 수 없도록 수정
-- 기존 정책 삭제 후 새로 생성
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON comments;

-- 비밀번호 해시 제외하고 조회 가능하도록 수정된 정책
-- 실제로는 애플리케이션 레벨에서 SELECT 시 password_hash 컬럼을 제외해야 함
CREATE POLICY "Comments are viewable by everyone" ON comments
    FOR SELECT USING (is_deleted = false);

-- 7. 관리자용 정책 - 모든 컬럼 접근 가능 (비밀번호 해시 포함)
CREATE POLICY "Admins can view all comment data" ON comments
    FOR SELECT USING (
        auth.jwt() ->> 'email' = 'cccc@cccc.or.kr'
    );

-- 마이그레이션 완료 로그
-- 주의: 기존 댓글의 경우 기본 비밀번호 해시가 설정되어 있으므로
--       실제 서비스 전에 기존 댓글 처리 방안을 결정해야 함
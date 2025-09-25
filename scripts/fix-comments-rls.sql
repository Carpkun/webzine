-- 댓글 삭제 오류 빠른 수정 스크립트
-- Supabase SQL Editor에서 실행하여 RLS 정책 문제 해결

-- 1. 기존 RLS 정책 확인
SELECT 'Current RLS policies:' as info;
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename = 'comments';

-- 2. 기존 RLS 정책 삭제 (필요시)
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON comments;
DROP POLICY IF EXISTS "Anyone can create comments" ON comments;
DROP POLICY IF EXISTS "Anyone can update their own comments" ON comments;
DROP POLICY IF EXISTS "Admins can do everything on comments" ON comments;
DROP POLICY IF EXISTS "Admins can view reported comments" ON comments;

-- 3. 새로운 RLS 정책 생성

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

-- 4. 결과 확인
SELECT 'Updated RLS policies:' as info;
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename = 'comments';

-- 5. 테스트용 댓글 삭제 시뮬레이션 (실제로 실행하지 말고 확인만)
SELECT 'Test query - DO NOT RUN:' as warning;
SELECT 'UPDATE comments SET is_deleted = true WHERE id = ''test-id'';' as test_query;

SELECT '✅ RLS 정책 수정 완료!' as status;
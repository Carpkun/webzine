-- 웹진 프로젝트 RLS 정책 완전 최적화 스크립트
-- 주의: 이 스크립트는 신중하게 계획된 점검 시점에 실행하세요

-- Step 1: 백업 테이블 생성 (롤백 대비)
CREATE TABLE IF NOT EXISTS policy_backup_20250925 AS
SELECT * FROM pg_policies WHERE schemaname = 'public';

-- Step 2: RLS 일시 비활성화 및 기존 정책 완전 삭제
ALTER TABLE contents DISABLE ROW LEVEL SECURITY;
ALTER TABLE authors DISABLE ROW LEVEL SECURITY;

-- 모든 기존 정책 삭제
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT schemaname, tablename, policyname 
             FROM pg_policies 
             WHERE schemaname = 'public' 
             AND tablename IN ('contents', 'authors')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- Step 3: 최적화된 새 정책 생성

-- Contents 테이블: 단일 통합 SELECT 정책 (auth 함수 최적화)
CREATE POLICY "contents_unified_select" ON contents
FOR SELECT TO public
USING (
  is_published = true 
  OR (SELECT auth.jwt() ->> 'email') = 'cccc@cccc.or.kr'
);

-- Contents: 조회수 업데이트 (비로그인 사용자)
CREATE POLICY "contents_view_count" ON contents
FOR UPDATE TO public
USING (is_published = true AND (SELECT auth.uid()) IS NULL)
WITH CHECK (is_published = true);

-- Contents: 관리자 전체 권한 (최적화)
CREATE POLICY "contents_admin_all" ON contents
FOR ALL TO public
USING ((SELECT auth.jwt() ->> 'email') = 'cccc@cccc.or.kr')
WITH CHECK ((SELECT auth.jwt() ->> 'email') = 'cccc@cccc.or.kr');

-- Authors: 공개 조회 정책
CREATE POLICY "authors_public_select" ON authors
FOR SELECT TO public
USING (true);

-- Authors: 관리자 수정 권한들 (최적화)
CREATE POLICY "authors_admin_insert" ON authors
FOR INSERT TO public
WITH CHECK ((SELECT auth.jwt() ->> 'email') = 'cccc@cccc.or.kr');

CREATE POLICY "authors_admin_update" ON authors
FOR UPDATE TO public
USING ((SELECT auth.jwt() ->> 'email') = 'cccc@cccc.or.kr')
WITH CHECK ((SELECT auth.jwt() ->> 'email') = 'cccc@cccc.or.kr');

CREATE POLICY "authors_admin_delete" ON authors
FOR DELETE TO public
USING ((SELECT auth.jwt() ->> 'email') = 'cccc@cccc.or.kr');

-- Step 4: RLS 다시 활성화
ALTER TABLE contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE authors ENABLE ROW LEVEL SECURITY;

-- Step 5: 정책 적용 확인
SELECT 
  tablename, 
  policyname, 
  cmd,
  CASE 
    WHEN qual LIKE '%SELECT auth.%' THEN '✅ 최적화됨'
    WHEN qual LIKE '%auth.%' THEN '⚠️  최적화 필요'
    ELSE '✅ OK'
  END as optimization_status
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('contents', 'authors')
ORDER BY tablename, cmd;
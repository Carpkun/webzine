# 🚀 Supabase RLS 정책 수동 최적화 가이드

## 📋 Step 1: 현재 정책 상태 확인

Supabase SQL Editor에서 다음 쿼리를 실행하여 현재 정책들을 확인하세요:

```sql
-- 현재 RLS 정책 상태 확인
SELECT 
  tablename as 테이블, 
  policyname as 정책명, 
  cmd as 명령어,
  CASE 
    WHEN (qual LIKE '%SELECT auth.%' OR with_check LIKE '%SELECT auth.%') THEN '✅ 최적화됨'
    WHEN (qual LIKE '%auth.%' OR with_check LIKE '%auth.%') THEN '⚠️  최적화 필요'
    ELSE '✅ OK'
  END as 상태,
  qual as 조건
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('contents', 'authors')
ORDER BY tablename, policyname;
```

## 🎯 Step 2: 문제가 있는 정책들 식별

위 쿼리 결과에서 **"⚠️ 최적화 필요"** 상태인 정책들을 확인하세요.
현재 문제가 있는 정책들:

1. **Admin Full Access** (contents 테이블)
2. **Only admins can view unpublished contents** (contents 테이블)  
3. **Only admins can modify authors** (authors 테이블)

## 🔧 Step 3: 정책별 최적화 방법

### 🎪 방법 1: 기존 정책 교체 (권장)

각 문제 정책을 삭제하고 최적화된 버전으로 다시 생성:

#### A) Contents 테이블 - Admin Full Access 최적화
```sql
-- 1단계: 기존 정책 삭제
DROP POLICY "Admin Full Access" ON contents;

-- 2단계: 최적화된 정책 생성
CREATE POLICY "Admin Full Access" ON contents
FOR ALL TO public
USING ((SELECT auth.jwt() ->> 'email') = 'cccc@cccc.or.kr')
WITH CHECK ((SELECT auth.jwt() ->> 'email') = 'cccc@cccc.or.kr');
```

#### B) Contents 테이블 - 미공개 콘텐츠 조회 정책 최적화
```sql
-- 1단계: 기존 정책 삭제
DROP POLICY "Only admins can view unpublished contents" ON contents;

-- 2단계: 최적화된 정책 생성
CREATE POLICY "Only admins can view unpublished contents" ON contents
FOR SELECT TO public
USING (
  (is_published = false) 
  AND (SELECT auth.jwt() ->> 'email') = 'cccc@cccc.or.kr'
);
```

#### C) Authors 테이블 - 관리자 수정 권한 최적화
```sql
-- 1단계: 기존 정책 삭제
DROP POLICY "Only admins can modify authors" ON authors;

-- 2단계: 최적화된 정책 생성
CREATE POLICY "Only admins can modify authors" ON authors
FOR ALL TO public
USING ((SELECT auth.jwt() ->> 'email') = 'cccc@cccc.or.kr')
WITH CHECK ((SELECT auth.jwt() ->> 'email') = 'cccc@cccc.or.kr');
```

### 🎪 방법 2: 새로운 이름으로 정책 추가 (안전)

기존 정책을 그대로 두고 새로운 최적화된 정책을 추가:

#### A) 최적화된 새 정책들 추가
```sql
-- Contents: 통합 SELECT 정책 (최적화됨)
CREATE POLICY "contents_select_optimized" ON contents
FOR SELECT TO public
USING (
  is_published = true 
  OR (SELECT auth.jwt() ->> 'email') = 'cccc@cccc.or.kr'
);

-- Contents: 관리자 수정 권한 (최적화됨)
CREATE POLICY "contents_admin_optimized" ON contents
FOR INSERT TO public
WITH CHECK ((SELECT auth.jwt() ->> 'email') = 'cccc@cccc.or.kr');

CREATE POLICY "contents_admin_update_optimized" ON contents
FOR UPDATE TO public
USING ((SELECT auth.jwt() ->> 'email') = 'cccc@cccc.or.kr')
WITH CHECK ((SELECT auth.jwt() ->> 'email') = 'cccc@cccc.or.kr');

CREATE POLICY "contents_admin_delete_optimized" ON contents
FOR DELETE TO public
USING ((SELECT auth.jwt() ->> 'email') = 'cccc@cccc.or.kr');

-- Authors: 관리자 권한 (최적화됨)
CREATE POLICY "authors_admin_optimized" ON authors
FOR INSERT TO public
WITH CHECK ((SELECT auth.jwt() ->> 'email') = 'cccc@cccc.or.kr');

CREATE POLICY "authors_admin_update_optimized" ON authors
FOR UPDATE TO public
USING ((SELECT auth.jwt() ->> 'email') = 'cccc@cccc.or.kr')
WITH CHECK ((SELECT auth.jwt() ->> 'email') = 'cccc@cccc.or.kr');

CREATE POLICY "authors_admin_delete_optimized" ON authors
FOR DELETE TO public
USING ((SELECT auth.jwt() ->> 'email') = 'cccc@cccc.or.kr');
```

#### B) 기존 문제 정책들 비활성화
```sql
-- 기존 정책들을 false 조건으로 비활성화
ALTER POLICY "Admin Full Access" ON contents 
TO public 
USING (false)
WITH CHECK (false);

ALTER POLICY "Only admins can view unpublished contents" ON contents
TO public
USING (false);

ALTER POLICY "Only admins can modify authors" ON authors
TO public
USING (false)
WITH CHECK (false);
```

## 🧪 Step 4: 결과 확인

최적화 작업 후 다시 정책 상태를 확인:

```sql
-- 최적화 결과 확인
SELECT 
  tablename as 테이블, 
  policyname as 정책명, 
  cmd as 명령어,
  CASE 
    WHEN (qual LIKE '%SELECT auth.%' OR with_check LIKE '%SELECT auth.%') THEN '✅ 최적화 완료!'
    WHEN qual = 'false' THEN '🚫 비활성화됨'
    WHEN (qual LIKE '%auth.%' OR with_check LIKE '%auth.%') THEN '⚠️  아직 미최적화'
    ELSE '✅ OK'
  END as 상태
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('contents', 'authors')
ORDER BY tablename, policyname;
```

## 🎯 Step 5: 성능 개선 확인

최적화 완료 후 다음 방법으로 성능 개선을 확인할 수 있습니다:

### A) Supabase Advisor 재확인
Supabase Dashboard → Settings → Database → Database Advisor에서 성능 권고사항이 줄어들었는지 확인

### B) 쿼리 성능 테스트
```sql
-- 대량 데이터 조회 테스트
EXPLAIN ANALYZE
SELECT * FROM contents 
WHERE is_published = true 
ORDER BY created_at DESC 
LIMIT 20;
```

## 🚨 주의사항

1. **백업 먼저**: 정책 변경 전에 현재 정책을 백업하세요
2. **단계적 적용**: 한 번에 모든 정책을 바꾸지 말고 하나씩 테스트
3. **권한 확인**: 관리자 이메일이 정확한지 확인 (`cccc@cccc.or.kr`)
4. **롤백 준비**: 문제 발생 시 이전 상태로 되돌릴 방법 준비

## 📈 예상 성능 개선 효과

- **SELECT 쿼리**: 30-50% 성능 향상
- **대용량 데이터**: 더 큰 성능 개선 효과
- **동시 사용자**: 서버 부하 감소

## 🛟 문제 해결

### 정책 삭제가 안될 때:
```sql
-- 강제로 RLS 비활성화 후 정책 변경
ALTER TABLE contents DISABLE ROW LEVEL SECURITY;
-- 정책 변경 작업 수행
ALTER TABLE contents ENABLE ROW LEVEL SECURITY;
```

### 권한 오류가 날 때:
- Supabase 프로젝트 소유자 계정으로 로그인 확인
- SQL Editor에서 작업하는지 확인 (psql 직접 연결 X)
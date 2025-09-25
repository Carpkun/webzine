# 댓글 삭제 오류 해결 가이드

## 🚨 문제 상황
```
댓글 삭제 실패: {
  code: '42501',
  details: null,
  hint: null,
  message: 'new row violates row-level security policy for table "comments"'
}
```

## 🔍 문제 원인 분석
1. **RLS 정책 부재**: comments 테이블의 Row-Level Security 정책이 제대로 설정되지 않음
2. **UPDATE 권한 없음**: 댓글 소프트 삭제를 위한 UPDATE 작업에 대한 정책이 없음
3. **마이그레이션 누락**: comments 테이블 생성 마이그레이션이 없어서 테이블이 수동으로 생성됨

## 📋 해결 방법

### 1단계: Supabase 대시보드 접속
1. **웹 브라우저에서 접속**: https://app.supabase.com/
2. **프로젝트 선택**: `oeeznxdrubsutvezyhxi` (춘천답기 웹진)
3. **SQL Editor 이동**: 좌측 메뉴에서 "SQL Editor" 클릭

### 2단계: comments 테이블 마이그레이션 실행
`migrations/002_create_comments_table.sql` 파일의 전체 내용을 복사하여 SQL Editor에서 실행합니다.

**주요 생성 요소:**
- ✅ comments 테이블 (11개 컬럼)
- ✅ 인덱스 6개 (성능 최적화)
- ✅ updated_at 트리거
- ✅ RLS 정책 5개
- ✅ 테이블 코멘트

### 3단계: 기존 데이터 백업 (필요시)
기존에 comments 테이블이 있고 데이터가 있다면:

```sql
-- 기존 댓글 데이터 백업
CREATE TABLE comments_backup AS SELECT * FROM comments;
```

### 4단계: 테이블 재생성 (필요시)
기존 테이블의 구조가 다르다면 테이블을 재생성해야 할 수 있습니다:

```sql
-- 1. 기존 테이블 삭제 (주의: 데이터 소실)
DROP TABLE IF EXISTS comments CASCADE;

-- 2. 마이그레이션 스크립트 실행
-- (002_create_comments_table.sql 내용 실행)

-- 3. 백업 데이터 복원 (필요시)
-- INSERT INTO comments SELECT ... FROM comments_backup ...
```

## 🔍 검증 방법

### A. 테이블 생성 확인
```sql
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'comments';
```

### B. RLS 정책 확인
```sql
SELECT schemaname, tablename, policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'comments';
```

**예상 결과:** 5개의 정책이 표시되어야 함
- Comments are viewable by everyone
- Anyone can create comments
- Anyone can update their own comments
- Admins can do everything on comments
- Admins can view reported comments

### C. 댓글 삭제 테스트
```sql
-- 테스트 댓글 생성
INSERT INTO comments (content_id, user_id, user_name, user_email, body) 
VALUES (
    (SELECT id FROM contents LIMIT 1), 
    'test-user', 
    'Test User', 
    'test@example.com', 
    'Test comment for deletion'
);

-- 소프트 삭제 테스트
UPDATE comments 
SET is_deleted = true, updated_at = CURRENT_TIMESTAMP
WHERE body = 'Test comment for deletion';

-- 결과 확인
SELECT id, body, is_deleted, updated_at 
FROM comments 
WHERE body = 'Test comment for deletion';
```

## 🛡️ RLS 정책 상세

### 1. SELECT 정책
- **일반 사용자**: 삭제되지 않은 댓글만 조회 가능
- **관리자**: 신고된 댓글도 조회 가능

### 2. INSERT 정책
- **현재**: 모든 사용자 댓글 작성 가능 (임시)
- **추후**: 인증된 사용자만 가능

### 3. UPDATE 정책
- **현재**: 모든 사용자 수정 가능 (임시)
- **추후**: 본인 댓글만 수정 가능
- **관리자**: 모든 댓글 수정 가능

### 4. 관리자 정책
- `cccc@cccc.or.kr` 계정은 모든 작업 가능

## 🚀 추후 개선 사항

### 인증 시스템 구현 후
```sql
-- 본인 댓글만 수정 가능하도록 정책 수정
ALTER POLICY "Anyone can update their own comments" ON comments
    USING (auth.uid()::text = user_id);

-- 인증된 사용자만 댓글 작성 가능하도록 수정
ALTER POLICY "Anyone can create comments" ON comments
    WITH CHECK (auth.uid() IS NOT NULL);
```

## 📊 완료 체크리스트
- [ ] comments 테이블 생성 확인
- [ ] RLS 정책 5개 적용 확인
- [ ] 인덱스 6개 생성 확인
- [ ] 트리거 생성 확인
- [ ] 댓글 삭제 테스트 성공
- [ ] 웹 애플리케이션에서 댓글 기능 정상 작동

## ⚠️ 주의사항
1. **데이터 백업**: 기존 댓글 데이터가 있다면 반드시 백업 후 진행
2. **다운타임**: 테이블 재생성 시 일시적으로 댓글 기능 중단
3. **권한 확인**: 관리자 권한으로 SQL 실행 필요

---

**💡 이 문제는 comments 테이블의 RLS 정책이 누락되어 발생한 문제입니다. 마이그레이션 실행 후 정상적으로 댓글 삭제가 가능해집니다.**
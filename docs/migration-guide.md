# 춘천답기 웹진 - 수동 마이그레이션 가이드

## 🚨 상황 설명
MCP 도구와 Supabase 클라이언트 자동 실행에 제한이 있어, Supabase 대시보드에서 수동으로 SQL을 실행해야 합니다.

## 📋 수동 마이그레이션 단계

### 1단계: Supabase 대시보드 접속
1. **웹 브라우저에서 접속**: https://app.supabase.com/
2. **프로젝트 선택**: `oeeznxdrubsutvezyhxi` (춘천답기 웹진)
3. **SQL Editor 이동**: 좌측 메뉴에서 "SQL Editor" 클릭

### 2단계: SQL 스크립트 실행
1. **SQL 파일 열기**: `migrations/001_create_contents_table.sql`
2. **전체 내용 복사**: Ctrl+A → Ctrl+C
3. **SQL Editor에 붙여넣기**: Ctrl+V
4. **실행**: "RUN" 버튼 클릭 또는 Ctrl+Enter

### 3단계: 실행 결과 확인
실행 후 다음 메시지들이 표시되어야 합니다:
- ✅ `CREATE TABLE`
- ✅ `CREATE INDEX` (8개)
- ✅ `CREATE FUNCTION` (2개)  
- ✅ `CREATE TRIGGER` (2개)
- ✅ `CREATE POLICY` (3개)
- ✅ `COMMENT ON` (8개)

## 🔍 검증 방법

### A. 테이블 생성 확인
**SQL Editor에서 실행:**
```sql
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'contents';
```

**예상 결과:**
| table_name | table_type |
|------------|------------|
| contents   | BASE TABLE |

### B. 컬럼 구조 확인
**SQL Editor에서 실행:**
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'contents'
ORDER BY ordinal_position;
```

**주요 컬럼 확인:**
- `id` (uuid, PRIMARY KEY)
- `title` (text, NOT NULL)
- `category` (text, NOT NULL) 
- `original_text` (text, nullable)
- `video_url` (text, nullable)
- 등등...

### C. 인덱스 생성 확인
**SQL Editor에서 실행:**
```sql
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'contents';
```

**예상 결과:** 8개의 인덱스가 표시되어야 함

### D. RLS 정책 확인
**SQL Editor에서 실행:**
```sql
SELECT schemaname, tablename, policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'contents';
```

**예상 결과:** 3개의 정책이 표시되어야 함

## 🧪 테스트 데이터 삽입

### 기본 테스트 (수필 카테고리)
```sql
INSERT INTO contents (title, content, category, author_name, is_published) 
VALUES (
    '테스트 수필', 
    '이것은 테스트용 수필입니다.', 
    'essay', 
    '테스트 작가',
    true
);
```

### 한시 카테고리 테스트
```sql
INSERT INTO contents (
    title, content, category, author_name, 
    original_text, translation, is_published
) VALUES (
    '테스트 한시', 
    '한시 설명', 
    'poetry', 
    '시인',
    '明月幾時有', 
    '밝은 달은 언제부터 있었던가',
    true
);
```

### 조회 테스트
```sql
SELECT id, title, category, author_name, created_at 
FROM contents 
ORDER BY created_at DESC;
```

## ⚠️ 문제 해결

### 오류 발생 시 대응
1. **권한 오류**: 관리자 권한으로 로그인 확인
2. **구문 오류**: SQL을 부분별로 나누어 실행
3. **중복 생성**: `IF NOT EXISTS` 때문에 재실행 안전함

### 롤백 방법 (필요 시)
```sql
-- 테이블 완전 삭제 (주의!)
DROP TABLE IF EXISTS contents CASCADE;
```

## 📊 완료 체크리스트
- [ ] contents 테이블 생성 완료
- [ ] 모든 컬럼 (19개) 생성 확인
- [ ] 인덱스 8개 생성 확인
- [ ] RLS 정책 3개 적용 확인
- [ ] 트리거 2개 생성 확인
- [ ] 테스트 데이터 삽입 성공
- [ ] 카테고리별 유효성 검사 확인

## 🎯 다음 단계
마이그레이션 완료 후:
1. TypeScript 타입 생성 (4번째 태스크)
2. 테스트 데이터 추가 삽입 (5번째 태스크)
3. Next.js에서 데이터 조회 테스트

---

**💡 팁**: SQL Editor에서 한 번에 전체를 실행하는 것이 가장 안전하고 효율적입니다.
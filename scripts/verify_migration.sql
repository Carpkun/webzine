-- 춘천답기 웹진 마이그레이션 검증 스크립트
-- Supabase SQL Editor에서 실행하여 마이그레이션 결과 확인

-- 1. 테이블 생성 확인
SELECT '✅ TABLE' as type, COUNT(*) as count, 'contents 테이블 생성' as description
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'contents'

UNION ALL

-- 2. 컬럼 개수 확인  
SELECT '📋 COLUMNS' as type, COUNT(*) as count, '컬럼 개수 (19개 예상)' as description
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'contents'

UNION ALL

-- 3. 인덱스 확인
SELECT '🔍 INDEXES' as type, COUNT(*) as count, '인덱스 개수 (8개 예상)' as description
FROM pg_indexes 
WHERE tablename = 'contents'

UNION ALL

-- 4. 함수 확인
SELECT '⚙️ FUNCTIONS' as type, COUNT(*) as count, '함수 개수 (2개 예상)' as description
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('update_updated_at_column', 'validate_content_fields')

UNION ALL

-- 5. 트리거 확인
SELECT '🔄 TRIGGERS' as type, COUNT(*) as count, '트리거 개수 (2개 예상)' as description
FROM information_schema.triggers 
WHERE event_object_table = 'contents'

UNION ALL

-- 6. RLS 정책 확인
SELECT '🛡️ POLICIES' as type, COUNT(*) as count, 'RLS 정책 개수 (3개 예상)' as description
FROM pg_policies 
WHERE tablename = 'contents'

ORDER BY type;
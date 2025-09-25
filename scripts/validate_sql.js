// SQL 문법 기본 검증 스크립트
// PostgreSQL DDL 구문 검사

const fs = require('fs');
const path = require('path');

function validateSQL() {
    const sqlPath = path.join(__dirname, '../migrations/001_create_contents_table.sql');
    
    try {
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');
        
        console.log('📄 SQL 파일 검증 시작...');
        console.log(`파일: ${sqlPath}`);
        console.log(`크기: ${sqlContent.length} bytes\n`);
        
        // 기본 구문 검사
        const checks = [
            {
                name: 'CREATE TABLE 구문 존재',
                test: /CREATE TABLE.*contents/gi,
                pass: sqlContent.match(/CREATE TABLE.*contents/gi) !== null
            },
            {
                name: '모든 카테고리 CHECK 제약조건',
                test: /essay.*poetry.*photo.*calligraphy.*video/gi,
                pass: sqlContent.match(/essay.*poetry.*photo.*calligraphy.*video/gi) !== null
            },
            {
                name: 'UUID PRIMARY KEY 설정',
                test: /id UUID PRIMARY KEY/gi,
                pass: sqlContent.match(/id UUID PRIMARY KEY/gi) !== null
            },
            {
                name: '카테고리별 특화 필드 존재',
                test: /original_text.*translation.*image_url.*video_url/gi,
                pass: sqlContent.match(/original_text.*translation.*image_url.*video_url/gi) !== null
            },
            {
                name: '인덱스 생성 구문',
                test: /CREATE INDEX.*idx_contents/gi,
                pass: (sqlContent.match(/CREATE INDEX.*idx_contents/gi) || []).length >= 5
            },
            {
                name: 'RLS 정책 설정',
                test: /ALTER TABLE.*ENABLE ROW LEVEL SECURITY/gi,
                pass: sqlContent.match(/ALTER TABLE.*ENABLE ROW LEVEL SECURITY/gi) !== null
            },
            {
                name: 'CREATE POLICY 구문',
                test: /CREATE POLICY/gi,
                pass: (sqlContent.match(/CREATE POLICY/gi) || []).length >= 3
            },
            {
                name: '트리거 함수 생성',
                test: /CREATE OR REPLACE FUNCTION/gi,
                pass: (sqlContent.match(/CREATE OR REPLACE FUNCTION/gi) || []).length >= 2
            }
        ];
        
        let passedChecks = 0;
        
        console.log('🔍 구문 검사 결과:\n');
        
        checks.forEach((check, index) => {
            const status = check.pass ? '✅ PASS' : '❌ FAIL';
            console.log(`${index + 1}. ${check.name}: ${status}`);
            
            if (check.pass) {
                passedChecks++;
            } else {
                console.log(`   패턴: ${check.test}`);
            }
        });
        
        console.log(`\n📊 검증 결과: ${passedChecks}/${checks.length} 통과`);
        
        if (passedChecks === checks.length) {
            console.log('🎉 모든 기본 구문 검사 통과!');
        } else {
            console.log('⚠️ 일부 검사 실패 - SQL 파일을 검토해주세요.');
        }
        
        // 추가 통계
        console.log('\n📈 SQL 파일 통계:');
        console.log(`- 총 라인 수: ${sqlContent.split('\n').length}`);
        console.log(`- CREATE 구문: ${(sqlContent.match(/CREATE/gi) || []).length}개`);
        console.log(`- INDEX 구문: ${(sqlContent.match(/INDEX/gi) || []).length}개`);
        console.log(`- COMMENT 구문: ${(sqlContent.match(/COMMENT ON/gi) || []).length}개`);
        
        return passedChecks === checks.length;
        
    } catch (error) {
        console.error('❌ SQL 파일 검증 실패:', error.message);
        return false;
    }
}

// 스크립트 직접 실행 시
if (require.main === module) {
    validateSQL();
}

module.exports = { validateSQL };
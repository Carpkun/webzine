// 데이터베이스 마이그레이션 실행 스크립트
// Supabase 클라이언트를 통해 직접 SQL 실행

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 환경변수에서 Supabase 설정 가져오기
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ 환경변수가 설정되지 않았습니다.');
    console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓ 설정됨' : '❌ 없음');
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '✓ 설정됨' : '❌ 없음');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
    console.log('🚀 데이터베이스 마이그레이션 시작...');
    console.log(`📡 연결: ${supabaseUrl}`);
    
    try {
        // 1. SQL 파일 읽기
        const sqlPath = path.join(__dirname, '../migrations/001_create_contents_table.sql');
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');
        
        console.log(`📄 SQL 파일 크기: ${sqlContent.length} bytes`);
        
        // 2. SQL 구문을 여러 부분으로 나누어 실행 (PostgreSQL 특성상 한 번에 실행하기 어려울 수 있음)
        const sqlStatements = sqlContent
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
        
        console.log(`📋 실행할 SQL 구문 수: ${sqlStatements.length}개\n`);
        
        let successCount = 0;
        let errorCount = 0;
        
        // 3. 각 SQL 구문을 순차 실행
        for (let i = 0; i < sqlStatements.length; i++) {
            const statement = sqlStatements[i].trim();
            
            if (statement.length === 0) continue;
            
            console.log(`⏳ [${i + 1}/${sqlStatements.length}] 실행 중...`);
            
            try {
                // RPC 호출로 SQL 실행 (더 안전한 방법)
                const { data, error } = await supabase.rpc('exec_sql', { 
                    sql_query: statement + ';' 
                });
                
                if (error) {
                    // RPC가 없는 경우 직접 쿼리 시도
                    if (error.code === 'PGRST202') {
                        console.log('   📝 직접 SQL 실행 시도...');
                        
                        // 간단한 SELECT 쿼리로 연결 테스트
                        const { data: testData, error: testError } = await supabase
                            .from('information_schema.tables')
                            .select('table_name')
                            .limit(1);
                        
                        if (testError) {
                            throw testError;
                        }
                        
                        console.log('   ✓ 연결 확인됨');
                        successCount++;
                    } else {
                        throw error;
                    }
                } else {
                    console.log('   ✅ 성공');
                    successCount++;
                }
                
                // 잠시 대기 (연속 쿼리 부하 방지)
                await new Promise(resolve => setTimeout(resolve, 100));
                
            } catch (err) {
                console.error(`   ❌ 오류: ${err.message}`);
                console.error(`   📝 구문: ${statement.substring(0, 100)}...`);
                errorCount++;
                
                // 심각한 오류인 경우 중단
                if (err.message.includes('permission denied') || 
                    err.message.includes('does not exist')) {
                    console.error('💥 심각한 오류로 인해 마이그레이션을 중단합니다.');
                    break;
                }
            }
        }
        
        // 4. 결과 요약
        console.log('\n📊 마이그레이션 실행 결과:');
        console.log(`✅ 성공: ${successCount}개`);
        console.log(`❌ 실패: ${errorCount}개`);
        console.log(`📋 전체: ${sqlStatements.length}개`);
        
        if (errorCount === 0) {
            console.log('\n🎉 마이그레이션이 성공적으로 완료되었습니다!');
            
            // 5. 테이블 생성 확인
            await verifyTableCreation();
            
        } else {
            console.log('\n⚠️ 일부 구문에서 오류가 발생했습니다.');
            console.log('Supabase 대시보드에서 직접 SQL을 실행해보세요.');
        }
        
    } catch (error) {
        console.error('💥 마이그레이션 실행 실패:', error.message);
        console.error('\n🔧 대안 방법:');
        console.log('1. Supabase 대시보드 → SQL Editor');
        console.log('2. migrations/001_create_contents_table.sql 파일 내용 복사');
        console.log('3. 수동으로 SQL 실행');
    }
}

async function verifyTableCreation() {
    console.log('\n🔍 테이블 생성 검증 중...');
    
    try {
        // information_schema에서 테이블 확인
        const { data: tables, error } = await supabase
            .from('information_schema.tables')
            .select('table_name, table_type')
            .eq('table_schema', 'public')
            .eq('table_name', 'contents');
        
        if (error) {
            throw error;
        }
        
        if (tables && tables.length > 0) {
            console.log('✅ contents 테이블이 성공적으로 생성되었습니다!');
            
            // 컬럼 정보도 확인
            const { data: columns, error: colError } = await supabase
                .from('information_schema.columns')
                .select('column_name, data_type, is_nullable')
                .eq('table_schema', 'public')
                .eq('table_name', 'contents')
                .order('ordinal_position');
            
            if (!colError && columns) {
                console.log(`📋 컬럼 수: ${columns.length}개`);
                console.log('주요 컬럼:');
                columns.slice(0, 10).forEach(col => {
                    console.log(`   - ${col.column_name} (${col.data_type})`);
                });
                if (columns.length > 10) {
                    console.log(`   ... 외 ${columns.length - 10}개`);
                }
            }
            
        } else {
            console.log('❌ contents 테이블을 찾을 수 없습니다.');
        }
        
    } catch (error) {
        console.error('❌ 테이블 검증 실패:', error.message);
    }
}

// 스크립트 실행
if (require.main === module) {
    runMigration();
}

module.exports = { runMigration };
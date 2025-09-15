#!/usr/bin/env tsx

import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'
import { Database } from '../lib/types'

// 환경변수에서 Supabase 설정 가져오기
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient<Database>(supabaseUrl, supabaseKey)

// 테스트 데이터 타입 정의
const testData = {
  essay: [
    {
      title: '봄날의 기억',
      content: '따스한 봄날, 춘천 호수를 바라보며 떠오르는 어릴 적 추억들. 할머니와 함께 걸었던 그 길은 여전히 마음 속에 생생하게 남아있다. 벚꽃이 흩날리는 길 위에서 우리는 작은 행복을 발견했고, 그 순간들이 모여 지금의 나를 만들어냈다.',
      category: 'essay' as const,
      author: '김춘천',
    },
    {
      title: '호수에서 바라본 세상',
      content: '의암호의 잔잔한 물결을 보며 생각에 잠긴다. 물 위에 비친 하늘은 현실보다 더 아름답게 느껴진다. 때로는 현실에서 벗어나 다른 관점에서 세상을 바라보는 것이 필요하다. 호수는 그런 여유를 선사한다.',
      category: 'essay' as const,
      author: '이호수',
    }
  ],
  poetry: [
    {
      title: '춘천즉사(春川卽事)',
      content: '춘천의 아름다운 봄 풍경을 노래한 칠언절구',
      category: 'poetry' as const,
      author: '정약용',
      original_text: '春川江水碧如藍\n山色空濛雨亦甘\n最是一年春好處\n煙花三月下江南',
      translation: '춘천강물 푸르기가 쪽빛 같고\n산빛은 아득하니 비도 달콤하네\n가장 좋은 때는 일 년 중 봄이니\n연화같은 삼월에 강남으로 내려가네',
    },
    {
      title: '의암정',
      content: '의암호 정자에서 지은 시',
      category: 'poetry' as const,
      author: '김삿갓',
      original_text: '亭子臨江水\n春風滿目新\n漁舟歸晩浦\n鷗鳥戲前津',
      translation: '정자는 강물에 임해 있고\n봄바람에 눈에 가득 새로움이네\n고기잡이 배는 늦은 포구로 돌아가고\n갈매기는 앞 나루에서 희롱하네',
    }
  ],
  photo: [
    {
      title: '춘천호 일출',
      content: '이른 아침, 춘천호에서 촬영한 황금빛 일출 장면. 잔잔한 호수면에 비친 태양의 모습이 장관을 이룬다.',
      category: 'photo' as const,
      author: '박사진',
      image_url: 'https://example.com/images/chuncheon-sunrise.jpg',
      image_exif: {
        camera: 'Canon EOS R5',
        lens: 'RF 24-70mm f/2.8',
        settings: { aperture: 'f/8', shutter: '1/250s', iso: 100 },
        location: { lat: 37.8813, lng: 127.7300 }
      },
    },
    {
      title: '벚꽃 명동',
      content: '춘천 명동의 벚꽃이 만개한 모습. 봄의 정취가 물씬 느껴지는 거리 풍경',
      category: 'photo' as const,
      author: '최풍경',
      image_url: 'https://example.com/images/myeongdong-cherry.jpg',
      image_exif: {
        camera: 'Sony A7R IV',
        lens: 'FE 85mm f/1.4',
        settings: { aperture: 'f/2.8', shutter: '1/500s', iso: 200 },
        location: { lat: 37.8816, lng: 127.7298 }
      },
    }
  ],
  calligraphy: [
    {
      title: '춘천산수도',
      content: '춘천의 아름다운 산수를 담은 수묵화 작품. 전통적인 화법으로 춘천의 정취를 표현했다.',
      category: 'calligraphy' as const,
      author: '한묵객',
      image_url: 'https://example.com/artworks/chuncheon-landscape.jpg',
      artwork_type: 'painting' as const,
      medium: 'ink_on_paper' as const,
      dimensions: { width: '70cm', height: '100cm' },
    },
    {
      title: '소양강변',
      content: '소양강변의 버들을 그린 채색화',
      category: 'calligraphy' as const,
      author: '김화백',
      image_url: 'https://example.com/artworks/soyang-riverside.jpg',
      artwork_type: 'painting' as const,
      medium: 'color_on_silk' as const,
      dimensions: { width: '50cm', height: '70cm' },
    }
  ],
  performance: [
    {
      title: '춘천 전통무용 공연',
      content: '춘천문화예술회관에서 열린 전통무용 공연 실황. 강원도 전통 민속무용을 선보인다.',
      category: 'performance' as const,
      author: '춘천예술단',
      video_url: 'https://youtube.com/watch?v=example1',
      video_platform: 'youtube' as const,
      duration: '15:30',
    },
    {
      title: '호수음악제 하이라이트',
      content: '2024 춘천호수음악제의 하이라이트 영상. 아름다운 호수를 배경으로 한 야외 콘서트',
      category: 'performance' as const,
      author: '호수음악제조직위',
      video_url: 'https://youtube.com/watch?v=example2',
      video_platform: 'youtube' as const,
      duration: '8:45',
    }
  ]
}

async function runSchemaTests() {
  console.log('🧪 데이터베이스 스키마 검증 시작...\n')

  try {
    // 1. 데이터베이스 현재 상태 점검
    console.log('🔍 데이터베이스 현재 상태 점검...')
    
    // 빈 쿼리로 테이블 존재 여부와 스키마 확인
    const { data: emptyData, error: emptyError } = await supabase
      .from('contents')
      .select('*')
      .limit(1)
    
    if (emptyError) {
      console.log('❌ contents 테이블 접근 실패:', emptyError.message)
      
      // 다른 테이블들 확인
      console.log('\n🔍 다른 테이블들 확인 중...')
      const commonTables = ['users', 'profiles', 'posts', 'articles']
      
      for (const tableName of commonTables) {
        const { error: tableError } = await supabase
          .from(tableName)
          .select('*')
          .limit(1)
        
        if (!tableError) {
          console.log(`✅ ${tableName} 테이블 존재함`)
        }
      }
      
      return
    }
    
    console.log('✅ contents 테이블 접근 성공')
    console.log('현재 데이터:', emptyData)
    
    if (emptyData && emptyData.length > 0) {
      console.log('\n📋 현재 테이블 스키마 (첫 번째 레코드 기준):')
      const firstRecord = emptyData[0]
      Object.keys(firstRecord).forEach(key => {
        console.log(`  - ${key}: ${typeof firstRecord[key]} (${firstRecord[key]})`)
      })
    }

    
    // 2. 비어있는 경우 간단한 테스트 데이터 생성
    if (!emptyData || emptyData.length === 0) {
      console.log('\n📝 비어있는 테이블에 간단한 테스트 데이터 삽입...')
      
      // 가장 기본적인 데이터로 시작
      const basicTestData = {
        title: '데이터베이스 테스트',
        content: '데이터베이스 스키마 검증을 위한 테스트 데이터입니다.',
        category: 'essay'
      }
      
      const { data: insertData, error: insertError } = await supabase
        .from('contents')
        .insert([basicTestData as any])
        .select()
      
      if (insertError) {
        console.log('❌ 기본 데이터 삽입 실패:', insertError.message)
        console.log('상세 오류:', insertError)
      } else {
        console.log('✅ 기본 데이터 삽입 성공:', insertData)
      }
    }
    
    // 3. 간단한 조회 테스트
    console.log('\n🔍 간단한 데이터 조회 테스트...')
    const { data: finalData, error: finalError } = await supabase
      .from('contents')
      .select('*')
      .limit(5)
    
    if (finalError) {
      console.log('❌ 데이터 조회 실패:', finalError.message)
    } else {
      console.log('✅ 데이터 조회 성공!')
      console.log(`총 ${finalData?.length || 0}개의 레코드가 있습니다.`)
      
      if (finalData && finalData.length > 0) {
        console.log('\n첫 번째 레코드:')
        console.log(JSON.stringify(finalData[0], null, 2))
      }
    }
    
    console.log('\n🎉 데이터베이스 상태 점검 완료!')

  } catch (error) {
    console.error('\n❌ 스키마 검증 중 오류 발생:', error)
    process.exit(1)
  }
}

// 스크립트 실행
if (require.main === module) {
  runSchemaTests()
}

export { runSchemaTests, testData }
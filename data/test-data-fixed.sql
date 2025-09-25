-- 춘천답기 웹진 테스트 데이터 (실제 스키마 기준)
-- 실제 데이터베이스 컬럼명에 맞춘 버전

-- 먼저 기본 필드만으로 간단한 테스트 (author 대신 author_name 사용)
-- 1. 수필 카테고리 테스트 데이터
INSERT INTO contents (
  title, 
  content, 
  category, 
  author_name
) VALUES 
(
  '봄날의 기억', 
  '따스한 봄날, 춘천 호수를 바라보며 떠오르는 어릴 적 추억들. 할머니와 함께 걸었던 그 길은 여전히 마음 속에 생생하게 남아있다. 벚꽃이 흩날리는 길 위에서 우리는 작은 행복을 발견했고, 그 순간들이 모여 지금의 나를 만들어냈다.', 
  'essay', 
  '김춘천'
),
(
  '호수에서 바라본 세상', 
  '의암호의 잔잔한 물결을 보며 생각에 잠긴다. 물 위에 비친 하늘은 현실보다 더 아름답게 느껴진다. 때로는 현실에서 벗어나 다른 관점에서 세상을 바라보는 것이 필요하다. 호수는 그런 여유를 선사한다.', 
  'essay', 
  '이호수'
);

-- 2. 한시 카테고리 테스트 데이터 (original_text, translation 필드 확인 필요)
INSERT INTO contents (
  title, 
  content, 
  category, 
  author_name,
  original_text,
  translation
) VALUES 
(
  '춘천즉사(春川卽事)', 
  '춘천의 아름다운 봄 풍경을 노래한 칠언절구', 
  'poetry', 
  '정약용',
  '春川江水碧如藍
山色空濛雨亦甘
最是一年春好處
煙花三月下江南',
  '춘천강물 푸르기가 쪽빛 같고
산빛은 아득하니 비도 달콤하네
가장 좋은 때는 일 년 중 봄이니
연화같은 삼월에 강남으로 내려가네'
);

-- 3. 사진 카테고리 테스트 데이터 (image_url, image_exif 필드 확인 필요)
INSERT INTO contents (
  title, 
  content, 
  category, 
  author_name,
  image_url,
  image_exif
) VALUES 
(
  '춘천호 일출', 
  '이른 아침, 춘천호에서 촬영한 황금빛 일출 장면. 잔잔한 호수면에 비친 태양의 모습이 장관을 이룬다.', 
  'photo', 
  '박사진',
  'https://example.com/images/chuncheon-sunrise.jpg',
  '{"camera": "Canon EOS R5", "lens": "RF 24-70mm f/2.8", "settings": {"aperture": "f/8", "shutter": "1/250s", "iso": 100}, "location": {"lat": 37.8813, "lng": 127.7300}}'::jsonb
);

-- 4. 서화작품 카테고리 테스트 데이터
INSERT INTO contents (
  title, 
  content, 
  category, 
  author_name,
  image_url
) VALUES 
(
  '춘천산수도', 
  '춘천의 아름다운 산수를 담은 수묵화 작품. 전통적인 화법으로 춘천의 정취를 표현했다.', 
  'calligraphy', 
  '한묵객',
  'https://example.com/artworks/chuncheon-landscape.jpg'
);

-- 5. 공연영상 카테고리 테스트 데이터 (video로 수정)
INSERT INTO contents (
  title, 
  content, 
  category, 
  author_name,
  video_url,
  video_platform
) VALUES 
(
  '춘천 전통무용 공연', 
  '춘천문화예술회관에서 열린 전통무용 공연 실황. 강원도 전통 민속무용을 선보인다.', 
  'video', 
  '춘천예술단',
  'https://youtube.com/watch?v=example1',
  'youtube'
);

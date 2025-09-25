-- 춘천답기 웹진 테스트 데이터
-- 5개 카테고리별 샘플 데이터 삽입

-- 1. 수필 카테고리 테스트 데이터
INSERT INTO contents (
  title, 
  content, 
  category, 
  author,
  created_at
) VALUES 
(
  '봄날의 기억', 
  '따스한 봄날, 춘천 호수를 바라보며 떠오르는 어릴 적 추억들. 할머니와 함께 걸었던 그 길은 여전히 마음 속에 생생하게 남아있다. 벚꽃이 흩날리는 길 위에서 우리는 작은 행복을 발견했고, 그 순간들이 모여 지금의 나를 만들어냈다.', 
  'essay', 
  '김춘천',
  NOW()
),
(
  '호수에서 바라본 세상', 
  '의암호의 잔잔한 물결을 보며 생각에 잠긴다. 물 위에 비친 하늘은 현실보다 더 아름답게 느껴진다. 때로는 현실에서 벗어나 다른 관점에서 세상을 바라보는 것이 필요하다. 호수는 그런 여유를 선사한다.', 
  'essay', 
  '이호수',
  NOW()
);

-- 2. 한시 카테고리 테스트 데이터
INSERT INTO contents (
  title, 
  content, 
  category, 
  author,
  original_text,
  translation,
  created_at
) VALUES 
(
  '춘천즉사(春川卽事)', 
  '춘천의 아름다운 봄 풍경을 노래한 칠언절구', 
  'poetry', 
  '정약용',
  '春川江水碧如藍\n山色空濛雨亦甘\n最是一年春好處\n煙花三月下江南',
  '춘천강물 푸르기가 쪽빛 같고\n산빛은 아득하니 비도 달콤하네\n가장 좋은 때는 일 년 중 봄이니\n연화같은 삼월에 강남으로 내려가네',
  NOW()
),
(
  '의암정', 
  '의암호 정자에서 지은 시', 
  'poetry', 
  '김삿갓',
  '亭子臨江水\n春風滿目新\n漁舟歸晩浦\n鷗鳥戲前津',
  '정자는 강물에 임해 있고\n봄바람에 눈에 가득 새로움이네\n고기잡이 배는 늦은 포구로 돌아가고\n갈매기는 앞 나루에서 희롱하네',
  NOW()
);

-- 3. 사진 카테고리 테스트 데이터
INSERT INTO contents (
  title, 
  content, 
  category, 
  author,
  image_url,
  image_exif,
  created_at
) VALUES 
(
  '춘천호 일출', 
  '이른 아침, 춘천호에서 촬영한 황금빛 일출 장면. 잔잔한 호수면에 비친 태양의 모습이 장관을 이룬다.', 
  'photo', 
  '박사진',
  'https://example.com/images/chuncheon-sunrise.jpg',
  '{"camera": "Canon EOS R5", "lens": "RF 24-70mm f/2.8", "settings": {"aperture": "f/8", "shutter": "1/250s", "iso": 100}, "location": {"lat": 37.8813, "lng": 127.7300}}',
  NOW()
),
(
  '벚꽃 명동', 
  '춘천 명동의 벚꽃이 만개한 모습. 봄의 정취가 물씬 느껴지는 거리 풍경', 
  'photo', 
  '최풍경',
  'https://example.com/images/myeongdong-cherry.jpg',
  '{"camera": "Sony A7R IV", "lens": "FE 85mm f/1.4", "settings": {"aperture": "f/2.8", "shutter": "1/500s", "iso": 200}, "location": {"lat": 37.8816, "lng": 127.7298}}',
  NOW()
);

-- 4. 서화작품 카테고리 테스트 데이터
INSERT INTO contents (
  title, 
  content, 
  category, 
  author,
  image_url,
  artwork_type,
  medium,
  dimensions,
  created_at
) VALUES 
(
  '춘천산수도', 
  '춘천의 아름다운 산수를 담은 수묵화 작품. 전통적인 화법으로 춘천의 정취를 표현했다.', 
  'calligraphy', 
  '한묵객',
  'https://example.com/artworks/chuncheon-landscape.jpg',
  'painting',
  'ink_on_paper',
  '{"width": "70cm", "height": "100cm"}',
  NOW()
),
(
  '소양강변', 
  '소양강변의 버들을 그린 채색화', 
  'calligraphy', 
  '김화백',
  'https://example.com/artworks/soyang-riverside.jpg',
  'painting',
  'color_on_silk',
  '{"width": "50cm", "height": "70cm"}',
  NOW()
);

-- 5. 공연영상 카테고리 테스트 데이터
INSERT INTO contents (
  title, 
  content, 
  category, 
  author,
  video_url,
  video_platform,
  duration,
  created_at
) VALUES 
(
  '춘천 전통무용 공연', 
  '춘천문화예술회관에서 열린 전통무용 공연 실황. 강원도 전통 민속무용을 선보인다.', 
  'performance', 
  '춘천예술단',
  'https://youtube.com/watch?v=example1',
  'youtube',
  '15:30',
  NOW()
),
(
  '호수음악제 하이라이트', 
  '2024 춘천호수음악제의 하이라이트 영상. 아름다운 호수를 배경으로 한 야외 콘서트', 
  'performance', 
  '호수음악제조직위',
  'https://youtube.com/watch?v=example2',
  'youtube',
  '8:45',
  NOW()
);
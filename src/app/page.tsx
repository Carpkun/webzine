'use client'

import Header from "../components/Header";
import Footer from "../components/Footer";
import CategoryContentSlider from "../components/CategoryContentSlider";
import { useLatestContentsByCategory } from '../hooks/useLatestContentsByCategory'

export default function Home() {
  const { contentsByCategory, loading, error } = useLatestContentsByCategory(6)
  
  // 카테고리 정보
  const categories = [
    { slug: 'essay', name: '수필', icon: '📝', description: '마음을 담아 써내려간 수필 작품들' },
    { slug: 'poetry', name: '한시', icon: '📜', description: '전통의 아름다움이 담긴 한시 작품들' },
    { slug: 'photo', name: '사진', icon: '📸', description: '순간의 아름다움을 포착한 사진 작품들' },
    { slug: 'calligraphy', name: '서화', icon: '🖼️', description: '붓끝에 담긴 정성과 예술 작품들' },
    { slug: 'video', name: '영상', icon: '🎬', description: '움직이는 이야기가 담긴 영상 작품들' },
  ]


  return (
    <div className="min-h-screen flex flex-col font-gowun">
      {/* 헤더 */}
      <Header />

      {/* 메인 콘텐츠 */}
      <main className="flex-1">
        {/* 히어로 섹션 */}
        <section className="bg-gradient-to-r from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900 py-16 lg:py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
                춘천답기 웹진
              </h1>
              <p className="text-xl sm:text-2xl text-gray-700 dark:text-gray-300 mb-12 max-w-4xl mx-auto">
                춘천문화원 회원들의 소중한 창작물을 디지털 아카이브로 보존하고 공유합니다
              </p>
            </div>
          </div>
        </section>

        {/* 에러 상태 */}
        {error && (
          <section className="py-8">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-red-700 dark:text-red-300">{error}</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 로딩 상태 */}
        {loading && (
          <section className="py-16">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">콘텐츠를 불러오고 있습니다...</p>
              </div>
            </div>
          </section>
        )}

        {/* 카테고리별 콘텐츠 슬라이더 */}
        {!loading && !error && (
          <>
            {categories.map((category) => (
              <CategoryContentSlider
                key={category.slug}
                contents={contentsByCategory[category.slug] || []}
                categoryName={category.name}
                categorySlug={category.slug}
                categoryIcon={category.icon}
              />
            ))}
          </>
        )}
      </main>

      {/* 푸터 */}
      <Footer />
    </div>
  );
}

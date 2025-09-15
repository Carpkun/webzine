import Link from 'next/link'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* 웹진 정보 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">춘천답기</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
              춘천문화원 회원들의 창작 활동을 디지털로 보존하고 공유하는 웹진입니다.
              수필, 한시, 사진, 서화, 영상 등 다양한 예술 작품을 만나보세요.
            </p>
          </div>

          {/* 카테고리 링크 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">카테고리</h3>
            <ul className="space-y-2">
              <li><Link href="/?category=essay" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm">📝 수필</Link></li>
              <li><Link href="/?category=poetry" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm">📜 한시</Link></li>
              <li><Link href="/?category=photo" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm">📸 사진</Link></li>
              <li><Link href="/?category=calligraphy" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm">🖼️ 서화</Link></li>
              <li><Link href="/?category=video" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm">🎬 영상</Link></li>
            </ul>
          </div>

          {/* 문화원 정보 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">춘천문화원</h3>
            <div className="text-gray-600 dark:text-gray-400 text-sm space-y-2">
              <p>강원특별자치도 춘천시</p>
              <p>지역 문화 예술 진흥</p>
              <p>회원 창작 활동 지원</p>
            </div>
          </div>
        </div>

        {/* 저작권 */}
        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              © {currentYear} 춘천문화원. 모든 권리 보유.
            </p>
            <div className="mt-4 sm:mt-0 flex space-x-6">
              <a href="#" className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-sm">
                개인정보처리방침
              </a>
              <a href="#" className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-sm">
                이용약관
              </a>
              <a href="#" className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-sm">
                문의하기
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
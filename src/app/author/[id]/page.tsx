import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import Header from '../../../components/Header'
import Footer from '../../../components/Footer'
import ServerContentCard from '../../../components/ServerContentCard'
import { getCategoryDisplayName, getCategoryIcon } from '../../../lib/contentUtils'

interface AuthorPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ page?: string; category?: string }>
}

// 작가 정보와 콘텐츠 조회 함수 - 내부 API 호출에는 내장 fetch 사용
async function getAuthorData(id: string, page: number = 1, category?: string) {
  try {
    // 작가별 콘텐츠 조회 - 상대 경로 사용 (서버 사이드에서 내부 API 호출)
    const { createClient } = require('@supabase/supabase-js')
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // 작가별 콘텐츠 직접 조회
    let query = supabase
      .from('contents')
      .select(`
        *,
        authors!inner(id, name, bio, profile_image_url)
      `)
      .eq('authors.id', id)
      .eq('is_published', true)
      .order('created_at', { ascending: false })
    
    // 카테고리 필터 적용
    if (category && category !== 'all') {
      query = query.eq('category', category)
    }
    
    // 페이지네이션 적용
    const from = (page - 1) * 12
    const to = from + 12 - 1
    query = query.range(from, to)
    
    const { data: contents, error: contentsError } = await query
    
    if (contentsError) {
      console.error('작가 콘텐츠 조회 오류:', contentsError)
      return null
    }
    
    // 작가 정보 조회
    const { data: author, error: authorError } = await supabase
      .from('authors')
      .select('*')
      .eq('id', id)
      .single()
    
    if (authorError) {
      console.error('작가 정보 조회 오류:', authorError)
      return null
    }
    
    // 전체 콘텐츠 수 조회
    let countQuery = supabase
      .from('contents')
      .select('id', { count: 'exact', head: true })
      .eq('author_id', id)
      .eq('is_published', true)
    
    if (category && category !== 'all') {
      countQuery = countQuery.eq('category', category)
    }
    
    const { count: totalCount } = await countQuery
    
    return {
      contents,
      author,
      pagination: {
        page,
        limit: 12,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / 12),
        hasNext: page < Math.ceil((totalCount || 0) / 12),
        hasPrev: page > 1
      }
    }
    
  } catch (error) {
    console.error('작가 데이터 조회 실패:', error)
    return null
  }
}

// 메타데이터 생성
export async function generateMetadata({ params }: AuthorPageProps): Promise<Metadata> {
  const { id } = await params
  const data = await getAuthorData(id)
  
  if (!data || !data.author) {
    return {
      title: '작가를 찾을 수 없습니다',
      description: '요청하신 작가를 찾을 수 없습니다.',
    }
  }
  
  const { author, contents } = data
  const contentCount = contents?.length || 0
  
  return {
    title: `${author.name} 작가 - 춘천답기 웹진`,
    description: author.bio || `${author.name} 작가의 작품 모음. 총 ${contentCount}개의 작품을 감상해보세요.`,
    keywords: [author.name, '춘천답기', '작가', '작품', '웹진'],
    openGraph: {
      title: `${author.name} 작가`,
      description: author.bio || `${author.name} 작가의 작품 모음`,
      images: author.profile_image_url ? [author.profile_image_url] : [],
      type: 'profile',
    },
  }
}

export default async function AuthorPage({ params, searchParams }: AuthorPageProps) {
  const { id } = await params
  const { page = '1', category = 'all' } = await searchParams
  
  const data = await getAuthorData(id, parseInt(page), category)
  
  if (!data || !data.author) {
    notFound()
  }
  
  const { author, contents, pagination } = data
  
  // 카테고리 목록 생성
  const categories = [
    { value: 'all', label: '전체', icon: '📚' },
    { value: 'essay', label: '수필', icon: '✍️' },
    { value: 'poetry', label: '한시', icon: '📜' },
    { value: 'photo', label: '사진', icon: '📷' },
    { value: 'calligraphy', label: '서화작품', icon: '🖼️' },
    { value: 'video', label: '공연영상', icon: '🎬' },
  ]
  
  return (
    <>
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
        <Header />
        
        <main className="flex-1 py-8">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            {/* 브레드크럼 */}
            <nav className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-8">
              <Link href="/" className="hover:text-gray-900 dark:hover:text-gray-200 transition-colors">
                홈
              </Link>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-gray-900 dark:text-gray-200 font-medium">
                {author.name} 작가
              </span>
            </nav>
            
            {/* 작가 프로필 섹션 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 mb-8">
              <div className="flex flex-col md:flex-row gap-6">
                {/* 프로필 이미지 */}
                <div className="flex-shrink-0">
                  {author.profile_image_url ? (
                    <div className="relative w-32 h-32 rounded-full overflow-hidden">
                      <Image
                        src={author.profile_image_url}
                        alt={`${author.name} 작가 프로필`}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-4xl font-bold">
                        {author.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* 작가 정보 */}
                <div className="flex-1">
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                    {author.name}
                  </h1>
                  
                  {author.bio && (
                    <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                      {author.bio}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span>총 {pagination.total}개의 작품</span>
                    <span>•</span>
                    <span>
                      {new Date(author.created_at).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })} 등록
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 카테고리 필터 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-8">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                카테고리별 작품
              </h2>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <Link
                    key={cat.value}
                    href={`/author/${id}?category=${cat.value}`}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      category === cat.value
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <span className="mr-2">{cat.icon}</span>
                    {cat.label}
                  </Link>
                ))}
              </div>
            </div>
            
            {/* 작품 목록 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {category === 'all' ? '전체 작품' : getCategoryDisplayName(category)}
                  <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                    ({pagination.total}개)
                  </span>
                </h2>
              </div>
              
              {contents && contents.length > 0 ? (
                <>
                  {/* 작품 그리드 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {contents.map((content: any) => (
                      <ServerContentCard key={content.id} content={content} />
                    ))}
                  </div>
                  
                  {/* 페이지네이션 */}
                  {pagination.totalPages > 1 && (
                    <div className="flex justify-center gap-2">
                      {pagination.hasPrev && (
                        <Link
                          href={`/author/${id}?page=${pagination.page - 1}&category=${category}`}
                          className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                          이전
                        </Link>
                      )}
                      
                      <span className="px-4 py-2 bg-blue-500 text-white rounded-lg">
                        {pagination.page} / {pagination.totalPages}
                      </span>
                      
                      {pagination.hasNext && (
                        <Link
                          href={`/author/${id}?page=${pagination.page + 1}&category=${category}`}
                          className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                          다음
                        </Link>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📝</div>
                  <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                    작품이 없습니다
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    {category === 'all' 
                      ? '아직 등록된 작품이 없습니다.' 
                      : `${getCategoryDisplayName(category)} 카테고리에 작품이 없습니다.`
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    </>
  )
}
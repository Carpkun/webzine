'use client'

import { useState } from 'react'
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import SearchBar from "../../../components/SearchBar";
import SortOptions from "../../../components/SortOptions";
import Pagination from "../../../components/Pagination";
import { useContents } from '../../../hooks/useContents'
import { ContentCategory } from "../../../../lib/types";
import { DynamicContentGrid } from '../../../utils/dynamicImports'

interface CategoryPageClientProps {
  categoryInfo: {
    category: ContentCategory;
    displayName: string;
    icon: string;
    description: string;
  }
}

export default function CategoryPageClient({ categoryInfo }: CategoryPageClientProps) {
  const { category, displayName, icon, description } = categoryInfo
  
  // 상태 관리
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'created_at' | 'updated_at' | 'likes_count' | 'view_count' | 'title'>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)

  // Supabase에서 해당 카테고리 데이터 조회
  const { 
    contents, 
    loading, 
    error, 
    totalCount, 
    totalPages
  } = useContents({
    category,
    search,
    sortBy,
    sortOrder,
    page,
    limit: 12
  })

  // 이벤트 핸들러들
  const handleSearchChange = (newSearch: string) => {
    setSearch(newSearch)
    setPage(1)
  }

  const handleSortChange = (newSortBy: typeof sortBy, newSortOrder: typeof sortOrder) => {
    setSortBy(newSortBy)
    setSortOrder(newSortOrder)
    setPage(1)
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* 헤더 */}
      <Header />

      {/* 메인 콘텐츠 */}
      <main className="flex-1">
        {/* 히어로 섹션 */}
        <section className="bg-gradient-to-r from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900 py-12 lg:py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="flex items-center justify-center mb-6">
                <span className="text-4xl mr-4">{icon}</span>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white">
                  {displayName}
                </h1>
              </div>
              <p className="text-lg sm:text-xl text-gray-700 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
                {description}
              </p>
              
              {/* 검색 바 */}
              <div className="max-w-lg mx-auto mb-8">
                <SearchBar 
                  value={search} 
                  onChange={handleSearchChange}
                  placeholder={`${displayName} 작품을 검색해보세요...`}
                />
              </div>
            </div>
          </div>
        </section>

        {/* 콘텐츠 영역 */}
        <section className="py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-6">
              {/* 정렬 옵션과 결과 정보 */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {displayName} 작품
                  </h2>
                  {!loading && (
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      총 {totalCount}개
                    </span>
                  )}
                </div>
                
                <SortOptions 
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSortChange={handleSortChange}
                />
              </div>
              
              {/* 에러 상태 */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-red-700 dark:text-red-300">{error}</p>
                  </div>
                </div>
              )}
              
              {/* 콘텐츠 그리드 */}
              <DynamicContentGrid 
                contents={contents}
                loading={loading}
                title=""
                showEmpty={true}
              />
              
              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <div className="mt-8">
                  <Pagination 
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* 푸터 */}
      <Footer />
    </div>
  );
}
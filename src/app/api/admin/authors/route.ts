import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin, createAuthErrorResponse } from '../../../../lib/auth-middleware'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// 전체 작가 목록 조회 (관리자 전용)
export async function GET(request: NextRequest) {
  try {
    // 관리자 권한 검증
    const authResult = await requireAdmin(request)
    if (!authResult.isAuthenticated || !authResult.isAdmin) {
      return createAuthErrorResponse(authResult)
    }
    
    // 관리자 인증 로깅 제거 (성능 최적화)

    const { data: authors, error } = await supabaseAdmin
      .from('authors')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('작가 목록 조회 오류:', error)
      return NextResponse.json(
        { error: '작가 목록을 불러올 수 없습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json(authors)
  } catch (error) {
    console.error('API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 새 작가 생성 (관리자 전용)
export async function POST(request: NextRequest) {
  try {
    // 관리자 권한 검증
    const authResult = await requireAdmin(request)
    if (!authResult.isAuthenticated || !authResult.isAdmin) {
      return createAuthErrorResponse(authResult)
    }
    
    // 관리자 인증 로깅 제거 (성능 최적화)
    
    const { name, bio, profile_image_url } = await request.json()
    
    if (!name?.trim()) {
      return NextResponse.json(
        { error: '작가명을 입력해주세요.' },
        { status: 400 }
      )
    }

    // 중복 체크
    const { data: existingAuthor } = await supabaseAdmin
      .from('authors')
      .select('id')
      .eq('name', name.trim())
      .single()

    if (existingAuthor) {
      return NextResponse.json(
        { error: '이미 등록된 작가명입니다.' },
        { status: 409 }
      )
    }

    // 작가 생성
    const { data, error } = await supabaseAdmin
      .from('authors')
      .insert([{
        name: name.trim(),
        bio: bio?.trim() || null,
        profile_image_url: profile_image_url?.trim() || null
      }])
      .select()
      .single()

    if (error) {
      console.error('작가 생성 오류:', error)
      return NextResponse.json(
        { error: '작가 등록에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

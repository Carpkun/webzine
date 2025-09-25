import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // 작가 정보 조회
    const { data: author, error } = await supabaseAdmin
      .from('authors')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      // 로깅 제거 (성능 최적화)
      return NextResponse.json(
        { error: '작가 정보를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json(author)
  } catch (error) {
    // 로깅 제거 (성능 최적화)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 작가 정보 수정 (관리자만)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const body = await request.json()
    const { name, bio, profile_image_url } = body

    // 작가 정보 업데이트
    const { data, error } = await supabaseAdmin
      .from('authors')
      .update({
        name,
        bio,
        profile_image_url,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      // 로깅 제거 (성능 최적화)
      return NextResponse.json(
        { error: '작가 정보를 수정할 수 없습니다.' },
        { status: 400 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    // 로깅 제거 (성능 최적화)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 작가 삭제 (관리자만)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // 작가 존재 확인
    const { data: author, error: authorError } = await supabaseAdmin
      .from('authors')
      .select('name')
      .eq('id', id)
      .single()

    if (authorError || !author) {
      return NextResponse.json(
        { error: '작가를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 작가 삭제
    const { error: deleteError } = await supabaseAdmin
      .from('authors')
      .delete()
      .eq('id', id)

    if (deleteError) {
      // 로깅 제거 (성능 최적화)
      return NextResponse.json(
        { error: '작가 삭제에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      message: `'${author.name}' 작가가 삭제되었습니다.` 
    })
  } catch (error) {
    // 로깅 제거 (성능 최적화)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

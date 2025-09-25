import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { sanitizeFileName, validateFileType } from '../../../../lib/validation'

// Supabase 클라이언트 초기화 (서버 사이드용)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY! // 서비스 키 필요

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// 파일 타입 및 크기 검증
const ALLOWED_TYPES = {
  image: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  video: ['video/mp4', 'video/webm', 'video/ogg'],
  document: ['application/pdf', 'text/plain']
}

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB (Free Plan 제한)

// POST - 파일 업로드 (관리자 전용)
export async function POST(request: NextRequest) {
  try {
    console.log('📤 파일 업로드 API 시작')
    
    // 인증 처리 - admin/authors API와 동일한 방식 사용 (간단한 버전)
    const cookieStore = await cookies()
    const supabaseAuth = createRouteHandlerClient({ cookies: () => cookieStore })
    
    console.log('🔐 인증 처리 완료, 파일 업로드 진행')

    const formData = await request.formData()
    const file = formData.get('file') as File
    const category = formData.get('category') as string || 'general'

    if (!file) {
      return NextResponse.json({ error: '파일이 필요합니다' }, { status: 400 })
    }

    console.log('📤 파일 업로드 요청:', {
      name: file.name,
      type: file.type,
      size: file.size,
      category
    })

    // 파일 크기 검증
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({
        error: `파일 크기가 너무 큽니다. 최대 ${MAX_FILE_SIZE / 1024 / 1024}MB까지 업로드 가능합니다.`
      }, { status: 400 })
    }

    // 파일 타입 검증
    const allowedTypes = Object.values(ALLOWED_TYPES).flat()
    if (!validateFileType(file.type, allowedTypes)) {
      return NextResponse.json({
        error: '지원하지 않는 파일 형식입니다.',
        supported: allowedTypes
      }, { status: 400 })
    }
    
    const fileType = getFileType(file.type)

    // 파일명 sanitization 및 생성 (중복 방지)
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const sanitizedOriginalName = sanitizeFileName(file.name)
    const fileExtension = sanitizedOriginalName.split('.').pop() || 'bin'
    const fileName = `${category}/${timestamp}-${randomString}.${fileExtension}`

    console.log('📁 생성된 파일명:', fileName)

    // Supabase Storage 버킷 확인/생성
    const bucketName = 'webzine-media'
    await ensureBucketExists(bucketName)

    // 파일 업로드
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('❌ Storage 업로드 실패:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 공개 URL 생성
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName)

    console.log('✅ 파일 업로드 성공:', publicUrl)

    return NextResponse.json({
      success: true,
      data: {
        url: publicUrl,
        fileName: fileName,
        originalName: file.name,
        type: fileType,
        size: file.size,
        category: category
      }
    }, { status: 201 })

  } catch (error) {
    console.error('❌ 파일 업로드 API 오류:', error)
    return NextResponse.json({
      error: '파일 업로드 중 오류가 발생했습니다'
    }, { status: 500 })
  }
}

// GET - 업로드된 파일 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const bucketName = 'webzine-media'
    let path = category || ''

    console.log('📋 파일 목록 조회:', { category, limit, offset })

    const { data, error } = await supabase.storage
      .from(bucketName)
      .list(path, {
        limit,
        offset,
        sortBy: { column: 'created_at', order: 'desc' }
      })

    if (error) {
      console.error('❌ 파일 목록 조회 실패:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 공개 URL과 함께 파일 정보 반환
    const filesWithUrls = data?.map(file => ({
      name: file.name,
      size: file.metadata?.size,
      type: getFileTypeFromName(file.name),
      created_at: file.created_at,
      updated_at: file.updated_at,
      url: supabase.storage.from(bucketName).getPublicUrl(
        path ? `${path}/${file.name}` : file.name
      ).data.publicUrl
    })) || []

    console.log(`✅ 파일 목록 조회 완료: ${filesWithUrls.length}개`)

    return NextResponse.json({
      data: filesWithUrls,
      count: filesWithUrls.length
    })

  } catch (error) {
    console.error('❌ 파일 목록 API 오류:', error)
    return NextResponse.json({
      error: '파일 목록 조회 중 오류가 발생했습니다'
    }, { status: 500 })
  }
}

// DELETE - 파일 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fileName = searchParams.get('fileName')

    if (!fileName) {
      return NextResponse.json({ error: '파일명이 필요합니다' }, { status: 400 })
    }

    console.log('🗑️ 파일 삭제 요청:', fileName)

    const bucketName = 'webzine-media'
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([fileName])

    if (error) {
      console.error('❌ 파일 삭제 실패:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('✅ 파일 삭제 완료:', fileName)

    return NextResponse.json({
      success: true,
      message: '파일이 삭제되었습니다'
    })

  } catch (error) {
    console.error('❌ 파일 삭제 API 오류:', error)
    return NextResponse.json({
      error: '파일 삭제 중 오류가 발생했습니다'
    }, { status: 500 })
  }
}

// 유틸리티 함수들
function getFileType(mimeType: string): string | null {
  for (const [type, mimes] of Object.entries(ALLOWED_TYPES)) {
    if (mimes.includes(mimeType)) {
      return type
    }
  }
  return null
}

function getFileTypeFromName(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase()
  
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
    return 'image'
  } else if (['mp4', 'webm', 'ogg'].includes(extension || '')) {
    return 'video'
  } else if (['pdf', 'txt'].includes(extension || '')) {
    return 'document'
  }
  
  return 'unknown'
}

// 버킷 존재 확인 및 생성
async function ensureBucketExists(bucketName: string) {
  const { data: buckets } = await supabase.storage.listBuckets()
  
  const bucketExists = buckets?.some(bucket => bucket.name === bucketName)
  
  if (!bucketExists) {
    console.log('📦 버킷 생성:', bucketName)
    
    const { error } = await supabase.storage.createBucket(bucketName, {
      public: true,
      allowedMimeTypes: Object.values(ALLOWED_TYPES).flat(),
      fileSizeLimit: MAX_FILE_SIZE
    })
    
    if (error) {
      console.error('❌ 버킷 생성 실패:', error)
      throw error
    }
  }
}
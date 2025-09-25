import { NextRequest, NextResponse } from 'next/server'
import { TextToSpeechClient } from '@google-cloud/text-to-speech'

// Google Cloud TTS 클라이언트 초기화
let ttsClient: TextToSpeechClient

try {
  ttsClient = new TextToSpeechClient({
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  })
} catch (error) {
  console.error('Google Cloud TTS 초기화 실패:', error)
}

export async function POST(request: NextRequest) {
  try {
    // 환경 변수 확인
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS || !process.env.GOOGLE_CLOUD_PROJECT_ID) {
      return NextResponse.json(
        { error: 'Google Cloud 설정이 누락되었습니다.' },
        { status: 500 }
      )
    }

    const { text, chunkIndex, totalChunks } = await request.json()

    if (!text) {
      return NextResponse.json(
        { error: '텍스트가 필요합니다.' },
        { status: 400 }
      )
    }

    // 개별 청크는 5000 바이트 제한
    const textBytes = new Blob([text]).size
    if (textBytes > 5000) {
      return NextResponse.json(
        { error: `청크 텍스트가 너무 깁니다. 5000바이트 이하로 제한됩니다. (현재: ${textBytes}바이트)` },
        { status: 400 }
      )
    }

    // TTS 요청 설정
    const request_config = {
      input: { text },
      voice: {
        languageCode: 'ko-KR',
        name: 'ko-KR-Neural2-A', // 자연스러운 한국어 여성 목소리
        ssmlGender: 'FEMALE' as const,
      },
      audioConfig: {
        audioEncoding: 'MP3' as const,
        speakingRate: 1.0, // 말하기 속도
        pitch: 0.0, // 음성 높낮이
        volumeGainDb: 0.0, // 볼륨
      },
    }

    // TTS 변환 실행
    const [response] = await ttsClient.synthesizeSpeech(request_config)

    if (!response.audioContent) {
      return NextResponse.json(
        { error: '오디오 생성에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 오디오 데이터를 Base64로 인코딩
    const audioBase64 = Buffer.from(response.audioContent).toString('base64')

    return NextResponse.json({
      success: true,
      audio: `data:audio/mp3;base64,${audioBase64}`,
      duration: Math.ceil(text.length / 10), // 대략적인 재생 시간 계산 (초)
      chunkIndex: chunkIndex || 0,
      totalChunks: totalChunks || 1,
    })

  } catch (error) {
    console.error('TTS API 오류:', error)
    return NextResponse.json(
      { error: 'TTS 변환 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
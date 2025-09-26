'use client'

import { useState, useEffect } from 'react'
import { ImageExifData } from '../lib/types'

interface PhotoExifInfoProps {
  imageUrl: string
  existingExifData?: ImageExifData | null
  className?: string
}

interface ExifDisplayData {
  // 기본 정보 (항상 표시)
  aperture?: string
  shutterSpeed?: string
  iso?: number
  focalLength?: string
  
  // 확장 정보 (드롭다운)
  camera?: string
  lens?: string
  dateTime?: string
  location?: string
  flash?: string
  whiteBalance?: string
  meteringMode?: string
  exposureMode?: string
  focusMode?: string
  colorSpace?: string
  orientation?: string
  software?: string
  photographer?: string
  copyright?: string
}

export default function PhotoExifInfo({ 
  imageUrl, 
  existingExifData, 
  className = '' 
}: PhotoExifInfoProps) {
  const [exifData, setExifData] = useState<ExifDisplayData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showExtendedInfo, setShowExtendedInfo] = useState(false)

  useEffect(() => {
    const extractExifData = async () => {
      try {
        setLoading(true)
        setError(null)

        // 기존 EXIF 데이터가 있는 경우 사용
        if (existingExifData) {
          setExifData({
            // 기본 정보
            aperture: existingExifData.aperture,
            shutterSpeed: existingExifData.shutterSpeed,
            iso: existingExifData.iso,
            focalLength: existingExifData.focalLength,
            
            // 확장 정보
            camera: existingExifData.camera,
            lens: existingExifData.lens,
            dateTime: existingExifData.dateTime,
            location: existingExifData.gps?.latitude && existingExifData.gps?.longitude
              ? `${existingExifData.gps.latitude.toFixed(6)}, ${existingExifData.gps.longitude.toFixed(6)}`
              : undefined,
            flash: existingExifData.flash,
            whiteBalance: existingExifData.whiteBalance,
            meteringMode: existingExifData.meteringMode,
            exposureMode: existingExifData.exposureMode,
            colorSpace: existingExifData.colorSpace,
            orientation: existingExifData.orientation,
            software: existingExifData.software
          })
          setLoading(false)
          return
        }

        // 이미지 URL에서 직접 EXIF 추출 (동적 import으로 번들 크기 최적화)
        const { parse } = await import('exifr')
        
        // 이미지 URL에서 EXIF 데이터 추출
        const rawExif = await parse(imageUrl, {
          // 필요한 EXIF 태그만 추출하여 성능 최적화
          pick: [
            // 기본 정보
            'FNumber', 'ExposureTime', 'ISO', 'FocalLength',
            
            // 확장 정보
            'Make', 'Model', 'LensModel', 'LensInfo',
            'DateTimeOriginal', 'DateTime',
            'GPSLatitude', 'GPSLongitude',
            'Flash', 'WhiteBalance', 'MeteringMode',
            'ExposureMode', 'FocusMode', 'ColorSpace',
            'Orientation', 'Software',
            'Artist', 'Copyright'
          ]
        })

        if (rawExif) {
          // EXIF 데이터를 사용자 친화적 형태로 변환
          const processedData: ExifDisplayData = {}

          // 기본 정보 (항상 표시)
          // 조리개값
          if (rawExif.FNumber) {
            processedData.aperture = `f/${rawExif.FNumber}`
          }

          // 셔터속도
          if (rawExif.ExposureTime) {
            if (rawExif.ExposureTime >= 1) {
              processedData.shutterSpeed = `${rawExif.ExposureTime}s`
            } else {
              const denominator = Math.round(1 / rawExif.ExposureTime)
              processedData.shutterSpeed = `1/${denominator}s`
            }
          }

          // ISO
          if (rawExif.ISO) {
            processedData.iso = rawExif.ISO
          }

          // 초점거리
          if (rawExif.FocalLength) {
            processedData.focalLength = `${rawExif.FocalLength}mm`
          }

          // 확장 정보 (드롭다운)
          // 카메라 정보
          if (rawExif.Make && rawExif.Model) {
            processedData.camera = `${rawExif.Make} ${rawExif.Model}`
          } else if (rawExif.Model) {
            processedData.camera = rawExif.Model
          }

          // 렌즈 정보
          if (rawExif.LensModel) {
            processedData.lens = rawExif.LensModel
          } else if (rawExif.LensInfo) {
            processedData.lens = Array.isArray(rawExif.LensInfo) 
              ? rawExif.LensInfo.join('mm-') + 'mm' 
              : rawExif.LensInfo
          }

          // 촬영일시
          if (rawExif.DateTimeOriginal) {
            processedData.dateTime = new Date(rawExif.DateTimeOriginal).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          } else if (rawExif.DateTime) {
            processedData.dateTime = new Date(rawExif.DateTime).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          }

          // GPS 좌표
          if (rawExif.GPSLatitude && rawExif.GPSLongitude) {
            processedData.location = `${rawExif.GPSLatitude.toFixed(6)}, ${rawExif.GPSLongitude.toFixed(6)}`
          }

          // 플래시 정보
          if (rawExif.Flash !== undefined) {
            // 숫자 값 처리
            const flashModes = {
              0: 'No',
              1: 'Yes',
              5: 'Yes (돌아오는 빛 감지 안됨)',
              7: 'Yes (돌아오는 빛 감지됨)',
              9: '강제',
              13: '강제 (돌아오는 빛 감지 안됨)',
              15: '강제 (돌아오는 빛 감지됨)',
              16: 'No (강제 사용 안함)',
              24: '자동 (Off)',
              25: '자동 (On)'
            }
            
            // 문자열 형태일 때 처리
            if (typeof rawExif.Flash === 'string') {
              const flashText = rawExif.Flash.toLowerCase()
              if (flashText.includes('did not fire') || flashText.includes('no flash')) {
                processedData.flash = 'No'
              } else if (flashText.includes('fired') || flashText.includes('flash')) {
                if (flashText.includes('compulsory') || flashText.includes('forced')) {
                  processedData.flash = '강제'
                } else if (flashText.includes('auto')) {
                  processedData.flash = '자동 (On)'
                } else {
                  processedData.flash = 'Yes'
                }
              } else {
                processedData.flash = 'No'
              }
            } else {
              // 숫자 값 처리
              processedData.flash = flashModes[rawExif.Flash] || 'No'
            }
          }

          // 화이트밸런스
          if (rawExif.WhiteBalance !== undefined) {
            const wbModes = {
              0: '자동 화이트밸런스',
              1: '수동 화이트밸런스'
            }
            processedData.whiteBalance = wbModes[rawExif.WhiteBalance] || `WB: ${rawExif.WhiteBalance}`
          }

          // 측광 모드
          if (rawExif.MeteringMode !== undefined) {
            const meteringModes = {
              0: '알 수 없음',
              1: '평균',
              2: '중앙 중점',
              3: '스팟',
              4: '멀티스팟',
              5: '패턴',
              6: '부분'
            }
            processedData.meteringMode = meteringModes[rawExif.MeteringMode] || `${rawExif.MeteringMode}`
          }

          // 노출 모드
          if (rawExif.ExposureMode !== undefined) {
            const exposureModes = {
              0: '자동 노출',
              1: '수동 노출',
              2: '자동 브래켓'
            }
            processedData.exposureMode = exposureModes[rawExif.ExposureMode] || `${rawExif.ExposureMode}`
          }

          // 색상 영역
          if (rawExif.ColorSpace !== undefined) {
            const colorSpaces = {
              1: 'sRGB',
              65535: 'Uncalibrated'
            }
            processedData.colorSpace = colorSpaces[rawExif.ColorSpace] || `색상영역: ${rawExif.ColorSpace}`
          }

          // 회전 정보
          if (rawExif.Orientation !== undefined) {
            const orientations = {
              1: '정상',
              2: '수평 반전',
              3: '180도 회전',
              4: '수직 반전',
              5: '수직 반전 + 90도 시계방향 회전',
              6: '90도 시계방향 회전',
              7: '수직 반전 + 90도 반시계방향 회전',
              8: '90도 반시계방향 회전'
            }
            processedData.orientation = orientations[rawExif.Orientation] || `회전: ${rawExif.Orientation}`
          }

          // 소프트웨어
          if (rawExif.Software) {
            processedData.software = rawExif.Software
          }

          // 작가/저작권 정보
          if (rawExif.Artist) {
            processedData.photographer = rawExif.Artist
          }
          
          if (rawExif.Copyright) {
            processedData.copyright = rawExif.Copyright
          }

          setExifData(processedData)
        } else {
          setExifData(null)
        }
      } catch (err) {
        console.error('EXIF 추출 오류:', err)
        setError('EXIF 정보를 추출할 수 없습니다.')
        setExifData(null)
      } finally {
        setLoading(false)
      }
    }

    if (imageUrl) {
      extractExifData()
    } else {
      setLoading(false)
      setExifData(null)
    }
  }, [imageUrl, existingExifData])

  // EXIF 데이터가 없으면 렌더링하지 않음
  if (loading) {
    return (
      <div className={`bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 ${className}`}>
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-sm text-blue-800 dark:text-blue-400">촬영 정보 불러오는 중...</span>
        </div>
      </div>
    )
  }

  if (error || !exifData || Object.keys(exifData).length === 0) {
    return null // EXIF 정보가 없으면 컴포넌트를 숨김
  }

  // 기본 정보를 보여줄 여부 확인
  const hasBasicInfo = exifData.aperture || exifData.shutterSpeed || exifData.iso || exifData.focalLength
  
  // 확장 정보를 보여줄 여부 확인 (핵심 6가지)
  const hasExtendedInfo = exifData.camera || exifData.lens || exifData.exposureMode || 
    exifData.meteringMode || exifData.flash || exifData.dateTime

  return (
    <div className={`bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <h4 className="font-semibold text-blue-900 dark:text-blue-300">촬영 정보</h4>
        </div>
        {hasExtendedInfo && (
          <button
            onClick={() => setShowExtendedInfo(!showExtendedInfo)}
            className="flex items-center space-x-1 px-3 py-1 text-xs bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 rounded-full hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors"
          >
            <span>{showExtendedInfo ? '자세히 숨기기' : '자세히 보기'}</span>
            <svg 
              className={`w-3 h-3 transition-transform ${showExtendedInfo ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
      </div>

      {/* 기본 정보 (항상 표시) */}
      {hasBasicInfo && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {exifData.aperture && (
            <div className="flex flex-col">
              <dt className="text-xs font-medium text-blue-700 dark:text-blue-400 uppercase tracking-wide mb-1">
                조리개
              </dt>
              <dd className="text-sm text-blue-900 dark:text-blue-200 font-medium">
                {exifData.aperture}
              </dd>
            </div>
          )}

          {exifData.shutterSpeed && (
            <div className="flex flex-col">
              <dt className="text-xs font-medium text-blue-700 dark:text-blue-400 uppercase tracking-wide mb-1">
                셔터속도
              </dt>
              <dd className="text-sm text-blue-900 dark:text-blue-200 font-medium">
                {exifData.shutterSpeed}
              </dd>
            </div>
          )}

          {exifData.iso && (
            <div className="flex flex-col">
              <dt className="text-xs font-medium text-blue-700 dark:text-blue-400 uppercase tracking-wide mb-1">
                ISO
              </dt>
              <dd className="text-sm text-blue-900 dark:text-blue-200 font-medium">
                {exifData.iso}
              </dd>
            </div>
          )}

          {exifData.focalLength && (
            <div className="flex flex-col">
              <dt className="text-xs font-medium text-blue-700 dark:text-blue-400 uppercase tracking-wide mb-1">
                초점거리
              </dt>
              <dd className="text-sm text-blue-900 dark:text-blue-200 font-medium">
                {exifData.focalLength}
              </dd>
            </div>
          )}
        </div>
      )}

      {/* 확장 정보 (드롭다운) - 핵심 6가지 */}
      {showExtendedInfo && hasExtendedInfo && (
        <div className="border-t border-blue-200 dark:border-blue-700 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {exifData.camera && (
              <div className="flex flex-col">
                <dt className="text-xs font-medium text-blue-700 dark:text-blue-400 uppercase tracking-wide mb-1">
                  카메라
                </dt>
                <dd className="text-sm text-blue-900 dark:text-blue-200 font-medium">
                  {exifData.camera}
                </dd>
              </div>
            )}

            {exifData.lens && (
              <div className="flex flex-col">
                <dt className="text-xs font-medium text-blue-700 dark:text-blue-400 uppercase tracking-wide mb-1">
                  렌즈
                </dt>
                <dd className="text-sm text-blue-900 dark:text-blue-200 font-medium">
                  {exifData.lens}
                </dd>
              </div>
            )}

            {exifData.exposureMode && (
              <div className="flex flex-col">
                <dt className="text-xs font-medium text-blue-700 dark:text-blue-400 uppercase tracking-wide mb-1">
                  노출 모드
                </dt>
                <dd className="text-sm text-blue-900 dark:text-blue-200 font-medium">
                  {exifData.exposureMode}
                </dd>
              </div>
            )}

            {exifData.meteringMode && (
              <div className="flex flex-col">
                <dt className="text-xs font-medium text-blue-700 dark:text-blue-400 uppercase tracking-wide mb-1">
                  측광 모드
                </dt>
                <dd className="text-sm text-blue-900 dark:text-blue-200 font-medium">
                  {exifData.meteringMode}
                </dd>
              </div>
            )}

            {exifData.flash && (
              <div className="flex flex-col">
                <dt className="text-xs font-medium text-blue-700 dark:text-blue-400 uppercase tracking-wide mb-1">
                  플래시
                </dt>
                <dd className="text-sm text-blue-900 dark:text-blue-200 font-medium">
                  {exifData.flash}
                </dd>
              </div>
            )}

            {exifData.dateTime && (
              <div className="flex flex-col">
                <dt className="text-xs font-medium text-blue-700 dark:text-blue-400 uppercase tracking-wide mb-1">
                  촬영일시
                </dt>
                <dd className="text-sm text-blue-900 dark:text-blue-200 font-medium">
                  {exifData.dateTime}
                </dd>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
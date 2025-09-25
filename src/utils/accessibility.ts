/**
 * 접근성 관련 유틸리티 함수들
 */

/**
 * 스크린 리더를 위한 시각적으로 숨겨진 텍스트 클래스
 */
export const srOnly = 'sr-only absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0'

/**
 * 키보드 포커스 가능한 요소들의 셀렉터
 */
export const focusableElements = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',')

/**
 * 요소 내의 포커스 가능한 첫 번째 요소로 포커스 이동
 */
export function focusFirstElement(container: HTMLElement): boolean {
  const firstFocusable = container.querySelector(focusableElements) as HTMLElement
  if (firstFocusable) {
    firstFocusable.focus()
    return true
  }
  return false
}

/**
 * 요소 내의 포커스 가능한 마지막 요소로 포커스 이동
 */
export function focusLastElement(container: HTMLElement): boolean {
  const focusableEls = container.querySelectorAll(focusableElements)
  const lastFocusable = focusableEls[focusableEls.length - 1] as HTMLElement
  if (lastFocusable) {
    lastFocusable.focus()
    return true
  }
  return false
}

/**
 * 포커스 트랩: 지정된 컨테이너 내에서만 탭 네비게이션 허용
 */
export function trapFocus(container: HTMLElement, event: KeyboardEvent): void {
  const focusableEls = Array.from(container.querySelectorAll(focusableElements)) as HTMLElement[]
  const firstFocusable = focusableEls[0]
  const lastFocusable = focusableEls[focusableEls.length - 1]

  if (event.key !== 'Tab') return

  if (event.shiftKey) {
    // Shift + Tab
    if (document.activeElement === firstFocusable) {
      event.preventDefault()
      lastFocusable.focus()
    }
  } else {
    // Tab
    if (document.activeElement === lastFocusable) {
      event.preventDefault()
      firstFocusable.focus()
    }
  }
}

/**
 * Escape 키로 모달/팝업 닫기
 */
export function handleEscapeKey(event: KeyboardEvent, onClose: () => void): void {
  if (event.key === 'Escape') {
    event.preventDefault()
    onClose()
  }
}

/**
 * ARIA 상태 업데이트
 */
export function updateAriaExpanded(element: HTMLElement, expanded: boolean): void {
  element.setAttribute('aria-expanded', expanded.toString())
}

export function updateAriaSelected(element: HTMLElement, selected: boolean): void {
  element.setAttribute('aria-selected', selected.toString())
}

/**
 * 스크린 리더용 라이브 리전 공지
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  const announcement = document.createElement('div')
  announcement.setAttribute('aria-live', priority)
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = srOnly
  announcement.textContent = message
  
  document.body.appendChild(announcement)
  
  // 공지 후 요소 제거
  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

/**
 * 컬러 대비 검사 (WCAG 2.1 AA 기준)
 */
export function checkColorContrast(foreground: string, background: string): {
  ratio: number
  isAA: boolean
  isAAA: boolean
} {
  // 간단한 헥스 색상 코드 대비 계산 (실제로는 더 복잡한 계산 필요)
  const getLuminance = (color: string): number => {
    const hex = color.replace('#', '')
    const r = parseInt(hex.slice(0, 2), 16) / 255
    const g = parseInt(hex.slice(2, 4), 16) / 255
    const b = parseInt(hex.slice(4, 6), 16) / 255
    
    const sRGB = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    
    return 0.2126 * sRGB(r) + 0.7152 * sRGB(g) + 0.0722 * sRGB(b)
  }
  
  const l1 = getLuminance(foreground)
  const l2 = getLuminance(background)
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
  
  return {
    ratio,
    isAA: ratio >= 4.5,
    isAAA: ratio >= 7.0
  }
}

/**
 * 키보드 네비게이션을 위한 방향키 처리
 */
export function handleArrowNavigation(
  event: KeyboardEvent,
  items: HTMLElement[],
  currentIndex: number,
  onIndexChange: (newIndex: number) => void,
  orientation: 'horizontal' | 'vertical' = 'vertical'
): void {
  let newIndex = currentIndex
  
  if (orientation === 'vertical') {
    if (event.key === 'ArrowDown') {
      newIndex = (currentIndex + 1) % items.length
    } else if (event.key === 'ArrowUp') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1
    }
  } else {
    if (event.key === 'ArrowRight') {
      newIndex = (currentIndex + 1) % items.length
    } else if (event.key === 'ArrowLeft') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1
    }
  }
  
  if (newIndex !== currentIndex) {
    event.preventDefault()
    onIndexChange(newIndex)
    items[newIndex]?.focus()
  }
}

/**
 * 화면 크기에 따른 모바일/데스크탑 구분
 */
export function isMobileDevice(): boolean {
  return window.innerWidth < 768
}

/**
 * 사용자의 선호하는 모션 설정 확인
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
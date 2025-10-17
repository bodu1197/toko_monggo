'use client';

import { useState, useEffect } from 'react';

/**
 * 화면 너비를 기반으로 모바일 여부를 반환하는 커스텀 훅
 * @param {number} breakpoint - 모바일로 간주할 최대 너비 (기본값: 768px)
 * @returns {boolean|null} 모바일 여부 (true/false) 또는 초기 상태(null)
 */
export function useScreenSize(breakpoint = 768) {
  // 초기값을 null로 설정하여 SSR/초기 렌더링 시 깜빡임 방지
  // CSS가 먼저 올바른 레이아웃을 표시하고, JS는 상태만 동기화
  const [isMobile, setIsMobile] = useState(null);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    // 컴포넌트 마운트 시 즉시 실행
    checkScreenSize();

    // resize 이벤트 리스너 등록
    window.addEventListener('resize', checkScreenSize);

    // 컴포넌트 언마운트 시 리스너 제거
    return () => window.removeEventListener('resize', checkScreenSize);
  }, [breakpoint]);

  return isMobile;
}

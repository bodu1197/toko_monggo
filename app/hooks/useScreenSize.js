'use client';

import { useState, useEffect } from 'react';

/**
 * 화면 너비를 기반으로 모바일 여부를 반환하는 커스텀 훅
 * @param {number} breakpoint - 모바일로 간주할 최대 너비 (기본값: 768px)
 * @returns {boolean} 모바일 여부 (true/false)
 */
export function useScreenSize(breakpoint = 768) {
  // 초기값을 true로 설정하여 모바일 우선 렌더링
  const [isMobile, setIsMobile] = useState(true);

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

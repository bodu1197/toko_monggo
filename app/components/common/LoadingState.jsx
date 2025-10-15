'use client';

/**
 * 로딩 상태를 표시하는 공통 컴포넌트
 * @param {object} props
 * @param {string} [props.message='로딩 중...'] - 로딩 메시지
 * @param {'sm' | 'md' | 'lg'} [props.size='lg'] - 스피너 크기
 */
export default function LoadingState({ message = '로딩 중...', size = 'lg' }) {
  const spinnerSizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-12 h-12 border-4',
    lg: 'w-16 h-16 border-4'
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] py-10 px-5 text-center">
      <div className={`rounded-full animate-spin border-[#374151] border-t-[#4b5563] ${spinnerSizes[size]}`}></div>
      {message && <p className="mt-4 text-[#9ca3af] text-base">{message}</p>}
    </div>
  );
}

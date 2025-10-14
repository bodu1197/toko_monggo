'use client';

/**
 * 로딩 상태를 표시하는 공통 컴포넌트
 * 스타일은 globals.css에서 관리
 * @param {object} props
 * @param {string} [props.message='로딩 중...'] - 로딩 메시지
 * @param {'sm' | 'md' | 'lg'} [props.size='lg'] - 스피너 크기
 */
export default function LoadingState({ message = '로딩 중...', size = 'lg' }) {
  return (
    <div className="loading-container">
      <div className={`spinner spinner-${size}`}></div>
      {message && <p>{message}</p>}
    </div>
  );
}

'use client';

import './LoadingState.css';

/**
 * 로딩 상태를 표시하는 공통 컴포넌트
 * @param {object} props
 * @param {string} [props.message='로딩 중...'] - 로딩 메시지
 * @param {'small' | 'large'} [props.size='large'] - 스피너 크기
 */
export default function LoadingState({ message = '로딩 중...', size = 'large' }) {
  return (
    <div className="loading-container">
      <div className={`spinner ${size}`}></div>
      {message && <p>{message}</p>}
    </div>
  );
}

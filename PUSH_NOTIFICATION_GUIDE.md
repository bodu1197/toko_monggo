# Push Notification Setup Guide for TokoMonggo

## 개요
이 가이드는 TokoMonggo에서 푸시 알림을 설정하고 사용하는 방법을 설명합니다.

## 설정 완료 사항

### 1. VAPID 키 생성 ✅
- 공개키와 비밀키가 생성되어 `.env.local`에 저장됨
- 클라이언트는 공개키를, 서버는 비밀키를 사용

### 2. 클라이언트 설정 ✅
- Service Worker (`/public/sw.js`) - 푸시 알림 수신 처리
- NotificationPermission 컴포넌트 - 사용자 권한 요청
- pushNotifications 유틸리티 - 알림 구독 관리

### 3. 서버 API 엔드포인트 ✅
- `/api/notifications/send` - 특정 사용자에게 알림 전송
- `/api/notifications/broadcast` - 모든 사용자 또는 그룹에게 알림 전송

## 사용 방법

### 1. 사용자가 알림을 활성화하는 방법
사용자는 다음 두 가지 방법으로 알림을 활성화할 수 있습니다:

1. **홈페이지의 알림 배너**
   - 처음 방문시 하단에 알림 활성화 배너 표시
   - "Aktifkan Notifikasi" 버튼 클릭

2. **설정 페이지**
   - `/settings/notifications`에서 알림 설정 관리

### 2. 특정 사용자에게 알림 보내기

```javascript
// API 호출 예제
const sendNotification = async (userId, message) => {
  const response = await fetch('/api/notifications/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId: userId,
      title: 'TokoMonggo',
      body: message,
      url: '/products/new', // 클릭시 이동할 URL
      tag: 'product-update' // 알림 그룹 태그
    })
  });

  return response.json();
};

// 사용 예시
sendNotification('user-123', 'Ada produk baru yang mungkin Anda sukai!');
```

### 3. 모든 사용자에게 알림 보내기 (Broadcast)

```javascript
// 전체 사용자에게 프로모 알림
const broadcastPromo = async () => {
  const response = await fetch('/api/notifications/broadcast', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: 'Promo Akhir Tahun! 🎉',
      body: 'Diskon hingga 50% untuk semua produk',
      url: '/promo',
      tag: 'promo-2024'
    })
  });

  return response.json();
};
```

### 4. 자동 알림 시나리오

다음과 같은 경우에 자동으로 알림을 보낼 수 있습니다:

1. **새 메시지**
```javascript
// 채팅 메시지 수신시
await sendNotification(receiverId, `Pesan baru dari ${senderName}`);
```

2. **가격 인하**
```javascript
// 관심 상품 가격 변경시
await sendNotification(userId, `Harga ${productName} turun ${discount}%!`);
```

3. **새 상품 등록**
```javascript
// 팔로우한 판매자의 새 상품
await sendNotification(followerId, `${sellerName} menambahkan produk baru`);
```

## Supabase 테이블 설정

다음 테이블이 필요합니다:

```sql
-- Push subscription 저장 테이블
CREATE TABLE push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  subscription_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

-- 알림 로그 테이블 (선택사항)
CREATE TABLE notification_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL, -- 'individual' or 'broadcast'
  title TEXT NOT NULL,
  body TEXT,
  url TEXT,
  total_recipients INTEGER,
  successful_sends INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 테스트 방법

1. **개발 환경에서 테스트**
   - 브라우저에서 알림 권한 허용
   - 개발자 도구 > Application > Service Workers 확인
   - NotificationPermission 컴포넌트의 "Test" 버튼 사용

2. **프로덕션 테스트**
   - HTTPS 환경 필요 (localhost는 예외)
   - 실제 모바일 기기에서 PWA 설치 후 테스트

## 주의사항

1. **HTTPS 필수**: 푸시 알림은 HTTPS에서만 작동 (localhost 제외)
2. **권한 관리**: 사용자가 거부하면 재요청 불가, 설정에서 직접 변경 필요
3. **iOS 제한**: iOS Safari는 PWA 설치 후에만 푸시 알림 지원
4. **배터리 최적화**: 과도한 알림은 사용자 경험 저하

## 문제 해결

1. **"VAPID public key not configured" 오류**
   - `.env.local` 파일에 VAPID 키가 있는지 확인
   - 서버 재시작 필요

2. **알림이 표시되지 않음**
   - 브라우저 알림 권한 확인
   - Service Worker 등록 상태 확인
   - 개발자 도구 콘솔에서 오류 확인

3. **410 Gone 오류**
   - 구독이 만료됨, 자동으로 DB에서 제거됨
   - 사용자가 다시 알림을 활성화해야 함

## 추가 개발 아이디어

1. **알림 스케줄링**: 특정 시간에 알림 전송
2. **알림 템플릿**: 자주 사용하는 알림 형식 저장
3. **알림 분석**: 클릭률, 전송 성공률 추적
4. **사용자 선호도**: 알림 종류별 on/off 설정
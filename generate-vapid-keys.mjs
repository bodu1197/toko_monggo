// VAPID 키 생성 스크립트 (ES Module)
import webpush from 'web-push';

// VAPID 키 생성
const vapidKeys = webpush.generateVAPIDKeys();

console.log('=== VAPID 키가 생성되었습니다 ===\n');
console.log('아래 내용을 .env.local 파일에 추가하세요:\n');
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log(`VAPID_SUBJECT=mailto:admin@tokomonggo.com\n`);
console.log('=================================');
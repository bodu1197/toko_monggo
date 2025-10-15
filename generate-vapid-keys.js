// VAPID 키 생성 스크립트
// 이 스크립트는 한 번만 실행하면 됩니다.

const crypto = require('crypto');

// VAPID 키 쌍 생성
function generateVAPIDKeys() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: 'prime256v1',
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });

  // Base64 URL-safe 인코딩으로 변환
  const publicKeyBase64 = Buffer.from(publicKey)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  const privateKeyBase64 = Buffer.from(privateKey)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return {
    publicKey: publicKeyBase64,
    privateKey: privateKeyBase64
  };
}

// web-push 라이브러리가 있다면 더 간단한 방법
try {
  const webpush = require('web-push');
  const vapidKeys = webpush.generateVAPIDKeys();

  console.log('=== VAPID 키가 생성되었습니다 ===\n');
  console.log('아래 내용을 .env.local 파일에 추가하세요:\n');
  console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
  console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
  console.log(`VAPID_SUBJECT=mailto:admin@tokomonggo.com\n`);

} catch (error) {
  // web-push가 설치되지 않은 경우 수동 생성
  console.log('web-push 패키지가 없습니다. 설치하려면 다음 명령어를 실행하세요:');
  console.log('npm install web-push\n');
  console.log('또는 아래의 온라인 도구를 사용하세요:');
  console.log('https://vapidkeys.com/');
  console.log('https://web-push-codelab.glitch.me/');
}
/**
 * 이미지 압축 유틸리티
 * 업로드 전에 클라이언트에서 이미지를 자동으로 압축합니다
 */

/**
 * 이미지 파일을 압축합니다
 * @param {File} file - 원본 이미지 파일
 * @param {Object} options - 압축 옵션
 * @returns {Promise<File>} - 압축된 이미지 파일
 */
export async function compressImage(file, options = {}) {
  const {
    maxWidth = 1200,        // 최대 너비
    maxHeight = 1200,       // 최대 높이
    quality = 0.8,          // 품질 (0.0 ~ 1.0)
    maxSizeMB = 1,          // 최대 파일 크기 (MB)
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        // Canvas 생성
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // 비율 유지하면서 리사이즈 계산
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;

        // 이미지 그리기 (품질 향상을 위한 설정)
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Canvas를 Blob으로 변환
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('이미지 압축 실패'));
              return;
            }

            // 파일 크기 확인
            const sizeMB = blob.size / (1024 * 1024);

            if (sizeMB > maxSizeMB && quality > 0.1) {
              // 파일이 여전히 크면 품질을 낮춰서 재시도
              const newQuality = quality * (maxSizeMB / sizeMB) * 0.9;
              compressImage(file, { ...options, quality: newQuality })
                .then(resolve)
                .catch(reject);
              return;
            }

            // 압축된 파일 생성
            const compressedFile = new File(
              [blob],
              file.name.replace(/\.[^.]+$/, '.jpg'), // 확장자를 jpg로 변경
              {
                type: 'image/jpeg',
                lastModified: Date.now(),
              }
            );

            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => {
        reject(new Error('이미지 로드 실패'));
      };

      img.src = e.target.result;
    };

    reader.onerror = () => {
      reject(new Error('파일 읽기 실패'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * 여러 이미지 파일을 압축합니다
 * @param {File[]} files - 이미지 파일 배열
 * @param {Object} options - 압축 옵션
 * @returns {Promise<File[]>} - 압축된 이미지 파일 배열
 */
export async function compressImages(files, options = {}) {
  const compressionPromises = files.map(file =>
    compressImage(file, options).catch(error => {
      console.error(`이미지 압축 실패: ${file.name}`, error);
      return file; // 압축 실패 시 원본 반환
    })
  );

  return Promise.all(compressionPromises);
}

/**
 * 파일이 이미지인지 확인합니다
 * @param {File} file - 확인할 파일
 * @returns {boolean}
 */
export function isImageFile(file) {
  return file && file.type.startsWith('image/');
}

/**
 * 파일 크기를 사람이 읽기 쉬운 형식으로 변환합니다
 * @param {number} bytes - 바이트 크기
 * @returns {string}
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

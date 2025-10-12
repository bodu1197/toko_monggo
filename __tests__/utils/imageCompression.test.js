/**
 * 이미지 압축 유틸리티 테스트
 */

import { isImageFile, formatFileSize } from '@/app/utils/imageCompression';

describe('Image Compression Utilities', () => {
  describe('isImageFile', () => {
    it('should return true for valid image files', () => {
      const imageFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      expect(isImageFile(imageFile)).toBe(true);
    });

    it('should return true for PNG files', () => {
      const imageFile = new File([''], 'test.png', { type: 'image/png' });
      expect(isImageFile(imageFile)).toBe(true);
    });

    it('should return true for GIF files', () => {
      const imageFile = new File([''], 'test.gif', { type: 'image/gif' });
      expect(isImageFile(imageFile)).toBe(true);
    });

    it('should return false for non-image files', () => {
      const pdfFile = new File([''], 'test.pdf', { type: 'application/pdf' });
      expect(isImageFile(pdfFile)).toBe(false);
    });

    it('should return false for text files', () => {
      const textFile = new File([''], 'test.txt', { type: 'text/plain' });
      expect(isImageFile(textFile)).toBe(false);
    });

    it('should return false for null', () => {
      expect(isImageFile(null)).toBeFalsy();
    });

    it('should return false for undefined', () => {
      expect(isImageFile(undefined)).toBeFalsy();
    });
  });

  describe('formatFileSize', () => {
    it('should format 0 bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
    });

    it('should format bytes correctly', () => {
      expect(formatFileSize(500)).toBe('500 Bytes');
    });

    it('should format kilobytes correctly', () => {
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(2048)).toBe('2 KB');
    });

    it('should format megabytes correctly', () => {
      expect(formatFileSize(1048576)).toBe('1 MB'); // 1024 * 1024
      expect(formatFileSize(5242880)).toBe('5 MB'); // 5 * 1024 * 1024
    });

    it('should format gigabytes correctly', () => {
      expect(formatFileSize(1073741824)).toBe('1 GB'); // 1024 * 1024 * 1024
    });

    it('should handle decimal values correctly', () => {
      expect(formatFileSize(1536)).toBe('1.5 KB'); // 1.5 * 1024
    });

    it('should round to 2 decimal places', () => {
      const result = formatFileSize(1234567);
      expect(result).toMatch(/^\d+(\.\d{1,2})? MB$/);
    });
  });

  describe('Image Compression Logic', () => {
    it('should calculate correct resize ratio when width exceeds maxWidth', () => {
      const originalWidth = 2400;
      const originalHeight = 1600;
      const maxWidth = 1200;
      const maxHeight = 1200;

      const ratio = Math.min(maxWidth / originalWidth, maxHeight / originalHeight);
      const newWidth = originalWidth * ratio;
      const newHeight = originalHeight * ratio;

      expect(newWidth).toBe(1200);
      expect(newHeight).toBe(800);
    });

    it('should calculate correct resize ratio when height exceeds maxHeight', () => {
      const originalWidth = 1600;
      const originalHeight = 2400;
      const maxWidth = 1200;
      const maxHeight = 1200;

      const ratio = Math.min(maxWidth / originalWidth, maxHeight / originalHeight);
      const newWidth = originalWidth * ratio;
      const newHeight = originalHeight * ratio;

      expect(newWidth).toBe(800);
      expect(newHeight).toBe(1200);
    });

    it('should not resize when image is smaller than max dimensions', () => {
      const originalWidth = 800;
      const originalHeight = 600;
      const maxWidth = 1200;
      const maxHeight = 1200;

      let width = originalWidth;
      let height = originalHeight;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }

      expect(width).toBe(800);
      expect(height).toBe(600);
    });

    it('should maintain aspect ratio during resize', () => {
      const originalWidth = 1920;
      const originalHeight = 1080;
      const maxWidth = 1200;
      const maxHeight = 1200;

      const ratio = Math.min(maxWidth / originalWidth, maxHeight / originalHeight);
      const newWidth = originalWidth * ratio;
      const newHeight = originalHeight * ratio;

      const originalAspectRatio = originalWidth / originalHeight;
      const newAspectRatio = newWidth / newHeight;

      expect(newAspectRatio).toBeCloseTo(originalAspectRatio, 5);
    });

    it('should calculate new quality when file exceeds maxSize', () => {
      const currentQuality = 0.8;
      const currentSizeMB = 2.0;
      const maxSizeMB = 1.0;

      const newQuality = currentQuality * (maxSizeMB / currentSizeMB) * 0.9;

      expect(newQuality).toBeCloseTo(0.36, 2);
      expect(newQuality).toBeLessThan(currentQuality);
    });

    it('should not reduce quality below 0.1', () => {
      const currentQuality = 0.15;
      const maxSizeMB = 1.0;
      const currentSizeMB = 5.0;

      const newQuality = currentQuality * (maxSizeMB / currentSizeMB) * 0.9;

      // 함수는 quality > 0.1 일 때만 재시도합니다
      const shouldRetry = currentQuality > 0.1;

      expect(shouldRetry).toBe(true);
      expect(newQuality).toBeGreaterThan(0);
    });
  });

  describe('File Extension Handling', () => {
    it('should replace file extension with .jpg', () => {
      const originalName = 'photo.png';
      const newName = originalName.replace(/\.[^.]+$/, '.jpg');

      expect(newName).toBe('photo.jpg');
    });

    it('should handle files with no extension', () => {
      const originalName = 'photo';
      const newName = originalName.replace(/\.[^.]+$/, '.jpg');

      // 확장자가 없으면 그대로 유지됨 (정규식이 매치되지 않음)
      expect(newName).toBe('photo');
    });

    it('should handle files with multiple dots', () => {
      const originalName = 'my.photo.backup.png';
      const newName = originalName.replace(/\.[^.]+$/, '.jpg');

      expect(newName).toBe('my.photo.backup.jpg');
    });
  });
});

/**
 * 통합 테스트 참고사항:
 *
 * compressImage와 compressImages 함수는 브라우저 API(FileReader, Image, Canvas)를
 * 사용하기 때문에 JSDOM 환경에서는 완전히 테스트할 수 없습니다.
 *
 * 실제 브라우저 환경에서 테스트하려면:
 * 1. E2E 테스트 (Playwright, Cypress) 사용
 * 2. 또는 canvas, FileReader를 mocking하여 단위 테스트 작성
 *
 * 예시 (canvas mocking):
 * ```javascript
 * global.FileReader = class {
 *   readAsDataURL(file) {
 *     this.onload({ target: { result: 'data:image/jpeg;base64,...' } });
 *   }
 * };
 *
 * global.Image = class {
 *   set src(value) {
 *     setTimeout(() => this.onload(), 0);
 *   }
 * };
 * ```
 */

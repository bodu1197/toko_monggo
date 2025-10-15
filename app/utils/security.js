/**
 * Security utility functions for input validation and sanitization
 */

/**
 * Sanitize string input to prevent XSS attacks
 * @param {string} input - User input string
 * @returns {string} - Sanitized string
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') return '';

  // Remove HTML tags and script elements
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();
}

/**
 * Sanitize SQL LIKE query to prevent SQL injection
 * @param {string} query - Search query
 * @returns {string} - Sanitized query
 */
export function sanitizeLikeQuery(query) {
  if (typeof query !== 'string') return '';

  // Escape special characters in LIKE queries: % _ \
  return query
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_')
    .replace(/'/g, "''")
    .trim()
    .substring(0, 100); // Limit length
}

/**
 * Validate email format
 * @param {string} email - Email address
 * @returns {boolean} - Is valid email
 */
export function isValidEmail(email) {
  if (typeof email !== 'string') return false;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

/**
 * Validate password strength
 * @param {string} password - Password
 * @returns {Object} - Validation result with isValid and message
 */
export function validatePassword(password) {
  if (typeof password !== 'string') {
    return { isValid: false, message: 'Password harus berupa teks' };
  }

  if (password.length < 8) {
    return { isValid: false, message: 'Password minimal 8 karakter' };
  }

  if (password.length > 128) {
    return { isValid: false, message: 'Password maksimal 128 karakter' };
  }

  // Check for at least one letter and one number
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  if (!hasLetter || !hasNumber) {
    return {
      isValid: false,
      message: 'Password harus mengandung huruf dan angka'
    };
  }

  return { isValid: true, message: '' };
}

/**
 * Validate integer input
 * @param {any} value - Value to validate
 * @param {number} min - Minimum value (optional)
 * @param {number} max - Maximum value (optional)
 * @returns {boolean} - Is valid integer
 */
export function isValidInteger(value, min = null, max = null) {
  const num = parseInt(value, 10);

  if (isNaN(num) || num !== Number(value)) {
    return false;
  }

  if (min !== null && num < min) return false;
  if (max !== null && num > max) return false;

  return true;
}

/**
 * Validate price input
 * @param {any} price - Price value
 * @returns {boolean} - Is valid price
 */
export function isValidPrice(price) {
  return isValidInteger(price, 0, 999999999999);
}

/**
 * Validate UUID format
 * @param {string} uuid - UUID string
 * @returns {boolean} - Is valid UUID
 */
export function isValidUUID(uuid) {
  if (typeof uuid !== 'string') return false;

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Sanitize error message for user display
 * @param {Error|string} error - Error object or message
 * @returns {string} - Safe error message
 */
export function getSafeErrorMessage(error) {
  // Never expose internal error details to users
  const errorMsg = error?.message || error || '';

  // Check for common Supabase/database errors
  if (errorMsg.includes('duplicate key') || errorMsg.includes('unique constraint')) {
    return 'Data sudah ada dalam sistem';
  }

  if (errorMsg.includes('foreign key') || errorMsg.includes('violates')) {
    return 'Operasi tidak valid';
  }

  if (errorMsg.includes('permission') || errorMsg.includes('denied') || errorMsg.includes('not authorized')) {
    return 'Akses ditolak';
  }

  if (errorMsg.includes('not found') || errorMsg.includes('does not exist')) {
    return 'Data tidak ditemukan';
  }

  if (errorMsg.includes('timeout') || errorMsg.includes('timed out')) {
    return 'Koneksi timeout. Silakan coba lagi';
  }

  if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
    return 'Kesalahan jaringan. Periksa koneksi internet Anda';
  }

  // Default generic message
  return 'Terjadi kesalahan. Silakan coba lagi';
}

/**
 * Rate limiter for client-side operations
 */
class RateLimiter {
  constructor() {
    this.attempts = new Map();
  }

  /**
   * Check if action is allowed
   * @param {string} key - Unique key for the action (e.g., user ID + action name)
   * @param {number} maxAttempts - Maximum attempts allowed
   * @param {number} windowMs - Time window in milliseconds
   * @returns {boolean} - Is action allowed
   */
  isAllowed(key, maxAttempts = 5, windowMs = 60000) {
    const now = Date.now();
    const record = this.attempts.get(key);

    if (!record) {
      this.attempts.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }

    // Reset if window expired
    if (now > record.resetAt) {
      this.attempts.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }

    // Increment count
    record.count++;

    // Check if exceeded
    if (record.count > maxAttempts) {
      return false;
    }

    return true;
  }

  /**
   * Reset rate limit for a key
   * @param {string} key - Key to reset
   */
  reset(key) {
    this.attempts.delete(key);
  }

  /**
   * Get remaining time until reset
   * @param {string} key - Key to check
   * @returns {number} - Milliseconds until reset
   */
  getResetTime(key) {
    const record = this.attempts.get(key);
    if (!record) return 0;

    const now = Date.now();
    return Math.max(0, record.resetAt - now);
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter();

/**
 * Validate file upload
 * @param {File} file - File object
 * @param {Object} options - Validation options
 * @returns {Object} - Validation result
 */
export function validateFileUpload(file, options = {}) {
  const {
    maxSizeMB = 5,
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'],
    allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp']
  } = options;

  if (!file) {
    return { isValid: false, message: 'File tidak ditemukan' };
  }

  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      isValid: false,
      message: `Ukuran file maksimal ${maxSizeMB}MB`
    };
  }

  // Check MIME type
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      message: `Tipe file tidak didukung. Gunakan: ${allowedTypes.join(', ')}`
    };
  }

  // Check file extension
  const fileName = file.name.toLowerCase();
  const hasValidExtension = allowedExtensions.some(ext =>
    fileName.endsWith(ext)
  );

  if (!hasValidExtension) {
    return {
      isValid: false,
      message: `Ekstensi file tidak valid. Gunakan: ${allowedExtensions.join(', ')}`
    };
  }

  return { isValid: true, message: '' };
}

/**
 * Generate secure random string
 * @param {number} length - Length of string
 * @returns {string} - Random string
 */
export function generateSecureToken(length = 32) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';

  // Use crypto API if available
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const randomValues = new Uint8Array(length);
    window.crypto.getRandomValues(randomValues);

    for (let i = 0; i < length; i++) {
      result += chars[randomValues[i] % chars.length];
    }
  } else {
    // Fallback to Math.random (less secure)
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
  }

  return result;
}

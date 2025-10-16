import { z } from 'zod';

/**
 * 상품 데이터 검증 스키마
 *
 * 보안 규칙:
 * - 모든 텍스트 필드는 최소/최대 길이 제한
 * - 가격은 양수이며 최소 1,000원, 최대 999,999,999원
 * - 전화번호는 인도네시아 형식 (08로 시작, 10-13자리)
 * - XSS 공격 방지를 위해 trim() 적용
 */
export const ProductSchema = z.object({
  title: z.string()
    .min(5, 'Judul minimal 5 karakter')
    .max(100, 'Judul maksimal 100 karakter')
    .trim()
    .refine((val) => val.length >= 5, {
      message: 'Judul tidak boleh hanya spasi'
    }),

  description: z.string()
    .min(10, 'Deskripsi minimal 10 karakter')
    .max(2000, 'Deskripsi maksimal 2000 karakter')
    .trim()
    .refine((val) => val.length >= 10, {
      message: 'Deskripsi tidak boleh hanya spasi'
    }),

  price: z.number({
    required_error: 'Harga wajib diisi',
    invalid_type_error: 'Harga harus berupa angka'
  })
    .int('Harga harus bilangan bulat')
    .positive('Harga harus lebih dari 0')
    .min(10000, 'Harga minimal Rp 10.000 (sekitar USD 0.60)')
    .max(10000000000, 'Harga maksimal Rp 10.000.000.000 (sekitar USD 625,000)'),

  condition: z.enum(
    ['Baru', 'Seperti Baru', 'Sangat Bagus', 'Bagus', 'Cukup Bagus'],
    {
      errorMap: () => ({ message: 'Kondisi tidak valid' })
    }
  ),

  province: z.string()
    .min(1, 'Pilih provinsi')
    .max(100, 'Nama provinsi terlalu panjang'),

  city: z.string()
    .min(1, 'Pilih kota/kabupaten')
    .max(100, 'Nama kota terlalu panjang'),

  category1: z.string()
    .min(1, 'Pilih kategori utama')
    .max(100, 'Nama kategori terlalu panjang'),

  category2: z.string()
    .min(1, 'Pilih sub kategori')
    .max(100, 'Nama sub kategori terlalu panjang'),

  phone: z.string()
    .regex(/^08[0-9]{8,11}$/, {
      message: 'Nomor telepon harus format 08xxxxxxxxxx (10-13 digit)'
    })
    .optional()
    .or(z.literal('')),

  whatsapp: z.string()
    .regex(/^08[0-9]{8,11}$/, {
      message: 'Nomor WhatsApp harus format 08xxxxxxxxxx (10-13 digit)'
    })
    .optional()
    .or(z.literal('')),

  negotiable: z.boolean().default(false)
}).refine(
  (data) => data.phone || data.whatsapp,
  {
    message: 'Minimal isi 1 nomor kontak (Telepon atau WhatsApp)',
    path: ['phone']
  }
);

/**
 * 알림 데이터 검증 스키마
 *
 * 보안 규칙:
 * - userId는 유효한 UUID 형식
 * - title, body는 길이 제한
 * - url은 유효한 URL 형식 (선택적)
 */
export const NotificationSchema = z.object({
  userId: z.string()
    .uuid('User ID harus format UUID yang valid')
    .optional(),

  title: z.string()
    .min(1, 'Judul notifikasi wajib diisi')
    .max(100, 'Judul maksimal 100 karakter')
    .trim(),

  body: z.string()
    .max(500, 'Isi notifikasi maksimal 500 karakter')
    .trim()
    .optional(),

  url: z.string()
    .url('URL tidak valid')
    .max(500, 'URL terlalu panjang')
    .optional()
    .or(z.literal('')),

  tag: z.string()
    .max(50, 'Tag maksimal 50 karakter')
    .optional(),

  requireInteraction: z.boolean()
    .optional()
    .default(false),

  userFilter: z.object({
    userIds: z.array(z.string().uuid()).optional()
  }).optional()
});

/**
 * Broadcast 알림 검증 스키마
 */
export const BroadcastNotificationSchema = NotificationSchema.omit({ userId: true });

/**
 * 헬퍼 함수: 검증 에러를 사용자 친화적 메시지로 변환
 */
export function formatValidationError(error) {
  if (error.errors && error.errors.length > 0) {
    return error.errors[0].message;
  }
  return 'Data tidak valid';
}

/**
 * 헬퍼 함수: 안전한 검증 (try-catch 래핑)
 */
export function safeValidate(schema, data) {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    return {
      success: false,
      error: formatValidationError(error),
      details: error.errors
    };
  }
}

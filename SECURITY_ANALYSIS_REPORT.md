# 🔐 보안 및 논리 분석 보고서

**프로젝트:** Toko Monggo (soriplay)
**분석 일자:** 2025-10-15
**분석 범위:** 전체 애플리케이션 로직 및 보안
**분석자:** Claude Code AI

---

## 📋 Executive Summary

Tailwind CSS v4 전환 작업 완료 후 전체 애플리케이션의 기능 로직과 보안을 분석한 결과, **15개의 보안 취약점 및 논리 오류**가 발견되었습니다.

### 심각도 분류
- **Critical (치명적):** 3개 - 즉시 수정 필요
- **High (높음):** 4개 - 1주일 내 수정 권장
- **Medium (중간):** 5개 - 1개월 내 수정 권장
- **Low (낮음):** 3개 - 기술 부채, 선택적 수정

### 주요 위험 영역
1. 권한 및 인증 (Authorization & Authentication) - 6개 이슈
2. 데이터 무결성 (Data Integrity) - 4개 이슈
3. 입력 검증 (Input Validation) - 3개 이슈
4. 세션 관리 (Session Management) - 2개 이슈

---

## 🚨 CRITICAL - 즉시 수정 필요

### 1. 관리자 권한 우회 (Admin Authorization Bypass)

**파일:** `app/admin/page.jsx`
**위치:** Lines 814-840, 184-199
**심각도:** ⚠️⚠️⚠️ CRITICAL

#### 문제 설명
```javascript
// Line 816: 클라이언트에서만 권한 체크
if (user && profile?.role === 'admin') {
  setIsAuthorized(true);
  // ... 관리자 데이터 로드
}
```

#### 취약점
- ❌ 클라이언트 측에서만 권한 검증
- ❌ 브라우저 개발자 도구로 우회 가능
- ❌ 서버 측 RPC 함수에 권한 검증 없음:
  - `get_all_users_with_email` (line 100)
  - `move_user_products_to_trash` (line 503)
  - 관리자 제품 삭제 (line 338)
  - 사용자 정지/삭제 (lines 440, 518)
- ❌ 브라우저 콘솔에서 직접 RPC 호출 가능

#### 공격 시나리오
```javascript
// 공격자가 브라우저 콘솔에서 실행 가능:
const { data } = await supabase.rpc('get_all_users_with_email');
// → 모든 사용자의 이메일 주소 탈취 성공!
```

#### 영향
- 🔴 무단 사용자가 **모든 사용자 데이터** (이메일 포함) 접근 가능
- 🔴 **임의 사용자 계정 삭제** 가능
- 🔴 **사용자 정지/활성화** 가능
- 🔴 **모든 제품 삭제/수정** 가능
- 🔴 **관리자 통계 및 신고 내역** 접근 가능

#### 수정 방안

**1. Supabase RLS (Row Level Security) 정책 추가**
```sql
-- profiles 테이블에 관리자 전용 정책
CREATE POLICY "Only admins can view all users"
ON profiles FOR SELECT
TO authenticated
USING (
  -- 자신의 프로필은 누구나 볼 수 있음
  id = auth.uid()
  OR
  -- 관리자만 모든 프로필 조회 가능
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- products 테이블에 관리자 삭제 권한
CREATE POLICY "Admins can delete any product"
ON products FOR DELETE
TO authenticated
USING (
  user_id = auth.uid() -- 본인 제품
  OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
```

**2. RPC 함수에 권한 검증 추가**
```sql
CREATE OR REPLACE FUNCTION get_all_users_with_email()
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  role TEXT,
  created_at TIMESTAMPTZ
)
SECURITY DEFINER -- 함수가 소유자 권한으로 실행
LANGUAGE plpgsql
AS $$
BEGIN
  -- 호출자가 관리자인지 확인
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  -- 데이터 반환
  RETURN QUERY
  SELECT
    p.id,
    u.email,
    p.full_name,
    p.role,
    p.created_at
  FROM profiles p
  JOIN auth.users u ON u.id = p.id
  ORDER BY p.created_at DESC;
END;
$$;
```

**3. 클라이언트 측 추가 검증 (방어적 프로그래밍)**
```javascript
const fetchUsers = async () => {
  try {
    // 클라이언트 측에서도 한 번 더 체크
    if (!user || profile?.role !== 'admin') {
      setError('관리자 권한이 필요합니다.');
      router.push('/');
      return;
    }

    const { data, error } = await supabase.rpc('get_all_users_with_email');

    if (error) {
      // 권한 오류인 경우
      if (error.message.includes('Unauthorized')) {
        alert('관리자 권한이 없습니다.');
        router.push('/');
        return;
      }
      throw error;
    }

    setUsers(data || []);
  } catch (error) {
    console.error('Error fetching users:', error);
    setError('사용자 목록을 불러올 수 없습니다.');
  }
};
```

---

### 2. 제품 수정 권한 우회 (Product Edit Authorization Bypass)

**파일:** `app/products/[id]/edit/page.jsx`
**위치:** Lines 183-199
**심각도:** ⚠️⚠️⚠️ CRITICAL

#### 문제 설명
```javascript
// Lines 183-199: 클라이언트에서만 권한 체크
const isAdmin = profileData?.role === 'admin';
const isOwner = productData.user_id === user.id;

if (!isOwner && !isAdmin) {
  alert('Anda tidak memiliki izin untuk mengedit produk ini');
  router.push('/');
  return;
}
```

#### 취약점
- ❌ 클라이언트에서만 소유권 검증
- ❌ 서버 측 RLS 정책 없음
- ❌ Supabase API 직접 호출 시 우회 가능
- ❌ 브라우저 콘솔, Postman 등으로 우회 가능

#### 공격 시나리오
```javascript
// 공격자가 브라우저 콘솔에서 실행:
await supabase
  .from('products')
  .update({
    price: 1,  // 가격을 1원으로 변경
    title: '해킹됨',
    description: '이 제품은 해킹되었습니다'
  })
  .eq('id', '타인의-제품-ID');
// → 성공! 타인의 제품 수정됨
```

#### 영향
- 🔴 **모든 제품의 가격 조작** 가능
- 🔴 **제품 정보 변경** (제목, 설명, 연락처)
- 🔴 **제품 이미지 삭제/교체** 가능
- 🔴 **대량 제품 변조** 공격 가능

#### 수정 방안

**1. Supabase RLS 정책 추가**
```sql
-- products 테이블 UPDATE 정책
CREATE POLICY "Users can only update their own products or admins can update any"
ON products FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  user_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- product_images 테이블도 동일하게 보호
CREATE POLICY "Users can only modify images of their own products"
ON product_images FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM products
    WHERE products.id = product_images.product_id
    AND (
      products.user_id = auth.uid()
      OR
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
      )
    )
  )
);
```

**2. 서버 측 검증 함수 생성**
```sql
-- 제품 소유권 확인 함수
CREATE OR REPLACE FUNCTION user_owns_product(product_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_owner BOOLEAN;
  is_admin BOOLEAN;
BEGIN
  -- 소유자인지 확인
  SELECT EXISTS(
    SELECT 1 FROM products
    WHERE id = product_id AND user_id = auth.uid()
  ) INTO is_owner;

  -- 관리자인지 확인
  SELECT EXISTS(
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  ) INTO is_admin;

  RETURN is_owner OR is_admin;
END;
$$;
```

---

### 3. 제품 삭제 권한 우회 - IDOR (Insecure Direct Object Reference)

**파일:** `app/profile/page.jsx`
**위치:** Lines 174-221
**심각도:** ⚠️⚠️⚠️ CRITICAL

#### 문제 설명
```javascript
const handleDeleteProduct = useCallback(async (productId) => {
  // ❌ 소유권 검증 없음!
  const { error: deleteError } = await supabaseClient
    .from('products')
    .delete()
    .eq('id', productId);

  // 누구나 아무 제품이나 삭제 가능!
```

#### 취약점
- ❌ 서버 측 소유권 검증 없음
- ❌ productId만 알면 누구나 삭제 가능
- ❌ Storage 이미지도 무단 삭제 가능
- ❌ `handleStatusChange`도 동일한 취약점 (line 223)

#### 공격 시나리오
```javascript
// 공격자가 다른 사용자의 제품 ID를 알아낸 후:
const victimProductIds = ['uuid-1', 'uuid-2', 'uuid-3', ...];

// 대량 삭제 공격
for (const id of victimProductIds) {
  await supabase.from('products').delete().eq('id', id);
}
// → 수백 개 제품 삭제 가능!
```

#### 영향
- 🔴 **타인의 제품 삭제** 가능
- 🔴 **대량 삭제 공격** (DoS) 가능
- 🔴 **Storage 공간 낭비** (삭제 후 재업로드 반복)
- 🔴 **비즈니스 손실** (판매자가 제품 잃음)

#### 수정 방안

**1. RLS 정책 추가**
```sql
-- products 삭제 정책
CREATE POLICY "Users can only delete their own products"
ON products FOR DELETE
TO authenticated
USING (
  user_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
```

**2. 클라이언트 측 추가 검증**
```javascript
const handleDeleteProduct = useCallback(async (productId) => {
  if (!confirm('Yakin ingin menghapus produk ini?')) return;

  try {
    // 1. 먼저 제품 소유권 확인
    const { data: product, error: fetchError } = await supabaseClient
      .from('products')
      .select('user_id, product_images(image_url)')
      .eq('id', productId)
      .single();

    if (fetchError) throw fetchError;

    // 2. 소유권 검증 (방어적 프로그래밍)
    if (product.user_id !== user.id) {
      alert('❌ 권한이 없습니다!');
      console.error('Unauthorized delete attempt:', {
        productId,
        userId: user.id,
        ownerId: product.user_id
      });
      return;
    }

    // 3. 삭제 진행 (RLS가 서버에서 다시 검증)
    const { error: deleteError } = await supabaseClient
      .from('products')
      .delete()
      .eq('id', productId);

    if (deleteError) {
      // 권한 오류 체크
      if (deleteError.code === 'PGRST301') {
        alert('❌ 삭제 권한이 없습니다.');
        return;
      }
      throw deleteError;
    }

    // 4. Storage 이미지 삭제
    const imagesToDelete = product.product_images || [];
    for (const img of imagesToDelete) {
      const urlParts = img.image_url.split('/product-images/');
      if (urlParts.length > 1) {
        await supabaseClient.storage
          .from('product-images')
          .remove([urlParts[1]]);
      }
    }

    // 5. UI 업데이트
    await fetchUserProducts(user.id);
    alert('✅ 제품이 삭제되었습니다.');

  } catch (error) {
    console.error('Error deleting product:', error);
    alert('❌ 제품 삭제 실패: ' + error.message);
  }
}, [supabaseClient, user, fetchUserProducts]);
```

---

## 🔴 HIGH PRIORITY - 1주일 내 수정

### 4. 비밀번호 재설정 토큰 검증 미흡

**파일:** `app/reset-password/page.jsx`
**위치:** Lines 19-38
**심각도:** 🔴 HIGH

#### 문제 설명
```javascript
const checkRecoveryToken = useCallback(async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    // ❌ 아무 세션이나 허용!
    if (error || !session) {
      setError('Link reset password tidak valid atau sudah kadaluarsa.');
      return;
    }

    setIsValidToken(true);
```

#### 취약점
- ❌ **recovery** 타입 세션인지 확인 안 함
- ❌ 이미 로그인된 사용자도 비밀번호 변경 가능
- ❌ 토큰 만료 시간 검증 안 함
- ❌ 여러 개 재설정 요청 시 Race Condition

#### 영향
- 🔴 탈취된 세션 쿠키로 비밀번호 변경 가능
- 🔴 이메일 인증 없이 비밀번호 변경 가능

#### 수정 방안
```javascript
const checkRecoveryToken = useCallback(async () => {
  try {
    // 1. URL에서 토큰 파라미터 추출
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');

    // 2. recovery 타입인지 확인
    if (type !== 'recovery') {
      setError('비밀번호 재설정 링크가 아닙니다.');
      setIsValidToken(false);
      return;
    }

    if (!accessToken || !refreshToken) {
      setError('유효하지 않은 재설정 링크입니다.');
      setIsValidToken(false);
      return;
    }

    // 3. 토큰으로 세션 설정
    const { data: { session }, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken
    });

    if (error || !session) {
      setError('링크가 만료되었거나 유효하지 않습니다.');
      setIsValidToken(false);
      return;
    }

    // 4. 토큰 만료 시간 확인
    const expiresAt = session.expires_at;
    if (expiresAt && new Date(expiresAt * 1000) < new Date()) {
      setError('링크가 만료되었습니다. 새로운 링크를 요청해주세요.');
      setIsValidToken(false);
      return;
    }

    setIsValidToken(true);
  } catch (error) {
    console.error('Token validation error:', error);
    setError('토큰 검증 중 오류가 발생했습니다.');
    setIsValidToken(false);
  }
}, [supabase]);
```

---

### 5. Race Condition - 제품 생성 트랜잭션 미처리

**파일:** `app/products/new/page.jsx`
**위치:** Lines 292-353
**심각도:** 🔴 HIGH

#### 문제 설명
```javascript
// 1. 제품 먼저 생성
const { data: product, error: productError } = await supabase
  .from('products')
  .insert([{ ... }])
  .select()
  .single();

if (productError) throw productError;

// 2. 이미지 업로드 (별도 프로세스)
for (let i = 0; i < imageFiles.length; i++) {
  const { error: uploadError } = await supabase.storage
    .from('product-images')
    .upload(filePath, file);

  // ❌ 업로드 실패 시 제품은 이미 생성됨!
  if (uploadError) {
    console.error('Image upload error:', uploadError);
    continue; // 그냥 계속 진행...
  }
}
```

#### 취약점
- ❌ 제품 생성과 이미지 업로드가 **원자적(atomic)이지 않음**
- ❌ 이미지 업로드 실패 시 **롤백 없음**
- ❌ **고아 레코드**(orphaned records) 생성 가능
- ❌ Storage와 Database 불일치

#### 영향
- 🔴 이미지 없는 제품이 DB에 남음
- 🔴 데이터베이스 레코드 없는 이미지가 Storage에 남음
- 🔴 Storage 공간 낭비
- 🔴 데이터 무결성 파괴

#### 수정 방안

**Option 1: 이미지 먼저 업로드 (권장)**
```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  if (!user) {
    alert('로그인이 필요합니다.');
    router.push('/login');
    return;
  }

  setSubmitting(true);
  let uploadedImages = [];

  try {
    // ===== STEP 1: 이미지 먼저 업로드 =====
    console.log('📤 Step 1: Uploading images to storage...');

    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      const fileExt = 'jpg';
      const timestamp = Date.now();
      const fileName = `${user.id}_${timestamp}_${i}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) {
        console.error('❌ Image upload failed:', uploadError);
        // 롤백: 지금까지 업로드한 이미지 삭제
        console.log('🔄 Rolling back uploaded images...');
        for (const img of uploadedImages) {
          await supabase.storage
            .from('product-images')
            .remove([img.filePath]);
        }
        throw new Error('이미지 업로드 실패: ' + uploadError.message);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      uploadedImages.push({
        filePath,  // 삭제용
        publicUrl,
        order: i
      });

      console.log(`✅ Uploaded ${i + 1}/${imageFiles.length}: ${fileName}`);
    }

    // ===== STEP 2: 데이터베이스에 제품 생성 =====
    console.log('💾 Step 2: Creating product in database...');

    // 데이터 준비
    const { data: provinceData } = await supabase
      .from('provinces')
      .select('province_id')
      .eq('province_name', formData.province)
      .single();

    const { data: regencyData } = await supabase
      .from('regencies')
      .select('regency_id, latitude, longitude')
      .eq('regency_name', formData.city)
      .eq('province_id', provinceData?.province_id)
      .single();

    const { data: categoryData } = await supabase
      .from('categories')
      .select('category_id')
      .eq('name', formData.category2)
      .eq('parent_category', formData.category1)
      .single();

    // 제품 삽입
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert([{
        user_id: user.id,
        title: formData.title,
        description: formData.description,
        price: parseInt(formData.price),
        condition: formData.condition,
        is_negotiable: formData.negotiable,
        province_id: provinceData?.province_id,
        regency_id: regencyData?.regency_id,
        category_id: categoryData?.category_id,
        latitude: regencyData?.latitude,
        longitude: regencyData?.longitude,
        phone_number: formData.phone || null,
        whatsapp_number: formData.whatsapp || null,
        status: 'active'
      }])
      .select()
      .single();

    if (productError) {
      console.error('❌ Product creation failed:', productError);
      // 롤백: 업로드한 이미지 삭제
      console.log('🔄 Rolling back uploaded images...');
      for (const img of uploadedImages) {
        await supabase.storage
          .from('product-images')
          .remove([img.filePath]);
      }
      throw productError;
    }

    console.log('✅ Product created:', product.id);

    // ===== STEP 3: 이미지 레코드 DB에 저장 =====
    console.log('🖼️ Step 3: Saving image records to database...');

    const imageRecords = uploadedImages.map((img) => ({
      product_id: product.id,
      image_url: img.publicUrl,
      order: img.order
    }));

    const { error: imagesError } = await supabase
      .from('product_images')
      .insert(imageRecords);

    if (imagesError) {
      console.error('❌ Image records creation failed:', imagesError);
      // 롤백: 제품 삭제 (CASCADE로 이미지 레코드도 삭제됨)
      await supabase.from('products').delete().eq('id', product.id);
      // 롤백: Storage 이미지 삭제
      for (const img of uploadedImages) {
        await supabase.storage
          .from('product-images')
          .remove([img.filePath]);
      }
      throw imagesError;
    }

    console.log('✅ All steps completed successfully!');

    // 성공 메시지 및 리다이렉트
    const goToMain = confirm(
      '제품이 성공적으로 등록되었습니다!\n\n' +
      'OK를 클릭하면 홈으로, Cancel을 클릭하면 내 프로필로 이동합니다.'
    );

    if (goToMain) {
      router.push('/');
    } else {
      router.push('/profile');
    }

  } catch (error) {
    console.error('❌ Error creating product:', error);
    alert('제품 등록 실패: ' + (error.message || 'Unknown error'));
  } finally {
    setSubmitting(false);
  }
};
```

**Option 2: Supabase Edge Function 사용 (더 안전)**
```sql
-- PostgreSQL Function으로 트랜잭션 보장
CREATE OR REPLACE FUNCTION create_product_with_images(
  product_data JSONB,
  image_urls JSONB
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  new_product_id UUID;
  img JSONB;
BEGIN
  -- 1. 제품 생성
  INSERT INTO products (
    user_id, title, description, price,
    condition, is_negotiable, province_id,
    regency_id, category_id, latitude, longitude,
    phone_number, whatsapp_number, status
  )
  VALUES (
    auth.uid(),
    (product_data->>'title')::TEXT,
    (product_data->>'description')::TEXT,
    (product_data->>'price')::INTEGER,
    (product_data->>'condition')::TEXT,
    (product_data->>'is_negotiable')::BOOLEAN,
    (product_data->>'province_id')::UUID,
    (product_data->>'regency_id')::UUID,
    (product_data->>'category_id')::UUID,
    (product_data->>'latitude')::NUMERIC,
    (product_data->>'longitude')::NUMERIC,
    (product_data->>'phone_number')::TEXT,
    (product_data->>'whatsapp_number')::TEXT,
    'active'
  )
  RETURNING id INTO new_product_id;

  -- 2. 이미지 레코드 생성
  FOR img IN SELECT * FROM jsonb_array_elements(image_urls)
  LOOP
    INSERT INTO product_images (product_id, image_url, "order")
    VALUES (
      new_product_id,
      (img->>'image_url')::TEXT,
      (img->>'order')::INTEGER
    );
  END LOOP;

  RETURN new_product_id;

EXCEPTION
  WHEN OTHERS THEN
    -- 에러 발생 시 자동 롤백
    RAISE;
END;
$$;
```

---

### 6. SQL Injection 취약점 (ILIKE 쿼리)

**파일:** `app/products/new/page.jsx`, `app/products/[id]/edit/page.jsx`
**위치:** Lines 268, 274 (new), Lines 371-382 (edit)
**심각도:** 🔴 HIGH

#### 문제 설명
```javascript
// Line 268
const { data: provinceData } = await supabase
  .from('provinces')
  .select('province_id')
  .ilike('province_name', formData.province) // ❌ 사용자 입력 직접 사용!
  .single();

// Line 274
const { data: regencyData } = await supabase
  .from('regencies')
  .select('regency_id')
  .ilike('regency_name', formData.city) // ❌ 사용자 입력 직접 사용!
```

#### 취약점
- ❌ `.ilike()`에 사용자 입력 직접 사용
- ❌ PostgreSQL ILIKE에서 `%`, `_` 특수 문자 이스케이프 안 됨
- ❌ 의도하지 않은 레코드 매칭 가능

#### 공격 시나리오
```javascript
// 사용자가 province 필드에 입력:
formData.province = "%"; // 모든 지역 매칭

// 또는
formData.city = "Jakarta%"; // Jakarta로 시작하는 모든 도시 매칭
```

#### 영향
- 🔴 잘못된 지역 데이터 저장
- 🔴 데이터 무결성 파괴
- 🔴 패턴 기반 공격 가능

#### 수정 방안
```javascript
// Option 1: .eq() 사용 (정확한 매칭)
const { data: provinceData, error: provinceError } = await supabase
  .from('provinces')
  .select('province_id')
  .eq('province_name', formData.province.trim()) // 정확히 일치
  .single();

if (provinceError || !provinceData) {
  alert('선택한 지역을 찾을 수 없습니다.');
  return;
}

// Option 2: 특수 문자 이스케이프 (ilike 사용 시)
const sanitizeForIlike = (str) => {
  // %, _, \ 문자를 이스케이프
  return str.replace(/[%_\\]/g, '\\$&');
};

const { data: regencyData } = await supabase
  .from('regencies')
  .select('regency_id, latitude, longitude')
  .ilike('regency_name', sanitizeForIlike(formData.city))
  .eq('province_id', provinceData.province_id)
  .single();
```

---

### 7. 입력 검증 부족

**파일:** Multiple files
**위치:** `app/signup/page.jsx`, `app/products/new/page.jsx`
**심각도:** 🔴 HIGH

#### 문제 7-1: 비밀번호 정책 미흡

**파일:** `app/signup/page.jsx`
**위치:** Lines 44-48

```javascript
// 너무 약한 비밀번호 정책
if (formData.password.length < 8) {
  setError('Kata sandi minimal 8 karakter!');
  return;
}
// ❌ 특수문자, 숫자, 대문자 확인 없음
```

**수정:**
```javascript
const validatePassword = (password) => {
  const errors = [];

  if (password.length < 8) {
    errors.push('최소 8자 이상');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('대문자 1개 이상');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('소문자 1개 이상');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('숫자 1개 이상');
  }
  if (!/[!@#$%^&*]/.test(password)) {
    errors.push('특수문자 1개 이상 (!@#$%^&*)');
  }

  return errors;
};

// 사용
const passwordErrors = validatePassword(formData.password);
if (passwordErrors.length > 0) {
  setError('비밀번호 요구사항: ' + passwordErrors.join(', '));
  return;
}
```

#### 문제 7-2: 가격 검증 미흡

**파일:** `app/products/new/page.jsx`
**위치:** Line 299

```javascript
price: parseInt(formData.price), // ❌ NaN, 음수, 0 가능
```

**수정:**
```javascript
// 가격 검증
const validatePrice = (priceString) => {
  const price = parseInt(priceString);

  if (isNaN(price)) {
    throw new Error('가격은 숫자여야 합니다.');
  }

  if (price < 1000) {
    throw new Error('최소 가격은 Rp 1.000입니다.');
  }

  if (price > 1000000000) { // 10억
    throw new Error('최대 가격은 Rp 1.000.000.000입니다.');
  }

  return price;
};

// 사용
const validatedPrice = validatePrice(formData.price);
```

#### 문제 7-3: 전화번호 검증 미흡

**파일:** `app/products/new/page.jsx`
**위치:** Lines 305-306

```javascript
phone_number: formData.phone || null, // ❌ HTML pattern만 있음, 서버 검증 없음
whatsapp_number: formData.whatsapp || null,
```

**수정:**
```javascript
const validatePhoneNumber = (phone) => {
  if (!phone) return null; // 선택 사항

  // 숫자만 추출
  const cleaned = phone.replace(/\D/g, '');

  // 길이 확인
  if (cleaned.length < 10 || cleaned.length > 13) {
    throw new Error('전화번호는 10-13자리여야 합니다.');
  }

  // 0으로 시작하는지 확인
  if (!cleaned.startsWith('0')) {
    throw new Error('전화번호는 0으로 시작해야 합니다.');
  }

  return cleaned;
};

// 사용
const phone = validatePhoneNumber(formData.phone);
const whatsapp = validatePhoneNumber(formData.whatsapp);

// 최소 하나는 있어야 함
if (!phone && !whatsapp) {
  throw new Error('전화번호 또는 WhatsApp 번호 중 하나는 필수입니다.');
}
```

#### 문제 7-4: XSS 취약점 (제품 설명)

**파일:** `app/products/new/page.jsx`
**위치:** Lines 297-298

```javascript
title: formData.title,
description: formData.description, // ❌ HTML/Script 필터링 없음
```

**수정:**
```javascript
// XSS 방지 함수
const sanitizeInput = (input) => {
  // HTML 태그 제거
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();
};

// 또는 DOMPurify 라이브러리 사용
import DOMPurify from 'isomorphic-dompurify';

const sanitizedTitle = DOMPurify.sanitize(formData.title);
const sanitizedDescription = DOMPurify.sanitize(formData.description);
```

---

## 🟡 MEDIUM PRIORITY - 1개월 내 수정

### 8. 세션 하이재킹 위험

**파일:** `app/login/page.jsx`
**위치:** Lines 42-70
**심각도:** 🟡 MEDIUM

#### 문제
```javascript
const handleGoogleLogin = async () => {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`, // ❌ 클라이언트에서 제어
      },
    });
```

#### 취약점
- ❌ PKCE (Proof Key for Code Exchange) 미설정
- ❌ State 파라미터 없음 (CSRF 방어 없음)
- ❌ localStorage에 토큰 저장 (XSS 취약)

#### 수정 방안
```javascript
// Supabase 클라이언트 생성 시 보안 옵션 추가
const supabase = createBrowserClient(url, key, {
  auth: {
    storage: window.localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce', // ⭐ PKCE 활성화
  }
});

// OAuth 리다이렉트 URL을 환경 변수로 관리
const redirectTo = process.env.NEXT_PUBLIC_APP_URL + '/';
```

---

### 9. 관리자 페이지 정보 노출

**파일:** `app/admin/page.jsx`
**위치:** Lines 99-123
**심각도:** 🟡 MEDIUM

#### 문제
```javascript
// 모든 사용자를 한 번에 로드
const { data, error } = await supabase.rpc('get_all_users_with_email');
setUsers(data || []); // ❌ 페이지네이션 없음
```

#### 취약점
- ❌ 모든 사용자 데이터를 한 번에 로드
- ❌ 페이지네이션 없음
- ❌ 사용자 이메일 전체 노출
- ❌ Rate limiting 없음
- ❌ 감사 로그 없음

#### 영향
- 🟡 관리자 계정 탈취 시 모든 이메일 유출
- 🟡 대량 사용자 시 성능 저하
- 🟡 GDPR 위반 가능성

#### 수정 방안
```sql
-- 페이지네이션된 사용자 조회 함수
CREATE OR REPLACE FUNCTION get_users_paginated(
  page_number INTEGER DEFAULT 1,
  page_size INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  role TEXT,
  created_at TIMESTAMPTZ,
  total_count BIGINT
)
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  offset_value INTEGER;
BEGIN
  -- 관리자 권한 확인
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- 감사 로그 기록
  INSERT INTO admin_audit_log (admin_id, action, timestamp)
  VALUES (auth.uid(), 'view_users', NOW());

  -- 오프셋 계산
  offset_value := (page_number - 1) * page_size;

  -- 데이터 반환
  RETURN QUERY
  SELECT
    p.id,
    u.email,
    p.full_name,
    p.role,
    p.created_at,
    COUNT(*) OVER() AS total_count
  FROM profiles p
  JOIN auth.users u ON u.id = p.id
  ORDER BY p.created_at DESC
  LIMIT page_size
  OFFSET offset_value;
END;
$$;
```

```javascript
// 클라이언트 측 페이지네이션
const [currentPage, setCurrentPage] = useState(1);
const [totalPages, setTotalPages] = useState(1);
const PAGE_SIZE = 50;

const fetchUsers = async (page = 1) => {
  try {
    const { data, error } = await supabase
      .rpc('get_users_paginated', {
        page_number: page,
        page_size: PAGE_SIZE
      });

    if (error) throw error;

    if (data && data.length > 0) {
      setUsers(data);
      const totalCount = data[0].total_count;
      setTotalPages(Math.ceil(totalCount / PAGE_SIZE));
    }
  } catch (error) {
    console.error('Error fetching users:', error);
  }
};
```

---

### 10. 검증되지 않은 리다이렉트 (Open Redirect)

**파일:** `app/login/page.jsx`
**위치:** Lines 31-32
**심각도:** 🟡 MEDIUM

#### 문제
```javascript
if (data?.user) {
  router.push('/'); // ❌ 항상 홈으로만 이동
  router.refresh();
}
```

#### 취약점
- ❌ returnTo URL 지원 없음
- ❌ 사용자 경험 저하
- ❌ OAuth redirectTo가 클라이언트 제어

#### 수정 방안
```javascript
// URL 검증 함수
const isValidReturnUrl = (url) => {
  if (!url) return false;

  try {
    const urlObj = new URL(url, window.location.origin);
    // 같은 origin만 허용
    return urlObj.origin === window.location.origin;
  } catch {
    return false;
  }
};

// 로그인 페이지 로드 시 returnTo 저장
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const returnTo = params.get('returnTo');

  if (returnTo && isValidReturnUrl(returnTo)) {
    sessionStorage.setItem('returnTo', returnTo);
  }
}, []);

// 로그인 성공 후
if (data?.user) {
  const returnTo = sessionStorage.getItem('returnTo');
  sessionStorage.removeItem('returnTo');

  const redirectUrl = isValidReturnUrl(returnTo) ? returnTo : '/';
  router.push(redirectUrl);
  router.refresh();
}
```

---

### 11. CSRF 보호 없음

**파일:** All forms
**심각도:** 🟡 MEDIUM

#### 문제
- 모든 폼에 CSRF 토큰 없음
- Supabase API 호출에 CSRF 방어 없음

#### 수정 방안
```javascript
// 민감한 작업에 확인 대화상자 추가
const handleDeleteProduct = async (productId) => {
  // CSRF 방어: 명시적 확인
  const confirmText = prompt(
    '정말 삭제하시겠습니까?\n' +
    '확인하려면 "삭제"를 입력하세요.'
  );

  if (confirmText !== '삭제') {
    return;
  }

  // 삭제 진행...
};

// 또는 Supabase Edge Functions에서 Origin 헤더 검증
// edge-function/delete-product/index.ts
export async function handler(req: Request) {
  const origin = req.headers.get('origin');
  const allowedOrigin = Deno.env.get('APP_URL');

  if (origin !== allowedOrigin) {
    return new Response('Invalid origin', { status: 403 });
  }

  // 삭제 로직...
}
```

---

### 12. 이미지 업로드 취약점

**파일:** `app/products/new/page.jsx`
**위치:** Lines 181-219
**심각도:** 🟡 MEDIUM

#### 문제
```javascript
const handleImageUpload = async (e) => {
  const files = Array.from(e.target.files);

  const compressedFiles = await compressImages(files, {
    maxWidth: 1200,
    maxHeight: 1200,
    quality: 0.8,
    maxSizeMB: 1,
  });
  // ❌ 파일 타입 검증 없음
  // ❌ 파일명 검증 없음
  // ❌ 악성 파일 검사 없음
```

#### 취약점
- ❌ HTML accept 속성만으로 검증 (우회 가능)
- ❌ 서버 측 파일 타입 검증 없음
- ❌ SVG 파일의 JavaScript 포함 가능 (XSS)
- ❌ 파일명 검증 없음 (경로 순회 공격)

#### 수정 방안
```javascript
// 파일 검증 함수
const validateImageFile = async (file) => {
  // 1. 파일 타입 검사
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('JPEG, PNG, WebP 파일만 업로드 가능합니다.');
  }

  // 2. 파일 크기 검사
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    throw new Error('파일 크기는 5MB 이하여야 합니다.');
  }

  // 3. 파일 시그니처 검사 (Magic Bytes)
  const isValidImage = await checkFileSignature(file);
  if (!isValidImage) {
    throw new Error('유효한 이미지 파일이 아닙니다.');
  }

  // 4. 파일명 검증
  const filename = file.name;
  if (!/^[a-zA-Z0-9_.-]+$/.test(filename)) {
    throw new Error('파일명에 특수문자가 포함될 수 없습니다.');
  }

  return true;
};

// Magic Bytes 확인
const checkFileSignature = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = (e) => {
      const arr = new Uint8Array(e.target.result).subarray(0, 4);
      let header = '';
      for (let i = 0; i < arr.length; i++) {
        header += arr[i].toString(16);
      }

      // JPEG: ffd8ff
      // PNG: 89504e47
      // WebP: 52494646
      const validHeaders = ['ffd8ff', '89504e47', '52494646'];
      const isValid = validHeaders.some(h => header.startsWith(h));
      resolve(isValid);
    };
    reader.readAsArrayBuffer(file.slice(0, 4));
  });
};

// 사용
const handleImageUpload = async (e) => {
  const files = Array.from(e.target.files);

  // 각 파일 검증
  for (const file of files) {
    try {
      await validateImageFile(file);
    } catch (error) {
      alert(error.message);
      return;
    }
  }

  // 압축 및 업로드
  const compressedFiles = await compressImages(files, {
    maxWidth: 1200,
    maxHeight: 1200,
    quality: 0.8,
    maxSizeMB: 1,
  });

  // ...
};
```

**Supabase Storage Bucket 정책 설정:**
```sql
-- Storage 버킷 정책
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = 'products'
  AND (
    -- JPEG
    (storage.extension(name) = 'jpg' OR storage.extension(name) = 'jpeg')
    OR
    -- PNG
    storage.extension(name) = 'png'
    OR
    -- WebP
    storage.extension(name) = 'webp'
  )
);
```

---

## 🔵 LOW PRIORITY - 선택적 개선

### 13. 에러 메시지 정보 노출

**파일:** Multiple files
**심각도:** 🔵 LOW

#### 문제
```javascript
catch (error) {
  console.error('Login error:', error);
  setError(error.message || 'Email atau kata sandi salah');
}
```

#### 수정
```javascript
catch (error) {
  // 개발 환경에서만 상세 로그
  if (process.env.NODE_ENV === 'development') {
    console.error('Login error:', error);
  }

  // 사용자에게는 일반적인 메시지만
  setError('이메일 또는 비밀번호가 올바르지 않습니다.');

  // 서버로 에러 로그 전송 (모니터링)
  logErrorToServer({
    type: 'login_error',
    message: error.message,
    userId: user?.id,
    timestamp: new Date().toISOString()
  });
}
```

---

### 14. Rate Limiting 없음

**파일:** All API calls
**심각도:** 🔵 LOW

#### 문제
- 로그인 시도 제한 없음
- 제품 생성 제한 없음
- 검색 API 제한 없음

#### 수정 방안

**Supabase Edge Function으로 Rate Limiting:**
```typescript
// edge-functions/rate-limit-middleware.ts
import { createClient } from '@supabase/supabase-js';

const rateLimits = new Map<string, { count: number; resetTime: number }>();

export async function checkRateLimit(
  userId: string,
  action: string,
  maxRequests: number,
  windowMs: number
): Promise<boolean> {
  const key = `${userId}:${action}`;
  const now = Date.now();

  const limit = rateLimits.get(key);

  if (!limit || now > limit.resetTime) {
    // 새 윈도우 시작
    rateLimits.set(key, {
      count: 1,
      resetTime: now + windowMs
    });
    return true;
  }

  if (limit.count >= maxRequests) {
    // 제한 초과
    return false;
  }

  // 카운트 증가
  limit.count++;
  return true;
}
```

**사용 예시:**
```javascript
// 로그인 시도 제한
const handleSubmit = async (e) => {
  e.preventDefault();

  // Rate limit: 5회/분
  const allowed = await checkRateLimit(
    email,
    'login',
    5,
    60000
  );

  if (!allowed) {
    setError('로그인 시도 횟수를 초과했습니다. 1분 후 다시 시도해주세요.');
    return;
  }

  // 로그인 로직...
};
```

---

### 15. useEffect 메모리 누수 가능성

**파일:** `app/page.jsx`
**위치:** Lines 496-507
**심각도:** 🔵 LOW

#### 문제
```javascript
useEffect(() => {
  const timer = setTimeout(() => {
    if (searchQuery) {
      fetchAutocompleteSuggestions(searchQuery);
    }
  }, 300);

  return () => clearTimeout(timer);
}, [searchQuery, fetchAutocompleteSuggestions]);
// ❌ fetchAutocompleteSuggestions가 변경될 때마다 재실행
```

#### 수정
```javascript
// fetchAutocompleteSuggestions를 useCallback으로 메모이제이션
const fetchAutocompleteSuggestions = useCallback(async (query) => {
  // ... 로직
}, [supabase]); // 필요한 의존성만 포함

// 또는 의존성 배열에서 제거
useEffect(() => {
  const timer = setTimeout(() => {
    if (searchQuery) {
      fetchAutocompleteSuggestions(searchQuery);
    }
  }, 300);

  return () => clearTimeout(timer);
}, [searchQuery]); // fetchAutocompleteSuggestions 제거
```

---

## 📊 우선순위 요약

### 즉시 수정 (1-3일)
1. ⚠️⚠️⚠️ 관리자 권한 우회 → RLS 정책 추가
2. ⚠️⚠️⚠️ 제품 수정 권한 우회 → RLS 정책 추가
3. ⚠️⚠️⚠️ 제품 삭제 IDOR → RLS 정책 + 소유권 검증

### 1주일 내 수정
4. 🔴 비밀번호 재설정 토큰 검증
5. 🔴 제품 생성 Race Condition
6. 🔴 SQL Injection (ILIKE)
7. 🔴 입력 검증 강화

### 1개월 내 수정
8-12. 🟡 세션 보안, 페이지네이션, CSRF, 이미지 검증 등

### 선택적 개선
13-15. 🔵 에러 처리, Rate Limiting, 메모리 최적화

---

## 🛡️ 보안 체크리스트

프로덕션 배포 전 확인사항:

- [ ] **RLS 정책** 모든 테이블에 적용
- [ ] **관리자 함수** 권한 검증 추가
- [ ] **PKCE** OAuth 플로우에 활성화
- [ ] **입력 검증** 클라이언트 + 서버 양쪽
- [ ] **Rate Limiting** 주요 엔드포인트에 적용
- [ ] **에러 로깅** 프로덕션 모니터링 설정
- [ ] **HTTPS** 강제 (Next.js middleware)
- [ ] **CSP 헤더** 설정
- [ ] **감사 로그** 민감한 작업 기록

---

## 📞 연락처

이 보고서에 대한 질문이나 추가 정보가 필요하면 개발팀에 문의하세요.

**생성일:** 2025-10-15
**문서 버전:** 1.0
**다음 검토:** 수정 완료 후

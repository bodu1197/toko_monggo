-- 카테고리를 인도네시아어로 통일 (코드와 일치하도록)

-- 1. parent_category를 인도네시아어로 업데이트
UPDATE categories
SET parent_category = CASE parent_category
  WHEN 'Electronics' THEN 'Handphone & Gadget'
  WHEN 'Fashion' THEN 'Fashion'
  WHEN 'Home & Living' THEN 'Rumah & Taman'
  WHEN 'Hobbies' THEN 'Hobi & Olahraga'
  ELSE parent_category
END
WHERE parent_category IN ('Electronics', 'Fashion', 'Home & Living', 'Hobbies');

-- 확인 쿼리
SELECT category_id, name, parent_category, icon
FROM categories
ORDER BY category_id;

-- Add only NEW categories that don't exist in DB
-- Categories.js has these main categories that are missing from DB:
-- Elektronik, Mobil, Motor, Keperluan Pribadi, Perlengkapan Bayi & Anak,
-- Buku & Edukasi, Kantor & Industri, Properti, Jasa & Lowongan Kerja,
-- Barang Gratis, Lainnya

-- First, let's add missing subcategories for existing parent categories

-- Additional Handphone & Gadget subcategories
INSERT INTO categories (name, parent_category, icon, created_at) VALUES
('Smartwatch', 'Handphone & Gadget', '⌚', NOW()),
('Aksesoris Handphone', 'Handphone & Gadget', '📱', NOW()),
('Power Bank', 'Handphone & Gadget', '🔋', NOW())
ON CONFLICT (name) DO NOTHING;

-- Additional Fashion subcategories
INSERT INTO categories (name, parent_category, icon, created_at) VALUES
('Sepatu Pria', 'Fashion', '👞', NOW()),
('Sepatu Wanita', 'Fashion', '👠', NOW()),
('Tas & Dompet', 'Fashion', '👜', NOW()),
('Aksesoris Fashion', 'Fashion', '👗', NOW()),
('Jam Tangan', 'Fashion', '⌚', NOW())
ON CONFLICT (name) DO NOTHING;

-- Additional Rumah & Taman subcategories
INSERT INTO categories (name, parent_category, icon, created_at) VALUES
('Dekorasi Rumah', 'Rumah & Taman', '🖼️', NOW()),
('Perlengkapan Dapur', 'Rumah & Taman', '🍳', NOW()),
('Peralatan Kebun', 'Rumah & Taman', '🌱', NOW()),
('Lampu & Penerangan', 'Rumah & Taman', '💡', NOW())
ON CONFLICT (name) DO NOTHING;

-- Additional Hobi & Olahraga subcategories
INSERT INTO categories (name, parent_category, icon, created_at) VALUES
('Alat Olahraga', 'Hobi & Olahraga', '⚽', NOW()),
('Sepeda', 'Hobi & Olahraga', '🚴', NOW()),
('Camping & Hiking', 'Hobi & Olahraga', '⛺', NOW()),
('Musik & Instrumen', 'Hobi & Olahraga', '🎸', NOW()),
('Mainan & Game', 'Hobi & Olahraga', '🎮', NOW())
ON CONFLICT (name) DO NOTHING;

-- NEW: Elektronik main category and subcategories
INSERT INTO categories (name, parent_category, icon, created_at) VALUES
('TV & Audio', 'Elektronik', '📺', NOW()),
('Komputer & Laptop', 'Elektronik', '💻', NOW()),
('Kamera', 'Elektronik', '📷', NOW()),
('Video Games & Konsol', 'Elektronik', '🎮', NOW()),
('Aksesoris Elektronik', 'Elektronik', '🔌', NOW())
ON CONFLICT (name) DO NOTHING;

-- NEW: Mobil main category and subcategories
INSERT INTO categories (name, parent_category, icon, created_at) VALUES
('Mobil Bekas', 'Mobil', '🚗', NOW()),
('Aksesoris Mobil', 'Mobil', '🔧', NOW()),
('Audio Mobil', 'Mobil', '🔊', NOW()),
('Spare Part Mobil', 'Mobil', '⚙️', NOW()),
('Velg & Ban', 'Mobil', '🛞', NOW())
ON CONFLICT (name) DO NOTHING;

-- NEW: Motor main category and subcategories
INSERT INTO categories (name, parent_category, icon, created_at) VALUES
('Motor Bekas', 'Motor', '🏍️', NOW()),
('Aksesoris Motor', 'Motor', '🔧', NOW()),
('Spare Part Motor', 'Motor', '⚙️', NOW()),
('Helm', 'Motor', '🪖', NOW()),
('Apparel Motor', 'Motor', '🧥', NOW())
ON CONFLICT (name) DO NOTHING;

-- NEW: Keperluan Pribadi main category and subcategories
INSERT INTO categories (name, parent_category, icon, created_at) VALUES
('Kecantikan', 'Keperluan Pribadi', '💄', NOW()),
('Makanan & Minuman', 'Keperluan Pribadi', '🍔', NOW()),
('Perlengkapan Ibadah', 'Keperluan Pribadi', '🕌', NOW())
ON CONFLICT (name) DO NOTHING;

-- NEW: Perlengkapan Bayi & Anak main category and subcategories
INSERT INTO categories (name, parent_category, icon, created_at) VALUES
('Pakaian Bayi & Anak', 'Perlengkapan Bayi & Anak', '👶', NOW()),
('Mainan Anak', 'Perlengkapan Bayi & Anak', '🧸', NOW()),
('Perlengkapan Makan', 'Perlengkapan Bayi & Anak', '🍼', NOW()),
('Stroller & Car Seat', 'Perlengkapan Bayi & Anak', '🍼', NOW()),
('Perlengkapan Ibu', 'Perlengkapan Bayi & Anak', '👩', NOW())
ON CONFLICT (name) DO NOTHING;

-- NEW: Buku & Edukasi main category and subcategories
INSERT INTO categories (name, parent_category, icon, created_at) VALUES
('Buku Fiksi', 'Buku & Edukasi', '📚', NOW()),
('Buku Non-Fiksi', 'Buku & Edukasi', '📖', NOW()),
('Buku Pelajaran', 'Buku & Edukasi', '📓', NOW()),
('Majalah', 'Buku & Edukasi', '📰', NOW()),
('Komik', 'Buku & Edukasi', '📕', NOW()),
('Alat Tulis', 'Buku & Edukasi', '✏️', NOW())
ON CONFLICT (name) DO NOTHING;

-- NEW: Kantor & Industri main category and subcategories
INSERT INTO categories (name, parent_category, icon, created_at) VALUES
('Perlengkapan Kantor', 'Kantor & Industri', '🏭', NOW()),
('Alat Berat', 'Kantor & Industri', '🚜', NOW()),
('Mesin & Peralatan', 'Kantor & Industri', '⚙️', NOW()),
('Bahan Bangunan', 'Kantor & Industri', '🧱', NOW())
ON CONFLICT (name) DO NOTHING;

-- NEW: Properti main category and subcategories
INSERT INTO categories (name, parent_category, icon, created_at) VALUES
('Rumah Dijual', 'Properti', '🏢', NOW()),
('Apartemen Dijual', 'Properti', '🏬', NOW()),
('Tanah Dijual', 'Properti', '🏞️', NOW()),
('Rumah Disewa', 'Properti', '🏘️', NOW()),
('Apartemen Disewa', 'Properti', '🏙️', NOW()),
('Kost', 'Properti', '🏠', NOW())
ON CONFLICT (name) DO NOTHING;

-- NEW: Jasa & Lowongan Kerja main category and subcategories
INSERT INTO categories (name, parent_category, icon, created_at) VALUES
('Jasa Perbaikan', 'Jasa & Lowongan Kerja', '💼', NOW()),
('Jasa Kebersihan', 'Jasa & Lowongan Kerja', '🧹', NOW()),
('Jasa Event', 'Jasa & Lowongan Kerja', '🎉', NOW()),
('Lowongan Kerja Full Time', 'Jasa & Lowongan Kerja', '💼', NOW()),
('Lowongan Kerja Part Time', 'Jasa & Lowongan Kerja', '⏰', NOW())
ON CONFLICT (name) DO NOTHING;

-- NEW: Barang Gratis main category
INSERT INTO categories (name, parent_category, icon, created_at) VALUES
('Barang Gratis', 'Barang Gratis', '🎁', NOW())
ON CONFLICT (name) DO NOTHING;

-- NEW: Lainnya main category
INSERT INTO categories (name, parent_category, icon, created_at) VALUES
('Lainnya', 'Lainnya', '📦', NOW())
ON CONFLICT (name) DO NOTHING;

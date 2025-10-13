// 영어-인도네시아어 카테고리 매핑 (DB 호환성)
export const CATEGORY_NAME_MAP = {
  // 영어 -> 인도네시아어
  'Electronics': 'Elektronik',
  'Phones & Gadgets': 'Handphone & Gadget',
  'Fashion': 'Fashion',
  'Home & Garden': 'Rumah & Taman',
  'Cars': 'Mobil',
  'Motorcycles': 'Motor',
  'Hobbies & Sports': 'Hobi & Olahraga',
  'Personal Care': 'Keperluan Pribadi',
  'Baby & Kids': 'Perlengkapan Bayi & Anak',
  'Books & Education': 'Buku & Edukasi',
  'Office & Industrial': 'Kantor & Industri',
  'Property': 'Properti',
  'Services & Jobs': 'Jasa & Lowongan Kerja',
  'Free Stuff': 'Barang Gratis',
  'Other': 'Lainnya'
};

// 인도네시아 상품 카테고리 데이터
export const CATEGORIES = {
  'Elektronik': {
    icon: '💻',
    subcategories: ['TV & Audio', 'Komputer & Laptop', 'Kamera', 'Video Games & Konsol', 'Aksesoris Elektronik']
  },
  'Handphone & Gadget': {
    icon: '📱',
    subcategories: ['Handphone', 'Laptop & Komputer', 'Kamera', 'Audio & Headphone', 'Tablet & iPad']
  },
  'Fashion': {
    icon: '👕',
    subcategories: ['Pakaian Pria', 'Pakaian Wanita', 'Sepatu Pria', 'Sepatu Wanita', 'Tas & Dompet', 'Aksesoris Fashion', 'Jam Tangan']
  },
  'Rumah & Taman': {
    icon: '🏠',
    subcategories: ['Furniture', 'Dekorasi Rumah', 'Perlengkapan Dapur', 'Peralatan Kebun', 'Lampu & Penerangan']
  },
  'Mobil': {
    icon: '🚗',
    subcategories: ['Mobil Bekas', 'Aksesoris Mobil', 'Audio Mobil', 'Spare Part Mobil', 'Velg & Ban']
  },
  'Motor': {
    icon: '🏍️',
    subcategories: ['Motor Bekas', 'Aksesoris Motor', 'Spare Part Motor', 'Helm', 'Apparel Motor']
  },
  'Hobi & Olahraga': {
    icon: '⚽',
    subcategories: ['Alat Olahraga', 'Sepeda', 'Camping & Hiking', 'Koleksi', 'Musik & Instrumen', 'Mainan & Game']
  },
  'Keperluan Pribadi': {
    icon: '🛍️',
    subcategories: ['Kecantikan', 'Kesehatan', 'Makanan & Minuman', 'Perlengkapan Ibadah']
  },
  'Perlengkapan Bayi & Anak': {
    icon: '👶',
    subcategories: ['Pakaian Bayi & Anak', 'Mainan Anak', 'Perlengkapan Makan', 'Stroller & Car Seat', 'Perlengkapan Ibu']
  },
  'Buku & Edukasi': {
    icon: '📚',
    subcategories: ['Buku Fiksi', 'Buku Non-Fiksi', 'Buku Pelajaran', 'Majalah', 'Komik', 'Alat Tulis']
  },
  'Kantor & Industri': {
    icon: '🏭',
    subcategories: ['Perlengkapan Kantor', 'Alat Berat', 'Mesin & Peralatan', 'Bahan Bangunan']
  },
  'Properti': {
    icon: '🏢',
    subcategories: ['Rumah Dijual', 'Apartemen Dijual', 'Tanah Dijual', 'Rumah Disewa', 'Apartemen Disewa', 'Kost']
  },
  'Jasa & Lowongan Kerja': {
    icon: '💼',
    subcategories: ['Jasa Perbaikan', 'Jasa Kebersihan', 'Jasa Event', 'Lowongan Kerja Full Time', 'Lowongan Kerja Part Time']
  },
  'Barang Gratis': {
    icon: '🎁',
    subcategories: ['Barang Gratis']
  },
  'Lainnya': {
    icon: '📦',
    subcategories: ['Lainnya']
  }
};

// Get category icon
export const getCategoryIcon = (categoryName) => {
  return CATEGORIES[categoryName]?.icon || '📦';
};

// Get all main categories
export const getMainCategories = () => {
  return Object.keys(CATEGORIES);
};

// Get subcategories for a main category
export const getSubcategories = (mainCategory) => {
  // 영어 이름이면 인도네시아어로 변환
  const mappedCategory = CATEGORY_NAME_MAP[mainCategory] || mainCategory;
  return CATEGORIES[mappedCategory]?.subcategories || [];
};

// Normalize category name (영어 -> 인도네시아어 변환)
export const normalizeCategoryName = (categoryName) => {
  return CATEGORY_NAME_MAP[categoryName] || categoryName;
};

/**
 * 카테고리 데이터 및 유틸리티 테스트
 */

import {
  CATEGORIES,
  getCategoryIcon,
  getMainCategories,
  getSubcategories
} from '@/app/data/categories';

describe('Categories Data and Utilities', () => {
  describe('CATEGORIES constant', () => {
    it('should have all expected main categories', () => {
      const expectedCategories = [
        'Elektronik',
        'Handphone & Gadget',
        'Fashion',
        'Rumah & Taman',
        'Mobil',
        'Motor',
        'Hobi & Olahraga',
        'Keperluan Pribadi',
        'Perlengkapan Bayi & Anak',
        'Buku & Edukasi',
        'Kantor & Industri',
        'Properti',
        'Jasa & Lowongan Kerja',
        'Barang Gratis',
        'Lainnya'
      ];

      const actualCategories = Object.keys(CATEGORIES);
      expect(actualCategories).toEqual(expectedCategories);
    });

    it('should have icon for each category', () => {
      Object.entries(CATEGORIES).forEach(([name, data]) => {
        expect(data.icon).toBeDefined();
        expect(typeof data.icon).toBe('string');
        expect(data.icon.length).toBeGreaterThan(0);
      });
    });

    it('should have subcategories array for each category', () => {
      Object.entries(CATEGORIES).forEach(([name, data]) => {
        expect(Array.isArray(data.subcategories)).toBe(true);
        expect(data.subcategories.length).toBeGreaterThan(0);
      });
    });

    it('should have valid subcategory data', () => {
      Object.entries(CATEGORIES).forEach(([name, data]) => {
        data.subcategories.forEach(subcategory => {
          expect(typeof subcategory).toBe('string');
          expect(subcategory.length).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('getCategoryIcon', () => {
    it('should return correct icon for existing category', () => {
      expect(getCategoryIcon('Elektronik')).toBe('💻');
      expect(getCategoryIcon('Handphone & Gadget')).toBe('📱');
      expect(getCategoryIcon('Fashion')).toBe('👕');
      expect(getCategoryIcon('Motor')).toBe('🏍️');
    });

    it('should return default icon for non-existing category', () => {
      expect(getCategoryIcon('NonExistentCategory')).toBe('📦');
    });

    it('should return default icon for null', () => {
      expect(getCategoryIcon(null)).toBe('📦');
    });

    it('should return default icon for undefined', () => {
      expect(getCategoryIcon(undefined)).toBe('📦');
    });

    it('should return default icon for empty string', () => {
      expect(getCategoryIcon('')).toBe('📦');
    });
  });

  describe('getMainCategories', () => {
    it('should return array of category names', () => {
      const categories = getMainCategories();
      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBeGreaterThan(0);
    });

    it('should return correct number of categories', () => {
      const categories = getMainCategories();
      expect(categories.length).toBe(15);
    });

    it('should include specific categories', () => {
      const categories = getMainCategories();
      expect(categories).toContain('Elektronik');
      expect(categories).toContain('Fashion');
      expect(categories).toContain('Properti');
    });

    it('should not modify original CATEGORIES object', () => {
      const beforeKeys = Object.keys(CATEGORIES);
      const result = getMainCategories();
      const afterKeys = Object.keys(CATEGORIES);

      expect(beforeKeys).toEqual(afterKeys);
    });
  });

  describe('getSubcategories', () => {
    it('should return subcategories for existing category', () => {
      const subcategories = getSubcategories('Elektronik');
      expect(Array.isArray(subcategories)).toBe(true);
      expect(subcategories).toContain('TV & Audio');
      expect(subcategories).toContain('Komputer & Laptop');
    });

    it('should return correct subcategories for Handphone & Gadget', () => {
      const subcategories = getSubcategories('Handphone & Gadget');
      expect(subcategories).toContain('Handphone');
      expect(subcategories).toContain('Tablet');
      expect(subcategories).toContain('Smartwatch');
    });

    it('should return subcategories for Fashion', () => {
      const subcategories = getSubcategories('Fashion');
      expect(subcategories).toContain('Pakaian Pria');
      expect(subcategories).toContain('Pakaian Wanita');
      expect(subcategories).toContain('Tas & Dompet');
    });

    it('should return empty array for non-existing category', () => {
      const subcategories = getSubcategories('NonExistentCategory');
      expect(Array.isArray(subcategories)).toBe(true);
      expect(subcategories.length).toBe(0);
    });

    it('should return empty array for null', () => {
      const subcategories = getSubcategories(null);
      expect(subcategories).toEqual([]);
    });

    it('should return empty array for undefined', () => {
      const subcategories = getSubcategories(undefined);
      expect(subcategories).toEqual([]);
    });

    it('should have at least one subcategory for Barang Gratis', () => {
      const subcategories = getSubcategories('Barang Gratis');
      expect(subcategories.length).toBeGreaterThan(0);
      expect(subcategories).toContain('Barang Gratis');
    });
  });

  describe('Category Structure Validation', () => {
    it('should have consistent structure for all categories', () => {
      Object.entries(CATEGORIES).forEach(([name, data]) => {
        expect(data).toHaveProperty('icon');
        expect(data).toHaveProperty('subcategories');
        expect(typeof data.icon).toBe('string');
        expect(Array.isArray(data.subcategories)).toBe(true);
      });
    });

    it('should not have duplicate subcategories within a category', () => {
      Object.entries(CATEGORIES).forEach(([name, data]) => {
        const subcategories = data.subcategories;
        const uniqueSubcategories = [...new Set(subcategories)];
        expect(subcategories.length).toBe(uniqueSubcategories.length);
      });
    });

    it('should have reasonable number of subcategories per category', () => {
      Object.entries(CATEGORIES).forEach(([name, data]) => {
        expect(data.subcategories.length).toBeGreaterThan(0);
        expect(data.subcategories.length).toBeLessThanOrEqual(10);
      });
    });
  });

  describe('Integration with Real Use Cases', () => {
    it('should support product categorization workflow', () => {
      // 1. 사용자가 메인 카테고리 선택
      const mainCategories = getMainCategories();
      expect(mainCategories.length).toBeGreaterThan(0);

      // 2. 선택한 카테고리의 아이콘 표시
      const icon = getCategoryIcon(mainCategories[0]);
      expect(icon).toBeDefined();

      // 3. 해당 카테고리의 서브카테고리 표시
      const subcategories = getSubcategories(mainCategories[0]);
      expect(subcategories.length).toBeGreaterThan(0);
    });

    it('should handle Elektronik category complete workflow', () => {
      const categoryName = 'Elektronik';

      // Get icon
      const icon = getCategoryIcon(categoryName);
      expect(icon).toBe('💻');

      // Get subcategories
      const subcategories = getSubcategories(categoryName);
      expect(subcategories).toContain('TV & Audio');
      expect(subcategories).toContain('Komputer & Laptop');
      expect(subcategories).toContain('Kamera');
    });

    it('should handle Motor category complete workflow', () => {
      const categoryName = 'Motor';

      const icon = getCategoryIcon(categoryName);
      expect(icon).toBe('🏍️');

      const subcategories = getSubcategories(categoryName);
      expect(subcategories).toContain('Motor Bekas');
      expect(subcategories).toContain('Aksesoris Motor');
      expect(subcategories).toContain('Helm');
    });
  });
});

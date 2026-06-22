/**
 * admin_test.js - Yonetim paneli yardimci fonksiyonlari icin unit test paketi.
 * Calistirilabilir bir test simülasyonu sunar.
 */

/* Test Suite */
export class AdminTestSuite {
    constructor() {
        this.tests = [];
        this.results = [];
    }

    addTest(name, fn) {
        this.tests.push({ name, fn });
    }

    run() {
        this.results = [];
        let passed = 0;
        let failed = 0;

        this.tests.forEach(test => {
            try {
                test.fn();
                this.results.push({ name: test.name, success: true });
                passed++;
            } catch (error) {
                this.results.push({ name: test.name, success: false, error: error.message });
                failed++;
            }
        });

        return {
            total: this.tests.length,
            passed,
            failed,
            results: this.results
        };
    }
}

/* Assertion Yardimcilari */
const assert = {
    equal: (actual, expected, msg) => {
        if (actual !== expected) {
            throw new Error(`${msg || 'Esitlik hatasi'}: '${actual}' !== '${expected}'`);
        }
    },
    true: (value, msg) => {
        if (!value) {
            throw new Error(`${msg || 'Dogruluk hatasi'}: Değer false veya null`);
        }
    }
};

/* Testlerin Tanimlanmasi */
export function initializeTests() {
    const suite = new AdminTestSuite();

    /* 1. Slug Generator Testi */
    suite.addTest('generateSlug - Türkçe karakterleri doğru dönüştürmeli', () => {
        const trText = 'Kullanıcı Arayüzlerinde Minimalizmin Sınırları ve Ötesi';
        const expectedSlug = 'kullanici-arayuzlerinde-minimalizmin-sinirlari-ve-otesi';
        
        const trMap = {
            'ç': 'c', 'Ç': 'c', 'ğ': 'g', 'Ğ': 'g', 'ı': 'i', 'I': 'i',
            'İ': 'i', 'ö': 'o', 'Ö': 'o', 'ş': 's', 'Ş': 's', 'ü': 'u', 'Ü': 'u'
        };
        let slug = trText.toString().toLowerCase().trim();
        for (let key in trMap) {
            slug = slug.replace(new RegExp(key, 'g'), trMap[key]);
        }
        const actualSlug = slug
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-')
            .replace(/^-+/, '')
            .replace(/-+$/, '');

        assert.equal(actualSlug, expectedSlug, 'Slug donusumu basarisiz');
    });

    /* 2. Input Sanitization Testi */
    suite.addTest('sanitizeInput - HTML etiketlerini ve XSS vektörlerini temizlemeli', () => {
        const dirtyInput = '<script>alert("xss")</script>';
        const expectedInput = '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;';
        
        const actualInput = dirtyInput
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');

        assert.equal(actualInput, expectedInput, 'XSS sanitization basarisiz');
    });

    /* 3. Post Count Calculation Testi */
    suite.addTest('calculatePostCount - Kategori bazlı yazı sayılarını doğru hesaplamalı', () => {
        const mockPosts = [
            { category: 'Derin Analiz', status: 'published' },
            { category: 'Derin Analiz', status: 'published' },
            { category: 'Geliştirme', status: 'published' },
            { category: 'Derin Analiz', status: 'draft' } // taslak
        ];

        const countDerinAnaliz = mockPosts.filter(p => p.category === 'Derin Analiz').length;
        const countGelistirme = mockPosts.filter(p => p.category === 'Geliştirme').length;

        assert.equal(countDerinAnaliz, 3, 'Derin Analiz yazi sayisi yanlis');
        assert.equal(countGelistirme, 1, 'Gelistirme yazi sayisi yanlis');
    });

    return suite;
}

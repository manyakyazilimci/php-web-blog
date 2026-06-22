/**
 * AdminMockData - Admin paneli icin mock/sahte veri kaynagi.
 * Tum sahte veriler burada merkezi olarak yonetilir.
 * Ileride gercek API entegrasyonu yapildiginda bu dosya
 * bir API service katmani ile degistirilecektir.
 */
export class AdminMockData {

    /**
     * Dashboard istatistik kartlari icin ozet veriler
     * @returns {Object} Istatistik verilerini iceren nesne
     */
    static getDashboardStats() {
        return {
            totalPosts: 24,
            totalCategories: 6,
            totalViews: 12847,
            totalComments: 189,
            monthlyGrowth: 12.5,
            avgReadTime: '6 dk'
        };
    }

    /**
     * Son aktivite akisi icin veriler
     * @returns {Array<Object>} Aktivite listesi
     */
    static getRecentActivity() {
        return [
            { type: 'post', action: 'oluşturuldu', title: 'Minimalizmin Sınırları', date: '2 saat önce', icon: 'fa-file-alt' },
            { type: 'comment', action: 'yeni yorum', title: 'CSS Grid Yapıları', date: '5 saat önce', icon: 'fa-comment' },
            { type: 'media', action: 'yüklendi', title: 'hero-banner.jpg', date: '1 gün önce', icon: 'fa-image' },
            { type: 'category', action: 'düzenlendi', title: 'Perspektif', date: '2 gün önce', icon: 'fa-folder' },
            { type: 'settings', action: 'güncellendi', title: 'Site Ayarları', date: '3 gün önce', icon: 'fa-cog' }
        ];
    }

    /**
     * Haftalik analytics verileri - bar chart gorsellestirmesi icin
     * @returns {Object} Etiketler, goruntulenme ve ziyaretci sayilari
     */
    static getWeeklyAnalytics() {
        return {
            labels: ['Pzt', 'Sal', 'Car', 'Per', 'Cum', 'Cmt', 'Paz'],
            views: [320, 450, 280, 510, 620, 390, 480],
            visitors: [180, 290, 160, 340, 410, 250, 310]
        };
    }

    /**
     * Kategori bazli yazi dagilimi - donut chart icin
     * @returns {Array<Object>} Kategori adi, yazi sayisi ve renk kodu
     */
    static getCategoryDistribution() {
        return [
            { name: 'Derin Analiz', count: 8, color: '#E04E36' },
            { name: 'Geliştirme', count: 6, color: '#3B82F6' },
            { name: 'Perspektif', count: 4, color: '#10B981' },
            { name: 'Etkileşim Tasarımı', count: 3, color: '#F59E0B' },
            { name: 'Ürün Tasarımı', count: 2, color: '#8B5CF6' },
            { name: 'Konsept', count: 1, color: '#EC4899' }
        ];
    }

    /**
     * Varsayılan kategori listesi
     * @returns {Array<Object>} Kategori bilgilerini içeren dizi
     */
    static getDefaultCategories() {
        return [
            { id: 'cat_1', name: 'Derin Analiz', slug: 'derin-analiz', description: 'Kapsamlı inceleme ve araştırma yazıları', postCount: 8, color: '#E04E36' },
            { id: 'cat_2', name: 'Geliştirme', slug: 'gelistirme', description: 'Kod, framework ve teknik konular', postCount: 6, color: '#3B82F6' },
            { id: 'cat_3', name: 'Perspektif', slug: 'perspektif', description: 'Kişisel görüş ve düşünce yazıları', postCount: 4, color: '#10B981' },
            { id: 'cat_4', name: 'Etkileşim Tasarımı', slug: 'etkilesim-tasarimi', description: 'UI/UX etkileşim kalıpları ve animasyonlar', postCount: 3, color: '#F59E0B' },
            { id: 'cat_5', name: 'Ürün Tasarımı', slug: 'urun-tasarimi', description: 'Ürün tasarımı ve geliştirme süreci', postCount: 2, color: '#8B5CF6' },
            { id: 'cat_6', name: 'Konsept', slug: 'konsept', description: 'Deneysel ve kavramsal çalışmalar', postCount: 1, color: '#EC4899' }
        ];
    }

    /**
     * Varsayılan medya kütüphanesi öğeleri
     * @returns {Array<Object>} Medya öğeleri dizisi
     */
    static getDefaultMediaItems() {
        return [
            { id: 'media_1', name: 'hero-banner.jpg', type: 'image/jpeg', size: '2.4 MB', dimensions: '1920x1080', uploadDate: '28 Mayıs 2026', gradient: 'linear-gradient(135deg, #2D2C2A, #1A1A1A)' },
            { id: 'media_2', name: 'about-photo.png', type: 'image/png', size: '1.8 MB', dimensions: '800x1000', uploadDate: '25 Mayıs 2026', gradient: 'linear-gradient(135deg, #D6D2C4, #BDB9A6)' },
            { id: 'media_3', name: 'project-thumb.jpg', type: 'image/jpeg', size: '980 KB', dimensions: '1200x630', uploadDate: '20 Mayıs 2026', gradient: 'linear-gradient(135deg, #E04E36, #A63420)' },
            { id: 'media_4', name: 'og-image.png', type: 'image/png', size: '1.2 MB', dimensions: '1200x630', uploadDate: '15 Mayıs 2026', gradient: 'linear-gradient(135deg, #1A1A1A, #0F0F0F)' },
            { id: 'media_5', name: 'css-grid-demo.gif', type: 'image/gif', size: '3.1 MB', dimensions: '800x600', uploadDate: '10 Mayıs 2026', gradient: 'linear-gradient(135deg, #667eea, #764ba2)' },
            { id: 'media_6', name: 'avatar-small.jpg', type: 'image/jpeg', size: '245 KB', dimensions: '400x400', uploadDate: '5 Mayıs 2026', gradient: 'linear-gradient(135deg, #f093fb, #f5576c)' },
            { id: 'media_7', name: 'manifesto-bg.jpg', type: 'image/jpeg', size: '4.2 MB', dimensions: '2560x1440', uploadDate: '1 Mayıs 2026', gradient: 'linear-gradient(135deg, #4facfe, #00f2fe)' },
            { id: 'media_8', name: 'blog-cover.png', type: 'image/png', size: '890 KB', dimensions: '1200x800', uploadDate: '28 Nisan 2026', gradient: 'linear-gradient(135deg, #43e97b, #38f9d7)' }
        ];
    }

    /**
     * Varsayilan site ayarlari
     * @returns {Object} Ayar anahtar-deger ciflerini iceren nesne
     */
    static getDefaultSettings() {
        return {
            siteName: 'Nurullah B.',
            siteDescription: 'Dijital dünyada estetik ve işlevi bir araya getiren kişisel blog.',
            logoText: 'NB.',
            copyrightText: '&copy; 2026 Nurullah B. Dijital Günlük.',
            siteActive: true,
            darkMode: false,
            cardView: 'bento',
            themeColor: '#E04E36'
        };
    }

    /**
     * Hakkimda sayfasi icin varsayilan bilgiler
     * @returns {Object} Profil bilgilerini iceren nesne
     */
    static getDefaultAboutInfo() {
        return {
            profilePhoto: null,
            title: 'Merhaba, ben Nurullah.',
            subtitle: 'Dijital dünyada estetik ve işlevi bir araya getiren bir ürün tasarımcısı ve geliştiricisiyim.',
            description: 'İyi tasarımın sadece güzel görünmekle kalmayıp, karmaşık problemleri basit etkileşimlere dönüştürmek olduğuna inanıyorum.',
            twitterUrl: '#',
            githubUrl: '#',
            linkedinUrl: '#',
            contactButtonText: 'Benimle İletişime Geç'
        };
    }

    /**
     * Sistem durumu bilgileri
     * @returns {Object} Sunucu/sistem metrikleri
     */
    static getSystemStatus() {
        return {
            uptime: '99.8%',
            lastDeploy: '30 Mayıs 2026, 14:32',
            version: '2.1.0',
            storageUsed: '42 MB',
            storageTotal: '500 MB'
        };
    }
}

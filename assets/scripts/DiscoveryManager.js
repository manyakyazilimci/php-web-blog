import { Project } from './Models.js';

/**
 * DiscoveryManager - Keşifler sayfasındaki projeleri arama ve filtreleme yöneticisi
 */
export class DiscoveryManager {
    constructor() {
        this.projects = [
            new Project('Nutgore Aura Etkisi', 'arayüz deneyi', '2026', 'WebGL kullanarak geliştirilen, kaydırma hareketine duyarlı 3D sıvı aura efekti. Performans optimizasyonları ve shader yazımı üzerine bir araştırma.'),
            new Project('Minimalist CSS Framework', 'açık kaynak', '2025', 'Sadece tipografi ve boşlukları (spacing) yöneten, 2KB boyutunda ultra hafif bir CSS başlangıç paketi.'),
            new Project('HR Yönetim Paneli', 'ürün tasarımı', '2025', 'Karmaşık veri setlerini anlaşılır hale getiren, bento-grid yapısına sahip kurumsal bir dashboard arayüz konsepti.'),
            new Project('Camın Arkasındaki Formlar', 'konsept', '2024', 'Glassmorphism akımının erişilebilirlik (a11y) standartlarına uygun olarak nasıl yorumlanabileceği üzerine bir UI kiti.')
        ];
        this.activeCategory = 'all';
        this.searchQuery = '';
    }

    bindEvents(container) {
        const searchInput = container.querySelector('#project-search');
        if (searchInput) {
            searchInput.value = this.searchQuery;
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.toLowerCase().trim();
                this.filterProjects(container);
            });
        }

        const filterButtons = container.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.activeCategory = btn.dataset.category;
                this.filterProjects(container);
            });
        });
    }

    filterProjects(container) {
        const grid = container.querySelector('.project-grid');
        if (!grid) return;

        const filtered = this.projects.filter(p => {
            const matchesCategory = this.activeCategory === 'all' || p.category === this.activeCategory;
            const matchesSearch = p.title.toLowerCase().includes(this.searchQuery) || 
                                  p.desc.toLowerCase().includes(this.searchQuery) ||
                                  p.category.toLowerCase().includes(this.searchQuery);
            return matchesCategory && matchesSearch;
        });

        grid.innerHTML = '';
        if (filtered.length === 0) {
            grid.innerHTML = '<div style="grid-column: span 2; text-align:center; padding: 4rem; color: var(--c-text-secondary);">Eşleşen proje bulunamadı.</div>';
            return;
        }

        filtered.forEach((p, idx) => {
            const article = document.createElement('article');
            article.className = `project-card reveal delayed-${(idx % 2) + 1}`;
            article.dataset.category = p.category;
            article.innerHTML = `
                <div class="project-image-wrap">
                    <div class="project-image bg-placeholder-${(idx % 4) + 1}"></div>
                </div>
                <div class="project-body">
                    <div class="project-meta">
                        <span class="project-tag">${p.category}</span>
                        <span class="project-year">${p.year}</span>
                    </div>
                    <h3 class="project-title">${p.title}</h3>
                    <p class="project-desc">${p.desc}</p>
                    <span class="read-link">İncele <i class="fas fa-arrow-right"></i></span>
                </div>
            `;
            grid.appendChild(article);
        });
    }
}

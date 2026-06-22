/**
 * ArchiveManager - Arşiv sayfasındaki yazıları yıla göre gruplayarak listeleme ve arama yöneticisi
 */
export class ArchiveManager {
    constructor(blogManager) {
        this.blogManager = blogManager;
        this.searchQuery = '';
    }

    bindEvents(container) {
        const searchInput = container.querySelector('#archive-search');
        if (searchInput) {
            searchInput.value = this.searchQuery;
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.toLowerCase().trim();
                this.renderArchive(container);
            });
        }
        this.renderArchive(container);
    }

    renderArchive(container) {
        const targetDiv = container.querySelector('#archive-container');
        if (!targetDiv) return;

        const posts = this.blogManager.getPosts();
        
        const filtered = posts.filter(p => {
            return p.title.toLowerCase().includes(this.searchQuery) ||
                   p.category.toLowerCase().includes(this.searchQuery) ||
                   p.lead.toLowerCase().includes(this.searchQuery);
        });

        targetDiv.innerHTML = '';
        if (filtered.length === 0) {
            targetDiv.innerHTML = '<div style="text-align:center; padding: 4rem; color: var(--c-text-secondary);">Arşivde eşleşen yazı bulunamadı.</div>';
            return;
        }

        const grouped = {};
        filtered.forEach(p => {
            const yearMatch = p.date.match(/\d{4}/);
            const year = yearMatch ? yearMatch[0] : 'Diğer';
            if (!grouped[year]) {
                grouped[year] = [];
            }
            grouped[year].push(p);
        });

        const years = Object.keys(grouped).sort((a, b) => b - a);

        years.forEach(year => {
            const yearSection = document.createElement('section');
            yearSection.style.marginBottom = '4rem';
            yearSection.className = 'reveal';
            
            yearSection.innerHTML = `
                <h2 class="archive-year">${year}</h2>
                <ul class="archive-list"></ul>
            `;
            
            const list = yearSection.querySelector('.archive-list');
            grouped[year].forEach(post => {
                const dayMonth = post.date.replace(/\s\d{4}$/, '');
                
                const li = document.createElement('li');
                li.className = 'archive-item';
                li.innerHTML = `
                    <span class="archive-date">${dayMonth}</span>
                    <a href="/post/${post.slug}" class="archive-link spa-route-link" data-slug="${post.slug}">${post.title}</a>
                    <span class="archive-tag">${post.category}</span>
                `;
                list.appendChild(li);
            });

            targetDiv.appendChild(yearSection);
        });
    }
}

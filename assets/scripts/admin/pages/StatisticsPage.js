import { ApiService } from '../../ApiService.js';

export class StatisticsPage {
    constructor(adminApp) {
        this.adminApp = adminApp;
        this.stats = [];
        this.posts = [];
    }

    async render(container) {
        container.innerHTML = `
            <div class="admin-page-header">
                <h1 class="admin-page-title">İstatistikler</h1>
                <p class="admin-page-subtitle">Yazı görüntülenme istatistiklerini görüntüleyin</p>
            </div>
            <div class="admin-content-area">
                <div id="stats-cards" class="admin-stats-cards">
                    <div class="admin-loading-state">
                        <i class="fas fa-spinner fa-spin"></i>
                        <span>Yükleniyor...</span>
                    </div>
                </div>
                <div id="stats-table" class="admin-table-container" style="margin-top: 2rem;">
                </div>
            </div>
        `;

        await this.loadStats();
        await this.loadPosts();
    }

    async loadStats() {
        try {
            const data = await ApiService.getViews();
            this.stats = Array.isArray(data) ? data : [];
            this.renderStatsCards();
            this.renderStatsTable();
        } catch (err) {
            console.error('İstatistikler yüklenemedi:', err);
            this.stats = [];
            this.renderStatsCards();
            this.renderStatsTable();
        }
    }

    async loadPosts() {
        try {
            const data = await ApiService.getPosts();
            this.posts = Array.isArray(data) ? data : [];
        } catch (err) {
            console.error('Yazılar yüklenemedi:', err);
            this.posts = [];
        }
    }

    renderStatsCards() {
        const container = document.getElementById('stats-cards');
        if (!container) return;

        const totalViews = this.stats.reduce((sum, stat) => sum + stat.viewCount, 0);
        const totalPosts = this.stats.length;

        container.innerHTML = `
            <div class="admin-stat-card">
                <div class="admin-stat-icon">
                    <i class="fas fa-eye"></i>
                </div>
                <div class="admin-stat-content">
                    <div class="admin-stat-value">${totalViews}</div>
                    <div class="admin-stat-label">Toplam Görüntülenme</div>
                </div>
            </div>
            <div class="admin-stat-card">
                <div class="admin-stat-icon">
                    <i class="fas fa-file-alt"></i>
                </div>
                <div class="admin-stat-content">
                    <div class="admin-stat-value">${totalPosts}</div>
                    <div class="admin-stat-label">Görüntülenen Yazı</div>
                </div>
            </div>
            <div class="admin-stat-card">
                <div class="admin-stat-icon">
                    <i class="fas fa-chart-line"></i>
                </div>
                <div class="admin-stat-content">
                    <div class="admin-stat-value">${totalPosts > 0 ? Math.round(totalViews / totalPosts) : 0}</div>
                    <div class="admin-stat-label">Ortalama Görüntülenme</div>
                </div>
            </div>
        `;
    }

    renderStatsTable() {
        const container = document.getElementById('stats-table');
        if (!container) return;

        if (this.stats.length === 0) {
            container.innerHTML = `
                <div class="admin-empty-state">
                    <i class="fas fa-chart-bar"></i>
                    <p>Henüz görüntülenme verisi bulunmamaktadır.</p>
                </div>
            `;
            return;
        }

        let html = `
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Yazı</th>
                        <th>Slug</th>
                        <th>Görüntülenme</th>
                        <th>İşlemler</th>
                    </tr>
                </thead>
                <tbody>
        `;

        this.stats.forEach(stat => {
            const post = this.posts.find(p => p.id === stat.postId);
            const postTitle = post ? post.title : 'Bilinmiyor';
            html += `
                <tr>
                    <td>${this.escapeHtml(postTitle)}</td>
                    <td><code>${this.escapeHtml(stat.postSlug)}</code></td>
                    <td>
                        <div class="view-count-badge">${stat.viewCount}</div>
                    </td>
                    <td>
                        <button class="admin-btn admin-btn-sm admin-btn-primary" onclick="window.viewPostDetails('${stat.postId}')">
                            <i class="fas fa-info-circle"></i>
                        </button>
                    </td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        container.innerHTML = html;
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

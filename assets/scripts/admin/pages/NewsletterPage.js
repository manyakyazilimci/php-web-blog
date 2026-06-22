import { ApiService } from '../../ApiService.js';

export class NewsletterPage {
    constructor(adminApp) {
        this.adminApp = adminApp;
        this.subscribers = [];
    }

    async render(container) {
        container.innerHTML = `
            <div class="admin-page-header">
                <h1 class="admin-page-title">Bülten Aboneleri</h1>
                <p class="admin-page-subtitle">E-posta bülten abonelerini yönetin</p>
            </div>
            <div class="admin-content-area">
                <div class="admin-filters">
                    <select id="filter-status" class="admin-select">
                        <option value="">Tüm Durumlar</option>
                        <option value="active">Aktif</option>
                        <option value="unsubscribed">Ayrılmış</option>
                    </select>
                </div>
                <div id="subscribers-table" class="admin-table-container">
                    <div class="admin-loading-state">
                        <i class="fas fa-spinner fa-spin"></i>
                        <span>Yükleniyor...</span>
                    </div>
                </div>
            </div>
        `;

        await this.loadSubscribers();
        this.bindEvents(container);
    }

    async loadSubscribers(status = '') {
        try {
            const data = await ApiService.getNewsletterSubscribers(status);
            this.subscribers = Array.isArray(data) ? data : [];
            this.renderSubscribersTable();
        } catch (err) {
            console.error('Aboneler yüklenemedi:', err);
            this.subscribers = [];
            this.renderSubscribersTable();
        }
    }

    renderSubscribersTable() {
        const container = document.getElementById('subscribers-table');
        if (!container) return;

        if (this.subscribers.length === 0) {
            container.innerHTML = `
                <div class="admin-empty-state">
                    <i class="fas fa-users"></i>
                    <p>Henüz abone bulunmamaktadır.</p>
                </div>
            `;
            return;
        }

        const statusLabels = {
            'active': '<span class="status-badge status-active">Aktif</span>',
            'unsubscribed': '<span class="status-badge status-inactive">Ayrılmış</span>'
        };

        let html = `
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Durum</th>
                        <th>E-posta</th>
                        <th>İsim</th>
                        <th>Kayıt Tarihi</th>
                        <th>İşlemler</th>
                    </tr>
                </thead>
                <tbody>
        `;

        this.subscribers.forEach(sub => {
            const date = new Date(sub.subscribedAt).toLocaleDateString('tr-TR', {
                day: 'numeric', month: 'long', year: 'numeric'
            });
            html += `
                <tr>
                    <td>${statusLabels[sub.status] || sub.status}</td>
                    <td>${this.escapeHtml(sub.email)}</td>
                    <td>${sub.name ? this.escapeHtml(sub.name) : '-'}</td>
                    <td>${date}</td>
                    <td>
                        ${sub.status === 'active' ? `
                            <button class="admin-btn admin-btn-sm admin-btn-warning" onclick="window.unsubscribeUser('${sub.id}')">
                                <i class="fas fa-user-minus"></i>
                            </button>
                        ` : `
                            <button class="admin-btn admin-btn-sm admin-btn-success" onclick="window.resubscribeUser('${sub.id}')">
                                <i class="fas fa-user-plus"></i>
                            </button>
                        `}
                    </td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        container.innerHTML = html;
    }

    bindEvents(container) {
        const filterSelect = container.querySelector('#filter-status');
        if (filterSelect) {
            filterSelect.addEventListener('change', (e) => {
                this.loadSubscribers(e.target.value);
            });
        }

        window.unsubscribeUser = async (id) => {
            if (!confirm('Bu aboneyi listeden çıkarmak istediğinize emin misiniz?')) return;
            
            try {
                await ApiService.deleteNewsletterSubscriber(id);
                this.loadSubscribers(document.getElementById('filter-status')?.value || '');
            } catch (err) {
                console.error('Abone çıkarılamadı:', err);
            }
        };

        window.resubscribeUser = async (id) => {
            try {
                await ApiService.deleteNewsletterSubscriber(id);
                this.loadSubscribers(document.getElementById('filter-status')?.value || '');
            } catch (err) {
                console.error('Abone tekrar aktif edilemedi:', err);
            }
        };
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

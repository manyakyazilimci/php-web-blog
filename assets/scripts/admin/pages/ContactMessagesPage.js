import { ApiService } from '../../ApiService.js';
import { AdminModalFactory } from '../AdminModal.js';

export class ContactMessagesPage {
    constructor(adminApp) {
        this.adminApp = adminApp;
        this.messages = [];
    }

    async render(container) {
        container.innerHTML = `
            <div class="admin-page-header">
                <h1 class="admin-page-title">İletişim Mesajları</h1>
                <p class="admin-page-subtitle">Ziyaretçilerden gelen mesajları yönetin</p>
            </div>
            <div class="admin-content-area">
                <div class="admin-filters">
                    <select id="filter-status" class="admin-select">
                        <option value="">Tüm Durumlar</option>
                        <option value="new">Yeni</option>
                        <option value="read">Okunmuş</option>
                        <option value="replied">Yanıtlanmış</option>
                    </select>
                </div>
                <div id="messages-table" class="admin-table-container">
                    <div class="admin-loading-state">
                        <i class="fas fa-spinner fa-spin"></i>
                        <span>Yükleniyor...</span>
                    </div>
                </div>
            </div>
        `;

        await this.loadMessages();
        this.bindEvents(container);
    }

    async loadMessages(status = '') {
        try {
            const data = await ApiService.getContactMessages(status);
            this.messages = Array.isArray(data) ? data : [];
            this.renderMessagesTable();
        } catch (err) {
            console.error('Mesajlar yüklenemedi:', err);
            this.messages = [];
            this.renderMessagesTable();
        }
    }

    renderMessagesTable() {
        const container = document.getElementById('messages-table');
        if (!container) return;

        if (this.messages.length === 0) {
            container.innerHTML = `
                <div class="admin-empty-state">
                    <i class="fas fa-envelope-open"></i>
                    <p>Henüz mesaj bulunmamaktadır.</p>
                </div>
            `;
            return;
        }

        const statusLabels = {
            'new': '<span class="status-badge status-new">Yeni</span>',
            'read': '<span class="status-badge status-read">Okunmuş</span>',
            'replied': '<span class="status-badge status-replied">Yanıtlanmış</span>'
        };

        let html = `
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Durum</th>
                        <th>Gönderen</th>
                        <th>E-posta</th>
                        <th>Konu</th>
                        <th>Tarih</th>
                        <th>İşlemler</th>
                    </tr>
                </thead>
                <tbody>
        `;

        this.messages.forEach(msg => {
            const date = new Date(msg.createdAt).toLocaleDateString('tr-TR', {
                day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
            });
            html += `
                <tr>
                    <td>${statusLabels[msg.status] || msg.status}</td>
                    <td>${this.escapeHtml(msg.name)}</td>
                    <td>${this.escapeHtml(msg.email)}</td>
                    <td>${msg.subject ? this.escapeHtml(msg.subject) : '-'}</td>
                    <td>${date}</td>
                    <td>
                        <button class="admin-btn admin-btn-sm admin-btn-primary" onclick="window.viewMessage('${msg.id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="admin-btn admin-btn-sm admin-btn-danger" onclick="window.deleteMessage('${msg.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
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
                this.loadMessages(e.target.value);
            });
        }

        window.viewMessage = async (id) => {
            const msg = this.messages.find(m => m.id === id);
            if (!msg) return;

            const modal = AdminModalFactory.createInfoModal('Mesaj Detayı', `
                <div style="line-height: 1.8;">
                    <p><strong>Gönderen:</strong> ${this.escapeHtml(msg.name)}</p>
                    <p><strong>E-posta:</strong> ${this.escapeHtml(msg.email)}</p>
                    <p><strong>Konu:</strong> ${msg.subject ? this.escapeHtml(msg.subject) : '-'}</p>
                    <p><strong>Durum:</strong> ${msg.status}</p>
                    <p><strong>Tarih:</strong> ${new Date(msg.createdAt).toLocaleString('tr-TR')}</p>
                    <hr style="margin: 1.5rem 0; border: none; border-top: 1px solid var(--admin-border);">
                    <p><strong>Mesaj:</strong></p>
                    <p style="background: var(--admin-bg-secondary); padding: 1rem; border-radius: 8px;">${this.escapeHtml(msg.message)}</p>
                </div>
                <div class="admin-modal-actions" style="margin-top: 1.5rem;">
                    <select id="update-status" class="admin-select" style="margin-right: 1rem;">
                        <option value="new" ${msg.status === 'new' ? 'selected' : ''}>Yeni</option>
                        <option value="read" ${msg.status === 'read' ? 'selected' : ''}>Okunmuş</option>
                        <option value="replied" ${msg.status === 'replied' ? 'selected' : ''}>Yanıtlanmış</option>
                    </select>
                    <button class="admin-btn admin-btn-primary" onclick="window.updateMessageStatus('${msg.id}')">Durumu Güncelle</button>
                </div>
            `);
            modal.open();
        };

        window.updateMessageStatus = async (id) => {
            const statusSelect = document.getElementById('update-status');
            if (!statusSelect) return;
            
            try {
                await ApiService.updateContactMessageStatus(id, statusSelect.value);
                this.loadMessages(document.getElementById('filter-status')?.value || '');
                document.querySelector('.modal-overlay')?.remove();
            } catch (err) {
                console.error('Durum güncellenemedi:', err);
            }
        };

        window.deleteMessage = async (id) => {
            if (!confirm('Bu mesajı silmek istediğinize emin misiniz?')) return;
            
            try {
                await ApiService.deleteContactMessage(id);
                this.loadMessages(document.getElementById('filter-status')?.value || '');
            } catch (err) {
                console.error('Mesaj silinemedi:', err);
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

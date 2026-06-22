import { ApiService } from '../../ApiService.js';
import { AdminModal, AdminModalFactory } from '../AdminModal.js';
import { AdminToast } from '../AdminToast.js';

/**
 * MediaPage - Medya kutuphanesi (API tabanli)
 */
export class MediaPage {
    constructor(appInstance) {
        this.app = appInstance;
        this.viewMode = 'grid';
    }

    async render(container) {
        this.container = container;

        let mediaItems = [];
        try {
            mediaItems = await ApiService.getMedia();
        } catch (error) {
            AdminToast.error('Medya yuklenemedi: ' + error.message);
        }

        const formatted = mediaItems.map(item => this.formatItem(item));

        this.container.innerHTML = `
            <div class="page-header">
                <div class="page-header-left">
                    <h1>Medya Kütüphanesi</h1>
                    <p>Yüklenen tüm görseller burada listelenir (kapak görselleri dahil).</p>
                </div>
            </div>

            <div class="upload-dropzone" id="media-dropzone">
                <div class="upload-dropzone-icon"><i class="fas fa-cloud-upload-alt"></i></div>
                <div class="upload-dropzone-text">Dosyaları buraya sürükleyin veya tıklayın</div>
                <div class="upload-dropzone-hint">PNG, JPG, GIF veya WebP (Maks. 2 MB)</div>
                <input type="file" id="media-file-input" multiple accept="image/*" style="display:none;">
            </div>

            <div id="upload-progress-container" style="margin-bottom: 2rem;"></div>

            <div class="media-toolbar">
                <div class="topbar-breadcrumb">Toplam <span>${formatted.length}</span> Dosya</div>
                <div class="media-view-toggle">
                    <button class="media-view-btn ${this.viewMode === 'grid' ? 'active' : ''}" id="btn-view-grid" type="button"><i class="fas fa-th-large"></i></button>
                    <button class="media-view-btn ${this.viewMode === 'list' ? 'active' : ''}" id="btn-view-list" type="button"><i class="fas fa-list"></i></button>
                </div>
            </div>

            <div id="media-items-wrapper">
                ${formatted.length === 0
                    ? `<div class="empty-state" style="padding:3rem;"><div class="empty-state-icon"><i class="fas fa-image"></i></div><h3 class="empty-state-title">Henüz medya yok</h3><p class="empty-state-desc">Kapak görseli veya buradan yüklediğiniz dosyalar burada görünür.</p></div>`
                    : (this.viewMode === 'grid' ? this.renderGridView(formatted) : this.renderListView(formatted))
                }
            </div>
        `;

        this.bindEvents(formatted);
    }

    formatItem(item) {
        return {
            id: item.id,
            name: item.name,
            url: item.url,
            type: item.type || 'image/jpeg',
            size: this.formatFileSize(item.size),
            uploadDate: item.uploadDate ? this.formatDate(item.uploadDate) : '-',
        };
    }

    formatFileSize(bytes) {
        if (!bytes) return '-';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    formatDate(dateStr) {
        try {
            return new Date(dateStr).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' });
        } catch {
            return dateStr;
        }
    }

    renderGridView(items) {
        return `
            <div class="media-grid">
                ${items.map(item => `
                    <div class="media-card" data-id="${item.id}">
                        <div class="media-card-preview">
                            <img src="${item.url}" alt="${this.esc(item.name)}" style="width:100%;height:100%;object-fit:cover;">
                        </div>
                        <div class="media-card-info">
                            <div class="media-card-name" title="${this.esc(item.name)}">${this.esc(item.name)}</div>
                            <div class="media-card-meta">${item.size}</div>
                        </div>
                        <div class="media-card-overlay">
                            <button class="media-overlay-btn btn-view-media" title="Görüntüle" type="button"><i class="fas fa-eye"></i></button>
                            <button class="media-overlay-btn danger btn-delete-media" title="Sil" type="button"><i class="fas fa-trash-alt"></i></button>
                        </div>
                    </div>
                `).join('')}
            </div>`;
    }

    renderListView(items) {
        return `
            <div class="media-list">
                ${items.map(item => `
                    <div class="media-list-item" data-id="${item.id}">
                        <div class="media-list-thumb" style="width:48px;height:48px;border-radius:var(--admin-radius-sm);overflow:hidden;flex-shrink:0;">
                            <img src="${item.url}" alt="${this.esc(item.name)}" style="width:100%;height:100%;object-fit:cover;">
                        </div>
                        <div class="media-list-info">
                            <div class="media-list-name" title="${this.esc(item.name)}">${this.esc(item.name)}</div>
                            <div class="media-list-meta"><span>${item.size}</span><span>${item.uploadDate}</span></div>
                        </div>
                        <div class="media-list-actions">
                            <button class="table-action-btn btn-view-media" type="button"><i class="fas fa-eye"></i></button>
                            <button class="table-action-btn danger btn-delete-media" type="button"><i class="fas fa-trash-alt"></i></button>
                        </div>
                    </div>
                `).join('')}
            </div>`;
    }

    bindEvents(mediaItems) {
        const dropzone = this.container.querySelector('#media-dropzone');
        const fileInput = this.container.querySelector('#media-file-input');

        this.container.querySelector('#btn-view-grid')?.addEventListener('click', () => {
            this.viewMode = 'grid';
            this.render(this.container);
        });
        this.container.querySelector('#btn-view-list')?.addEventListener('click', () => {
            this.viewMode = 'list';
            this.render(this.container);
        });

        dropzone?.addEventListener('click', () => fileInput?.click());
        dropzone?.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('dragover'); });
        dropzone?.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
        dropzone?.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('dragover');
            if (e.dataTransfer.files.length) this.handleFilesUpload(e.dataTransfer.files);
        });
        fileInput?.addEventListener('change', (e) => {
            if (e.target.files.length) this.handleFilesUpload(e.target.files);
        });

        this.container.querySelectorAll('.btn-view-media').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.closest('[data-id]')?.dataset.id;
                if (id) this.openPreviewModal(id, mediaItems);
            });
        });

        this.container.querySelectorAll('.btn-delete-media').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.closest('[data-id]')?.dataset.id;
                if (id) this.confirmDeleteMedia(id, mediaItems);
            });
        });
    }

    async handleFilesUpload(files) {
        for (const file of files) {
            if (file.size > 2 * 1024 * 1024) {
                AdminToast.error(`"${file.name}" 2 MB limitini aşıyor.`);
                continue;
            }
            try {
                await ApiService.uploadFile(file);
                AdminToast.success(`"${file.name}" yüklendi.`);
            } catch (error) {
                AdminToast.error(error.message);
            }
        }
        await this.render(this.container);
    }

    confirmDeleteMedia(id, mediaItems) {
        const item = mediaItems.find(m => m.id === id);
        if (!item) return;

        AdminModalFactory.createConfirmModal(
            'Medya Dosyasını Sil',
            `"${item.name}" dosyasını silmek istediğinizden emin misiniz?`,
            async () => {
                try {
                    await ApiService.deleteMedia(id);
                    AdminToast.success('Dosya silindi.');
                    await this.render(this.container);
                } catch (error) {
                    AdminToast.error(error.message);
                }
            }
        ).open();
    }

    openPreviewModal(id, mediaItems) {
        const item = mediaItems.find(m => m.id === id);
        if (!item) return;

        const contentHTML = `
            <div style="display:flex;flex-direction:column;gap:1.5rem;align-items:center;">
                <div style="width:100%;max-height:300px;border-radius:var(--admin-radius-md);overflow:hidden;border:1px solid var(--admin-border);">
                    <img src="${item.url}" alt="${this.esc(item.name)}" style="max-width:100%;max-height:300px;object-fit:contain;display:block;margin:0 auto;">
                </div>
                <div style="width:100%;background:var(--admin-bg);padding:1.25rem;border-radius:var(--admin-radius-md);font-size:0.88rem;display:grid;grid-template-columns:repeat(2,1fr);gap:0.75rem;">
                    <div><strong>Dosya Adı:</strong></div><div>${this.esc(item.name)}</div>
                    <div><strong>Boyut:</strong></div><div>${item.size}</div>
                    <div><strong>Tarih:</strong></div><div>${item.uploadDate}</div>
                    <div><strong>URL:</strong></div><div style="word-break:break-all;">${item.url}</div>
                </div>
                <div class="admin-modal-actions" style="width:100%;">
                    <button type="button" class="admin-btn admin-btn-secondary modal-close-btn" style="margin-left:auto;">Kapat</button>
                </div>
            </div>`;

        const modal = new AdminModal('modal-media-preview', 'Dosya Detayı', null, contentHTML);
        modal.element.querySelector('.modal-close-btn')?.addEventListener('click', () => modal.close());
        modal.open();
    }

    esc(str) {
        if (typeof str !== 'string') return '';
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
}

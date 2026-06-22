import { ApiService } from '../../ApiService.js';
import { AdminModalFactory } from '../AdminModal.js';
import { AdminToast } from '../AdminToast.js';
import { RichEditor } from '../RichEditor.js';

/**
 * PostsPage - Yönetim paneli yazılar CRUD ekranı (API + WYSIWYG editör)
 */
export class PostsPage {
    constructor(appInstance) {
        this.app = appInstance;
        this.currentPage = 1;
        this.itemsPerPage = 5;
        this.searchQuery = '';
        this.selectedCategory = 'all';
        this.activeView = 'list';
        this.editingPostId = null;
        this.posts = [];
        this.categories = [];
        this.featuredImage = null;
    }

    async render(container) {
        this.container = container;

        try {
            [this.posts, this.categories] = await Promise.all([
                ApiService.getPosts(),
                ApiService.getCategories(),
            ]);
        } catch (error) {
            AdminToast.error('Yazilar yuklenemedi: ' + error.message);
            this.posts = [];
            this.categories = [];
        }

        if (this.activeView === 'form') {
            await this.renderFormView();
        } else {
            this.renderListView();
        }
    }

    renderListView() {
        const filteredPosts = this.posts.filter(post => {
            const matchesSearch =
                post.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                post.lead.toLowerCase().includes(this.searchQuery.toLowerCase());
            const matchesCategory =
                this.selectedCategory === 'all' || post.category === this.selectedCategory;
            return matchesSearch && matchesCategory;
        });

        const totalItems = filteredPosts.length;
        const totalPages = Math.ceil(totalItems / this.itemsPerPage) || 1;
        if (this.currentPage > totalPages) this.currentPage = totalPages;

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const paginatedPosts = filteredPosts.slice(startIndex, startIndex + this.itemsPerPage);

        this.container.innerHTML = `
            <div class="page-header">
                <div class="page-header-left">
                    <h1>Yazılar</h1>
                    <p>Blog yazılarınızı ekleyin, düzenleyin veya silin.</p>
                </div>
                <button class="admin-btn admin-btn-primary" id="btn-new-post" type="button">
                    <i class="fas fa-plus" aria-hidden="true"></i> Yeni Yazı Ekle
                </button>
            </div>

            <div class="admin-card" style="margin-bottom: 1.5rem;">
                <div class="table-toolbar">
                    <div class="table-toolbar-left">
                        <div class="table-search">
                            <i class="fas fa-search" aria-hidden="true"></i>
                            <input type="text" id="post-search-input" value="${this.searchQuery}" placeholder="Yazı ara..." aria-label="Yazılarda ara">
                        </div>
                        <select class="admin-form-select" id="post-category-filter" aria-label="Kategoriye göre filtrele"
                            style="width: auto; padding: 0.55rem 2.5rem 0.55rem 1.1rem; border-radius: 40px; font-size: 0.82rem;">
                            <option value="all" ${this.selectedCategory === 'all' ? 'selected' : ''}>Tüm Kategoriler</option>
                            ${this.categories.map(cat => `
                                <option value="${cat.name}" ${this.selectedCategory === cat.name ? 'selected' : ''}>${cat.name}</option>
                            `).join('')}
                        </select>
                    </div>
                </div>

                <div class="admin-table-container">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th style="width:60px;">Görsel</th>
                                <th>Yazı Başlığı</th>
                                <th>Kategori</th>
                                <th>Tarih</th>
                                <th>Durum</th>
                                <th style="text-align: right;">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${paginatedPosts.length === 0 ? `
                                <tr><td colspan="6">
                                    <div class="empty-state">
                                        <div class="empty-state-icon"><i class="fas fa-file-signature"></i></div>
                                        <h3 class="empty-state-title">Yazı Bulunamadı</h3>
                                        <p class="empty-state-desc">Arama veya filtreye uygun blog yazısı bulunmuyor.</p>
                                    </div>
                                </td></tr>
                            ` : paginatedPosts.map(post => {
                                const status = post.status || 'published';
                                const statusClass = status === 'published' ? 'badge-published' : 'badge-draft';
                                const statusText = status === 'published' ? 'Yayında' : 'Taslak';
                                const thumb = post.featuredImage
                                    ? `<img src="${post.featuredImage}" alt="" style="width:48px;height:48px;object-fit:cover;border-radius:8px;">`
                                    : `<div style="width:48px;height:48px;border-radius:8px;background:var(--admin-border);display:flex;align-items:center;justify-content:center;color:var(--admin-text-muted);"><i class="fas fa-image"></i></div>`;
                                return `
                                    <tr data-id="${post.id}">
                                        <td>${thumb}</td>
                                        <td>
                                            <div class="table-title-cell" title="${this.escapeHtml(post.title)}">${this.escapeHtml(post.title)}</div>
                                            <div style="font-size: 0.78rem; color: var(--admin-text-muted); margin-top: 0.25rem;">
                                                ${this.escapeHtml(post.readTime)} &bull; Slug: ${this.escapeHtml(post.slug)}
                                            </div>
                                        </td>
                                        <td><span class="badge badge-category">${this.escapeHtml(post.category)}</span></td>
                                        <td>${post.date || '-'}</td>
                                        <td><span class="badge ${statusClass}"><span class="badge-dot"></span> ${statusText}</span></td>
                                        <td>
                                            <div class="table-actions" style="justify-content: flex-end;">
                                                <button class="table-action-btn btn-edit-post" title="Düzenle" type="button"><i class="fas fa-edit"></i></button>
                                                <button class="table-action-btn danger btn-delete-post" title="Sil" type="button"><i class="fas fa-trash-alt"></i></button>
                                            </div>
                                        </td>
                                    </tr>`;
                            }).join('')}
                        </tbody>
                    </table>
                </div>

                ${totalPages > 1 ? `
                    <div class="pagination">
                        <button class="pagination-btn ${this.currentPage === 1 ? 'disabled' : ''}" id="btn-prev-page" type="button"><i class="fas fa-chevron-left"></i></button>
                        ${Array.from({ length: totalPages }, (_, i) => i + 1).map(page => `
                            <button class="pagination-btn ${this.currentPage === page ? 'active' : ''} btn-page-number" data-page="${page}" type="button">${page}</button>
                        `).join('')}
                        <button class="pagination-btn ${this.currentPage === totalPages ? 'disabled' : ''}" id="btn-next-page" type="button"><i class="fas fa-chevron-right"></i></button>
                    </div>
                ` : ''}
            </div>
        `;

        this.bindListEvents();
    }

    async renderFormView() {
        const isEdit = this.editingPostId !== null;
        const post = isEdit ? this.posts.find(p => p.id === this.editingPostId) : null;

        if (isEdit && !post) {
            AdminToast.error('Düzenlenecek yazı bulunamadı.');
            this.switchToListView();
            return;
        }

        this.featuredImage = isEdit ? (post.featuredImage || null) : null;
        const pageTitle = isEdit ? 'Yazıyı Düzenle' : 'Yeni Yazı Oluştur';

        this.container.innerHTML = `
            <div class="page-header">
                <div class="page-header-left">
                    <button class="admin-btn admin-btn-ghost" id="btn-back-to-list" type="button">
                        <i class="fas fa-arrow-left"></i> Geri Dön
                    </button>
                    <h1 style="margin-top: 0.75rem;">${pageTitle}</h1>
                    <p>${isEdit ? '"' + this.escapeHtml(post.title) + '" başlıklı yazıyı düzenliyorsunuz.' : 'Yeni bir blog yazısı oluşturun.'}</p>
                </div>
            </div>

            <form id="form-manage-post" novalidate>
                <div class="post-editor-layout">
                    <div class="post-editor-main">
                        <div class="admin-card" style="margin-bottom: 1.5rem;">
                            <div class="admin-card-header"><h2 class="admin-card-title">Yazı Bilgileri</h2></div>
                            <div class="admin-card-body" style="display: flex; flex-direction: column; gap: 1.25rem;">
                                <div class="admin-form-group">
                                    <label class="admin-form-label" for="post-title">Yazı Başlığı <span class="required-star">*</span></label>
                                    <input type="text" id="post-title" name="title" class="admin-form-input"
                                        value="${isEdit ? this.escapeHtml(post.title) : ''}" placeholder="Yazınızın başlığını girin..." required>
                                </div>
                                <div class="admin-form-group">
                                    <label class="admin-form-label" for="post-lead">Özet / Öncü Paragraf <span class="required-star">*</span></label>
                                    <textarea id="post-lead" name="lead" class="admin-form-input" style="min-height: 80px; resize: vertical;"
                                        placeholder="Ana sayfada görünecek kısa özet..." required>${isEdit ? this.escapeHtml(post.lead) : ''}</textarea>
                                </div>
                            </div>
                        </div>

                        <div class="admin-card">
                            <div class="admin-card-header"><h2 class="admin-card-title">İçerik</h2></div>
                            <div class="admin-card-body">
                                <textarea id="post-body-editor">${isEdit ? post.body : ''}</textarea>
                            </div>
                        </div>
                    </div>

                    <div class="post-editor-sidebar">
                        <div class="admin-card" style="margin-bottom: 1.5rem;">
                            <div class="admin-card-header"><h2 class="admin-card-title">Kapak Görseli</h2></div>
                            <div class="admin-card-body">
                                <div id="featured-image-preview" class="featured-image-preview">
                                    ${this.featuredImage
                                        ? `<img src="${this.featuredImage}" alt="Kapak görseli">`
                                        : '<div class="featured-image-placeholder"><i class="fas fa-image"></i><span>Görsel seçilmedi</span></div>'}
                                </div>
                                <input type="file" id="featured-image-input" accept="image/*" style="display:none;">
                                <button type="button" class="admin-btn admin-btn-secondary" id="btn-upload-featured" style="width:100%;justify-content:center;margin-top:0.75rem;">
                                    <i class="fas fa-upload"></i> Görsel Yükle
                                </button>
                                ${this.featuredImage ? `
                                    <button type="button" class="admin-btn admin-btn-danger admin-btn-sm" id="btn-remove-featured" style="width:100%;justify-content:center;margin-top:0.5rem;">
                                        <i class="fas fa-trash"></i> Görseli Kaldır
                                    </button>
                                ` : ''}
                            </div>
                        </div>

                        <div class="admin-card" style="margin-bottom: 1.5rem;">
                            <div class="admin-card-header"><h2 class="admin-card-title">Yayın Ayarları</h2></div>
                            <div class="admin-card-body" style="display: flex; flex-direction: column; gap: 1.25rem;">
                                <div class="admin-toggle-wrapper">
                                    <div class="admin-toggle-info">
                                        <div class="admin-toggle-label">Yayına Al</div>
                                        <div class="admin-toggle-desc">Pasif durumdayken taslak olarak kaydedilir.</div>
                                    </div>
                                    <label class="admin-toggle" for="post-status">
                                        <input type="checkbox" id="post-status" ${(!isEdit || post.status === 'published') ? 'checked' : ''}>
                                        <span class="admin-toggle-slider"></span>
                                    </label>
                                </div>
                                <div style="display: flex; flex-direction: column; gap: 0.75rem; padding-top: 0.5rem; border-top: 1px solid var(--admin-border);">
                                    <button type="submit" class="admin-btn admin-btn-primary" id="btn-save-post"><i class="fas fa-save"></i> Kaydet</button>
                                    <button type="button" class="admin-btn admin-btn-secondary" id="btn-cancel-form">Vazgeç</button>
                                </div>
                            </div>
                        </div>

                        <div class="admin-card">
                            <div class="admin-card-header"><h2 class="admin-card-title">Sınıflandırma</h2></div>
                            <div class="admin-card-body" style="display: flex; flex-direction: column; gap: 1.25rem;">
                                <div class="admin-form-group">
                                    <label class="admin-form-label" for="post-category">Kategori <span class="required-star">*</span></label>
                                    <select id="post-category" class="admin-form-select" required>
                                        ${this.categories.length === 0
                                            ? '<option value="">Henüz kategori eklenmedi</option>'
                                            : this.categories.map(cat => `
                                                <option value="${cat.id}" ${(isEdit && post.categoryId === cat.id) ? 'selected' : ''}>${cat.name}</option>
                                            `).join('')}
                                    </select>
                                </div>
                                <div class="admin-form-group">
                                    <label class="admin-form-label" for="post-readtime">Okuma Süresi</label>
                                    <input type="text" id="post-readtime" class="admin-form-input"
                                        value="${isEdit ? this.escapeHtml(post.readTime) : '5 dk okuma'}" placeholder="Örn: 6 dk okuma">
                                </div>
                                <div class="admin-form-group">
                                    <label class="admin-form-label">URL Kimliği (Slug)</label>
                                    <div class="category-card-slug" id="post-slug-preview" style="display: inline-block; font-size: 0.83rem; padding: 0.4rem 0.8rem;">
                                        ${isEdit ? post.slug : 'yazi-basligi'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        `;

        this.bindFormEvents(isEdit, post);
        this.bodyEditor = await RichEditor.create('#post-body-editor', {
            height: 450,
            initialContent: isEdit ? post.body : '',
        });
    }

    bindListEvents() {
        if (!this.container) return;

        this.container.querySelector('#btn-new-post')?.addEventListener('click', () => this.switchToFormView(null));

        const searchInput = this.container.querySelector('#post-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value;
                this.currentPage = 1;
                this.renderListView();
                const fresh = this.container.querySelector('#post-search-input');
                fresh?.focus();
                fresh?.setSelectionRange(fresh.value.length, fresh.value.length);
            });
        }

        this.container.querySelector('#post-category-filter')?.addEventListener('change', (e) => {
            this.selectedCategory = e.target.value;
            this.currentPage = 1;
            this.renderListView();
        });

        this.container.querySelectorAll('.btn-edit-post').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tr = e.target.closest('tr');
                if (tr) this.switchToFormView(tr.dataset.id);
            });
        });

        this.container.querySelectorAll('.btn-delete-post').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tr = e.target.closest('tr');
                if (tr) this.confirmDeletePost(tr.dataset.id);
            });
        });

        this.container.querySelector('#btn-prev-page')?.addEventListener('click', () => {
            if (this.currentPage > 1) { this.currentPage--; this.renderListView(); }
        });

        this.container.querySelector('#btn-next-page')?.addEventListener('click', () => {
            const totalPages = Math.ceil(this.posts.length / this.itemsPerPage);
            if (this.currentPage < totalPages) { this.currentPage++; this.renderListView(); }
        });

        this.container.querySelectorAll('.btn-page-number').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.currentPage = parseInt(e.target.dataset.page, 10);
                this.renderListView();
            });
        });
    }

    bindFormEvents(isEdit, post) {
        this.container.querySelector('#btn-back-to-list')?.addEventListener('click', () => this.switchToListView());
        this.container.querySelector('#btn-cancel-form')?.addEventListener('click', () => this.switchToListView());

        const titleInput = this.container.querySelector('#post-title');
        const slugPreview = this.container.querySelector('#post-slug-preview');
        titleInput?.addEventListener('input', (e) => {
            if (slugPreview) slugPreview.textContent = this.generateSlug(e.target.value) || 'yazi-basligi';
        });

        const imageInput = this.container.querySelector('#featured-image-input');
        this.container.querySelector('#btn-upload-featured')?.addEventListener('click', () => imageInput?.click());

        imageInput?.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            if (file.size > 2 * 1024 * 1024) {
                AdminToast.error('Görsel boyutu 2 MB\'dan büyük olamaz.');
                return;
            }
            try {
                const result = await ApiService.uploadFile(file);
                this.featuredImage = result.url;
                this.updateFeaturedPreview();
                AdminToast.success('Kapak görseli yüklendi.');
            } catch (error) {
                AdminToast.error(error.message);
            }
        });

        this.container.querySelector('#btn-remove-featured')?.addEventListener('click', () => {
            this.featuredImage = null;
            this.updateFeaturedPreview();
        });

        this.container.querySelector('#form-manage-post')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit(isEdit, post);
        });
    }

    updateFeaturedPreview() {
        const preview = this.container.querySelector('#featured-image-preview');
        if (!preview) return;

        preview.innerHTML = this.featuredImage
            ? `<img src="${this.featuredImage}" alt="Kapak görseli">`
            : '<div class="featured-image-placeholder"><i class="fas fa-image"></i><span>Görsel seçilmedi</span></div>';

        const removeBtn = this.container.querySelector('#btn-remove-featured');
        if (this.featuredImage && !removeBtn) {
            const uploadBtn = this.container.querySelector('#btn-upload-featured');
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.id = 'btn-remove-featured';
            btn.className = 'admin-btn admin-btn-danger admin-btn-sm';
            btn.style.cssText = 'width:100%;justify-content:center;margin-top:0.5rem;';
            btn.innerHTML = '<i class="fas fa-trash"></i> Görseli Kaldır';
            btn.addEventListener('click', () => { this.featuredImage = null; this.updateFeaturedPreview(); });
            uploadBtn?.after(btn);
        } else if (!this.featuredImage && removeBtn) {
            removeBtn.remove();
        }
    }

    async handleFormSubmit(isEdit, existingPost) {
        const title = this.container.querySelector('#post-title')?.value.trim() || '';
        const lead = this.container.querySelector('#post-lead')?.value.trim() || '';
        const body = RichEditor.getContent('#post-body-editor').trim();
        const categoryId = this.container.querySelector('#post-category')?.value || '';
        const readTime = this.container.querySelector('#post-readtime')?.value.trim() || '5 dk okuma';
        const status = this.container.querySelector('#post-status')?.checked ? 'published' : 'draft';

        const textOnly = body.replace(/<[^>]*>/g, '').trim();
        if (!title) { AdminToast.error('Yazı başlığı zorunludur.'); return; }
        if (!lead) { AdminToast.error('Özet zorunludur.'); return; }
        if (!textOnly) { AdminToast.error('Yazı içeriği boş bırakılamaz.'); return; }
        if (!categoryId) { AdminToast.error('Bir kategori seçmelisiniz.'); return; }

        const payload = { title, lead, body, categoryId, readTime, status, featuredImage: this.featuredImage };

        try {
            if (isEdit) {
                await ApiService.updatePost(this.editingPostId, payload);
                AdminToast.success('Yazı başarıyla güncellendi.');
            } else {
                await ApiService.createPost(payload);
                AdminToast.success('Yeni yazı başarıyla eklendi.');
            }
            this.app.updateSidebarPostBadge();
            await this.switchToListView();
        } catch (error) {
            AdminToast.error(error.message);
        }
    }

    confirmDeletePost(postId) {
        const post = this.posts.find(p => p.id === postId);
        if (!post) return;

        AdminModalFactory.createConfirmModal(
            'Yazıyı Sil',
            `"${post.title}" başlıklı yazıyı silmek istediğinizden emin misiniz?`,
            async () => {
                try {
                    await ApiService.deletePost(postId);
                    AdminToast.success('Yazı başarıyla silindi.');
                    this.app.updateSidebarPostBadge();
                    await this.render(this.container);
                } catch (error) {
                    AdminToast.error(error.message);
                }
            }
        ).open();
    }

    async switchToFormView(postId = null) {
        RichEditor.destroy('#post-body-editor');
        this.editingPostId = postId;
        this.activeView = 'form';
        await this.render(this.container);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    async switchToListView() {
        RichEditor.destroy('#post-body-editor');
        this.editingPostId = null;
        this.activeView = 'list';
        await this.render(this.container);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    generateSlug(text) {
        if (!text) return '';
        const trMap = { 'ç':'c','Ç':'c','ğ':'g','Ğ':'g','ı':'i','I':'i','İ':'i','ö':'o','Ö':'o','ş':'s','Ş':'s','ü':'u','Ü':'u' };
        let slug = text.toString().toLowerCase().trim();
        for (const key in trMap) slug = slug.replace(new RegExp(key, 'g'), trMap[key]);
        return slug.replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-\-+/g, '-').replace(/^-+/, '').replace(/-+$/, '');
    }

    escapeHtml(str) {
        if (typeof str !== 'string') return '';
        return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }
}

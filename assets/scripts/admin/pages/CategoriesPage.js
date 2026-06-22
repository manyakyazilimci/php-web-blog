import { ApiService } from '../../ApiService.js';
import { AdminMockData } from '../AdminMockData.js';
import { AdminModal, AdminModalFactory } from '../AdminModal.js';
import { AdminToast } from '../AdminToast.js';

/**
 * CategoriesPage - Yonetim paneli kategoriler CRUD ekrani bileseni (OOP).
 */
export class CategoriesPage {
    /**
     * @param {Object} appInstance - AdminApp main instance
     */
    constructor(appInstance) {
        this.app = appInstance;
    }

    /**
     * Kategoriler sayfasini render eder
     * @param {HTMLElement} container - Icerigin render edilecegi DOM elementi
     */
    async render(container) {
        this.container = container;

        let categories = AdminMockData.getDefaultCategories();
        try {
            categories = await ApiService.getCategories();
        } catch (error) {
            AdminToast.error('Kategoriler yuklenemedi.');
        }

        container.innerHTML = `
            <div class="page-header">
                <div class="page-header-left">
                    <h1>Kategoriler</h1>
                    <p>Yazılarınızı sınıflandırmak için kullanacağınız kategorileri yönetin.</p>
                </div>
                <button class="admin-btn admin-btn-primary" id="btn-new-category" type="button">
                    <i class="fas fa-plus" aria-hidden="true"></i> Yeni Kategori Ekle
                </button>
            </div>

            <!-- Kategoriler Grid -->
            <div class="category-grid">
                ${categories.map(cat => `
                    <div class="category-card" style="--cat-color: ${cat.color || '#E04E36'}" data-id="${cat.id}">
                        <div class="category-card-header">
                            <h3 class="category-card-name">${cat.name}</h3>
                            <div class="category-card-actions">
                                <button class="table-action-btn btn-edit-category" title="Düzenle" type="button">
                                    <i class="fas fa-edit" aria-hidden="true"></i>
                                </button>
                                <button class="table-action-btn danger btn-delete-category" title="Sil" type="button">
                                    <i class="fas fa-trash-alt" aria-hidden="true"></i>
                                </button>
                            </div>
                        </div>
                        <p class="category-card-desc">${cat.description || 'Bu kategori için açıklama girilmemiş.'}</p>
                        <div class="category-card-footer">
                            <span class="category-card-slug">${cat.slug}</span>
                            <span class="category-card-count">${cat.postCount} Yazı</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        this.bindEvents();
    }

    /**
     * Olay dinleyicilerini baglar
     */
    bindEvents() {
        if (!this.container) return;

        /* Yeni Kategori Butonu */
        const btnNew = this.container.querySelector('#btn-new-category');
        if (btnNew) {
            btnNew.addEventListener('click', () => this.openCategoryModal());
        }

        /* Duzenleme Butonlari */
        this.container.querySelectorAll('.btn-edit-category').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const card = e.target.closest('.category-card');
                const id = card.dataset.id;
                this.openCategoryModal(id);
            });
        });

        /* Silme Butonlari */
        this.container.querySelectorAll('.btn-delete-category').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const card = e.target.closest('.category-card');
                const id = card.dataset.id;
                this.confirmDeleteCategory(id);
            });
        });
    }

    /**
     * Yeni kategori ekleme veya duzenleme modalini acar
     * @param {string|null} catId - Kategori ID (null ise yeni ekle)
     */
    openCategoryModal(catId = null) {
        const isEdit = catId !== null;
        ApiService.getCategories().then(categories => {
            this._openCategoryModalWithData(catId, isEdit, categories);
        }).catch(() => AdminToast.error('Kategoriler yuklenemedi.'));
    }

    _openCategoryModalWithData(catId, isEdit, categories) {
        let cat = null;

        if (isEdit) {
            cat = categories.find(c => c.id === catId);
            if (!cat) {
                AdminToast.error('Kategori bulunamadı.');
                return;
            }
        }

        const contentHTML = `
            <form id="form-manage-category">
                <div class="admin-form-group">
                    <label class="admin-form-label" for="cat-name">Kategori Adı</label>
                    <input type="text" id="cat-name" name="name" class="admin-form-input" 
                        value="${isEdit ? cat.name : ''}" placeholder="Geliştirme, Tasarım vb..." required>
                </div>

                <div class="admin-form-group">
                    <label class="admin-form-label">Slug (URL Kimliği) Önerisi</label>
                    <div class="category-card-slug" id="cat-slug-preview" style="display:inline-block; font-size:0.85rem; padding:0.4rem 0.8rem; margin-bottom: 0.5rem;">
                        ${isEdit ? cat.slug : 'kategori-adi'}
                    </div>
                </div>

                <div class="admin-form-group">
                    <label class="admin-form-label" for="cat-description">Açıklama</label>
                    <textarea id="cat-description" name="description" class="admin-form-input" style="min-height: 80px; resize: vertical;" 
                        placeholder="Kategori hakkında kısa açıklama..." required>${isEdit ? cat.description : ''}</textarea>
                </div>

                <div class="admin-form-group">
                    <label class="admin-form-label" for="cat-color">Tema Rengi (HEX)</label>
                    <div class="admin-color-picker-wrapper">
                        <input type="color" id="cat-color" name="color" class="admin-color-picker" 
                            value="${isEdit ? cat.color : '#E04E36'}">
                        <span class="admin-color-value" id="cat-color-value">${isEdit ? cat.color : '#E04E36'}</span>
                    </div>
                </div>

                <div class="admin-modal-actions">
                    <button type="button" class="admin-btn admin-btn-secondary modal-cancel-btn">Vazgeç</button>
                    <button type="submit" class="admin-btn admin-btn-primary">Kaydet</button>
                </div>
            </form>
        `;

        const modalTitle = isEdit ? 'Kategoriyi Düzenle' : 'Yeni Kategori Ekle';
        const modal = new AdminModal('modal-manage-category', modalTitle, null, contentHTML);

        /* Vazgec butonu */
        const cancelBtn = modal.element.querySelector('.modal-cancel-btn');
        if (cancelBtn) cancelBtn.addEventListener('click', () => modal.close());

        /* Renk Picker Guncelleme Olayi */
        const colorInput = modal.element.querySelector('#cat-color');
        const colorValueText = modal.element.querySelector('#cat-color-value');
        if (colorInput && colorValueText) {
            colorInput.addEventListener('input', (e) => {
                colorValueText.textContent = e.target.value.toUpperCase();
            });
        }

        /* Dinamik Slug Onerisi */
        const nameInput = modal.element.querySelector('#cat-name');
        const slugPreview = modal.element.querySelector('#cat-slug-preview');
        if (nameInput && slugPreview) {
            nameInput.addEventListener('input', (e) => {
                const slug = this.generateSlug(e.target.value);
                slugPreview.textContent = slug || 'kategori-adi';
            });
        }

        /* Submit / Kaydet */
        modal.setSubmitHandler(async (formData) => {
            const slug = this.generateSlug(formData.name);
            if (!formData.name.trim() || !slug) {
                AdminToast.error('Geçersiz kategori adı.');
                return;
            }

            const nameExists = categories.some(c => c.name.toLowerCase() === formData.name.toLowerCase() && (!isEdit || c.id !== catId));
            if (nameExists) {
                AdminToast.error('Bu isimde bir kategori zaten mevcut.');
                return;
            }

            try {
                if (isEdit) {
                    await ApiService.updateCategory(catId, {
                        name: formData.name,
                        slug,
                        description: formData.description,
                        color: formData.color,
                    });
                    AdminToast.success('Kategori başarıyla güncellendi.');
                } else {
                    await ApiService.createCategory({
                        name: formData.name,
                        slug,
                        description: formData.description,
                        color: formData.color,
                    });
                    AdminToast.success('Yeni kategori başarıyla eklendi.');
                }
                modal.close();
                await this.render(this.container);
            } catch (error) {
                AdminToast.error(error.message);
            }
        });

        modal.open();
    }

    /**
     * Kategori silmek icin onay penceresi acar
     * @param {string} catId - Silinecek kategori ID'si
     */
    confirmDeleteCategory(catId) {
        ApiService.getCategories().then(async categories => {
            const cat = categories.find(c => c.id === catId);
            if (!cat) return;

            let message = `"${cat.name}" kategorisini silmek istediğinizden emin misiniz?`;
            if (cat.postCount > 0) {
                message += `<br><br><strong style="color:var(--admin-danger);">Dikkat:</strong> Bu kategoriye bağlı <strong>${cat.postCount} yazı</strong> var.`;
            }

            AdminModalFactory.createConfirmModal('Kategoriyi Sil', message, async () => {
                try {
                    await ApiService.deleteCategory(catId);
                    AdminToast.success('Kategori başarıyla silindi.');
                    await this.render(this.container);
                } catch (error) {
                    AdminToast.error(error.message);
                }
            }).open();
        });
    }

    /**
     * Metinden URL uyumlu slug uretir
     * @param {string} text - Girdi metni
     * @returns {string} Slug metni
     */
    generateSlug(text) {
        if (!text) return '';
        const trMap = {
            'ç': 'c', 'Ç': 'c', 'ğ': 'g', 'Ğ': 'g', 'ı': 'i', 'I': 'i',
            'İ': 'i', 'ö': 'o', 'Ö': 'o', 'ş': 's', 'Ş': 's', 'ü': 'u', 'Ü': 'u'
        };
        let slug = text.toString().toLowerCase().trim();
        for (let key in trMap) {
            slug = slug.replace(new RegExp(key, 'g'), trMap[key]);
        }
        return slug
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-')
            .replace(/^-+/, '')
            .replace(/-+$/, '');
    }

    logActivity() {}
}

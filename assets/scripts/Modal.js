/**
 * Modal - Genel modal pencere bileşeni
 */
export class Modal {
    constructor(id, title, description, contentHTML) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.contentHTML = contentHTML;
        this.element = null;
        this.createDOMElement();
    }

    createDOMElement() {
        const existing = document.getElementById(this.id);
        if (existing) {
            existing.remove();
        }

        const overlay = document.createElement('div');
        overlay.id = this.id;
        overlay.className = 'modal-overlay';
        
        overlay.innerHTML = `
            <div class="modal-container">
                <button class="modal-close" aria-label="Kapat">
                    <i class="fas fa-times"></i>
                </button>
                <h3 class="modal-title">${this.title}</h3>
                ${this.description ? `<p class="modal-desc">${this.description}</p>` : ''}
                <div class="modal-body-content">
                    ${this.contentHTML}
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        this.element = overlay;

        const closeBtn = overlay.querySelector('.modal-close');
        closeBtn.addEventListener('click', () => this.close());
        
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.close();
            }
        });
    }

    open() {
        setTimeout(() => {
            this.element.classList.add('active');
        }, 10);
    }

    close() {
        this.element.classList.remove('active');
        setTimeout(() => {
            this.element.remove();
        }, 400);
    }

    getFormValues() {
        const form = this.element.querySelector('form');
        if (!form) return {};
        const formData = new FormData(form);
        const values = {};
        for (let [key, val] of formData.entries()) {
            values[key] = this.sanitizeInput(val);
        }
        return values;
    }

    sanitizeInput(str) {
        if (typeof str !== 'string') return str;
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;');
    }

    setSubmitHandler(callback) {
        const form = this.element.querySelector('form');
        if (!form) return;
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            callback(this.getFormValues(), form);
        });
    }
}

/**
 * ModalFactory - Uygulama genelinde modalları üreten fabrika (Factory Pattern)
 */
export class ModalFactory {
    static createNewsletterModal(onSubmit) {
        const content = `
            <form id="form-newsletter">
                <div class="form-group">
                    <label class="form-label" for="news-name">İsim (İsteğe Bağlı)</label>
                    <input type="text" id="news-name" name="name" class="form-input" placeholder="Adınız">
                </div>
                <div class="form-group">
                    <label class="form-label" for="news-email">E-posta Adresi</label>
                    <input type="email" id="news-email" name="email" class="form-input" placeholder="isim@domain.com" required>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn-accent" style="border: none; cursor: pointer;">Kaydol</button>
                </div>
            </form>
        `;
        const modal = new Modal(
            'modal-newsletter',
            'Bültene Katıl',
            'En yeni tasarım ve kod keşiflerini doğrudan gelen kutunuza gönderelim. Spam yok, sadece odaklı içerik.',
            content
        );
        modal.setSubmitHandler((data) => {
            if (data.email) {
                onSubmit(data.email, data.name, modal);
            }
        });
        return modal;
    }

    static createContactModal(onSubmit) {
        const content = `
            <form id="form-contact">
                <div class="form-group">
                    <label class="form-label" for="contact-name">Adınız</label>
                    <input type="text" id="contact-name" name="name" class="form-input" placeholder="Adınız Soyadınız" required>
                </div>
                <div class="form-group">
                    <label class="form-label" for="contact-email">E-posta Adresiniz</label>
                    <input type="email" id="contact-email" name="email" class="form-input" placeholder="isim@domain.com" required>
                </div>
                <div class="form-group">
                    <label class="form-label" for="contact-message">Mesajınız</label>
                    <textarea id="contact-message" name="message" class="form-textarea" placeholder="Projeniz veya fikriniz hakkında yazın..." required></textarea>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn-accent" style="border: none; cursor: pointer;">Mesaj Gönder</button>
                </div>
            </form>
        `;
        const modal = new Modal(
            'modal-contact',
            'Benimle İletişime Geç',
            'Yeni bir proje, iş birliği veya sadece tasarım felsefesi üzerine sohbet etmek için mesaj bırakabilirsiniz.',
            content
        );
        modal.setSubmitHandler((data) => {
            if (data.name && data.email && data.message) {
                onSubmit(data, modal);
            }
        });
        return modal;
    }

    static createPostFormModal(title, postData, onSubmit) {
        const isEdit = !!postData;
        const categories = ['Derin Analiz', 'Geliştirme', 'Perspektif', 'Etkileşim Tasarımı', 'Ürün Tasarımı', 'Konsept'];
        
        const content = `
            <form id="form-post-manage">
                <div class="form-group">
                    <label class="form-label" for="post-form-title">Yazı Başlığı</label>
                    <input type="text" id="post-form-title" name="title" class="form-input" 
                        value="${isEdit ? postData.title : ''}" placeholder="Arayüzlerde Minimalizm..." required>
                </div>
                <div class="form-group">
                    <label class="form-label" for="post-form-category">Kategori</label>
                    <select id="post-form-category" name="category" class="form-select" required>
                        ${categories.map(c => `
                            <option value="${c}" ${(isEdit && postData.category === c) ? 'selected' : ''}>${c}</option>
                        `).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label" for="post-form-readtime">Okuma Süresi (örn. 8 dk okuma)</label>
                    <input type="text" id="post-form-readtime" name="readTime" class="form-input" 
                        value="${isEdit ? postData.readTime : '5 dk okuma'}" placeholder="8 dk okuma" required>
                </div>
                <div class="form-group">
                    <label class="form-label" for="post-form-lead">Özet / Lead Paragrafı</label>
                    <input type="text" id="post-form-lead" name="lead" class="form-input" 
                        value="${isEdit ? postData.lead : ''}" placeholder="Bu yazının kısa özeti..." required>
                </div>
                <div class="form-group">
                    <label class="form-label" for="post-form-body">İçerik (HTML destekli)</label>
                    <textarea id="post-form-body" name="body" class="form-textarea" style="min-height: 200px;" 
                        placeholder="&lt;p&gt;Yazı içeriği paragrafları...&lt;/p&gt;" required>${isEdit ? postData.body : ''}</textarea>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-secondary modal-cancel-btn">Vazgeç</button>
                    <button type="submit" class="btn-accent" style="border: none; cursor: pointer;">Kaydet</button>
                </div>
            </form>
        `;

        const modal = new Modal(
            'modal-post-manage',
            title,
            null,
            content
        );

        const cancelBtn = modal.element.querySelector('.modal-cancel-btn');
        cancelBtn.addEventListener('click', () => modal.close());

        modal.setSubmitHandler((data) => {
            if (data.title && data.category && data.lead && data.body) {
                onSubmit(data, modal);
            }
        });

        return modal;
    }

    static createConfirmModal(title, message, onConfirm) {
        const content = `
            <div class="confirm-message-text" style="margin-bottom: 2rem; line-height: 1.6; color: var(--c-text-secondary);">
                ${message}
            </div>
            <div class="form-actions">
                <button type="button" class="btn-secondary modal-cancel-btn">İptal</button>
                <button type="button" class="btn-accent modal-confirm-btn" style="border: none; cursor: pointer; background-color: var(--c-accent);">Onayla</button>
            </div>
        `;
        const modal = new Modal(
            'modal-confirm',
            title,
            null,
            content
        );

        const cancelBtn = modal.element.querySelector('.modal-cancel-btn');
        cancelBtn.addEventListener('click', () => modal.close());

        const confirmBtn = modal.element.querySelector('.modal-confirm-btn');
        confirmBtn.addEventListener('click', () => {
            onConfirm();
            modal.close();
        });

        return modal;
    }

    static createInfoModal(title, message) {
        const content = `
            <div style="margin-bottom: 2rem; line-height: 1.6; color: var(--c-text-secondary);">
                ${message}
            </div>
            <div class="form-actions">
                <button type="button" class="btn-accent modal-close-ok-btn" style="border: none; cursor: pointer;">Kapat</button>
            </div>
        `;
        const modal = new Modal(
            'modal-info',
            title,
            null,
            content
        );
        const okBtn = modal.element.querySelector('.modal-close-ok-btn');
        okBtn.addEventListener('click', () => modal.close());
        return modal;
    }
}

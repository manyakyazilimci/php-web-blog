/**
 * AdminModal - Admin paneline ozel modal pencere bileseni (OOP Tasarim).
 * admin.css ile tam uyumlu sinif yapilarini kullanir.
 */
export class AdminModal {
    /**
     * @param {string} id - Modal DOM kimligi
     * @param {string} title - Modal basligi
     * @param {string|null} description - Modal aciklamasi
     * @param {string} contentHTML - Form veya icerik HTML yapisi
     */
    constructor(id, title, description, contentHTML) {
        this.id = id;
        this.title = title;
        this.description = description || '';
        this.contentHTML = contentHTML;
        this.element = null;
        this.createDOMElement();
    }

    /**
     * Modal DOM elemanini olusturur ve body'ye ekler
     */
    createDOMElement() {
        const existing = document.getElementById(this.id);
        if (existing) {
            existing.remove();
        }

        const overlay = document.createElement('div');
        overlay.id = this.id;
        overlay.className = 'admin-modal-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-labelledby', `${this.id}-title`);

        overlay.innerHTML = `
            <div class="admin-modal">
                <button class="admin-modal-close" aria-label="Kapat" type="button">
                    <i class="fas fa-times" aria-hidden="true"></i>
                </button>
                <h3 id="${this.id}-title" class="admin-modal-title">${this.title}</h3>
                ${this.description ? `<p class="admin-modal-desc">${this.description}</p>` : ''}
                <div class="admin-modal-body">
                    ${this.contentHTML}
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        this.element = overlay;

        /* Olay dinleyicileri */
        const closeBtn = overlay.querySelector('.admin-modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }
        
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.close();
            }
        });
    }

    /**
     * Modali ekranda gosterir
     */
    open() {
        /* CSS animasyonunun tetiklenmesi icin hafif bir gecikme eklenir */
        setTimeout(() => {
            if (this.element) {
                this.element.classList.add('active');
            }
        }, 10);
    }

    /**
     * Modali kapatir ve DOM'dan temizler
     */
    close() {
        if (!this.element) return;
        this.element.classList.remove('active');
        
        /* Animasyon tamamlandiktan sonra DOM'dan kaldirilir */
        setTimeout(() => {
            if (this.element) {
                this.element.remove();
                this.element = null;
            }
        }, 350);
    }

    /**
     * Modal icindeki form verilerini sanitize ederek nesne olarak doner
     * @returns {Object} Form degerleri
     */
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

    /**
     * Kullanici girdilerini XSS'e karsi korumak icin temizler
     * @param {string} str - Girdi metni
     * @returns {string} Temizlenmis metin
     */
    sanitizeInput(str) {
        if (typeof str !== 'string') return str;
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
    }

    /**
     * Form submit olayini yakalar
     * @param {Function} callback - Submit sonrasi calisacak fonksiyon
     */
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
 * AdminModalFactory - Farkli modal turlerini olusturan fabrika sinifi (Factory Pattern)
 */
export class AdminModalFactory {
    /**
     * Onaylama modali olusturur
     * @param {string} title - Modal basligi
     * @param {string} message - Onay mesaji
     * @param {Function} onConfirm - Onaylandiginda calisacak fonksiyon
     * @returns {AdminModal} Modal nesnesi
     */
    static createConfirmModal(title, message, onConfirm) {
        const content = `
            <div class="confirm-message-text" style="margin-bottom: 2rem; color: var(--admin-text-secondary); font-size: 0.95rem;">
                ${message}
            </div>
            <div class="admin-modal-actions">
                <button type="button" class="admin-btn admin-btn-secondary modal-cancel-btn">Iptal</button>
                <button type="button" class="admin-btn admin-btn-danger modal-confirm-btn">Onayla</button>
            </div>
        `;
        
        const modal = new AdminModal('modal-admin-confirm', title, null, content);
        
        const cancelBtn = modal.element.querySelector('.modal-cancel-btn');
        if (cancelBtn) cancelBtn.addEventListener('click', () => modal.close());

        const confirmBtn = modal.element.querySelector('.modal-confirm-btn');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                onConfirm();
                modal.close();
            });
        }

        return modal;
    }

    /**
     * Bilgi modali olusturur
     * @param {string} title - Modal basligi
     * @param {string} message - Bilgilendirme mesaji
     * @returns {AdminModal} Modal nesnesi
     */
    static createInfoModal(title, message) {
        const content = `
            <div style="margin-bottom: 2rem; color: var(--admin-text-secondary); font-size: 0.95rem; line-height: 1.6;">
                ${message}
            </div>
            <div class="admin-modal-actions">
                <button type="button" class="admin-btn admin-btn-primary modal-ok-btn">Tamam</button>
            </div>
        `;
        
        const modal = new AdminModal('modal-admin-info', title, null, content);
        
        const okBtn = modal.element.querySelector('.modal-ok-btn');
        if (okBtn) okBtn.addEventListener('click', () => modal.close());
        
        return modal;
    }
}

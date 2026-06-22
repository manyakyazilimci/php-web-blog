/**
 * AdminToast - Yonetim paneli bildirim servisi (toast notifications).
 * Ekrana animasyonlu basari, hata, uyari ve bilgi mesajlari basar.
 */
export class AdminToast {
    /**
     * Toast container'ini dondurur, yoksa olusturur
     * @returns {HTMLElement} Toast container
     */
    static getContainer() {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container';
            container.setAttribute('aria-live', 'assertive');
            document.body.appendChild(container);
        }
        return container;
    }

    /**
     * Yeni bir toast bildirimi olusturur ve gosterir
     * @param {string} message - Bildirim mesaji
     * @param {string} type - Toast tipi ('success', 'error', 'warning', 'info')
     * @param {number} duration - Bildirimin ekranda kalma suresi (ms)
     */
    static show(message, type = 'success', duration = 4000) {
        const container = AdminToast.getContainer();
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        /* Tip bazli FontAwesome ikonlari */
        let iconClass = 'fa-check-circle';
        if (type === 'error') iconClass = 'fa-exclamation-circle';
        else if (type === 'warning') iconClass = 'fa-exclamation-triangle';
        else if (type === 'info') iconClass = 'fa-info-circle';

        toast.innerHTML = `
            <div class="toast-icon">
                <i class="fas ${iconClass}" aria-hidden="true"></i>
            </div>
            <div class="toast-message">${message}</div>
            <button class="toast-close" aria-label="Kapat" type="button">
                <i class="fas fa-times" aria-hidden="true"></i>
            </button>
        `;

        container.appendChild(toast);

        /* Kapatma butonu islevi */
        const closeBtn = toast.querySelector('.toast-close');
        let removeTimeout;

        const removeToast = () => {
            clearTimeout(removeTimeout);
            toast.classList.add('removing');
            /* Animasyon suresi sonunda DOM'dan kaldir */
            setTimeout(() => {
                toast.remove();
            }, 300);
        };

        if (closeBtn) {
            closeBtn.addEventListener('click', removeToast);
        }

        /* Belirlenen sure sonrasinda otomatik kapat */
        removeTimeout = setTimeout(removeToast, duration);
    }

    /**
     * Basari bildirimi
     * @param {string} message - Bildirim mesaji
     * @param {number} duration - Sure (ms)
     */
    static success(message, duration = 4000) {
        AdminToast.show(message, 'success', duration);
    }

    /**
     * Hata bildirimi
     * @param {string} message - Bildirim mesaji
     * @param {number} duration - Sure (ms)
     */
    static error(message, duration = 4000) {
        AdminToast.show(message, 'error', duration);
    }

    /**
     * Uyari bildirimi
     * @param {string} message - Bildirim mesaji
     * @param {number} duration - Sure (ms)
     */
    static warning(message, duration = 4000) {
        AdminToast.show(message, 'warning', duration);
    }

    /**
     * Bilgi bildirimi
     * @param {string} message - Bildirim mesaji
     * @param {number} duration - Sure (ms)
     */
    static info(message, duration = 4000) {
        AdminToast.show(message, 'info', duration);
    }
}

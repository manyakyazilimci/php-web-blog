/**
 * AdminStorageService - Admin paneli icin localStorage yoneticisi.
 * Blog tarafindaki StorageService ile ayni API'ya sahiptir,
 * ancak admin-spesifik key prefix'i kullanarak veri izolasyonu saglar.
 * 
 * Yan Etki: localStorage uzerinde okuma/yazma islemleri yapar.
 */
export class AdminStorageService {

    /** Tum admin anahtarlari icin kullanilan on ek */
    static PREFIX = 'nb_admin_';

    /**
     * localStorage'dan veri okur
     * @param {string} key - Okunacak veri anahtari (prefix otomatik eklenir)
     * @returns {*} JSON olarak parse edilmis veri veya null
     */
    static get(key) {
        if (!key || typeof key !== 'string') {
            return null;
        }

        try {
            const fullKey = AdminStorageService.PREFIX + key;
            const data = localStorage.getItem(fullKey);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            AdminStorageService.logError('Veri okuma hatasi', key, error);
            return null;
        }
    }

    /**
     * localStorage'a veri yazar
     * @param {string} key - Yazilacak veri anahtari (prefix otomatik eklenir)
     * @param {*} value - JSON serialize edilecek veri
     * @returns {boolean} Basarili ise true, hata varsa false
     */
    static set(key, value) {
        if (!key || typeof key !== 'string') {
            return false;
        }

        try {
            const fullKey = AdminStorageService.PREFIX + key;
            localStorage.setItem(fullKey, JSON.stringify(value));
            return true;
        } catch (error) {
            AdminStorageService.logError('Veri yazma hatasi', key, error);
            return false;
        }
    }

    /**
     * localStorage'dan belirtilen anahtari siler
     * @param {string} key - Silinecek veri anahtari (prefix otomatik eklenir)
     * @returns {boolean} Basarili ise true
     */
    static remove(key) {
        if (!key || typeof key !== 'string') {
            return false;
        }

        try {
            const fullKey = AdminStorageService.PREFIX + key;
            localStorage.removeItem(fullKey);
            return true;
        } catch (error) {
            AdminStorageService.logError('Veri silme hatasi', key, error);
            return false;
        }
    }

    /**
     * Admin prefix'ine ait tum verileri temizler
     * @returns {boolean} Basarili ise true
     */
    static clearAll() {
        try {
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const currentKey = localStorage.key(i);
                if (currentKey && currentKey.startsWith(AdminStorageService.PREFIX)) {
                    keysToRemove.push(currentKey);
                }
            }
            keysToRemove.forEach(k => localStorage.removeItem(k));
            return true;
        } catch (error) {
            AdminStorageService.logError('Toplu temizleme hatasi', 'clearAll', error);
            return false;
        }
    }

    /**
     * Hata loglama yardimcisi (production'da disable edilebilir)
     * @param {string} message - Hata mesaji
     * @param {string} key - Ilgili anahtar
     * @param {Error} error - Hata nesnesi
     */
    static logError(message, key, error) {
        // Production'da bu satir kaldirilabilir
        if (typeof console !== 'undefined') {
            console.error(`[AdminStorage] ${message} (key: ${key}):`, error);
        }
    }
}

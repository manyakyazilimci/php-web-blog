/**
 * StorageService - LocalStorage veri yöneticisi
 */
export class StorageService {
    static get(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Storage read error:', error);
            return null;
        }
    }

    static set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Storage write error:', error);
            return false;
        }
    }
}

import { StorageService } from './StorageService.js';

/**
 * ThemeManager - Aydınlık ve Koyu mod yönetimi
 */
export class ThemeManager {
    constructor() {
        this.storageKey = 'nb_blog_theme';
        this.currentTheme = 'theme-light';
        this.init();
    }

    init() {
        const stored = StorageService.get(this.storageKey);
        if (stored) {
            this.currentTheme = stored;
        } else {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            this.currentTheme = prefersDark ? 'theme-dark' : 'theme-light';
        }
        this.applyTheme();
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'theme-light' ? 'theme-dark' : 'theme-light';
        this.applyTheme();
        StorageService.set(this.storageKey, this.currentTheme);
    }

    applyTheme() {
        document.body.className = this.currentTheme;
        
        const toggleBtn = document.getElementById('theme-toggle');
        if (toggleBtn) {
            const icon = toggleBtn.querySelector('i');
            if (icon) {
                if (this.currentTheme === 'theme-dark') {
                    icon.className = 'fas fa-sun';
                } else {
                    icon.className = 'fas fa-moon';
                }
            }
        }
    }
}

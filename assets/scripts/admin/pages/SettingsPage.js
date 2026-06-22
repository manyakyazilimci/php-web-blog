import { ApiService } from '../../ApiService.js';
import { AdminMockData } from '../AdminMockData.js';
import { AdminToast } from '../AdminToast.js';

/**
 * SettingsPage - Yonetim paneli sistem ayarlari bileseni (OOP).
 */
export class SettingsPage {
    /**
     * @param {Object} appInstance - AdminApp main instance
     */
    constructor(appInstance) {
        this.app = appInstance;
        this.sharedStorageKey = 'nb_site_settings';
    }

    /**
     * Ayarlar sayfasini render eder
     * @param {HTMLElement} container - Icerigin render edilecegi DOM elementi
     */
    async render(container) {
        this.container = container;

        let settings = AdminMockData.getDefaultSettings();
        try {
            settings = await ApiService.getSettings();
        } catch { /* varsayilan */ }

        container.innerHTML = `
            <div class="page-header">
                <div class="page-header-left">
                    <h1>Sistem Ayarları</h1>
                    <p>Sitenizin meta bilgilerini, tema renklerini ve erişilebilirlik tercihlerini buradan yönetin.</p>
                </div>
            </div>

            <form id="form-settings-page">
                <div class="settings-grid">
                    <!-- Sol Kolon: Genel Ayarlar -->
                    <div class="settings-section">
                        <h2 class="settings-section-title">Genel Ayarlar</h2>
                        
                        <div class="admin-form-group">
                            <label class="admin-form-label" for="settings-sitename">Site Adı</label>
                            <input type="text" id="settings-sitename" name="siteName" class="admin-form-input"
                                value="${settings.siteName}" placeholder="Nurullah B. Dijital Günlük" required>
                        </div>

                        <div class="admin-form-group">
                            <label class="admin-form-label" for="settings-sitedesc">Site Açıklaması (Meta Description)</label>
                            <textarea id="settings-sitedesc" name="siteDescription" class="admin-form-input" style="min-height: 80px;"
                                placeholder="Arama motorlarında görünecek açıklama..." required>${settings.siteDescription}</textarea>
                        </div>

                        <div class="admin-form-group">
                            <label class="admin-form-label" for="settings-logotext">Logo Metni</label>
                            <input type="text" id="settings-logotext" name="logoText" class="admin-form-input" 
                                value="${settings.logoText}" placeholder="NB." required>
                        </div>

                        <div class="admin-form-group">
                            <label class="admin-form-label" for="settings-copyright">Telif Hakkı (Copyright) Metni</label>
                            <input type="text" id="settings-copyright" name="copyrightText" class="admin-form-input" 
                                value="${settings.copyrightText}" placeholder="&copy; 2026 Nurullah B." required>
                        </div>
                    </div>

                    <!-- Sag Kolon: Sistem ve Tema Tercihleri -->
                    <div class="settings-section">
                        <h2 class="settings-section-title">Tema ve Görünüm Ayarları</h2>

                        <!-- Tema Rengi Picker -->
                        <div class="admin-form-group">
                            <label class="admin-form-label" for="settings-themecolor">Accent (Vurgu) Rengi</label>
                            <div class="admin-color-picker-wrapper">
                                <input type="color" id="settings-themecolor" name="themeColor" class="admin-color-picker" 
                                    value="${settings.themeColor}">
                                <span class="admin-color-value" id="settings-themecolor-value">${settings.themeColor}</span>
                            </div>
                            <div class="admin-form-hint">Sitenin tüm buton, rozet ve bağlantı vurgularını bu renk belirler.</div>
                        </div>

                        <!-- Kart Gorunumu Secici -->
                        <div class="admin-form-group">
                            <label class="admin-form-label" for="settings-cardview">Blog Liste Tasarimi</label>
                            <select id="settings-cardview" name="cardView" class="admin-form-select" required>
                                <option value="bento" ${settings.cardView === 'bento' ? 'selected' : ''}>Bento Izgara (Estetik)</option>
                                <option value="standard" ${settings.cardView === 'standard' ? 'selected' : ''}>Standart Kart Liste</option>
                            </select>
                        </div>

                        <!-- Dark Mode Switch -->
                        <div class="admin-toggle-wrapper">
                            <div class="admin-toggle-info">
                                <div class="admin-toggle-label">Koyu Tema (Dark Mode)</div>
                                <div class="admin-toggle-desc">Yönetim panelini ve genel blog sitesini koyu tonda görüntüler.</div>
                            </div>
                            <label class="admin-toggle" for="settings-darkmode">
                                <input type="checkbox" id="settings-darkmode" name="darkModeChecked" ${settings.darkMode ? 'checked' : ''}>
                                <span class="admin-toggle-slider"></span>
                            </label>
                        </div>

                        <!-- Site Aktif / Pasif Switch -->
                        <div class="admin-toggle-wrapper">
                            <div class="admin-toggle-info">
                                <div class="admin-toggle-label">Siteyi Yayına Al</div>
                                <div class="admin-toggle-desc">Pasif edildiğinde genel ziyaretçilere "Bakım Modu" sayfası gösterilir.</div>
                            </div>
                            <label class="admin-toggle" for="settings-siteactive">
                                <input type="checkbox" id="settings-siteactive" name="siteActiveChecked" ${settings.siteActive ? 'checked' : ''}>
                                <span class="admin-toggle-slider"></span>
                            </label>
                        </div>
                    </div>
                </div>

                <div class="admin-form-actions" style="margin-top: 1.5rem; background: var(--admin-surface); padding: 1.5rem 2rem; border-radius: var(--admin-radius-xl); border: 1px solid var(--admin-border);">
                    <button type="submit" class="admin-btn admin-btn-primary">
                        <i class="fas fa-save" aria-hidden="true"></i> Ayarları Kaydet
                    </button>
                </div>
            </form>
        `;

        this.bindEvents(settings);
    }

    /**
     * Olay dinleyicilerini baglar
     * @param {Object} currentSettings - Mevcut ayarlar nesnesi
     */
    bindEvents(currentSettings) {
        if (!this.container) return;

        const form = this.container.querySelector('#form-settings-page');
        const colorInput = this.container.querySelector('#settings-themecolor');
        const colorValueText = this.container.querySelector('#settings-themecolor-value');
        const darkModeToggle = this.container.querySelector('#settings-darkmode');

        /* Renk Secici Degisim Olayi */
        if (colorInput && colorValueText) {
            colorInput.addEventListener('input', (e) => {
                const color = e.target.value.toUpperCase();
                colorValueText.textContent = color;
                
                /* Canli vurgu rengi onizlemesi (Admin panelinde) */
                document.documentElement.style.setProperty('--admin-accent', color);
            });
        }

        /* Dark Mode Switch Canli Geri Bildirim */
        if (darkModeToggle) {
            darkModeToggle.addEventListener('change', (e) => {
                const isChecked = e.target.checked;
                document.body.classList.toggle('admin-theme-dark', isChecked);
                document.body.classList.toggle('admin-theme-light', !isChecked);
            });
        }

        /* Form Kaydetme Olayi */
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();

                const formData = new FormData(form);
                const updatedSettings = {
                    siteName: formData.get('siteName').trim(),
                    siteDescription: formData.get('siteDescription').trim(),
                    logoText: formData.get('logoText').trim(),
                    copyrightText: formData.get('copyrightText').trim(),
                    themeColor: formData.get('themeColor'),
                    cardView: formData.get('cardView'),
                    darkMode: form.querySelector('#settings-darkmode').checked,
                    siteActive: form.querySelector('#settings-siteactive').checked
                };

                try {
                    await ApiService.updateSettings(updatedSettings);
                    this.app.settings = updatedSettings;
                    this.app.applyThemeSettings(updatedSettings);
                    this.app.applyAdminMeta();
                    AdminToast.success('Sistem ayarları başarıyla kaydedildi.');
                    await this.render(this.container);
                } catch (error) {
                    AdminToast.error(error.message);
                }
            });
        }
    }

    saveSettings(data) {
        return ApiService.updateSettings(data);
    }

    logActivity() {}
}

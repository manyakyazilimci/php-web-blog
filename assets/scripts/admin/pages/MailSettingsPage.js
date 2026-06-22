import { ApiService } from '../../ApiService.js';

export class MailSettingsPage {
    constructor(adminApp) {
        this.adminApp = adminApp;
        this.settings = {};
    }

    async render(container) {
        container.innerHTML = `
            <div class="admin-page-header">
                <h1 class="admin-page-title">E-posta Ayarları</h1>
                <p class="admin-page-subtitle">SMTP ve e-posta gönderim ayarlarını yapılandırın</p>
            </div>
            <div class="admin-content-area">
                <form id="mail-settings-form" class="admin-form">
                    <div class="admin-form-section">
                        <h3 class="admin-form-section-title">SMTP Ayarları</h3>
                        
                        <div class="admin-form-group">
                            <label class="admin-form-label" for="smtp-host">SMTP Host</label>
                            <input type="text" id="smtp-host" name="smtpHost" class="admin-input" placeholder="smtp.gmail.com">
                        </div>

                        <div class="admin-form-group">
                            <label class="admin-form-label" for="smtp-port">SMTP Port</label>
                            <input type="number" id="smtp-port" name="smtpPort" class="admin-input" placeholder="587" value="587">
                        </div>

                        <div class="admin-form-group">
                            <label class="admin-form-label" for="smtp-username">SMTP Kullanıcı Adı</label>
                            <input type="text" id="smtp-username" name="smtpUsername" class="admin-input" placeholder="email@domain.com">
                        </div>

                        <div class="admin-form-group">
                            <label class="admin-form-label" for="smtp-password">SMTP Şifre</label>
                            <input type="password" id="smtp-password" name="smtpPassword" class="admin-input" placeholder="••••••••">
                        </div>

                        <div class="admin-form-group">
                            <label class="admin-form-label" for="smtp-encryption">Şifreleme</label>
                            <select id="smtp-encryption" name="smtpEncryption" class="admin-select">
                                <option value="tls">TLS</option>
                                <option value="ssl">SSL</option>
                                <option value="none">Yok</option>
                            </select>
                        </div>
                    </div>

                    <div class="admin-form-section">
                        <h3 class="admin-form-section-title">Gönderici Bilgileri</h3>
                        
                        <div class="admin-form-group">
                            <label class="admin-form-label" for="from-email">Gönderici E-posta</label>
                            <input type="email" id="from-email" name="fromEmail" class="admin-input" placeholder="noreply@domain.com">
                        </div>

                        <div class="admin-form-group">
                            <label class="admin-form-label" for="from-name">Gönderici İsmi</label>
                            <input type="text" id="from-name" name="fromName" class="admin-input" placeholder="Nurullah B.">
                        </div>

                        <div class="admin-form-group">
                            <label class="admin-form-label" for="reply-to-email">Yanıtlama Adresi (Reply-To)</label>
                            <input type="email" id="reply-to-email" name="replyToEmail" class="admin-input" placeholder="contact@domain.com">
                        </div>
                    </div>

                    <div class="admin-form-actions">
                        <button type="submit" class="admin-btn admin-btn-primary">
                            <i class="fas fa-save"></i>
                            Ayarları Kaydet
                        </button>
                    </div>
                </form>
            </div>
        `;

        await this.loadSettings();
        this.bindEvents(container);
    }

    async loadSettings() {
        try {
            this.settings = await ApiService.getMailSettings();
            this.populateForm();
        } catch (err) {
            console.error('Ayarlar yüklenemedi:', err);
        }
    }

    populateForm() {
        const form = document.getElementById('mail-settings-form');
        if (!form) return;

        if (this.settings.smtpHost) form.querySelector('[name="smtpHost"]').value = this.settings.smtpHost;
        if (this.settings.smtpPort) form.querySelector('[name="smtpPort"]').value = this.settings.smtpPort;
        if (this.settings.smtpUsername) form.querySelector('[name="smtpUsername"]').value = this.settings.smtpUsername;
        if (this.settings.smtpPassword) form.querySelector('[name="smtpPassword"]').value = this.settings.smtpPassword;
        if (this.settings.smtpEncryption) form.querySelector('[name="smtpEncryption"]').value = this.settings.smtpEncryption;
        if (this.settings.fromEmail) form.querySelector('[name="fromEmail"]').value = this.settings.fromEmail;
        if (this.settings.fromName) form.querySelector('[name="fromName"]').value = this.settings.fromName;
        if (this.settings.replyToEmail) form.querySelector('[name="replyToEmail"]').value = this.settings.replyToEmail;
    }

    bindEvents(container) {
        const form = container.querySelector('#mail-settings-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.saveSettings();
            });
        }
    }

    async saveSettings() {
        const form = document.getElementById('mail-settings-form');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
            await ApiService.updateMailSettings(data);
        } catch (err) {
            console.error('Ayarlar kaydedilemedi:', err);
        }
    }
}

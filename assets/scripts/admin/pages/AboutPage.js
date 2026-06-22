import { ApiService } from '../../ApiService.js';
import { AdminMockData } from '../AdminMockData.js';
import { AdminToast } from '../AdminToast.js';

/**
 * AboutPage - Yönetim paneli hakkımda sayfası düzenleme bileşeni (OOP).
 */
export class AboutPage {
    /**
     * @param {Object} appInstance - AdminApp main instance
     */
    constructor(appInstance) {
        this.app = appInstance;
        this.sharedStorageKey = 'nb_about_info';
    }

    /**
     * Hakkımda sayfasını render eder
     * @param {HTMLElement} container - İçeriğin render edileceği DOM elementi
     */
    async render(container) {
        this.container = container;

        let aboutInfo = AdminMockData.getDefaultAboutInfo();
        try {
            const data = await ApiService.getAbout();
            if (data && data.title) aboutInfo = data;
        } catch { /* varsayilan */ }

        container.innerHTML = `
            <div class="page-header">
                <div class="page-header-left">
                    <h1>Hakkımda Sayfası</h1>
                    <p>Genel blog ana sayfasındaki hakkımda bölümünü ve sosyal medya bağlantılarını düzenleyin.</p>
                </div>
            </div>

            <div class="about-edit-layout">
                <!-- Sol Taraf: Profil Fotoğrafı Yönetimi -->
                <div class="about-photo-section">
                    <div class="admin-form-label" style="margin-bottom: 1rem;">Profil Fotoğrafı</div>
                    <div class="about-photo-preview" id="profile-photo-preview">
                        ${aboutInfo.profilePhoto ? `
                            <img src="${aboutInfo.profilePhoto}" alt="Profil Fotoğrafı" style="width:100%; height:100%; object-fit:cover;">
                        ` : 'NB'}
                    </div>
                    
                    <!-- File input ve trigger butonu -->
                    <input type="file" id="profile-photo-input" accept="image/*" style="display: none;">
                    <button class="admin-btn admin-btn-secondary" id="btn-upload-photo" type="button" style="width:100%; justify-content:center; margin-bottom:0.75rem;">
                        <i class="fas fa-camera" aria-hidden="true"></i> Fotoğraf Değiştir
                    </button>
                    ${aboutInfo.profilePhoto ? `
                        <button class="admin-btn admin-btn-danger admin-btn-sm" id="btn-remove-photo" type="button" style="width:100%; justify-content:center;">
                            <i class="fas fa-trash" aria-hidden="true"></i> Fotoğrafı Kaldır
                        </button>
                    ` : ''}
                    <div class="admin-form-hint" style="margin-top: 1rem;">Maksimum 1 MB boyutunda görsel yükleyin.</div>
                </div>

                <!-- Sağ Taraf: Metin Alanları ve Linkler -->
                <div class="about-form-section">
                    <form id="form-about-settings">
                        <div class="admin-form-group">
                            <label class="admin-form-label" for="about-title">Başlık (Karşılama Metni)</label>
                            <input type="text" id="about-title" name="title" class="admin-form-input" 
                                value="${aboutInfo.title}" placeholder="Merhaba, ben..." required>
                        </div>

                        <div class="admin-form-group">
                            <label class="admin-form-label" for="about-subtitle">Alt Başlık (Meslek / Kısa Tanım)</label>
                            <input type="text" id="about-subtitle" name="subtitle" class="admin-form-input" 
                                value="${aboutInfo.subtitle}" placeholder="Dijital dünyada..." required>
                        </div>

                        <div class="admin-form-group">
                            <label class="admin-form-label" for="about-description">Detaylı Açıklama (Hakkımda Metni)</label>
                            <textarea id="about-description" name="description" class="admin-form-input" style="min-height: 120px;" 
                                placeholder="Tasarım felsefeniz, deneyimleriniz..." required>${aboutInfo.description}</textarea>
                        </div>

                        <div class="admin-form-row">
                            <div class="admin-form-group">
                                <label class="admin-form-label" for="about-twitter">Twitter URL</label>
                                <input type="text" id="about-twitter" name="twitterUrl" class="admin-form-input" 
                                    value="${aboutInfo.twitterUrl}" placeholder="https://twitter.com/..." required>
                            </div>
                            <div class="admin-form-group">
                                <label class="admin-form-label" for="about-github">GitHub URL</label>
                                <input type="text" id="about-github" name="githubUrl" class="admin-form-input" 
                                    value="${aboutInfo.githubUrl}" placeholder="https://github.com/..." required>
                            </div>
                        </div>

                        <div class="admin-form-row">
                            <div class="admin-form-group">
                                <label class="admin-form-label" for="about-linkedin">LinkedIn URL</label>
                                <input type="text" id="about-linkedin" name="linkedinUrl" class="admin-form-input" 
                                    value="${aboutInfo.linkedinUrl}" placeholder="https://linkedin.com/in/..." required>
                            </div>
                            <div class="admin-form-group">
                                <label class="admin-form-label" for="about-contact-text">İletişim Buton Metni</label>
                                <input type="text" id="about-contact-text" name="contactButtonText" class="admin-form-input" 
                                    value="${aboutInfo.contactButtonText}" placeholder="Benimle İletişime Geç" required>
                            </div>
                        </div>

                        <div class="admin-form-actions">
                            <button type="submit" class="admin-btn admin-btn-primary">Değişiklikleri Kaydet</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        this.bindEvents(aboutInfo);
    }

    /**
     * Olay dinleyicilerini bağlar
     * @param {Object} currentInfo - Mevcut hakkımda bilgileri
     */
    bindEvents(currentInfo) {
        if (!this.container) return;

        const photoInput = this.container.querySelector('#profile-photo-input');
        const uploadBtn = this.container.querySelector('#btn-upload-photo');
        const removeBtn = this.container.querySelector('#btn-remove-photo');
        const form = this.container.querySelector('#form-about-settings');

        /* Fotoğraf Değiştir Butonu tetikleyici */
        if (uploadBtn && photoInput) {
            uploadBtn.addEventListener('click', () => {
                photoInput.click();
            });
        }

        /* Fotoğraf Seçildiğinde */
        if (photoInput) {
            photoInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                if (file.size > 2 * 1024 * 1024) {
                    AdminToast.error('Görsel boyutu 2 MB\'tan büyük olamaz.');
                    photoInput.value = '';
                    return;
                }

                try {
                    const result = await ApiService.uploadFile(file);
                    currentInfo.profilePhoto = result.url;
                    await this.saveAboutInfo(currentInfo);
                    AdminToast.success('Profil fotoğrafı güncellendi.');
                    await this.render(this.container);
                } catch (error) {
                    AdminToast.error(error.message);
                }
            });
        }

        if (removeBtn) {
            removeBtn.addEventListener('click', async () => {
                currentInfo.profilePhoto = null;
                await this.saveAboutInfo(currentInfo);
                AdminToast.success('Profil fotoğrafı kaldırıldı.');
                await this.render(this.container);
            });
        }

        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(form);
                const updatedInfo = {
                    ...currentInfo,
                    title: formData.get('title').trim(),
                    subtitle: formData.get('subtitle').trim(),
                    description: formData.get('description').trim(),
                    twitterUrl: formData.get('twitterUrl').trim(),
                    githubUrl: formData.get('githubUrl').trim(),
                    linkedinUrl: formData.get('linkedinUrl').trim(),
                    contactButtonText: formData.get('contactButtonText').trim()
                };

                try {
                    await this.saveAboutInfo(updatedInfo);
                    AdminToast.success('Hakkımda bilgileri başarıyla kaydedildi.');
                    await this.render(this.container);
                } catch (error) {
                    AdminToast.error(error.message);
                }
            });
        }
    }

    saveAboutInfo(data) {
        return ApiService.updateAbout(data);
    }

    logActivity() {}
}

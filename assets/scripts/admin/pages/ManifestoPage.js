import { ApiService } from '../../ApiService.js';
import { AdminToast } from '../AdminToast.js';
import { RichEditor } from '../RichEditor.js';

/**
 * ManifestoPage - Manifesto icerigini duzenleme
 */
export class ManifestoPage {
    constructor(appInstance) {
        this.app = appInstance;
    }

    async render(container) {
        this.container = container;

        let data = {
            title: 'Tasarım Manifestosu',
            subtitle: '',
            intro: '',
            principles: [],
            closingTitle: 'Son Söz',
            closingText: '',
            signature: '',
        };

        try {
            const apiData = await ApiService.getManifesto();
            if (apiData && Object.keys(apiData).length > 0) {
                data = { ...data, ...apiData };
            }
        } catch (error) {
            AdminToast.error('Manifesto yuklenemedi: ' + error.message);
        }

        this.container.innerHTML = `
            <div class="page-header">
                <div class="page-header-left">
                    <h1>Manifesto</h1>
                    <p>Manifesto sayfasinin baslik, ilkeler ve kapanis metinlerini duzenleyin.</p>
                </div>
            </div>

            <form id="form-manifesto">
                <div class="admin-card" style="margin-bottom:1.5rem;">
                    <div class="admin-card-header"><h2 class="admin-card-title">Baslik Bilgileri</h2></div>
                    <div class="admin-card-body" style="display:flex;flex-direction:column;gap:1.25rem;">
                        <div class="admin-form-group">
                            <label class="admin-form-label" for="manifesto-title">Baslik</label>
                            <input type="text" id="manifesto-title" class="admin-form-input" required>
                        </div>
                        <div class="admin-form-group">
                            <label class="admin-form-label" for="manifesto-subtitle">Alt Baslik</label>
                            <input type="text" id="manifesto-subtitle" class="admin-form-input">
                        </div>
                    </div>
                </div>

                <div class="admin-card" style="margin-bottom:1.5rem;">
                    <div class="admin-card-header"><h2 class="admin-card-title">Giris Metni</h2></div>
                    <div class="admin-card-body">
                        <textarea id="manifesto-intro-editor"></textarea>
                    </div>
                </div>

                <div class="admin-card" style="margin-bottom:1.5rem;">
                    <div class="admin-card-header" style="display:flex;justify-content:space-between;align-items:center;">
                        <h2 class="admin-card-title">Ilkeler</h2>
                        <button type="button" class="admin-btn admin-btn-secondary admin-btn-sm" id="btn-add-principle">
                            <i class="fas fa-plus"></i> Ilke Ekle
                        </button>
                    </div>
                    <div class="admin-card-body" id="principles-list"></div>
                </div>

                <div class="admin-card" style="margin-bottom:1.5rem;">
                    <div class="admin-card-header"><h2 class="admin-card-title">Kapanis</h2></div>
                    <div class="admin-card-body" style="display:flex;flex-direction:column;gap:1.25rem;">
                        <div class="admin-form-group">
                            <label class="admin-form-label" for="manifesto-closing-title">Kapanis Basligi</label>
                            <input type="text" id="manifesto-closing-title" class="admin-form-input">
                        </div>
                        <div class="admin-form-group">
                            <label class="admin-form-label">Kapanis Metni</label>
                            <textarea id="manifesto-closing-editor"></textarea>
                        </div>
                        <div class="admin-form-group">
                            <label class="admin-form-label" for="manifesto-signature">Imza</label>
                            <input type="text" id="manifesto-signature" class="admin-form-input">
                        </div>
                    </div>
                </div>

                <div class="admin-form-actions">
                    <button type="submit" class="admin-btn admin-btn-primary"><i class="fas fa-save"></i> Kaydet</button>
                </div>
            </form>
        `;

        this.container.querySelector('#manifesto-title').value = data.title || '';
        this.container.querySelector('#manifesto-subtitle').value = data.subtitle || '';
        this.container.querySelector('#manifesto-closing-title').value = data.closingTitle || 'Son Söz';
        this.container.querySelector('#manifesto-signature').value = data.signature || '';
        this.container.querySelector('#principles-list').innerHTML = this.renderPrinciples(data.principles);

        this.bindEvents();
        this.initEditors(data);
    }

    async initEditors(data) {
        try {
            await RichEditor.create('#manifesto-intro-editor', {
                height: 220,
                initialContent: data.intro || '',
            });
            await RichEditor.create('#manifesto-closing-editor', {
                height: 220,
                initialContent: data.closingText || '',
            });
        } catch (error) {
            AdminToast.error('Metin editoru yuklenemedi. Plain text ile devam edebilirsiniz.');
            const intro = this.container.querySelector('#manifesto-intro-editor');
            const closing = this.container.querySelector('#manifesto-closing-editor');
            if (intro) {
                intro.value = data.intro || '';
                intro.style.minHeight = '120px';
                intro.className = 'admin-form-input';
            }
            if (closing) {
                closing.value = data.closingText || '';
                closing.style.minHeight = '120px';
                closing.className = 'admin-form-input';
            }
        }
    }

    renderPrinciples(principles) {
        if (!principles || principles.length === 0) {
            return '<p style="color:var(--admin-text-muted);font-size:0.9rem;">Henuz ilke eklenmedi.</p>';
        }
        return principles.map((p, i) => `
            <div class="principle-edit-item" data-index="${i}" style="border:1px solid var(--admin-border);border-radius:var(--admin-radius-md);padding:1.25rem;margin-bottom:1rem;">
                <div style="display:flex;justify-content:space-between;margin-bottom:1rem;">
                    <strong>Ilke #${i + 1}</strong>
                    <button type="button" class="table-action-btn danger btn-remove-principle" title="Sil"><i class="fas fa-trash-alt"></i></button>
                </div>
                <div class="admin-form-row" style="display:grid;grid-template-columns:80px 1fr;gap:1rem;margin-bottom:0.75rem;">
                    <div class="admin-form-group">
                        <label class="admin-form-label">No</label>
                        <input type="text" class="admin-form-input principle-number" value="${this.esc(p.number || String(i + 1).padStart(2, '0'))}">
                    </div>
                    <div class="admin-form-group">
                        <label class="admin-form-label">Baslik</label>
                        <input type="text" class="admin-form-input principle-title" value="${this.esc(p.title || '')}">
                    </div>
                </div>
                <div class="admin-form-group">
                    <label class="admin-form-label">Metin</label>
                    <textarea class="admin-form-input principle-text" style="min-height:80px;">${this.esc(p.text || '')}</textarea>
                </div>
            </div>
        `).join('');
    }

    bindEvents() {
        this.container.querySelector('#btn-add-principle')?.addEventListener('click', () => {
            const list = this.container.querySelector('#principles-list');
            const items = list.querySelectorAll('.principle-edit-item');
            const num = String(items.length + 1).padStart(2, '0');
            const div = document.createElement('div');
            div.className = 'principle-edit-item';
            div.style.cssText = 'border:1px solid var(--admin-border);border-radius:var(--admin-radius-md);padding:1.25rem;margin-bottom:1rem;';
            div.innerHTML = `
                <div style="display:flex;justify-content:space-between;margin-bottom:1rem;">
                    <strong>Yeni Ilke</strong>
                    <button type="button" class="table-action-btn danger btn-remove-principle" title="Sil"><i class="fas fa-trash-alt"></i></button>
                </div>
                <div class="admin-form-row" style="display:grid;grid-template-columns:80px 1fr;gap:1rem;margin-bottom:0.75rem;">
                    <div class="admin-form-group"><label class="admin-form-label">No</label><input type="text" class="admin-form-input principle-number" value="${num}"></div>
                    <div class="admin-form-group"><label class="admin-form-label">Baslik</label><input type="text" class="admin-form-input principle-title" value=""></div>
                </div>
                <div class="admin-form-group"><label class="admin-form-label">Metin</label><textarea class="admin-form-input principle-text" style="min-height:80px;"></textarea></div>
            `;
            if (list.querySelector('p')) list.innerHTML = '';
            list.appendChild(div);
            div.querySelector('.btn-remove-principle')?.addEventListener('click', () => div.remove());
        });

        this.container.querySelectorAll('.btn-remove-principle').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.principle-edit-item')?.remove();
            });
        });

        this.container.querySelector('#form-manifesto')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const principles = [];
            this.container.querySelectorAll('.principle-edit-item').forEach(item => {
                principles.push({
                    number: item.querySelector('.principle-number')?.value.trim() || '',
                    title: item.querySelector('.principle-title')?.value.trim() || '',
                    text: item.querySelector('.principle-text')?.value.trim() || '',
                });
            });

            const payload = {
                title: this.container.querySelector('#manifesto-title')?.value.trim(),
                subtitle: this.container.querySelector('#manifesto-subtitle')?.value.trim(),
                intro: RichEditor.getContent('#manifesto-intro-editor'),
                principles,
                closingTitle: this.container.querySelector('#manifesto-closing-title')?.value.trim(),
                closingText: RichEditor.getContent('#manifesto-closing-editor'),
                signature: this.container.querySelector('#manifesto-signature')?.value.trim(),
            };

            try {
                await ApiService.updateManifesto(payload);
                AdminToast.success('Manifesto kaydedildi.');
            } catch (error) {
                AdminToast.error(error.message);
            }
        });
    }

    esc(str) {
        if (typeof str !== 'string') return '';
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
}

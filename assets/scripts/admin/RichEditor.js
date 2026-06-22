import { ApiService } from '../ApiService.js';

/**
 * RichEditor - TinyMCE tabanli profesyonel WYSIWYG editör
 */
export class RichEditor {
    static loaded = false;
    static loadPromise = null;

    static hasTinyMCE() {
        return typeof window !== 'undefined' && window.tinymce;
    }

    static loadTinyMCE() {
        if (this.hasTinyMCE()) {
            this.loaded = true;
            return Promise.resolve();
        }
        if (this.loadPromise) return this.loadPromise;

        this.loadPromise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/tinymce@6.8.3/tinymce.min.js';
            script.referrerPolicy = 'origin';
            script.onload = () => {
                this.loaded = true;
                resolve();
            };
            script.onerror = () => reject(new Error('TinyMCE yuklenemedi'));
            document.head.appendChild(script);
        });

        return this.loadPromise;
    }

    static async create(selector, options = {}) {
        await this.loadTinyMCE();

        if (!this.hasTinyMCE()) {
            throw new Error('TinyMCE yuklenemedi');
        }

        const editorId = selector.replace('#', '');
        const existing = window.tinymce.get(editorId);
        if (existing) {
            existing.remove();
        }

        const height = options.height || 420;
        const initialContent = options.initialContent || '';

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Editor zaman asimina ugradi'));
            }, 20000);

            const config = {
                selector,
                height,
                menubar: 'edit insert view format table tools',
                plugins: 'lists link image table code fullscreen wordcount autolink',
                toolbar: [
                    'undo redo | blocks fontsize | bold italic underline strikethrough',
                    'forecolor backcolor | alignleft aligncenter alignright alignjustify',
                    'bullist numlist outdent indent | link image table | removeformat code fullscreen'
                ].join(' | '),
                block_formats: 'Paragraf=p; Baslik 2=h2; Baslik 3=h3; Baslik 4=h4',
                font_size_formats: '10px 12px 14px 16px 18px 20px 24px 28px 32px',
                branding: false,
                promotion: false,
                relative_urls: false,
                remove_script_host: false,
                convert_urls: true,
                skin: document.body.classList.contains('admin-theme-dark') ? 'oxide-dark' : 'oxide',
                content_css: document.body.classList.contains('admin-theme-dark') ? 'dark' : 'default',
                init_instance_callback: (editor) => {
                    clearTimeout(timeout);
                    if (initialContent) {
                        editor.setContent(initialContent);
                    }
                    resolve(editor);
                },
                images_upload_handler: (blobInfo, progress) => new Promise(async (res, rej) => {
                    try {
                        const file = blobInfo.blob();
                        const namedFile = new File([file], blobInfo.filename(), { type: file.type });
                        const result = await ApiService.uploadFile(namedFile);
                        progress(100);
                        const url = result.url.startsWith('/') ? result.url : '/' + result.url.replace(/^\//, '');
                        res(url);
                    } catch (error) {
                        rej(error.message || 'Gorsel yuklenemedi');
                    }
                }),
                ...(options.tinymce || {}),
            };

            window.tinymce.init(config).catch((err) => {
                clearTimeout(timeout);
                reject(err);
            });
        });
    }

    static getContent(selector) {
        const el = document.querySelector(selector);
        if (this.hasTinyMCE()) {
            const editor = window.tinymce.get(selector.replace('#', ''));
            if (editor) return editor.getContent();
        }
        return el ? (el.value || el.textContent || '') : '';
    }

    static destroy(selector) {
        if (!this.hasTinyMCE()) return;
        const editor = window.tinymce.get(selector.replace('#', ''));
        if (editor) editor.remove();
    }
}

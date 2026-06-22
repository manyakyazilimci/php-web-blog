import { ThemeManager } from './ThemeManager.js';
import { BlogManager } from './BlogManager.js';
import { ArchiveManager } from './ArchiveManager.js';
import { Router } from './Router.js';
import { ModalFactory } from './Modal.js';
import { ApiService } from './ApiService.js';

/**
 * App - Uygulama ana giriş noktası (Facade Pattern)
 */
class App {
    constructor() {
        this.themeManager = null;
        this.blogManager = null;
        this.archiveManager = null;
        this.router = null;
        this.siteSettings = null;
    }

    async init() {
        this.themeManager = new ThemeManager();
        this.blogManager = new BlogManager();
        this.archiveManager = new ArchiveManager(this.blogManager);

        await Promise.all([
            this.blogManager.load(),
            this.applyDynamicSettings(),
        ]);

        this.router = new Router(this);
        this.router.resolve();

        this.bindGlobalEvents();
    }

    bindGlobalEvents() {
        const themeBtn = document.getElementById('theme-toggle');
        if (themeBtn) {
            themeBtn.addEventListener('click', () => {
                this.themeManager.toggleTheme();
            });
        }

        document.querySelectorAll('.newsletter-trigger').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.openNewsletterModal();
            });
        });

        document.addEventListener('click', (e) => {
            const contactTrigger = e.target.closest('.contact-trigger');
            if (contactTrigger) {
                e.preventDefault();
                this.openContactModal();
            }
        });
    }

    openNewsletterModal() {
        const modal = ModalFactory.createNewsletterModal(async (email, name, m) => {
            if (!this.validateEmail(email)) {
                ModalFactory.createInfoModal('Hata', 'Lütfen geçerli bir e-posta adresi girin.').open();
                return;
            }
            try {
                const response = await fetch('/api/newsletter', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, name })
                });
                const result = await response.json();
                if (result.success) {
                    m.close();
                    setTimeout(() => {
                        ModalFactory.createInfoModal('Başarılı', result.message || 'Bültene başarıyla kaydoldunuz. Teşekkür ederiz!').open();
                    }, 500);
                } else {
                    ModalFactory.createInfoModal('Hata', result.error || 'Bir hata oluştu.').open();
                }
            } catch (err) {
                ModalFactory.createInfoModal('Hata', 'Bağlantı hatası. Lütfen tekrar deneyin.').open();
            }
        });
        modal.open();
    }

    openContactModal() {
        const modal = ModalFactory.createContactModal(async (data, m) => {
            if (!this.validateEmail(data.email)) {
                ModalFactory.createInfoModal('Hata', 'Lütfen geçerli bir e-posta adresi girin.').open();
                return;
            }
            try {
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                const result = await response.json();
                if (result.success) {
                    m.close();
                    setTimeout(() => {
                        ModalFactory.createInfoModal('Mesaj İletildi', result.message || `Sayın ${data.name}, mesajınız başarıyla alındı. En kısa sürede geri dönüş yapacağım.`).open();
                    }, 500);
                } else {
                    ModalFactory.createInfoModal('Hata', result.error || 'Bir hata oluştu.').open();
                }
            } catch (err) {
                ModalFactory.createInfoModal('Hata', 'Bağlantı hatası. Lütfen tekrar deneyin.').open();
            }
        });
        modal.open();
    }

    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    updatePageMeta(titleKey, postTitle = null) {
        const name = this.siteSettings?.siteName || 'Nurullah B.';
        const desc = this.siteSettings?.siteDescription || 'Kişisel blog ve dijital günlük';

        const titles = {
            home: `${name} | Kişisel Blog`,
            manifesto: `Manifesto | ${name}`,
            archive: `Arşiv | ${name}`,
            post: postTitle ? `${postTitle} | ${name}` : `${name}`,
        };

        document.title = titles[titleKey] || name;

        let meta = document.querySelector('meta[name="description"]');
        if (!meta) {
            meta = document.createElement('meta');
            meta.name = 'description';
            document.head.appendChild(meta);
        }
        meta.setAttribute('content', desc);
    }

    async applyDynamicSettings() {
        let settings = null;
        try {
            settings = await ApiService.getSettings();
        } catch {
            return;
        }
        if (!settings) return;

        this.siteSettings = settings;

        if (settings.siteActive === false) {
            this.showMaintenanceMode();
        }

        const brandLogo = document.querySelector('.brand');
        if (brandLogo) {
            brandLogo.textContent = settings.logoText || 'NB.';
        }

        const footerText = document.querySelector('.footer p');
        if (footerText) {
            footerText.innerHTML = settings.copyrightText || '&copy; 2026 Nurullah B. Dijital Günlük.';
        }

        if (settings.themeColor) {
            document.documentElement.style.setProperty('--c-accent', settings.themeColor);
            document.documentElement.style.setProperty('--c-accent-hover', settings.themeColor + 'DD');
        }

        if (settings.darkMode !== undefined && this.themeManager) {
            const desiredTheme = settings.darkMode ? 'theme-dark' : 'theme-light';
            if (this.themeManager.currentTheme !== desiredTheme) {
                this.themeManager.currentTheme = desiredTheme;
                this.themeManager.applyTheme();
            }
        }

        this.updatePageMeta('home');
    }

    showMaintenanceMode() {
        document.body.innerHTML = `
            <div class="noise-overlay"></div>
            <div class="container" style="display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:100vh; text-align:center; padding: 2rem;">
                <h1 style="font-family: 'Bodoni Moda', serif; font-size: 3.5rem; margin-bottom: 1.5rem; letter-spacing: -2px;">Bakım Modundayız</h1>
                <p style="color: var(--c-text-secondary); max-width: 500px; line-height: 1.7; font-size: 1.1rem; margin-bottom: 2.5rem;">
                    Size daha iyi bir deneyim sunabilmek için sitemizi kısa süreliğine bakıma aldık.
                </p>
            </div>
        `;
        throw new Error("Site bakim modundadir.");
    }

    async applyDynamicAboutInfo(container) {
        let aboutInfo = null;
        try {
            aboutInfo = await ApiService.getAbout();
        } catch {
            return;
        }
        if (!aboutInfo || !aboutInfo.title) return;

        const aboutTitle = container.querySelector('.about-title');
        const aboutSubtitle = container.querySelector('.about-subtitle');
        const aboutText = container.querySelector('.about-text');
        const aboutImg = container.querySelector('.about-image');
        const contactTrigger = container.querySelector('.contact-trigger');
        const socialLinks = container.querySelector('.social-links');

        if (aboutTitle) aboutTitle.textContent = aboutInfo.title;
        if (aboutSubtitle) aboutSubtitle.textContent = aboutInfo.subtitle;
        if (aboutText) aboutText.textContent = aboutInfo.description;
        if (aboutImg && aboutInfo.profilePhoto) {
            aboutImg.style.backgroundImage = `url(${aboutInfo.profilePhoto})`;
            aboutImg.className = 'about-image';
        }
        if (contactTrigger) {
            contactTrigger.textContent = aboutInfo.contactButtonText || 'Benimle İletişime Geç';
        }

        if (socialLinks) {
            socialLinks.innerHTML = `
                ${aboutInfo.twitterUrl ? `<a href="${aboutInfo.twitterUrl}" target="_blank" rel="noopener noreferrer">Twitter</a>` : ''}
                ${aboutInfo.githubUrl ? `<a href="${aboutInfo.githubUrl}" target="_blank" rel="noopener noreferrer">GitHub</a>` : ''}
                ${aboutInfo.linkedinUrl ? `<a href="${aboutInfo.linkedinUrl}" target="_blank" rel="noopener noreferrer">LinkedIn</a>` : ''}
            `;
        }
    }

    async renderManifestoPage(container) {
        let data = null;
        try {
            data = await ApiService.getManifesto();
        } catch {
            return;
        }
        if (!data || !data.title) return;

        const titleEl = container.querySelector('.manifesto-title');
        const subtitleEl = container.querySelector('.manifesto-subtitle');
        const contentEl = container.querySelector('.manifesto-content');

        if (titleEl) titleEl.textContent = data.title;
        if (subtitleEl) subtitleEl.textContent = data.subtitle;

        if (contentEl) {
            let html = data.intro ? `<div class="manifesto-intro">${data.intro}</div>` : '';

            (data.principles || []).forEach((p, i) => {
                html += `
                    <div class="principle-card reveal ${i === 0 ? 'delayed-2' : ''}">
                        <div class="principle-number">${p.number || String(i + 1).padStart(2, '0')}</div>
                        <h3 class="principle-title">${p.title || ''}</h3>
                        <p class="principle-text">${p.text || ''}</p>
                    </div>
                `;
            });

            if (data.closingTitle || data.closingText) {
                html += `<h2 class="manifesto-closing-title">${data.closingTitle || 'Son Söz'}</h2>`;
                html += `<div class="manifesto-closing">${data.closingText || ''}</div>`;
            }

            if (data.signature) {
                html += `<div class="signature reveal">${data.signature}</div>`;
            }

            contentEl.innerHTML = html;
        }
    }

    onPageLoaded(routePath, container, param) {
        switch (routePath) {
            case '/':
                this.renderBlogPage(container);
                this.applyDynamicAboutInfo(container);
                break;
            case '/manifesto':
                this.renderManifestoPage(container);
                break;
            case '/arsiv':
                this.archiveManager.bindEvents(container);
                break;
            case '/post':
                this.renderPostDetailPage(container, param);
                break;
        }
    }

    renderBlogPage(container) {
        const bentoGrid = container.querySelector('#bento-blog-container');
        if (!bentoGrid) return;

        const posts = this.blogManager.getPosts();
        bentoGrid.innerHTML = '';

        if (posts.length === 0) {
            bentoGrid.innerHTML = '<div style="text-align:center; padding: 4rem; color: var(--c-text-secondary); width:100%; display:block;">Henüz eklenmiş blog yazısı bulunmamaktadır.</div>';
            return;
        }

        posts.forEach((post, idx) => {
            const article = document.createElement('article');

            // Sıralı animasyon gecikmesi
            let delayClass = '';
            if (idx % 3 === 1) delayClass = 'delayed-1';
            else if (idx % 3 === 2) delayClass = 'delayed-2';

            article.className = `card reveal ${delayClass}`;
            article.addEventListener('click', () => {
                this.router.navigate(`/post/${post.slug}`);
            });

            // Masonry asimetrisi oluşturacak en-boy oranları
            const aspectRatios = ['16/10', '4/3', '1/1', '3/4', '16/9'];
            const aspect = aspectRatios[idx % aspectRatios.length];

            article.innerHTML = `
                <div class="card-image-wrap">
                    <div class="card-image ${post.featuredImage ? '' : 'bg-placeholder-' + ((idx % 4) + 1)}" style="aspect-ratio: ${aspect};${post.featuredImage ? ` background-image:url('${post.featuredImage}'); background-size:cover; background-position:center;` : ''}"></div>
                    <div class="category-badge">${post.category}</div>
                </div>
                <div class="card-body">
                    <div class="meta"><span>${post.date}</span> &bull; <span>${post.readTime}</span></div>
                    <h3 class="card-title">${post.title}</h3>
                    <p class="card-excerpt">${post.lead}</p>
                    <span class="read-link">Tamamını Oku</span>
                </div>
            `;

            bentoGrid.appendChild(article);
        });
    }

    renderPostDetailPage(container, slug) {
        const post = this.blogManager.getPostBySlug(slug);
        if (!post) {
            this.router.renderNotFound();
            return;
        }

        this.updatePageMeta('post', post.title);

        container.querySelector('#post-category').textContent = post.category;
        container.querySelector('#post-date').textContent = post.date;
        container.querySelector('#post-date').setAttribute('datetime', post.date);
        container.querySelector('#post-read-time').textContent = post.readTime;
        container.querySelector('#post-title').textContent = post.title;
        container.querySelector('#post-lead').textContent = post.lead;

        const heroWrap = container.querySelector('.hero-img-wrap');
        if (heroWrap && post.featuredImage) {
            heroWrap.style.backgroundImage = `url('${post.featuredImage}')`;
            heroWrap.style.backgroundSize = 'cover';
            heroWrap.style.backgroundPosition = 'center';
            heroWrap.classList.remove('bg-placeholder-1');
        }

        container.querySelector('#post-body').innerHTML = this.normalizePostHtml(post.body);

        this.trackPostView(post.id, post.slug);
    }

    async trackPostView(postId, postSlug) {
        try {
            await fetch('/api/views', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ postId, postSlug })
            });
        } catch (err) {
            console.error('View tracking failed:', err);
        }
    }

    normalizePostHtml(html) {
        if (!html) return '';
        return html.replace(/(src|href)=(["'])(?!https?:\/\/|\/|data:|blob:|mailto:)(uploads\/)/gi, '$1=$2/$3');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init().catch(err => console.error('Uygulama baslatilamadi:', err));
});

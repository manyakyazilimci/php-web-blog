/**
 * Router - Single Page Application (SPA) Yönlendiricisi
 */
export class Router {
    constructor(app) {
        this.app = app;
        this.routes = {
            '/': { templateId: 'temp-blog', titleKey: 'home' },
            '/manifesto': { templateId: 'temp-manifesto', titleKey: 'manifesto' },
            '/arsiv': { templateId: 'temp-arsiv', titleKey: 'archive' },
            '/post': { templateId: 'temp-post', titleKey: 'post' }
        };
        this.rootElement = document.getElementById('app-root');
        this.init();
    }

    init() {
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (!link) return;

            const href = link.getAttribute('href');
            if (href && (href.startsWith('/') || href.startsWith(window.location.origin))) {
                e.preventDefault();
                const path = href.replace(window.location.origin, '');
                this.navigate(path);
            }
        });

        window.addEventListener('popstate', () => {
            this.resolve();
        });
    }

    navigate(path) {
        window.history.pushState({}, '', path);
        this.resolve();
    }

    resolve() {
        const path = window.location.pathname;
        let matchedRoute = '/';
        let routeParam = null;

        if (path.startsWith('/post/')) {
            matchedRoute = '/post';
            routeParam = path.substring(6);
        } else if (this.routes[path]) {
            matchedRoute = path;
        }

        const config = this.routes[matchedRoute];
        if (!config) {
            this.renderNotFound();
            return;
        }

        const postTitle = matchedRoute === '/post' && routeParam
            ? this.app.blogManager?.getPostBySlug(routeParam)?.title
            : null;

        this.app.updatePageMeta(config.titleKey, postTitle);
        this.updateActiveNavLink(matchedRoute === '/post' ? '/' : matchedRoute);
        this.renderTemplate(config.templateId, matchedRoute, routeParam);
    }

    updateActiveNavLink(path) {
        const links = document.querySelectorAll('.nav-links a');
        links.forEach(link => {
            const href = link.getAttribute('href');
            if (href === path) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    renderTemplate(templateId, routePath, param) {
        const template = document.getElementById(templateId);
        if (!template) {
            this.renderNotFound();
            return;
        }

        this.rootElement.innerHTML = '';
        const clone = template.content.cloneNode(true);
        this.rootElement.appendChild(clone);

        this.rootElement.style.animation = 'none';
        this.rootElement.offsetHeight;
        this.rootElement.style.animation = null;

        this.app.onPageLoaded(routePath, this.rootElement, param);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    renderNotFound() {
        document.title = '404 - Sayfa Bulunamadı';
        this.rootElement.innerHTML = `
            <div class="container" style="text-align: center; padding: 10rem 2rem;">
                <h1 style="font-family: var(--f-display); font-size: 5rem; margin-bottom: 2rem;">404</h1>
                <p style="color: var(--c-text-secondary); margin-bottom: 3rem;">Aradığınız sayfa mevcut değil veya taşınmış olabilir.</p>
                <a href="/" class="btn-accent">Ana Sayfaya Dön</a>
            </div>
        `;
    }
}

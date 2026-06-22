import { AdminSidebar } from './AdminSidebar.js';
import { AdminMockData } from './AdminMockData.js';
import { ApiService } from '../ApiService.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { PostsPage } from './pages/PostsPage.js';
import { CategoriesPage } from './pages/CategoriesPage.js';
import { AboutPage } from './pages/AboutPage.js';
import { ManifestoPage } from './pages/ManifestoPage.js';
import { MediaPage } from './pages/MediaPage.js';
import { SettingsPage } from './pages/SettingsPage.js';
import { ContactMessagesPage } from './pages/ContactMessagesPage.js';
import { NewsletterPage } from './pages/NewsletterPage.js';
import { MailSettingsPage } from './pages/MailSettingsPage.js';
import { StatisticsPage } from './pages/StatisticsPage.js';

export class AdminApp {
    constructor() {
        this.sidebar = null;
        this.pages = {};
        this.activeRoute = 'dashboard';
        this.contentElement = document.getElementById('admin-content');
        this.topbarElement = document.getElementById('admin-topbar');
        this.settings = AdminMockData.getDefaultSettings();
        this.user = null;
    }

    async init() {
        try {
            this.user = await ApiService.checkAuth();
        } catch {
            window.location.href = '/admin/login';
            return;
        }

        try {
            this.settings = await ApiService.getSettings();
        } catch {
            this.settings = AdminMockData.getDefaultSettings();
        }

        this.applyAdminMeta();
        this.initPages();
        this.renderTopbar();
        this.initSidebar();
        this.applyThemeOnLoad();
        this.bindGlobalEvents();
        await this.navigate(this.activeRoute);
    }

    applyAdminMeta() {
        const name = this.settings.siteName || 'Nurullah B.';
        document.title = `Yönetim Paneli | ${name}`;
        let meta = document.querySelector('meta[name="description"]');
        if (meta && this.settings.siteDescription) {
            meta.setAttribute('content', this.settings.siteDescription);
        }
    }

    initPages() {
        this.pages = {
            dashboard: new DashboardPage(this),
            posts: new PostsPage(this),
            categories: new CategoriesPage(this),
            about: new AboutPage(this),
            manifesto: new ManifestoPage(this),
            media: new MediaPage(this),
            settings: new SettingsPage(this),
            contact: new ContactMessagesPage(this),
            newsletter: new NewsletterPage(this),
            mailSettings: new MailSettingsPage(this),
            statistics: new StatisticsPage(this)
        };
    }

    initSidebar() {
        this.sidebar = new AdminSidebar((route) => this.navigate(route));
        this.sidebar.init();
        this.updateSidebarPostBadge();
    }

    renderTopbar() {
        if (!this.topbarElement) return;

        this.topbarElement.innerHTML = `
            <div class="topbar-left">
                <div class="topbar-page-title" id="topbar-title">Genel Bakış</div>
                <div class="topbar-breadcrumb">Yönetim Paneli &gt; <span id="topbar-breadcrumb-current">Genel Bakış</span></div>
            </div>
            <div class="topbar-right">
                <button class="topbar-icon-btn" id="topbar-logout" title="Çıkış Yap" type="button">
                    <i class="fas fa-sign-out-alt"></i>
                </button>
                <button class="topbar-icon-btn" id="topbar-theme-toggle" title="Temayı Değiştir" type="button">
                    <i class="fas fa-moon"></i>
                </button>
                <div class="topbar-user" id="topbar-user-card">
                    <div class="topbar-user-avatar">${(this.user?.username || 'A').charAt(0).toUpperCase()}</div>
                    <div class="topbar-user-name" id="topbar-user-name">${this.user?.username || 'Admin'}</div>
                </div>
            </div>
        `;
    }

    async navigate(routeId) {
        if (!this.pages[routeId]) return;

        this.activeRoute = routeId;
        this.sidebar?.setActiveRoute(routeId);

        const routeLabelMap = {
            dashboard: 'Genel Bakış', posts: 'Yazılar', categories: 'Kategoriler',
            about: 'Hakkımda', manifesto: 'Manifesto', media: 'Medya', settings: 'Ayarlar',
            contact: 'İletişim Mesajları', newsletter: 'Bülten Aboneleri', mailSettings: 'E-posta Ayarları', statistics: 'İstatistikler'
        };
        const pageLabel = routeLabelMap[routeId] || routeId;

        document.getElementById('topbar-title').textContent = pageLabel;
        document.getElementById('topbar-breadcrumb-current').textContent = pageLabel;

        this.renderLoadingState();
        await new Promise(r => setTimeout(r, 200));

        if (this.activeRoute === routeId && this.contentElement) {
            this.contentElement.innerHTML = '';
            const pageContainer = document.createElement('div');
            pageContainer.className = 'page-transition-enter';
            this.contentElement.appendChild(pageContainer);

            try {
                await this.pages[routeId].render(pageContainer);
            } catch (err) {
                console.error('Sayfa render hatasi:', err);
                if (!pageContainer.innerHTML.trim()) {
                    pageContainer.innerHTML = `
                        <div class="admin-card" style="padding:2rem;text-align:center;">
                            <p>Sayfa yuklenirken bir hata olustu.</p>
                            <p style="color:var(--admin-text-muted);font-size:0.9rem;margin-top:0.5rem;">${err.message || ''}</p>
                        </div>`;
                }
            }

            this.updateSidebarPostBadge();
        }
    }

    renderLoadingState() {
        if (!this.contentElement) return;
        this.contentElement.innerHTML = `
            <div class="admin-loading-state">
                <i class="fas fa-spinner fa-spin"></i><span>Yükleniyor...</span>
            </div>`;
    }

    async updateSidebarPostBadge() {
        if (!this.sidebar) return;
        try {
            const posts = await ApiService.getPosts();
            this.sidebar.updateBadge('posts', posts.length || null);
        } catch {
            this.sidebar.updateBadge('posts', null);
        }
    }

    applyThemeOnLoad() {
        this.applyThemeSettings(this.settings);
    }

    applyThemeSettings(settings) {
        if (!settings) return;
        document.body.classList.toggle('admin-theme-dark', settings.darkMode);
        document.body.classList.toggle('admin-theme-light', !settings.darkMode);
        if (settings.themeColor) {
            document.documentElement.style.setProperty('--admin-accent', settings.themeColor);
            document.documentElement.style.setProperty('--admin-accent-hover', settings.themeColor + 'DD');
        }
        const themeBtnIcon = document.querySelector('#topbar-theme-toggle i');
        if (themeBtnIcon) themeBtnIcon.className = settings.darkMode ? 'fas fa-sun' : 'fas fa-moon';
    }

    bindGlobalEvents() {
        document.getElementById('topbar-theme-toggle')?.addEventListener('click', async () => {
            this.settings.darkMode = !this.settings.darkMode;
            try { await ApiService.updateSettings({ darkMode: this.settings.darkMode }); } catch {}
            this.applyThemeSettings(this.settings);
            if (this.activeRoute === 'settings') this.navigate('settings');
        });

        document.getElementById('topbar-user-card')?.addEventListener('click', () => this.navigate('settings'));

        document.getElementById('topbar-logout')?.addEventListener('click', async () => {
            try { await ApiService.logout(); } catch {}
            window.location.href = '/admin/login';
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new AdminApp().init().catch(err => console.error('Admin panel baslatilamadi:', err));
});

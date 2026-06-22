/**
 * AdminSidebar - Yonetim paneli sidebar navigasyon bileseni.
 * Menue ogelerini render eder, aktif sayfa vurgusunu yonetir,
 * ve mobil cihazlarda collapse/expand islevselligini saglar.
 */
export class AdminSidebar {
    /**
     * @param {Function} onNavigate - Sayfa degisim callback fonksiyonu
     */
    constructor(onNavigate) {
        this.onNavigate = onNavigate;
        this.activeRoute = 'dashboard';
        this.sidebarElement = document.getElementById('admin-sidebar');
        this.overlayElement = document.getElementById('sidebar-overlay');
        this.mobileToggle = document.getElementById('sidebar-mobile-toggle');
        this.isOpen = false;

        /** Sidebar navigasyon menüsünü tanımlayan yapılandırma */
        this.menuConfig = [
            {
                sectionTitle: 'Genel',
                items: [
                    { id: 'dashboard', label: 'Genel Bakış', icon: 'fa-th-large' },
                    { id: 'posts', label: 'Yazılar', icon: 'fa-file-alt', badge: null },
                    { id: 'categories', label: 'Kategoriler', icon: 'fa-folder' },
                ]
            },
            {
                sectionTitle: 'İçerik',
                items: [
                    { id: 'about', label: 'Hakkımda', icon: 'fa-user' },
                    { id: 'manifesto', label: 'Manifesto', icon: 'fa-scroll' },
                    { id: 'media', label: 'Medya', icon: 'fa-image' },
                ]
            },
            {
                sectionTitle: 'İletişim',
                items: [
                    { id: 'contact', label: 'İletişim Mesajları', icon: 'fa-envelope' },
                    { id: 'newsletter', label: 'Bülten Aboneleri', icon: 'fa-users' },
                ]
            },
            {
                sectionTitle: 'Sistem',
                items: [
                    { id: 'statistics', label: 'İstatistikler', icon: 'fa-chart-bar' },
                    { id: 'mailSettings', label: 'E-posta Ayarları', icon: 'fa-cog' },
                    { id: 'settings', label: 'Site Ayarları', icon: 'fa-sliders-h' },
                ]
            }
        ];
    }

    /**
     * Sidebar'i render eder ve olaylari baglar
     */
    init() {
        this.render();
        this.bindEvents();
    }

    /**
     * Sidebar HTML icerigini olusturur ve DOM'a ekler
     */
    render() {
        if (!this.sidebarElement) return;

        const sectionsHTML = this.menuConfig.map(section => {
            const itemsHTML = section.items.map(item => this.renderMenuItem(item)).join('');
            return `
                <div class="sidebar-nav-section">
                    <div class="sidebar-nav-title">${section.sectionTitle}</div>
                    ${itemsHTML}
                </div>
            `;
        }).join('');

        this.sidebarElement.innerHTML = `
            <div class="sidebar-brand">
                <div>
                    <div class="sidebar-brand-logo">NB.</div>
                    <div class="sidebar-brand-label">Yönetim Paneli</div>
                </div>
            </div>
            <nav class="sidebar-nav" aria-label="Ana gezinme">
                ${sectionsHTML}
            </nav>
            <div class="sidebar-footer">
                <a href="/" class="sidebar-footer-link" target="_blank" rel="noopener noreferrer">
                    <i class="fas fa-external-link-alt" aria-hidden="true"></i>
                    <span>Siteyi Görüntüle</span>
                </a>
            </div>
        `;
    }

    /**
     * Tek bir menu ogesinin HTML'ini olusturur
     * @param {Object} item - Menu oge konfigurasyonu
     * @returns {string} Menu ogesi HTML'i
     */
    renderMenuItem(item) {
        const isActive = this.activeRoute === item.id;
        const badgeHTML = item.badge ? `<span class="sidebar-nav-badge">${item.badge}</span>` : '';
        
        return `
            <button class="sidebar-nav-item ${isActive ? 'active' : ''}" 
                    data-route="${item.id}" 
                    aria-current="${isActive ? 'page' : 'false'}"
                    type="button">
                <i class="fas ${item.icon}" aria-hidden="true"></i>
                <span>${item.label}</span>
                ${badgeHTML}
            </button>
        `;
    }

    /**
     * Sidebar olaylarini baglar: menu tiklama, mobil toggle, overlay
     */
    bindEvents() {
        /* Menu oge tiklama delegasyonu */
        if (this.sidebarElement) {
            this.sidebarElement.addEventListener('click', (e) => {
                const navItem = e.target.closest('.sidebar-nav-item');
                if (navItem) {
                    const route = navItem.dataset.route;
                    if (route && route !== this.activeRoute) {
                        this.setActiveRoute(route);
                        this.onNavigate(route);
                    }
                    /* Mobilde tiklamadan sonra sidebar'i kapat */
                    if (this.isOpen) {
                        this.closeMobileSidebar();
                    }
                }
            });
        }

        /* Mobil toggle butonu */
        if (this.mobileToggle) {
            this.mobileToggle.addEventListener('click', () => {
                if (this.isOpen) {
                    this.closeMobileSidebar();
                } else {
                    this.openMobileSidebar();
                }
            });
        }

        /* Overlay tiklamasi ile sidebar kapama */
        if (this.overlayElement) {
            this.overlayElement.addEventListener('click', () => {
                this.closeMobileSidebar();
            });
        }
    }

    /**
     * Aktif route'u gunceller ve sidebar'daki gorsel vurguyu degistirir
     * @param {string} route - Yeni aktif route kimlik degeri
     */
    setActiveRoute(route) {
        this.activeRoute = route;
        const allItems = this.sidebarElement.querySelectorAll('.sidebar-nav-item');
        allItems.forEach(item => {
            const isActive = item.dataset.route === route;
            item.classList.toggle('active', isActive);
            item.setAttribute('aria-current', isActive ? 'page' : 'false');
        });
    }

    /**
     * Belirli bir menu ogesinin badge degerini gunceller
     * @param {string} routeId - Menu ogesi kimlik degeri
     * @param {string|number|null} value - Badge'de gosterilecek deger (null = gizle)
     */
    updateBadge(routeId, value) {
        const menuItem = this.sidebarElement.querySelector(`[data-route="${routeId}"]`);
        if (!menuItem) return;

        let badge = menuItem.querySelector('.sidebar-nav-badge');
        if (value !== null && value !== undefined) {
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'sidebar-nav-badge';
                menuItem.appendChild(badge);
            }
            badge.textContent = value;
        } else if (badge) {
            badge.remove();
        }
    }

    /** Mobil sidebar'i acar */
    openMobileSidebar() {
        this.isOpen = true;
        this.sidebarElement.classList.add('open');
        this.overlayElement.classList.add('visible');
        this.overlayElement.setAttribute('aria-hidden', 'false');
        
        /* Toggle ikonunu degistir */
        const icon = this.mobileToggle.querySelector('i');
        if (icon) {
            icon.className = 'fas fa-times';
        }
    }

    /** Mobil sidebar'i kapatir */
    closeMobileSidebar() {
        this.isOpen = false;
        this.sidebarElement.classList.remove('open');
        this.overlayElement.classList.remove('visible');
        this.overlayElement.setAttribute('aria-hidden', 'true');
        
        /* Toggle ikonunu geri al */
        const icon = this.mobileToggle.querySelector('i');
        if (icon) {
            icon.className = 'fas fa-bars';
        }
    }
}

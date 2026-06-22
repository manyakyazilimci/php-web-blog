import { AdminMockData } from '../AdminMockData.js';
import { ApiService } from '../../ApiService.js';

/**
 * DashboardPage - Yonetim paneli ana dashboard ekrani bileseni (OOP).
 */
export class DashboardPage {
    /**
     * @param {Object} appInstance - AdminApp main instance
     */
    constructor(appInstance) {
        this.app = appInstance;
    }

    /**
     * Dashboard sayfasini render eder
     * @param {HTMLElement} container - Icerigin render edilecegi DOM elementi
     */
    async render(container) {
        let posts = [];
        let categories = AdminMockData.getDefaultCategories();
        let activities = AdminMockData.getRecentActivity();

        try {
            [posts, categories, activities] = await Promise.all([
                ApiService.getPosts(),
                ApiService.getCategories(),
                ApiService.getActivities(),
            ]);
        } catch { /* mock fallback */ }

        const systemStatus = AdminMockData.getSystemStatus();
        const analytics = AdminMockData.getWeeklyAnalytics();

        /* Kategori dagilimini hesapla */
        const catCounts = {};
        posts.forEach(post => {
            catCounts[post.category] = (catCounts[post.category] || 0) + 1;
        });

        /* Toplam veriler */
        const totalPosts = posts.length;
        const totalCategories = categories.length;
        const totalViews = 12847 + (totalPosts * 150); // Dinamik fake artis simule et
        const totalComments = 189 + (totalPosts * 2);

        container.innerHTML = `
            <!-- Sayfa Başlığı -->
            <div class="page-header">
                <div class="page-header-left">
                    <h1>Genel Bakış</h1>
                    <p>Sitenizin genel durumu ve son istatistikler.</p>
                </div>
            </div>

            <!-- Istatistik Kartlari (Bento Style Grid) -->
            <div class="stats-grid">
                <!-- Toplam Yazilar -->
                <div class="stat-card">
                    <div class="stat-card-header">
                        <div class="stat-card-icon">
                            <i class="fas fa-file-alt" aria-hidden="true"></i>
                        </div>
                        <span class="stat-card-trend up">
                            <i class="fas fa-arrow-up" aria-hidden="true"></i> 12%
                        </span>
                    </div>
                    <div class="stat-card-value">${totalPosts}</div>
                    <div class="stat-card-label">Toplam Yazi</div>
                </div>

                <!-- Toplam Kategoriler -->
                <div class="stat-card">
                    <div class="stat-card-header">
                        <div class="stat-card-icon">
                            <i class="fas fa-folder" aria-hidden="true"></i>
                        </div>
                        <span class="stat-card-trend up">
                            <i class="fas fa-arrow-up" aria-hidden="true"></i> Aktif
                        </span>
                    </div>
                    <div class="stat-card-value">${totalCategories}</div>
                    <div class="stat-card-label">Toplam Kategori</div>
                </div>

                <!-- Toplam Ziyaret -->
                <div class="stat-card">
                    <div class="stat-card-header">
                        <div class="stat-card-icon">
                            <i class="fas fa-eye" aria-hidden="true"></i>
                        </div>
                        <span class="stat-card-trend up">
                            <i class="fas fa-arrow-up" aria-hidden="true"></i> 8.2%
                        </span>
                    </div>
                    <div class="stat-card-value">${totalViews.toLocaleString('tr-TR')}</div>
                    <div class="stat-card-label">Toplam Görüntülenme</div>
                </div>

                <!-- Toplam Yorumlar -->
                <div class="stat-card">
                    <div class="stat-card-header">
                        <div class="stat-card-icon">
                            <i class="fas fa-comments" aria-hidden="true"></i>
                        </div>
                        <span class="stat-card-trend up">
                            <i class="fas fa-arrow-up" aria-hidden="true"></i> 15%
                        </span>
                    </div>
                    <div class="stat-card-value">${totalComments}</div>
                    <div class="stat-card-label">Toplam Yorum</div>
                </div>
            </div>

            <!-- Grafikler ve Sistem/Aktivite Grid -->
            <div class="dashboard-grid">
                <!-- Haftalik Ziyaretci Grafigi -->
                <div class="admin-card">
                    <div class="admin-card-header">
                        <h2 class="admin-card-title">Haftalık Analiz</h2>
                        <span class="badge badge-info"><i class="fas fa-chart-bar" aria-hidden="true"></i> Son 7 Gün</span>
                    </div>
                    <div class="chart-container">
                        <div class="bar-chart" id="dashboard-bar-chart">
                            <!-- CSS Bar Chart buraya render edilecek -->
                        </div>
                    </div>
                    <div class="chart-legend">
                        <div class="chart-legend-item">
                            <span class="chart-legend-dot" style="background: var(--admin-accent);"></span>
                            <span>Görüntülenme</span>
                        </div>
                        <div class="chart-legend-item">
                            <span class="chart-legend-dot" style="background: var(--admin-info);"></span>
                            <span>Ziyaretçi</span>
                        </div>
                    </div>
                </div>

                <!-- Sag Kolon: Son Aktiviteler & Sistem Durumu -->
                <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                    <!-- Sistem Durumu -->
                    <div class="admin-card">
                        <div class="admin-card-header">
                            <h2 class="admin-card-title">Sistem Durumu</h2>
                        </div>
                        <div class="admin-card-body" style="display:flex; flex-direction:column; gap:1.25rem;">
                            <div class="system-status-grid">
                                <div class="system-status-item">
                                    <div class="system-status-value">${systemStatus.uptime}</div>
                                    <div class="system-status-label">Çalışma Süresi</div>
                                </div>
                                <div class="system-status-item">
                                    <div class="system-status-value">${systemStatus.version}</div>
                                    <div class="system-status-label">Sürüm</div>
                                </div>
                            </div>
                            
                            <!-- Storage Bar -->
                            <div>
                                <div class="storage-bar-label">
                                    <span>Disk Kullanımı</span>
                                    <span>${systemStatus.storageUsed} / ${systemStatus.storageTotal}</span>
                                </div>
                                <div class="storage-bar">
                                    <div class="storage-bar-fill" id="storage-bar-fill" style="width: 0%;"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Son Aktiviteler -->
                    <div class="admin-card">
                        <div class="admin-card-header">
                            <h2 class="admin-card-title">Son Aktiviteler</h2>
                        </div>
                        <div class="activity-list">
                            ${activities.slice(0, 4).map(act => `
                                <div class="activity-item">
                                    <div class="activity-icon">
                                        <i class="fas ${act.icon}" aria-hidden="true"></i>
                                    </div>
                                    <div class="activity-content">
                                        <div class="activity-title">
                                            <strong>${act.title}</strong> ${act.action}
                                        </div>
                                        <div class="activity-date">${act.date}</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.animateCharts(analytics);
    }

    /**
     * Grafik ve bar doldurma animasyonlarini tetikler
     * @param {Object} analytics - Analiz verileri
     */
    animateCharts(analytics) {
        /* CSS Bar Chart olusturma */
        const chartElement = document.getElementById('dashboard-bar-chart');
        if (chartElement) {
            const maxVal = Math.max(...analytics.views);
                        const columnsHTML = analytics.labels.map((label, idx) => {
                const viewVal = analytics.views[idx];
                const visVal = analytics.visitors[idx];
                
                /* Yükseklikleri orantila */
                const viewHeight = Math.max(10, Math.round((viewVal / maxVal) * 160));
                const visHeight = Math.max(10, Math.round((visVal / maxVal) * 160));

                return `
                    <div class="bar-chart-column">
                        <div class="bar-chart-bar-group">
                            <div class="bar-chart-bar primary" style="height: 0px;" data-height="${viewHeight}px" title="Görüntülenme: ${viewVal}"></div>
                            <div class="bar-chart-bar secondary" style="height: 0px;" data-height="${visHeight}px" title="Ziyaretçi: ${visVal}"></div>
                        </div>
                        <span class="bar-chart-label">${label}</span>
                    </div>
                `;
            }).join('');

            chartElement.innerHTML = columnsHTML;

            /* Bar yuksekliklerini animasyonlu yukle */
            setTimeout(() => {
                const bars = chartElement.querySelectorAll('.bar-chart-bar');
                bars.forEach(bar => {
                    const targetHeight = bar.getAttribute('data-height');
                    bar.style.height = targetHeight;
                });
            }, 100);
        }

        /* Storage bar doldurma animasyonu */
        setTimeout(() => {
            const storageBarFill = document.getElementById('storage-bar-fill');
            if (storageBarFill) {
                storageBarFill.style.width = '8.4%'; // 42MB / 500MB
            }
        }, 150);
    }
}

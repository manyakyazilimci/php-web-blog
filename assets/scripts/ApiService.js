/**
 * ApiService - PHP backend API istemcisi
 */
export class ApiService {
    static BASE = '/api';

    static async request(path, options = {}) {
        const url = `${this.BASE}/${path}`.replace(/\/+/g, '/').replace(':/', '://');
        
        const headers = { 'Content-Type': 'application/json', ...options.headers };
        const method = (options.method || 'GET').toUpperCase();
        if (['POST', 'PUT', 'DELETE'].includes(method)) {
            const csrfToken = sessionStorage.getItem('csrf_token');
            if (csrfToken) {
                headers['X-CSRF-Token'] = csrfToken;
            }
        }

        const config = {
            credentials: 'same-origin',
            headers,
            ...options,
        };

        if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
            config.body = JSON.stringify(config.body);
        }

        if (config.body instanceof FormData) {
            delete config.headers['Content-Type'];
        }

        const response = await fetch(url, config);
        const data = await response.json().catch(() => ({}));

        if (response.status === 401 && !path.startsWith('auth/')) {
            const onLoginPage = window.location.pathname.includes('/admin/login');
            if (window.location.pathname.includes('/admin') && !onLoginPage) {
                window.location.href = '/admin/login';
            }
            throw new Error(data.error || 'Oturum suresi doldu.');
        }

        if (!response.ok || data.success === false) {
            throw new Error(data.error || `API hatasi (${response.status})`);
        }

        if (data.data && data.data.csrfToken) {
            sessionStorage.setItem('csrf_token', data.data.csrfToken);
        }

        return data.data !== undefined ? data.data : data;
    }

    /* Auth */
    static login(username, password) {
        return this.request('auth/login', { method: 'POST', body: { username, password } });
    }

    static async logout() {
        try {
            await this.request('auth/logout', { method: 'POST' });
        } finally {
            sessionStorage.removeItem('csrf_token');
        }
    }

    static checkAuth() {
        return this.request('auth/check');
    }

    /* Posts */
    static getPosts(status = null) {
        const query = status ? `?status=${status}` : '';
        return this.request(`posts${query}`);
    }

    static getPostById(id) {
        return this.request(`posts/${id}`);
    }

    static getPostBySlug(slug) {
        return this.request(`posts/slug/${slug}`);
    }

    static createPost(post) {
        return this.request('posts', { method: 'POST', body: post });
    }

    static updatePost(id, post) {
        return this.request(`posts/${id}`, { method: 'PUT', body: post });
    }

    static deletePost(id) {
        return this.request(`posts/${id}`, { method: 'DELETE' });
    }

    /* Categories */
    static getCategories() {
        return this.request('categories');
    }

    static createCategory(category) {
        return this.request('categories', { method: 'POST', body: category });
    }

    static updateCategory(id, category) {
        return this.request(`categories/${id}`, { method: 'PUT', body: category });
    }

    static deleteCategory(id) {
        return this.request(`categories/${id}`, { method: 'DELETE' });
    }

    /* Settings */
    static getSettings() {
        return this.request('settings');
    }

    static updateSettings(settings) {
        return this.request('settings', { method: 'PUT', body: settings });
    }

    /* About */
    static getAbout() {
        return this.request('about');
    }

    static updateAbout(about) {
        return this.request('about', { method: 'PUT', body: about });
    }

    /* Manifesto */
    static getManifesto() {
        return this.request('manifesto');
    }

    static updateManifesto(data) {
        return this.request('manifesto', { method: 'PUT', body: data });
    }

    /* Media */
    static getMedia() {
        return this.request('media');
    }

    static deleteMedia(id) {
        return this.request(`media/${id}`, { method: 'DELETE' });
    }

    /* Activities */
    static getActivities() {
        return this.request('activities');
    }

    /* Upload */
    static uploadFile(file) {
        const formData = new FormData();
        formData.append('file', file);
        return this.request('upload', { method: 'POST', body: formData });
    }

    /* Newsletter */
    static getNewsletterSubscribers(status = null) {
        const query = status ? `?status=${status}` : '';
        return this.request(`newsletter${query}`);
    }

    static deleteNewsletterSubscriber(id) {
        return this.request(`newsletter/${id}`, { method: 'DELETE' });
    }

    /* Contact Messages */
    static getContactMessages(status = null) {
        const query = status ? `?status=${status}` : '';
        return this.request(`contact${query}`);
    }

    static updateContactMessageStatus(id, status) {
        return this.request(`contact/${id}`, { method: 'PUT', body: { status } });
    }

    static deleteContactMessage(id) {
        return this.request(`contact/${id}`, { method: 'DELETE' });
    }

    /* Views */
    static getViews(postId = null) {
        const query = postId ? `?post_id=${postId}` : '';
        return this.request(`views${query}`);
    }

    static trackView(postId, postSlug) {
        return this.request('views', { method: 'POST', body: { postId, postSlug } });
    }

    /* Mail Settings */
    static getMailSettings() {
        return this.request('mail-settings');
    }

    static updateMailSettings(settings) {
        return this.request('mail-settings', { method: 'PUT', body: settings });
    }
}

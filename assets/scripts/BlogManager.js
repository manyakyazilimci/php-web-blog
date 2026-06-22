import { ApiService } from './ApiService.js';
import { BlogPost } from './Models.js';

/**
 * BlogManager - Blog yazısı yönetim sistemi (API tabanlı)
 */
export class BlogManager {
    constructor() {
        this.posts = [];
        this.loaded = false;
    }

    async load() {
        try {
            const data = await ApiService.getPosts('published');
            this.posts = data.map(p => this.mapToModel(p));
            this.loaded = true;
        } catch (error) {
            console.error('Yazilar yuklenemedi:', error);
            this.posts = [];
        }
        return this.posts;
    }

    mapToModel(p) {
        const post = new BlogPost(p.id, p.title, p.category, p.date, p.readTime, p.lead, p.body);
        post.status = p.status || 'published';
        post.slug = p.slug;
        post.featuredImage = p.featuredImage || null;
        return post;
    }

    getPosts() {
        return this.posts.filter(p => p.status !== 'draft');
    }

    getAllPosts() {
        return this.posts;
    }

    getPostById(id) {
        return this.posts.find(post => post.id === id);
    }

    getPostBySlug(slug) {
        return this.posts.find(post => post.slug === slug);
    }

    getStats() {
        const total = this.posts.length;
        let totalMinutes = 0;
        this.posts.forEach(p => {
            const min = parseInt(p.readTime) || 5;
            totalMinutes += min;
        });
        const avg = total > 0 ? Math.round(totalMinutes / total) : 0;

        const categories = {};
        this.posts.forEach(p => {
            categories[p.category] = (categories[p.category] || 0) + 1;
        });
        let popularCat = '-';
        let maxCount = 0;
        for (const cat in categories) {
            if (categories[cat] > maxCount) {
                maxCount = categories[cat];
                popularCat = cat;
            }
        }

        return {
            total,
            avg: `${avg} dk`,
            popularCategory: popularCat
        };
    }
}

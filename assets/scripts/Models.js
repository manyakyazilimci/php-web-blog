/**
 * BlogPost - Blog yazısı veri modeli
 */
export class BlogPost {
    constructor(id, title, category, date, readTime, lead, body) {
        this.id = id || this.generateUUID();
        this.title = title;
        this.category = category;
        this.date = date || this.formatCurrentDate();
        this.readTime = readTime || '5 dk';
        this.lead = lead;
        this.body = body;
        this.featuredImage = null;
        this.slug = this.generateSlug(title);
    }

    generateUUID() {
        return 'post_' + Math.random().toString(36).substr(2, 9);
    }

    generateSlug(text) {
        const trMap = {
            'ç': 'c', 'Ç': 'c', 'ğ': 'g', 'Ğ': 'g', 'ı': 'i', 'I': 'i',
            'İ': 'i', 'ö': 'o', 'Ö': 'o', 'ş': 's', 'Ş': 's', 'ü': 'u', 'Ü': 'u'
        };
        let slug = text.toString().toLowerCase().trim();
        for (let key in trMap) {
            slug = slug.replace(new RegExp(key, 'g'), trMap[key]);
        }
        return slug
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-')
            .replace(/^-+/, '')
            .replace(/-+$/, '');
    }

    formatCurrentDate() {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date().toLocaleDateString('tr-TR', options);
    }
}

/**
 * Project - Proje / Keşif veri modeli
 */
export class Project {
    constructor(title, category, year, desc, link = '#') {
        this.title = title;
        this.category = category;
        this.year = year;
        this.desc = desc;
        this.link = link;
    }
}

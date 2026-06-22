CREATE DATABASE IF NOT EXISTS nb_blog CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE nb_blog;

CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(20) DEFAULT '#E04E36',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS posts (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    category_id VARCHAR(50) DEFAULT NULL,
    post_date VARCHAR(50) NOT NULL,
    read_time VARCHAR(50) DEFAULT '5 dk okuma',
    lead TEXT NOT NULL,
    body LONGTEXT NOT NULL,
    status ENUM('published', 'draft') DEFAULT 'draft',
    featured_image VARCHAR(500) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    INDEX idx_status (status),
    INDEX idx_slug (slug),
    INDEX idx_category_id (category_id),
    CONSTRAINT fk_posts_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS settings (
    setting_key VARCHAR(50) PRIMARY KEY,
    setting_value JSON NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS about_info (
    id TINYINT PRIMARY KEY DEFAULT 1,
    title VARCHAR(255) DEFAULT 'Merhaba, ben Nurullah.',
    subtitle TEXT,
    description TEXT,
    profile_photo VARCHAR(500) DEFAULT NULL,
    contact_button_text VARCHAR(100) DEFAULT 'Benimle İletişime Geç',
    twitter_url VARCHAR(255) DEFAULT NULL,
    github_url VARCHAR(255) DEFAULT NULL,
    linkedin_url VARCHAR(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS media_items (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    url VARCHAR(500) NOT NULL,
    file_type VARCHAR(50) DEFAULT 'image/jpeg',
    file_size INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    icon VARCHAR(50) DEFAULT 'fa-file-alt',
    level ENUM('ERROR', 'WARNING', 'INFO', 'DEBUG') DEFAULT 'INFO',
    ip_address VARCHAR(45) DEFAULT NULL,
    username VARCHAR(100) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS manifesto (
    id TINYINT PRIMARY KEY DEFAULT 1,
    title VARCHAR(255) DEFAULT 'Tasarım Manifestosu',
    subtitle TEXT,
    intro TEXT,
    principles JSON,
    closing_title VARCHAR(255) DEFAULT 'Son Söz',
    closing_text TEXT,
    signature VARCHAR(255) DEFAULT 'Nurullah B.'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id VARCHAR(50) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(100) DEFAULT NULL,
    status ENUM('active', 'unsubscribed') DEFAULT 'active',
    subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    unsubscribed_at TIMESTAMP NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    INDEX idx_email (email),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS contact_messages (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) DEFAULT NULL,
    message TEXT NOT NULL,
    status ENUM('new', 'read', 'replied') DEFAULT 'new',
    ip_address VARCHAR(45) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    INDEX idx_status (status),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS post_views (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id VARCHAR(50) NOT NULL,
    post_slug VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_post_id (post_id),
    INDEX idx_post_slug (post_slug),
    INDEX idx_viewed_at (viewed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mail_settings (
    id TINYINT PRIMARY KEY DEFAULT 1,
    smtp_host VARCHAR(255) DEFAULT NULL,
    smtp_port INT DEFAULT 587,
    smtp_username VARCHAR(255) DEFAULT NULL,
    smtp_password VARCHAR(255) DEFAULT NULL,
    smtp_encryption ENUM('none', 'tls', 'ssl') DEFAULT 'tls',
    from_email VARCHAR(255) DEFAULT NULL,
    from_name VARCHAR(100) DEFAULT NULL,
    reply_to_email VARCHAR(255) DEFAULT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

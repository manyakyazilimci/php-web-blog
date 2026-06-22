<?php

require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/../config/database.php';

$method = $_SERVER['REQUEST_METHOD'];
$path = trim($_GET['path'] ?? '', '/');
$segments = $path !== '' ? explode('/', $path) : [];

try {
    $pdo = db();
} catch (PDOException $e) {
    jsonError('Veritabanı bağlantısı kurulamadı. database/install.php çalıştırın.', 503);
}

if (($segments[0] ?? '') === 'auth') {
    handleAuth($pdo, $method, $segments);
}

if (!isPublicApiRequest($method, $segments)) {
    requireAuth();
}

$resource = $segments[0] ?? '';

switch ($resource) {
    case 'posts':
        handlePosts($pdo, $method, $segments);
        break;
    case 'categories':
        handleCategories($pdo, $method, $segments);
        break;
    case 'settings':
        handleSettings($pdo, $method);
        break;
    case 'about':
        handleAbout($pdo, $method);
        break;
    case 'manifesto':
        handleManifesto($pdo, $method);
        break;
    case 'media':
        handleMedia($pdo, $method, $segments);
        break;
    case 'activities':
        handleActivities($pdo, $method);
        break;
    case 'upload':
        handleUpload($method);
        break;
    case 'newsletter':
        handleNewsletter($pdo, $method, $segments);
        break;
    case 'contact':
        handleContact($pdo, $method, $segments);
        break;
    case 'views':
        handleViews($pdo, $method, $segments);
        break;
    case 'mail-settings':
        handleMailSettings($pdo, $method);
        break;
    default:
        jsonError('Endpoint bulunamadı', 404);
}

function handlePosts(PDO $pdo, string $method, array $segments): void
{
    if ($method === 'GET' && count($segments) === 1) {
        $status = $_GET['status'] ?? null;
        $sql = 'SELECT posts.*, categories.name AS category_name FROM posts 
                LEFT JOIN categories ON posts.category_id = categories.id 
                WHERE posts.deleted_at IS NULL';
        $params = [];

        if ($status) {
            $sql .= ' AND posts.status = ?';
            $params[] = $status;
        }

        $sql .= ' ORDER BY posts.created_at DESC';
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $posts = array_map('mapPostRow', $stmt->fetchAll());
        jsonResponse(['success' => true, 'data' => $posts]);
    }

    if ($method === 'GET' && ($segments[1] ?? '') === 'slug' && isset($segments[2])) {
        $stmt = $pdo->prepare('SELECT posts.*, categories.name AS category_name FROM posts 
                               LEFT JOIN categories ON posts.category_id = categories.id 
                               WHERE posts.slug = ? AND posts.deleted_at IS NULL LIMIT 1');
        $stmt->execute([$segments[2]]);
        $row = $stmt->fetch();
        if (!$row) {
            jsonError('Yazı bulunamadı', 404);
        }
        jsonResponse(['success' => true, 'data' => mapPostRow($row)]);
    }

    if ($method === 'GET' && isset($segments[1])) {
        $stmt = $pdo->prepare('SELECT posts.*, categories.name AS category_name FROM posts 
                               LEFT JOIN categories ON posts.category_id = categories.id 
                               WHERE posts.id = ? AND posts.deleted_at IS NULL LIMIT 1');
        $stmt->execute([$segments[1]]);
        $row = $stmt->fetch();
        if (!$row) {
            jsonError('Yazı bulunamadı', 404);
        }
        jsonResponse(['success' => true, 'data' => mapPostRow($row)]);
    }

    if ($method === 'POST' && count($segments) === 1) {
        $data = getJsonBody();
        $title = trim($data['title'] ?? '');
        $lead = trim($data['lead'] ?? '');
        $body = normalizeContentUrls(trim($data['body'] ?? ''));
        $categoryId = trim($data['categoryId'] ?? '');
        $featuredImage = normalizeAssetUrl($data['featuredImage'] ?? null);

        if ($title === '' || $lead === '' || $body === '' || $categoryId === '') {
            jsonError('Başlık, özet, içerik ve kategori zorunludur.');
        }

        $id = generateId('post');
        $slug = generateSlug($title);
        $existing = $pdo->prepare('SELECT COUNT(*) FROM posts WHERE slug = ? AND deleted_at IS NULL');
        $existing->execute([$slug]);
        if ((int) $existing->fetchColumn() > 0) {
            $slug .= '-' . substr($id, -4);
        }

        $stmt = $pdo->prepare(
            'INSERT INTO posts (id, title, slug, category_id, post_date, read_time, lead, body, status, featured_image)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $id,
            $title,
            $slug,
            $categoryId,
            formatPostDate(),
            $data['readTime'] ?? '5 dk okuma',
            $lead,
            $body,
            $data['status'] ?? 'draft',
            $featuredImage,
        ]);

        logActivity($pdo, 'post', 'olusturuldu', $title, 'INFO', 'fa-file-alt');

        $stmt = $pdo->prepare('SELECT posts.*, categories.name AS category_name FROM posts 
                               LEFT JOIN categories ON posts.category_id = categories.id 
                               WHERE posts.id = ? LIMIT 1');
        $stmt->execute([$id]);
        jsonResponse(['success' => true, 'data' => mapPostRow($stmt->fetch())], 201);
    }

    if ($method === 'PUT' && isset($segments[1])) {
        $data = getJsonBody();
        $stmt = $pdo->prepare('SELECT * FROM posts WHERE id = ? AND deleted_at IS NULL LIMIT 1');
        $stmt->execute([$segments[1]]);
        $existing = $stmt->fetch();
        if (!$existing) {
            jsonError('Yazı bulunamadı', 404);
        }

        $title = trim($data['title'] ?? $existing['title']);
        $slug = generateSlug($title);
        $check = $pdo->prepare('SELECT COUNT(*) FROM posts WHERE slug = ? AND id != ? AND deleted_at IS NULL');
        $check->execute([$slug, $segments[1]]);
        if ((int) $check->fetchColumn() > 0) {
            $slug .= '-' . substr($segments[1], -4);
        }

        $body = array_key_exists('body', $data)
            ? normalizeContentUrls(trim($data['body']))
            : $existing['body'];
        $featuredImage = array_key_exists('featuredImage', $data)
            ? normalizeAssetUrl($data['featuredImage'])
            : normalizeAssetUrl($existing['featured_image']);

        $stmt = $pdo->prepare(
            'UPDATE posts SET title = ?, slug = ?, category_id = ?, read_time = ?, lead = ?, body = ?, status = ?, featured_image = ?
             WHERE id = ?'
        );
        $stmt->execute([
            $title,
            $slug,
            $data['categoryId'] ?? $existing['category_id'],
            $data['readTime'] ?? $existing['read_time'],
            $data['lead'] ?? $existing['lead'],
            $body,
            $data['status'] ?? $existing['status'],
            $featuredImage,
            $segments[1],
        ]);

        logActivity($pdo, 'post', 'duzenlendi', $title, 'INFO', 'fa-file-alt');

        $stmt = $pdo->prepare('SELECT posts.*, categories.name AS category_name FROM posts 
                               LEFT JOIN categories ON posts.category_id = categories.id 
                               WHERE posts.id = ?');
        $stmt->execute([$segments[1]]);
        jsonResponse(['success' => true, 'data' => mapPostRow($stmt->fetch())]);
    }

    if ($method === 'DELETE' && isset($segments[1])) {
        $stmt = $pdo->prepare('SELECT title FROM posts WHERE id = ? AND deleted_at IS NULL');
        $stmt->execute([$segments[1]]);
        $post = $stmt->fetch();
        if (!$post) {
            jsonError('Yazı bulunamadı', 404);
        }

        $pdo->prepare('UPDATE posts SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?')->execute([$segments[1]]);
        logActivity($pdo, 'post', 'silindi', $post['title'], 'WARNING', 'fa-trash-alt');
        jsonResponse(['success' => true]);
    }

    jsonError('Geçersiz istek', 405);
}

function handleCategories(PDO $pdo, string $method, array $segments): void
{
    if ($method === 'GET') {
        $stmt = $pdo->query('SELECT * FROM categories WHERE deleted_at IS NULL ORDER BY name ASC');
        $categories = $stmt->fetchAll();

        $postCounts = $pdo->query(
            'SELECT category_id, COUNT(*) AS cnt FROM posts WHERE deleted_at IS NULL GROUP BY category_id'
        )->fetchAll(PDO::FETCH_KEY_PAIR);

        $result = array_map(function ($cat) use ($postCounts) {
            return [
                'id' => $cat['id'],
                'name' => $cat['name'],
                'slug' => $cat['slug'],
                'description' => $cat['description'],
                'color' => $cat['color'],
                'postCount' => (int) ($postCounts[$cat['id']] ?? 0),
            ];
        }, $categories);

        jsonResponse(['success' => true, 'data' => $result]);
    }

    if ($method === 'POST' && count($segments) === 1) {
        $data = getJsonBody();
        $name = trim($data['name'] ?? '');
        if ($name === '') {
            jsonError('Kategori adı zorunludur.');
        }

        $id = generateId('cat');
        $slug = $data['slug'] ?? generateSlug($name);

        $pdo->prepare(
            'INSERT INTO categories (id, name, slug, description, color) VALUES (?, ?, ?, ?, ?)'
        )->execute([
            $id, $name, $slug,
            $data['description'] ?? '',
            $data['color'] ?? '#E04E36',
        ]);

        logActivity($pdo, 'category', 'olusturuldu', $name, 'INFO', 'fa-folder');

        jsonResponse(['success' => true, 'data' => [
            'id' => $id, 'name' => $name, 'slug' => $slug,
            'description' => $data['description'] ?? '',
            'color' => $data['color'] ?? '#E04E36', 'postCount' => 0,
        ]], 201);
    }

    if ($method === 'PUT' && isset($segments[1])) {
        $data = getJsonBody();
        $name = trim($data['name'] ?? '');
        if ($name === '') {
            jsonError('Kategori adı zorunludur.');
        }

        $stmt = $pdo->prepare('SELECT name FROM categories WHERE id = ? AND deleted_at IS NULL');
        $stmt->execute([$segments[1]]);
        $old = $stmt->fetch();
        if (!$old) {
            jsonError('Kategori bulunamadı', 404);
        }

        $slug = $data['slug'] ?? generateSlug($name);
        $pdo->prepare(
            'UPDATE categories SET name = ?, slug = ?, description = ?, color = ? WHERE id = ?'
        )->execute([
            $name, $slug,
            $data['description'] ?? '',
            $data['color'] ?? '#E04E36',
            $segments[1],
        ]);

        logActivity($pdo, 'category', 'duzenlendi', $name, 'INFO', 'fa-folder');

        jsonResponse(['success' => true]);
    }

    if ($method === 'DELETE' && isset($segments[1])) {
        $stmt = $pdo->prepare('SELECT name FROM categories WHERE id = ? AND deleted_at IS NULL');
        $stmt->execute([$segments[1]]);
        $cat = $stmt->fetch();
        if (!$cat) {
            jsonError('Kategori bulunamadı', 404);
        }
        $pdo->prepare('UPDATE categories SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?')->execute([$segments[1]]);
        logActivity($pdo, 'category', 'silindi', $cat['name'], 'WARNING', 'fa-folder');
        jsonResponse(['success' => true]);
    }

    jsonError('Geçersiz istek', 405);
}

function handleSettings(PDO $pdo, string $method): void
{
    if ($method === 'GET') {
        $stmt = $pdo->prepare('SELECT setting_value FROM settings WHERE setting_key = ?');
        $stmt->execute(['site']);
        $row = $stmt->fetch();
        $settings = $row ? json_decode($row['setting_value'], true) : [];
        jsonResponse(['success' => true, 'data' => $settings]);
    }

    if ($method === 'PUT') {
        $data = getJsonBody();
        $stmt = $pdo->prepare('SELECT setting_value FROM settings WHERE setting_key = ?');
        $stmt->execute(['site']);
        $row = $stmt->fetch();
        $current = $row ? json_decode($row['setting_value'], true) : [];
        $merged = array_merge($current, $data);

        $pdo->prepare(
            'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)
             ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)'
        )->execute(['site', json_encode($merged, JSON_UNESCAPED_UNICODE)]);

        jsonResponse(['success' => true, 'data' => $merged]);
    }

    jsonError('Geçersiz istek', 405);
}

function handleAbout(PDO $pdo, string $method): void
{
    if ($method === 'GET') {
        $row = $pdo->query('SELECT * FROM about_info WHERE id = 1')->fetch();
        if (!$row) {
            jsonResponse(['success' => true, 'data' => []]);
        }
        jsonResponse(['success' => true, 'data' => [
            'title' => $row['title'],
            'subtitle' => $row['subtitle'],
            'description' => $row['description'],
            'profilePhoto' => $row['profile_photo'],
            'contactButtonText' => $row['contact_button_text'],
            'twitterUrl' => $row['twitter_url'],
            'githubUrl' => $row['github_url'],
            'linkedinUrl' => $row['linkedin_url'],
        ]]);
    }

    if ($method === 'PUT') {
        $data = getJsonBody();
        $pdo->prepare(
            'UPDATE about_info SET title = ?, subtitle = ?, description = ?, profile_photo = ?,
             contact_button_text = ?, twitter_url = ?, github_url = ?, linkedin_url = ? WHERE id = 1'
        )->execute([
            $data['title'] ?? '',
            $data['subtitle'] ?? '',
            $data['description'] ?? '',
            $data['profilePhoto'] ?? null,
            $data['contactButtonText'] ?? 'Benimle İletişime Geç',
            $data['twitterUrl'] ?? null,
            $data['githubUrl'] ?? null,
            $data['linkedinUrl'] ?? null,
        ]);
        jsonResponse(['success' => true]);
    }

    jsonError('Geçersiz istek', 405);
}

function mapManifestoRow(array $row): array
{
    $principles = $row['principles'] ?? '[]';
    if (is_string($principles)) {
        $principles = json_decode($principles, true) ?: [];
    }

    return [
        'title' => $row['title'],
        'subtitle' => $row['subtitle'],
        'intro' => $row['intro'],
        'principles' => $principles,
        'closingTitle' => $row['closing_title'],
        'closingText' => $row['closing_text'],
        'signature' => $row['signature'],
    ];
}

function handleManifesto(PDO $pdo, string $method): void
{
    if ($method === 'GET') {
        $row = $pdo->query('SELECT * FROM manifesto WHERE id = 1')->fetch();
        if (!$row) {
            jsonResponse(['success' => true, 'data' => []]);
        }
        jsonResponse(['success' => true, 'data' => mapManifestoRow($row)]);
    }

    if ($method === 'PUT') {
        $data = getJsonBody();
        $principles = isset($data['principles']) ? json_encode($data['principles'], JSON_UNESCAPED_UNICODE) : '[]';

        $pdo->prepare(
            'INSERT INTO manifesto (id, title, subtitle, intro, principles, closing_title, closing_text, signature)
             VALUES (1, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
             title = VALUES(title), subtitle = VALUES(subtitle), intro = VALUES(intro),
             principles = VALUES(principles), closing_title = VALUES(closing_title),
             closing_text = VALUES(closing_text), signature = VALUES(signature)'
        )->execute([
            $data['title'] ?? '',
            $data['subtitle'] ?? '',
            $data['intro'] ?? '',
            $principles,
            $data['closingTitle'] ?? 'Son Söz',
            $data['closingText'] ?? '',
            $data['signature'] ?? '',
        ]);

        logActivity($pdo, 'manifesto', 'guncellendi', 'Manifesto', 'fa-scroll');
        jsonResponse(['success' => true]);
    }

    jsonError('Geçersiz istek', 405);
}

function handleMedia(PDO $pdo, string $method, array $segments): void
{
    if ($method === 'GET') {
        $items = $pdo->query('SELECT * FROM media_items WHERE deleted_at IS NULL ORDER BY created_at DESC')->fetchAll();
        $result = array_map(fn ($item) => [
            'id' => $item['id'],
            'name' => $item['name'],
            'url' => $item['url'],
            'type' => $item['file_type'],
            'size' => (int) $item['file_size'],
            'uploadDate' => $item['created_at'],
        ], $items);
        jsonResponse(['success' => true, 'data' => $result]);
    }

    if ($method === 'POST') {
        $data = getJsonBody();
        $id = generateId('media');
        $pdo->prepare(
            'INSERT INTO media_items (id, name, url, file_type, file_size) VALUES (?, ?, ?, ?, ?)'
        )->execute([
            $id,
            $data['name'] ?? 'gorsel',
            $data['url'] ?? '',
            $data['type'] ?? 'image/jpeg',
            $data['size'] ?? 0,
        ]);
        
        logActivity($pdo, 'media', 'olusturuldu', $data['name'] ?? 'gorsel', 'INFO', 'fa-image');
        
        jsonResponse(['success' => true, 'data' => ['id' => $id]], 201);
    }

    if ($method === 'DELETE' && isset($segments[1])) {
        $stmt = $pdo->prepare('SELECT name FROM media_items WHERE id = ? AND deleted_at IS NULL');
        $stmt->execute([$segments[1]]);
        $media = $stmt->fetch();
        if ($media) {
            $pdo->prepare('UPDATE media_items SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?')->execute([$segments[1]]);
            logActivity($pdo, 'media', 'silindi', $media['name'], 'WARNING', 'fa-image');
        }
        jsonResponse(['success' => true]);
    }

    jsonError('Geçersiz istek', 405);
}

function handleActivities(PDO $pdo, string $method): void
{
    if ($method === 'GET') {
        $rows = $pdo->query(
            'SELECT type, action, title, icon, created_at FROM activities ORDER BY created_at DESC LIMIT 10'
        )->fetchAll();

        $result = array_map(function ($row) {
            $diff = time() - strtotime($row['created_at']);
            if ($diff < 60) {
                $date = 'Az önce';
            } elseif ($diff < 3600) {
                $date = floor($diff / 60) . ' dk önce';
            } else {
                $date = floor($diff / 3600) . ' saat önce';
            }
            return [
                'type' => $row['type'],
                'action' => $row['action'],
                'title' => $row['title'],
                'icon' => $row['icon'],
                'date' => $date,
            ];
        }, $rows);

        jsonResponse(['success' => true, 'data' => $result]);
    }

    jsonError('Geçersiz istek', 405);
}

function handleUpload(string $method): void
{
    if ($method !== 'POST') {
        jsonError('Geçersiz istek', 405);
    }

    if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
        jsonError('Dosya yüklenemedi.');
    }

    $config = require __DIR__ . '/../config/config.php';
    $upload = $config['upload'];
    $file = $_FILES['file'];

    if ($file['size'] > $upload['max_size']) {
        jsonError('Dosya boyutu 2 MB\'dan büyük olamaz.');
    }

    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);

    if (!in_array($mime, $upload['allowed'], true)) {
        jsonError('Geçersiz dosya türü. Sadece JPG, PNG, GIF ve WebP kabul edilir.');
    }

    if (!is_dir($upload['dir'])) {
        mkdir($upload['dir'], 0755, true);
    }

    $ext = match ($mime) {
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/gif' => 'gif',
        'image/webp' => 'webp',
        default => 'jpg',
    };

    $filename = 'post_' . bin2hex(random_bytes(8)) . '.' . $ext;
    $dest = $upload['dir'] . '/' . $filename;

    if (!move_uploaded_file($file['tmp_name'], $dest)) {
        jsonError('Dosya kaydedilemedi.', 500);
    }

    $url = $upload['url'] . '/' . $filename;

    try {
        $pdo = db();
        $id = generateId('media');
        $pdo->prepare(
            'INSERT INTO media_items (id, name, url, file_type, file_size) VALUES (?, ?, ?, ?, ?)'
        )->execute([$id, $file['name'], $url, $mime, $file['size']]);
        
        logActivity($pdo, 'media', 'yuklendi', $file['name'], 'INFO', 'fa-upload');
    } catch (PDOException $e) {
        // Medya kaydi basarisiz olsa bile upload basarili
    }

    jsonResponse(['success' => true, 'data' => [
        'url' => $url,
        'name' => $file['name'],
        'type' => $mime,
        'size' => $file['size'],
    ]]);
}

function handleNewsletter(PDO $pdo, string $method, array $segments): void
{
    if ($method === 'GET') {
        $status = $_GET['status'] ?? null;
        $sql = 'SELECT * FROM newsletter_subscribers WHERE deleted_at IS NULL';
        $params = [];

        if ($status) {
            $sql .= ' AND status = ?';
            $params[] = $status;
        }

        $sql .= ' ORDER BY subscribed_at DESC';
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $subscribers = $stmt->fetchAll();

        $result = array_map(function ($sub) {
            return [
                'id' => $sub['id'],
                'email' => $sub['email'],
                'name' => $sub['name'],
                'status' => $sub['status'],
                'subscribedAt' => $sub['subscribed_at'],
                'unsubscribedAt' => $sub['unsubscribed_at'],
            ];
        }, $subscribers);

        jsonResponse(['success' => true, 'data' => $result]);
    }

    if ($method === 'POST' && count($segments) === 1) {
        $data = getJsonBody();
        $email = trim($data['email'] ?? '');
        $name = trim($data['name'] ?? '');

        if ($email === '') {
            jsonError('E-posta adresi zorunludur.');
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            jsonError('Geçersiz e-posta adresi.');
        }

        $existing = $pdo->prepare('SELECT id, status FROM newsletter_subscribers WHERE email = ? AND deleted_at IS NULL');
        $existing->execute([$email]);
        $row = $existing->fetch();

        if ($row) {
            if ($row['status'] === 'unsubscribed') {
                $pdo->prepare('UPDATE newsletter_subscribers SET status = ?, unsubscribed_at = NULL WHERE id = ?')
                    ->execute(['active', $row['id']]);
                logActivity($pdo, 'newsletter', 'abone yeniden aktiflesti', $email, 'INFO', 'fa-user-plus');
                jsonResponse(['success' => true, 'message' => 'Bültene yeniden kaydoldunuz.']);
            } else {
                jsonError('Bu e-posta adresi zaten bültene kayıtlı.');
            }
        }

        $id = generateId('sub');
        $ip = $_SERVER['REMOTE_ADDR'] ?? null;

        $stmt = $pdo->prepare(
            'INSERT INTO newsletter_subscribers (id, email, name, status, ip_address) VALUES (?, ?, ?, ?, ?)'
        );
        $stmt->execute([$id, $email, $name ?: null, 'active', $ip]);

        logActivity($pdo, 'newsletter', 'yeni abone kaydoldu', $email, 'INFO', 'fa-user-plus');

        jsonResponse(['success' => true, 'message' => 'Bültene başarıyla kaydoldunuz.'], 201);
    }

    if ($method === 'DELETE' && isset($segments[1])) {
        $stmt = $pdo->prepare('SELECT email FROM newsletter_subscribers WHERE id = ? AND deleted_at IS NULL');
        $stmt->execute([$segments[1]]);
        $sub = $stmt->fetch();
        if ($sub) {
            $pdo->prepare('UPDATE newsletter_subscribers SET status = ?, unsubscribed_at = NOW(), deleted_at = CURRENT_TIMESTAMP WHERE id = ?')
                ->execute(['unsubscribed', $segments[1]]);
            logActivity($pdo, 'newsletter', 'abone silindi', $sub['email'], 'WARNING', 'fa-envelope-open');
        }
        jsonResponse(['success' => true]);
    }

    jsonError('Geçersiz istek', 405);
}

function handleContact(PDO $pdo, string $method, array $segments): void
{
    if ($method === 'GET') {
        $status = $_GET['status'] ?? null;
        $sql = 'SELECT * FROM contact_messages WHERE deleted_at IS NULL';
        $params = [];

        if ($status) {
            $sql .= ' WHERE status = ?';
            $params[] = $status;
        }

        $sql .= ' ORDER BY created_at DESC';
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $messages = $stmt->fetchAll();

        $result = array_map(function ($msg) {
            return [
                'id' => $msg['id'],
                'name' => $msg['name'],
                'email' => $msg['email'],
                'subject' => $msg['subject'],
                'message' => $msg['message'],
                'status' => $msg['status'],
                'createdAt' => $msg['created_at'],
            ];
        }, $messages);

        jsonResponse(['success' => true, 'data' => $result]);
    }

    if ($method === 'POST' && count($segments) === 1) {
        $data = getJsonBody();
        $name = trim($data['name'] ?? '');
        $email = trim($data['email'] ?? '');
        $subject = trim($data['subject'] ?? '');
        $message = trim($data['message'] ?? '');

        if ($name === '' || $email === '' || $message === '') {
            jsonError('İsim, e-posta ve mesaj zorunludur.');
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            jsonError('Geçersiz e-posta adresi.');
        }

        $id = generateId('msg');
        $ip = $_SERVER['REMOTE_ADDR'] ?? null;

        $stmt = $pdo->prepare(
            'INSERT INTO contact_messages (id, name, email, subject, message, ip_address) VALUES (?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([$id, $name, $email, $subject ?: null, $message, $ip]);

        jsonResponse(['success' => true, 'message' => 'Mesajınız başarıyla gönderildi.'], 201);
    }

    if ($method === 'PUT' && isset($segments[1])) {
        $data = getJsonBody();
        $status = $data['status'] ?? null;

        if ($status && in_array($status, ['new', 'read', 'replied'], true)) {
            $pdo->prepare('UPDATE contact_messages SET status = ? WHERE id = ? AND deleted_at IS NULL')
                ->execute([$status, $segments[1]]);
            
            logActivity($pdo, 'contact', 'mesaj durumu guncellendi', "Durum: {$status}", 'INFO', 'fa-comment');
        }

        jsonResponse(['success' => true]);
    }

    if ($method === 'DELETE' && isset($segments[1])) {
        $stmt = $pdo->prepare('SELECT name, subject FROM contact_messages WHERE id = ? AND deleted_at IS NULL');
        $stmt->execute([$segments[1]]);
        $msg = $stmt->fetch();
        if ($msg) {
            $pdo->prepare('UPDATE contact_messages SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?')->execute([$segments[1]]);
            logActivity($pdo, 'contact', 'mesaj silindi', $msg['name'] . ': ' . ($msg['subject'] ?? 'Konusuz'), 'WARNING', 'fa-comment-slash');
        }
        jsonResponse(['success' => true]);
    }

    jsonError('Geçersiz istek', 405);
}

function handleViews(PDO $pdo, string $method, array $segments): void
{
    if ($method === 'GET') {
        $postId = $_GET['post_id'] ?? null;
        
        if ($postId) {
            $stmt = $pdo->prepare('SELECT COUNT(*) as view_count FROM post_views WHERE post_id = ?');
            $stmt->execute([$postId]);
            $count = $stmt->fetch();
            jsonResponse(['success' => true, 'data' => ['viewCount' => (int) $count['view_count']]]);
        }

        $stmt = $pdo->query('
            SELECT post_id, post_slug, COUNT(*) as view_count 
            FROM post_views 
            GROUP BY post_id, post_slug 
            ORDER BY view_count DESC
        ');
        $stats = $stmt->fetchAll();

        $result = array_map(function ($stat) {
            return [
                'postId' => $stat['post_id'],
                'postSlug' => $stat['post_slug'],
                'viewCount' => (int) $stat['view_count'],
            ];
        }, $stats);

        jsonResponse(['success' => true, 'data' => $result]);
    }

    if ($method === 'POST' && count($segments) === 1) {
        $data = getJsonBody();
        $postId = trim($data['postId'] ?? '');
        $postSlug = trim($data['postSlug'] ?? '');

        if ($postId === '' || $postSlug === '') {
            jsonError('Yazı ID ve slug zorunludur.');
        }

        $ip = $_SERVER['REMOTE_ADDR'] ?? null;
        $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? null;

        $stmt = $pdo->prepare(
            'INSERT INTO post_views (post_id, post_slug, ip_address, user_agent) VALUES (?, ?, ?, ?)'
        );
        $stmt->execute([$postId, $postSlug, $ip, $userAgent]);

        jsonResponse(['success' => true], 201);
    }

    jsonError('Geçersiz istek', 405);
}

function handleMailSettings(PDO $pdo, string $method): void
{
    if ($method === 'GET') {
        $row = $pdo->query('SELECT * FROM mail_settings WHERE id = 1')->fetch();
        if (!$row) {
            jsonResponse(['success' => true, 'data' => []]);
        }
        jsonResponse(['success' => true, 'data' => [
            'smtpHost' => $row['smtp_host'],
            'smtpPort' => (int) $row['smtp_port'],
            'smtpUsername' => $row['smtp_username'],
            'smtpPassword' => $row['smtp_password'],
            'smtpEncryption' => $row['smtp_encryption'],
            'fromEmail' => $row['from_email'],
            'fromName' => $row['from_name'],
            'replyToEmail' => $row['reply_to_email'],
        ]]);
    }

    if ($method === 'PUT') {
        $data = getJsonBody();
        $pdo->prepare(
            'INSERT INTO mail_settings (id, smtp_host, smtp_port, smtp_username, smtp_password, smtp_encryption, from_email, from_name, reply_to_email)
             VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
             smtp_host = VALUES(smtp_host), smtp_port = VALUES(smtp_port), smtp_username = VALUES(smtp_username),
             smtp_password = VALUES(smtp_password), smtp_encryption = VALUES(smtp_encryption),
             from_email = VALUES(from_email), from_name = VALUES(from_name), reply_to_email = VALUES(reply_to_email)'
        )->execute([
            $data['smtpHost'] ?? null,
            $data['smtpPort'] ?? 587,
            $data['smtpUsername'] ?? null,
            $data['smtpPassword'] ?? null,
            $data['smtpEncryption'] ?? 'tls',
            $data['fromEmail'] ?? null,
            $data['fromName'] ?? null,
            $data['replyToEmail'] ?? null,
        ]);

        jsonResponse(['success' => true]);
    }

    jsonError('Geçersiz istek', 405);
}

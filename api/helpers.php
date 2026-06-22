<?php

function jsonResponse(mixed $data, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function jsonError(string $message, int $status = 400): never
{
    jsonResponse(['success' => false, 'error' => $message], $status);
}

function getJsonBody(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') {
        return [];
    }

    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function generateId(string $prefix = 'id'): string
{
    return $prefix . '_' . bin2hex(random_bytes(6));
}

function generateSlug(string $text): string
{
    $trMap = [
        'ç' => 'c', 'Ç' => 'c', 'ğ' => 'g', 'Ğ' => 'g', 'ı' => 'i', 'I' => 'i',
        'İ' => 'i', 'ö' => 'o', 'Ö' => 'o', 'ş' => 's', 'Ş' => 's', 'ü' => 'u', 'Ü' => 'u',
    ];

    $slug = mb_strtolower(trim($text), 'UTF-8');
    $slug = strtr($slug, $trMap);
    $slug = preg_replace('/\s+/', '-', $slug);
    $slug = preg_replace('/[^\w\-]+/', '', $slug);
    $slug = preg_replace('/\-+/', '-', $slug);

    return trim($slug, '-');
}

function formatPostDate(): string
{
    $months = [
        1 => 'Ocak', 2 => 'Şubat', 3 => 'Mart', 4 => 'Nisan',
        5 => 'Mayıs', 6 => 'Haziran', 7 => 'Temmuz', 8 => 'Ağustos',
        9 => 'Eylül', 10 => 'Ekim', 11 => 'Kasım', 12 => 'Aralık',
    ];

    $day = (int) date('j');
    $month = $months[(int) date('n')];
    $year = date('Y');

    return "{$day} {$month} {$year}";
}

function normalizeAssetUrl(?string $url): ?string
{
    if ($url === null || $url === '') {
        return $url;
    }
    if (preg_match('#^(https?://|/|data:|blob:)#i', $url)) {
        return $url;
    }
    return '/' . ltrim($url, '/');
}

function normalizeContentUrls(string $html): string
{
    if ($html === '') {
        return $html;
    }

    return preg_replace(
        '#(src|href)=(["\'])(?!https?://|/|data:|blob:|mailto:)(uploads/)#i',
        '$1=$2/$3',
        $html
    );
}

function mapPostRow(array $row): array
{
    return [
        'id' => $row['id'],
        'title' => $row['title'],
        'slug' => $row['slug'],
        'categoryId' => $row['category_id'] ?? null,
        'category' => $row['category_name'] ?? $row['category'] ?? '-',
        'date' => $row['post_date'],
        'readTime' => $row['read_time'],
        'lead' => $row['lead'],
        'body' => normalizeContentUrls($row['body']),
        'status' => $row['status'],
        'featuredImage' => normalizeAssetUrl($row['featured_image']),
    ];
}

function logActivity(PDO $pdo, string $type, string $action, string $title, string $level = 'INFO', string $icon = 'fa-file-alt'): void
{
    if ($level === 'DEBUG') {
        $configPath = __DIR__ . '/../config/config.php';
        if (file_exists($configPath)) {
            $config = require $configPath;
            if (empty($config['debug_mode'])) {
                return;
            }
        } else {
            return;
        }
    }

    $ip = $_SERVER['REMOTE_ADDR'] ?? null;
    $username = $_SESSION['admin_username'] ?? null;

    $pdo->prepare(
        'INSERT INTO activities (type, action, title, icon, level, ip_address, username) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )->execute([$type, $action, mb_substr($title, 0, 255), $icon, $level, $ip, $username]);
}

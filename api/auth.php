<?php

if (session_status() === PHP_SESSION_NONE) {
    $lifetime = 86400;
    $configPath = __DIR__ . '/../config/config.php';
    if (file_exists($configPath)) {
        $config = require $configPath;
        if (isset($config['session']['lifetime'])) {
            $lifetime = $config['session']['lifetime'];
        }
    }
    
    session_set_cookie_params([
        'lifetime' => $lifetime,
        'path' => '/',
        'domain' => '',
        'secure' => isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on',
        'httponly' => true,
        'samesite' => 'Lax'
    ]);
    session_start();
}

function isAuthenticated(): bool
{
    return !empty($_SESSION['admin_id']);
}

function requireAuth(): void
{
    if (!isAuthenticated()) {
        jsonError('Oturum gerekli. Lütfen giriş yapın.', 401);
    }

    // CSRF koruması: POST, PUT, DELETE metotları için doğrulama yap
    $method = $_SERVER['REQUEST_METHOD'];
    if (in_array($method, ['POST', 'PUT', 'DELETE'], true)) {
        $headers = getallheaders();
        $csrfToken = $headers['X-CSRF-Token'] ?? $headers['x-csrf-token'] ?? '';
        if ($csrfToken === '' || empty($_SESSION['csrf_token']) || $csrfToken !== $_SESSION['csrf_token']) {
            jsonError('Geçersiz CSRF isteği.', 403);
        }
    }
}

function loginUser(array $user): void
{
    $_SESSION['admin_id'] = $user['id'];
    $_SESSION['admin_username'] = $user['username'];
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
}

function logoutUser(): void
{
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $p = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $p['path'], $p['domain'], $p['secure'], $p['httponly']);
    }
    session_destroy();
}

function handleAuth(PDO $pdo, string $method, array $segments): void
{
    $action = $segments[1] ?? '';

    if ($action === 'login' && $method === 'POST') {
        $data = getJsonBody();
        $username = trim($data['username'] ?? '');
        $password = $data['password'] ?? '';

        if ($username === '' || $password === '') {
            jsonError('Kullanıcı adı ve şifre zorunludur.');
        }

        $stmt = $pdo->prepare('SELECT id, username, password_hash FROM admin_users WHERE username = ? LIMIT 1');
        $stmt->execute([$username]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($password, $user['password_hash'])) {
            jsonError('Geçersiz kullanıcı adı veya şifre.', 401);
        }

        loginUser($user);
        jsonResponse(['success' => true, 'data' => [
            'username' => $user['username'],
            'csrfToken' => $_SESSION['csrf_token'] ?? null,
        ]]);
    }

    if ($action === 'logout' && $method === 'POST') {
        logoutUser();
        jsonResponse(['success' => true]);
    }

    if ($action === 'check' && $method === 'GET') {
        if (!isAuthenticated()) {
            jsonError('Oturum yok', 401);
        }
        if (empty($_SESSION['csrf_token'])) {
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        }
        jsonResponse(['success' => true, 'data' => [
            'username' => $_SESSION['admin_username'] ?? 'admin',
            'csrfToken' => $_SESSION['csrf_token'],
        ]]);
    }

    jsonError('Geçersiz istek', 405);
}

function isPublicApiRequest(string $method, array $segments): bool
{
    $resource = $segments[0] ?? '';

    if ($resource === 'auth') {
        return true;
    }

    if ($method === 'GET') {
        if ($resource === 'posts') {
            return isset($_GET['status']) || (($segments[1] ?? '') === 'slug' && isset($segments[2]));
        }
        if (in_array($resource, ['settings', 'about', 'manifesto'], true)) {
            return true;
        }
    }

    if ($method === 'POST') {
        if (in_array($resource, ['newsletter', 'contact', 'views'], true)) {
            return true;
        }
    }

    return false;
}

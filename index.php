<?php

/**
 * Front Controller - SPA ve API yonlendiricisi
 */

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = rawurldecode($uri);

if (str_starts_with($uri, '/api')) {
    $path = substr($uri, strlen('/api'));
    $path = ltrim($path, '/');
    $_GET['path'] = $path;
    require __DIR__ . '/api/index.php';
    exit;
}

$staticExtensions = ['css', 'js', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'ico', 'woff', 'woff2', 'ttf', 'map'];
$extension = strtolower(pathinfo($uri, PATHINFO_EXTENSION));

if ($extension && in_array($extension, $staticExtensions, true)) {
    return false;
}

$filePath = __DIR__ . $uri;

if ($uri !== '/' && is_file($filePath)) {
    return false;
}

if ($uri === '/admin/login' || $uri === '/admin/login/') {
    readfile(__DIR__ . '/login.html');
    exit;
}

if ($uri === '/admin' || $uri === '/admin/') {
    readfile(__DIR__ . '/admin.html');
    exit;
}

if ($uri === '/401' || $uri === '/401/') {
    readfile(__DIR__ . '/401.html');
    exit;
}

if ($uri === '/403' || $uri === '/403/') {
    readfile(__DIR__ . '/403.html');
    exit;
}

if ($uri === '/404' || $uri === '/404/') {
    readfile(__DIR__ . '/404.html');
    exit;
}

if ($uri === '/500' || $uri === '/500/') {
    readfile(__DIR__ . '/500.html');
    exit;
}

readfile(__DIR__ . '/index.html');
exit;

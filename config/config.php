<?php

return [
    'db' => [
        'host' => '--',
        'name' => '--',
        'user' => '--',
        'pass' => '--',
        'charset' => 'utf8mb4',
    ],
    'upload' => [
        'dir' => __DIR__ . '/../uploads/posts',
        'url' => '/uploads/posts',
        'max_size' => 2 * 1024 * 1024,
        'allowed' => ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    ],
    'session' => [
        'lifetime' => 86400,
    ],
];

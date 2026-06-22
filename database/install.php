<?php

/**
 * Veritabani kurulum scripti.
 * Tarayicidan veya CLI'dan calistirin: php database/install.php
 */

$config = require __DIR__ . '/../config/config.php';
$db = $config['db'];

try {
    $pdo = new PDO(
        sprintf('mysql:host=%s;charset=%s', $db['host'], $db['charset']),
        $db['user'],
        $db['pass'],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $schema = file_get_contents(__DIR__ . '/schema.sql');
    $statements = array_filter(array_map('trim', explode(';', $schema)));

    foreach ($statements as $statement) {
        if ($statement !== '') {
            $pdo->exec($statement);
        }
    }

    $pdo->exec("USE {$db['name']}");

    seedDefaults($pdo);

    $uploadDir = __DIR__ . '/../uploads/posts';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    echo "Veritabani basariyla kuruldu: {$db['name']}\n";
} catch (PDOException $e) {
    http_response_code(500);
    echo "Kurulum hatasi: " . $e->getMessage() . "\n";
    exit(1);
}

function seedDefaults(PDO $pdo): void
{
    $count = (int) $pdo->query('SELECT COUNT(*) FROM categories')->fetchColumn();
    if ($count > 0) {
        return;
    }

    $categories = [
        ['cat_1', 'Derin Analiz', 'derin-analiz', 'Kavramsal ve derinlemesine incelemeler.', '#E04E36'],
        ['cat_2', 'Geliştirme', 'gelistirme', 'Kod, teknik ve geliştirme notları.', '#2563EB'],
        ['cat_3', 'Perspektif', 'perspektif', 'Görüş ve fikir yazıları.', '#7C3AED'],
        ['cat_4', 'Etkileşim Tasarımı', 'etkilesim-tasarimi', 'UX ve mikro etkileşim konuları.', '#059669'],
    ];

    $stmt = $pdo->prepare(
        'INSERT INTO categories (id, name, slug, description, color) VALUES (?, ?, ?, ?, ?)'
    );
    foreach ($categories as $cat) {
        $stmt->execute($cat);
    }

    $posts = [
        [
            'post_1',
            'Kullanıcı Arayüzlerinde Minimalizmin Sınırları ve Ötesi',
            'kullanici-arayuzlerinde-minimalizmin-sinirlari-ve-otesi',
            'cat_1',
            '24 Ekim 2026',
            '12 dk okuma',
            'Piksel mükemmelliğinden ziyade deneyim odaklı tasarımların markalara nasıl daha derin bir karakter kazandırdığına dair kavramsal bir inceleme.',
            '<p>Web tasarımı son on yılda dramatik bir şekilde sadeleşti. Karmaşık degradeler, ağır gölgeler ve iskelet tasarımlar yerini düz, geniş boşluklara ve güçlü tipografiye bıraktı.</p><div class="premium-quote">"Tasarım, ekleyecek bir şey kalmadığında değil, çıkarılacak bir şey kalmadığında mükemmele ulaşır."<cite>Antoine de Saint-Exupéry</cite></div><h2>Form İşlevi Takip Etmeli midir?</h2><p>Modernist hareketin en önemli düsturlarından biri olan bu ilke, günümüz web dünyasında sıklıkla sorgulanmaktadır.</p>',
            'published',
            null,
        ],
        [
            'post_2',
            'CSS Grid Yapılarıyla Beklenmedik Düzenler',
            'css-grid-yapilariyla-beklenmedik-duzenler',
            'cat_2',
            '18 Ekim 2026',
            '6 dk okuma',
            'Sıkıcı ve standart hale gelmiş kutu tasarımlarından uzaklaşmak için teknik yaklaşımlar.',
            '<p>Tipik web düzeni, üstte bir kahraman alanı, altta üç sütunlu bir kart yapısı ve bir footer\'dan oluşur. CSS Grid, bu katı sınırları yıkmak için tasarlanmıştır.</p>',
            'published',
            null,
        ],
        [
            'post_3',
            'İyi Ürün Neden Sessizdir?',
            'iyi-urun-neden-sessizdir',
            'cat_3',
            '12 Ekim 2026',
            '8 dk okuma',
            'Sürekli ilgi isteyen gürültülü arayüzlere karşı zarif ürünlerin felsefesi.',
            '<p>Bugün dijital ekosistemde neredeyse her uygulama dikkatimizi satın almak için yarışıyor.</p>',
            'published',
            null,
        ],
        [
            'post_4',
            'Mikro Etkileşimler: Kullanıcıya Dokunan Unutulmaz Detaylar',
            'mikro-etkilesimler-kullaniciya-dokunan-unutulmaz-detaylar',
            'cat_4',
            '5 Ekim 2026',
            '10 dk okuma',
            'Sadece bir butona basmak değil, butona basmanın hissini tasarlamak.',
            '<p>Mikro etkileşimler, bir arayüzdeki tek bir görevi yerine getiren küçük detaylardır.</p>',
            'published',
            null,
        ],
    ];

    $stmt = $pdo->prepare(
        'INSERT INTO posts (id, title, slug, category_id, post_date, read_time, lead, body, status, featured_image)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    foreach ($posts as $post) {
        $stmt->execute($post);
    }

    $defaultSettings = json_encode([
        'siteName' => 'Nurullah B.',
        'siteDescription' => 'Kişisel blog ve dijital günlük',
        'logoText' => 'NB.',
        'copyrightText' => '&copy; 2026 Nurullah B. Dijital Günlük.',
        'siteActive' => true,
        'darkMode' => false,
        'cardView' => 'bento',
        'themeColor' => '#E04E36',
    ], JSON_UNESCAPED_UNICODE);

    $pdo->prepare('INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)')
        ->execute(['site', $defaultSettings]);

    $pdo->exec("INSERT INTO about_info (id, title, subtitle, description) VALUES (
        1,
        'Merhaba, ben Nurullah.',
        'Dijital dünyada estetik ve işlevi bir araya getiren bir ürün tasarımcısı ve geliştiricisiyim.',
        'İyi tasarımın sadece güzel görünmekle kalmayıp, karmaşık problemleri basit etkileşimlere dönüştürmek olduğuna inanıyorum.'
    )");

    $principles = json_encode([
        ['number' => '01', 'title' => 'Form İşlevi Takip Eder, Ama Estetik Gereklidir.', 'text' => 'Bir ürünün sadece çalışması yetmez; kullanıcısında bir his uyandırmalıdır.'],
        ['number' => '02', 'title' => 'Sessiz Tasarım', 'text' => 'Arayüzler kullanıcıya bağırmamalıdır.'],
        ['number' => '03', 'title' => 'Performans Bir Tasarım Özelliğidir', 'text' => 'Yavaş bir site, kötü tasarlanmış bir sitedir.'],
    ], JSON_UNESCAPED_UNICODE);

    $pdo->prepare('INSERT INTO manifesto (id, title, subtitle, intro, principles, closing_title, closing_text, signature) VALUES (1,?,?,?,?,?,?,?)')
        ->execute([
            'Tasarım Manifestosu',
            'Dijital ekosistemde nasıl var olmalıyız?',
            'Web, sonsuz bir gürültü alanı haline geldi. Bu manifesto, daha sakin dijital ürünler yaratmak için bir taahhüttür.',
            $principles,
            'Son Söz',
            'Bizler dijital dünyanın mimarlarıyız.',
            'Nurullah B.',
        ]);

    $hash = password_hash('admin123', PASSWORD_DEFAULT);
    $pdo->prepare('INSERT INTO admin_users (username, password_hash) VALUES (?, ?)')->execute(['admin', $hash]);
}

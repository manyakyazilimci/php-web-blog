<?php

/**
 * Veritabanı Migrasyon ve Tohum Scripti
 * Mevcut verileri koruyarak veritabanı şemasını yeni yapıya günceller ve tohum verileri oluşturur.
 * php database/migrate.php
 */

$config = require __DIR__ . '/../config/config.php';
$db = $config['db'];

try {
    $pdo = new PDO(
        sprintf('mysql:host=%s;dbname=%s;charset=%s', $db['host'], $db['name'], $db['charset']),
        $db['user'],
        $db['pass'],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    echo "Veritabanina baglanildi. Migrasyon ve tohumlama baslatiliyor...\n";

    // 1. Yardimci Fonksiyonlar
    function addColumnIfNotExists(PDO $pdo, string $table, string $column, string $definition): void
    {
        $stmt = $pdo->prepare("
            SELECT COUNT(*) 
            FROM information_schema.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
              AND TABLE_NAME = ? 
              AND COLUMN_NAME = ?
        ");
        $stmt->execute([$table, $column]);
        if ((int) $stmt->fetchColumn() === 0) {
            $pdo->exec("ALTER TABLE `{$table}` ADD COLUMN `{$column}` {$definition}");
            echo "- `{$table}` tablosuna `{$column}` sutunu eklendi.\n";
        }
    }

    function generateSlug(string $title): string
    {
        $slug = strtr($title, [
            'Ş' => 'S', 'İ' => 'I', 'Ç' => 'C', 'Ü' => 'U', 'Ö' => 'O', 'Ğ' => 'G',
            'ş' => 's', 'ı' => 'i', 'ç' => 'c', 'ü' => 'u', 'ö' => 'o', 'ğ' => 'g'
        ]);
        $slug = strtolower($slug);
        $slug = preg_replace('/[^a-z0-9]+/', '-', $slug);
        $slug = trim($slug, '-');
        return $slug;
    }

    // 2. Soft Delete (deleted_at) Sutunlarini Ekle
    addColumnIfNotExists($pdo, 'categories', 'deleted_at', 'TIMESTAMP NULL DEFAULT NULL');
    addColumnIfNotExists($pdo, 'media_items', 'deleted_at', 'TIMESTAMP NULL DEFAULT NULL');
    addColumnIfNotExists($pdo, 'newsletter_subscribers', 'deleted_at', 'TIMESTAMP NULL DEFAULT NULL');
    addColumnIfNotExists($pdo, 'contact_messages', 'deleted_at', 'TIMESTAMP NULL DEFAULT NULL');
    addColumnIfNotExists($pdo, 'posts', 'deleted_at', 'TIMESTAMP NULL DEFAULT NULL');

    // 3. Activities Tablosu Audit Log Sutunlarini Ekle
    addColumnIfNotExists($pdo, 'activities', 'level', "ENUM('ERROR', 'WARNING', 'INFO', 'DEBUG') DEFAULT 'INFO'");
    addColumnIfNotExists($pdo, 'activities', 'ip_address', 'VARCHAR(45) DEFAULT NULL');
    addColumnIfNotExists($pdo, 'activities', 'username', 'VARCHAR(100) DEFAULT NULL');

    // 4. Kategori Tohum Verilerini Ekle
    $categoriesToSeed = [
        ['id' => 'cat-derin-analiz', 'name' => 'Derin Analiz', 'slug' => 'derin-analiz', 'description' => 'Derinlemesine tasarim ve teknoloji analizleri.', 'color' => '#E04E36'],
        ['id' => 'cat-gelistirme', 'name' => 'Gelisirme', 'slug' => 'gelistirme', 'description' => 'Yazilim gelistirme surecleri ve vibe coding.', 'color' => '#2D2C2A'],
        ['id' => 'cat-etkilesim-tasarimi', 'name' => 'Etkilesim Tasarimi', 'slug' => 'etkilesim-tasarimi', 'description' => 'Kullanici etkilesimleri ve mikro etkilesimler.', 'color' => '#BDB9A6'],
        ['id' => 'cat-urun-tasarimi', 'name' => 'Urun Tasarimi', 'slug' => 'urun-tasarimi', 'description' => 'Urun tasarimi ve renk psikolojisi.', 'color' => '#E04E36'],
        ['id' => 'cat-konsept', 'name' => 'Konsept', 'slug' => 'konsept', 'description' => 'Tasarim konseptleri ve animasyonlar.', 'color' => '#1A1A1A']
    ];

    foreach ($categoriesToSeed as $cat) {
        $stmt = $pdo->prepare('SELECT COUNT(*) FROM categories WHERE id = ?');
        $stmt->execute([$cat['id']]);
        if ((int) $stmt->fetchColumn() === 0) {
            $pdo->prepare('INSERT INTO categories (id, name, slug, description, color) VALUES (?, ?, ?, ?, ?)')
                ->execute([$cat['id'], $cat['name'], $cat['slug'], $cat['description'], $cat['color']]);
            echo "- Kategori eklendi: {$cat['name']}\n";
        }
    }

    // 5. Posts Tablosunda category_id Iliskisini Kur ve Verileri Tasi
    $stmt = $pdo->prepare("
        SELECT COUNT(*) 
        FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'posts' 
          AND COLUMN_NAME = 'category'
    ");
    $stmt->execute();
    $hasOldCategoryColumn = (int) $stmt->fetchColumn() > 0;

    // category_id sutununu ekle
    addColumnIfNotExists($pdo, 'posts', 'category_id', 'VARCHAR(50) DEFAULT NULL');

    if ($hasOldCategoryColumn) {
        echo "Eski 'category' sutunu bulundu. Veriler 'category_id' sutununa tasiniyor...\n";
        
        // Verileri isim eslesmesi uzerinden guncelle
        $pdo->exec("
            UPDATE posts p
            JOIN categories c ON p.category = c.name
            SET p.category_id = c.id
            WHERE p.category_id IS NULL
        ");
        
        echo "Veri tasima islemi tamamlandi.\n";
    }

    // 6. Foreign Key Iliskisini Ekle
    $stmt = $pdo->prepare("
        SELECT COUNT(*) 
        FROM information_schema.TABLE_CONSTRAINTS 
        WHERE CONSTRAINT_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'posts' 
          AND CONSTRAINT_NAME = 'fk_posts_category'
    ");
    $stmt->execute();
    if ((int) $stmt->fetchColumn() === 0) {
        // Indeks ekle
        $pdo->exec("ALTER TABLE posts ADD INDEX idx_category_id (category_id)");
        // Foreign Key ekle
        $pdo->exec("ALTER TABLE posts ADD CONSTRAINT fk_posts_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL");
        echo "- `posts` tablosuna `fk_posts_category` yabanci anahtar iliskisi eklendi.\n";
    }

    // 7. Eski category Sutununu Drop Et
    if ($hasOldCategoryColumn) {
        $pdo->exec("ALTER TABLE posts DROP COLUMN category");
        echo "- `posts` tablosundan eski 'category' sutunu basariyla kaldirildi.\n";
    }

    // 8. Eksik Tablolar Varsa Olustur
    $pdo->exec("CREATE TABLE IF NOT EXISTS settings (
        setting_key VARCHAR(50) PRIMARY KEY,
        setting_value JSON NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS about_info (
        id TINYINT PRIMARY KEY DEFAULT 1,
        title VARCHAR(255) DEFAULT 'Merhaba, ben Nurullah.',
        subtitle TEXT,
        description TEXT,
        profile_photo VARCHAR(500) DEFAULT NULL,
        contact_button_text VARCHAR(100) DEFAULT 'Benimle Iletisime Gec',
        twitter_url VARCHAR(255) DEFAULT NULL,
        github_url VARCHAR(255) DEFAULT NULL,
        linkedin_url VARCHAR(255) DEFAULT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS manifesto (
        id TINYINT PRIMARY KEY DEFAULT 1,
        title VARCHAR(255) DEFAULT 'Tasarim Manifestosu',
        subtitle TEXT,
        intro TEXT,
        principles JSON,
        closing_title VARCHAR(255) DEFAULT 'Son Soz',
        closing_text TEXT,
        signature VARCHAR(255) DEFAULT 'Nurullah B.'
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS admin_users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS post_views (
        id INT AUTO_INCREMENT PRIMARY KEY,
        post_id VARCHAR(50) NOT NULL,
        post_slug VARCHAR(255) NOT NULL,
        ip_address VARCHAR(45) DEFAULT NULL,
        user_agent TEXT DEFAULT NULL,
        viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_post_id (post_id),
        INDEX idx_post_slug (post_slug),
        INDEX idx_viewed_at (viewed_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS mail_settings (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // 9. Varsayilan manifesto tohum verisini ekle
    $count = (int) $pdo->query('SELECT COUNT(*) FROM manifesto')->fetchColumn();
    if ($count === 0) {
        $principles = json_encode([
            ['number' => '01', 'title' => 'Form Islevi Takip Eder, Ama Estetik Gereklidir.', 'text' => 'Bir urunun sadece calismasi yetmez; kullanicisinda bir his uyandirmalidir.'],
            ['number' => '02', 'title' => 'Sessiz Tasarim', 'text' => 'Arayuzler kullaniciya bagirmamalidir.'],
            ['number' => '03', 'title' => 'Performans Bir Tasarim Ozelligidir', 'text' => 'Yavas bir site, kotu tasarlanmis bir sitedir.'],
        ], JSON_UNESCAPED_UNICODE);

        $pdo->prepare('INSERT INTO manifesto (id, title, subtitle, intro, principles, closing_title, closing_text, signature) VALUES (1,?,?,?,?,?,?,?)')
            ->execute([
                'Tasarim Manifestosu',
                'Dijital ekosistemde nasil var olmaliyiz?',
                'Web, sonsuz bir gurultu alani haline geldi. Bu manifesto, daha sakin dijital urunler yaratmak icin bir taahhutur.',
                $principles,
                'Son Soz',
                'Bizler dijital dunyanin mimariyiz.',
                'Nurullah B.',
            ]);
        echo "- Varsayilan manifesto verileri eklendi.\n";
    }

    // 10. Varsayilan admin tohum verisini ekle
    $userCount = (int) $pdo->query('SELECT COUNT(*) FROM admin_users')->fetchColumn();
    if ($userCount === 0) {
        $hash = password_hash('admin123', PASSWORD_DEFAULT);
        $pdo->prepare('INSERT INTO admin_users (username, password_hash) VALUES (?, ?)')
            ->execute(['admin', $hash]);
        echo "- Varsayilan yonetici hesabi olusturuldu (admin / admin123).\n";
    }

    // 11. Gonderi Tohum Verilerini Ekle (seed_posts + Unsplash gorselleri doğrudan)
    $postsToSeed = [
        [
            'title' => 'Minimalizm Siradan Degildir: Tasarimin Sessiz Devrimi',
            'category_id' => 'cat-derin-analiz',
            'readTime' => '12 dk okuma',
            'lead' => 'Minimalizm sadece bosluk birakmak degil. Her elementin var olma nedenini sorgulamak, gereksizleri atmak ve kalanlara nefes vermek.',
            'featuredImage' => 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&h=600&fit=crop',
            'body' => '<p>Minimalizm genellikle yanlis anlasilir. Bircok kisi bunu "daha az element" olarak gorur. Oysa minimalizm, azaltma sanati degil, <strong>odaklanma sanatidir</strong>.</p><h3>Bosluk Neden Onemli?</h3><p>Bir arayuzdeki bosluk, sadece dekoratif bir secim degil. Bosluk, kullanicinin zihnine nefes verme alanidir. Gozun bir noktadan digerine kayarken dinlenmesi gereken anlardir. Modern web tasariminda bu "negative space" kavrami, sadece estetik degil, ayni zamanda kullanilabilirlik acisindan da kritik.</p><blockquote>"Minimalizm, her seyi kaldirmak degil, dogru seyleri birakmaktir."</blockquote><p>Apple\'in tasarim felsefesini dusunun. Her element, her piksel, her animasyonun bir amaci var. Rastgele bir dekorasyon yok. Ama bu sikici mi? Hayir. Tam tersine, bu yaklasim, her elementin agirligini artirir. Bir buton, sadece bir buton degil - dikkat cekici bir eylem cagrisi.</p><h3>Vibe Coding ve Minimalizm</h3><p>Vibe coding, yazilim gelistirmenin yeni bir paradigmasi. Kod yazarken sadece teknik gereksinimleri dusunmek yetmiyor. Kodun "vibe"i, onun hissiyati. Minimalist bir arayuz, vibe coding\'in mukemmel bir sonucu olabilir. Her satir kod, her component, bir amaca hizmet eder ve gereksiz karmasadan uzak durur.</p><p>Bir projede minimalizm uygulamak icin:</p><ul><li><strong>Hierarchy</strong> - Once en onemli elementi belirle</li><li><strong>Reduction</strong> - Gereksizleri kaldir</li><li><strong>Refinement</strong> - Kalanlari mukemmellestir</li><li><strong>Consistency</strong> - Dil ve hissiyati koru</li></ul><p>Minimalizm, kolay bir yol degil. Aslinda, karmasikligi gizlemek daha kolay. Her seyi sadelestirmek ve yine de guclu bir hissiyat yaratmak, gercek ustalik ister. Ama sonuc, her zaman deger.</p>'
        ],
        [
            'title' => 'Vibe Coding: Kodun Duygusal Zekasi',
            'category_id' => 'cat-gelistirme',
            'readTime' => '10 dk okuma',
            'lead' => 'Kod sadece mantik degil. Kod, bir hissiyat, bir atmosfer, bir vibe. Yazilim gelistirmeyi sadece teknik bir surec degil, yaratici bir ifade olarak yeniden dusunmek.',
            'featuredImage' => 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&h=600&fit=crop',
            'body' => '<p>Yazilim gelistirme dunyasinda, teknik mukemmellik genellikle tek kriter olarak gorulur. Kod calismali, hizli olmali, hatasiz olmali. Ama bu yeterli mi? Bir uygulama sadece islevsel mi olmali, yoksa kullanicida bir his uyandirmali mi?</p><h3>Kodun Ruhu</h3><p>Vibe coding, kodun duygusal zekasini on plana cikaran bir yaklasim. Bir component\'in sadece "calismasi" yetmez. Kullanici onu etkilesim kurarken nasil hissetmeli? Guvende mi? Heyecanli mi? Rahat mi?</p><p>Bir buton tasarimini dusunun. Sadece tiklanabilir bir element mi, yoksa kullaniciya "bunu yapabilirsin" mesaji veren bir guvence mi? Animasyonlar sadece sus mu, yoksa kullanicinin eylemini onaylayan bir geri bildirim mi?</p><h3>Micro-Interactions</h3><p>Micro-interactions, vibe coding\'in en onemli araclarindan biri. Kucuk detaylar, buyuk hissiyat yaratir. Bir form alanina tikladiginizda hafifce buyumesi, bir butonun hover\'da renk degistirmesi, bir yuklemenin progress bar\'ı - hepsi bir sey soyluyor.</p><p>Bu detaylar, kullaniciya "seni duyuyorum" mesaji veriyor. Sistem sadece tepki vermiyor, anliyor ve yanit veriyor. Bu, teknik bir ozellik degil, duygusal bir bag.</p><h3>Pratik Uygulama</h3><p>Vibe coding\'i projenize nasil entegre edebilirsiniz?</p><ul><li><strong>Empathy First</strong> - Kullanicinin o anki hissiyatini dusun</li><li><strong>Consistent Voice</strong> - Tum interaksiyonlar ayni dili konusmali</li><li><strong>Meaningful Motion</strong> - Her animasyon bir anlam tasimali</li><li><strong>Emotional Feedback</strong> - Basari ve hata durumlarinda duygusal yanit ver</li></ul><p>Vibe coding, yazilim gelistirmeyi sadece teknik bir surec olmaktan cikarip, yaratici bir ifadeye donusturuyor. Kod, sadece makine icin degil, insan icin yaziliyor.</p>'
        ],
        [
            'title' => 'Tipografi Gorsel Dildir: Kelimelerin Gucu',
            'category_id' => 'cat-etkilesim-tasarimi',
            'readTime' => '8 dk okuma',
            'lead' => 'Tipografi sadece font secimi degil. Tipografi, gorsel bir dil, bir iletisim araci, bir atmosfer yaraticisi. Dogru tipografi, yanlis kelimeyi bile dogru hissettirebilir.',
            'featuredImage' => 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=1200&h=600&fit=crop',
            'body' => '<p>Web tasariminda tipografi genellikle sonradan dusunulen bir element olarak gorulur. Once layout, sonra renkler, sonra... tipografi. Ama bu yaklasim, buyuk bir firsat kaciriyor. Tipografi, bir arayuzun en guclu iletisim araci.</p><h3>Tipografi Okuma Degildir</h3><p>Tipografi, sadece metni okunabilir yapmak degil. Tipografi, metnin hissiyatini, tonunu, agirligini belirler. Ayni cumle, farkli fontlarla tamamen farkli anlamlar kazanabilir.</p><blockquote>"Font secimi, bir projenin karakterini belirler."</blockquote><p>Bir serif font, otorite ve gelenek hissi verir. Bir sans-serif, modern ve erisilebilir. Bir monospace, teknik ve dogrudan. Bu secimler, kullaniciya projenin ne hakkinda oldugunu soyluyor, kelimelerden once.</p><h3>Hierarchy ve Flow</h3><p>Tipografi, kullanicinin gozunu yonlendiren bir harita. Basliklar, alt basliklar, paragraflar, listeler - hepsi bir hiyerarsi olusturuyor. Kullanici bu hiyerarsiyi takip ederek icerigi tuketiyor.</p><p>Dogru tipografi hiyerarsisi:</p><ul><li><strong>Clear H1</strong> - Sayfanin ana mesaji</li><li><strong>Supporting H2</strong> - Bolumler ve alt basliklar</li><li><strong>Readable Body</strong> - Ana icerik</li><li><strong>Accent Elements</strong> - Vurgular ve onemli noktalar</li></ul><h3>Spacing ve Rhythm</h3><p>Tipografi sadece font degil, ayni zamanda spacing. Satir yuksekligi, paragraf araligi, harf araligi - hepsi okuma deneyimini etkiliyor. Dogru spacing, metni "akici" hale getirir. Yanlis spacing, okumayi zorlastirir ve kullaniciyi yorar.</p><p>Tipografi, tasarimin en guclu ve en az anlasilan elementlerinden biri. Dogru kullanildiginda, bir arayuz sadece goruntulenmez, hissedilir.</p>'
        ],
        [
            'title' => 'Renk Psikolojisi: Duygulari Tasarlamak',
            'category_id' => 'cat-urun-tasarimi',
            'readTime' => '9 dk okuma',
            'lead' => 'Renkler sadece gorsel degil. Renkler, duygular, anilar, tepkiler. Dogru renk paleti, bir urunun basarisini belirleyebilir. Yanlis renk paleti, kullaniciyi uzaklastirabilir.',
            'featuredImage' => 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=1200&h=600&fit=crop',
            'body' => '<p>Renkler, insan psikolojisinin en guclu tetikleyicilerinden biri. Bir renk, sadece bir dalga boyutu degil, bir duygu, bir ani, bir tepki. Web tasariminda renk secimi, estetik bir tercih degil, stratejik bir karar.</p><h3>Renklerin Dili</h3><p>Her renk, farkli bir mesaj tasir:</p><ul><li><strong>Kirmizi</strong> - Tutku, aciliyet, dikkat</li><li><strong>Mavi</strong> - Guven, huzur, profesyonellik</li><li><strong>Yesil</strong> - Buyume, doga, basari</li><li><strong>Sari</strong> - Enerji, nese, dikkat</li><li><strong>Siyah</strong> - Luks, otorite, guc</li><li><strong>Beyaz</strong> - Saflik, minimalizm, ferahlik</li></ul><p>Bu mesajlar, kulturel olarak da degisebilir. Bati kulturunde beyaz safligi temsil ederken, bazi Dogu kulturlerinde yasi temsil edebilir. Tasarimci olarak, hedef kitleyi anlamak kritik.</p><h3>Renk Paleti Olusturma</h3><p>Basarili bir renk paleti, sadece guzel renklerin birlesimi degil. Bir palet, bir hikaye anlatmali. Ana renk, projenin karakteri. Yardimci renkler, bu karakteri desteklemeli. Accent renkler, dikkat cekici noktalar olusturmali.</p><blockquote>"Renk paleti, bir projenin DNA\"si."</blockquote><p>60-30-10 kurali iyi bir baslangic noktasi: %60 ana renk, %30 yardimci renk, %10 accent. Bu oran, denge ve hiyerarsi saglar.</p><h3>Erisilebilirlik</h3><p>Renk secimi sadece estetik degil, ayni zamanda erisilebilirlik. Renk koru kullanicilar icin kontrast kritik. WCAG standartlarina uymak, sadece yasal gereklilik degil, iyi tasarim pratigi.</p><p>Renkler, tasarimin en guclu araclarindan biri. Dogru kullanildiginda, bir arayuz sadece goruntulenmez, hissedilir ve hatirlanir.</p>'
        ],
        [
            'title' => 'Animasyonlar Hareket Dili: Hikaye Anlatmak',
            'category_id' => 'cat-konsept',
            'readTime' => '11 dk okuma',
            'lead' => 'Animasyonlar sadece sus degil. Animasyonlar, bir hikaye anlatma araci, bir kullanici rehberi, bir duygusal bag kurucu. Dogru animasyon, statik bir arayuzu canli hale getirir.',
            'featuredImage' => 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&h=600&fit=crop',
            'body' => '<p>Animasyonlar, web tasariminda genellikle "nice to have" olarak gorulur. Once islevsellik, sonra estetik, sonra... animasyonlar. Ama bu yaklasim, buyuk bir firsat kaciriyor. Animasyonlar, bir arayuzun canli, duygusal ve akici hissetmesini saglar.</p><h3>Animasyonlarin Amaci</h3><p>Animasyonlar sadece gorsel sus degil. Animasyonlarin uc ana amaci var:</p><ul><li><strong>Attention</strong> - Kullanicinin dikkatini cekmek</li><li><strong>Feedback</strong> - Kullaniciye yanit vermek</li><li><strong>Guidance</strong> - Kullaniciyi yonlendirmek</li></ul><p>Bir butonun hover\'da buyumesi, kullanicinin dikkatini ceker. Bir formun basariyla gonderildiginde yesil bir checkmark animasyonu, kullaniciye yanit verir. Bir sayfanin yuklenirken progress bar\'ı, kullaniciyi yonlendirir.</p><h3>Micro-Animations</h3><p>Micro-animations, kucuk ama guclu detaylar. Bir input\'un focus\'ta hafifce parlamasi, bir card\'ın hover\'da hafifce yukselmesi, bir icon\'un tiklaninca hafifce donmesi - hepsi bir sey soyluyor.</p><blockquote>"Animasyonlar, statik arayuzlere ruh katar."</blockquote><p>Bu detaylar, kullaniciye "bu sistem canli" mesaji veriyor. Sadece tepki vermiyor, anliyor ve yanit veriyor. Bu, teknik bir ozellik degil, duygusal bir bag.</p><h3>Performance ve UX</h3><p>Animasyonlar guclu ama tehlikeli. Yavas animasyonlar, kullaniciyi yorar. Hizli animasyonlar, dikkat cekmez. Dogru timing, her sey.</p><p>Genel kural: 200-500ms arasi ideal. Daha kisa, fark edilmez. Daha uzun, yorar. Easing fonksiyonlari da kritik - ease-in-out, ease-out, cubic-bezier - hepsi farkli hissiyatlar yaratir.</p><p>Animasyonlar, tasarimin en guclu araclarindan biri. Dogru kullanildiginda, bir arayuz sadece goruntulenmez, hissedilir ve akici.</p>'
        ],
        [
            'title' => 'UX Writing: Kelimeler Tasarimdir',
            'category_id' => 'cat-etkilesim-tasarimi',
            'readTime' => '7 dk okuma',
            'lead' => 'UX writing, sadece metin yazmak degil. UX writing, kullaniciyla konusmak, onu anlamak, ona rehberlik etmek. Dogru kelimeler, yanlis tasarimi bile kurtarabilir.',
            'featuredImage' => 'https://images.unsplash.com/photo-1558655146-d09347e92766?w=1200&h=600&fit=crop',
            'body' => '<p>UX writing, genellikle tasarim surecinin son asamasi olarak gorulur. Once gorsel tasarim, sonra... metin. Ama bu yaklasim, buyuk bir hata. UX writing, tasarimin en onemli elementlerinden biri.</p><h3>Kelimelerin Gucu</h3><p>Kelimeler, sadece bilgi degil. Kelimeler, bir hissiyat, bir ton, bir iliski. "Submit" butonu, sadece bir eylem degil. "Gonder" butonu, daha dostca. "Hemen Gonder" butonu, daha acil.</p><blockquote>"UX writing, tasarimin sessiz kahramani."</blockquote><p>Doğru UX writing, kullaniciye "seni anliyorum" mesaji verir. Yanlis UX writing, kullaniciyi uzaklastirir. Teknik jargon, uzun cumleler, emir kipindeki ifadeler - hepsi kullaniciyi yorar.</p><h3>Clarity ve Conciseness</h3><p>Iyi UX writing, net ve oz. Kullanici ne yapmasi gerektigini bir bakista anlamali. Karmasik cumleler, gereksiz detaylar, teknik terimler - hepsi okumayi zorlastirir.</p><p>Genel kural: Kisa ve net. Bir cumle, bir fikir. Gereksiz kelimeleri at. Teknik jargonu kacin. Kullanicinin dilini konus.</p><h3>Tone ve Voice</h3><p>UX writing, sadece netlik degil. Ayni zamanda tone ve voice. Bir marka ciddi mi, yoksa eglenceli mi? Profesyonel mi, yoksa dostca mi? Bu ton, tum metinlerde tutarli olmalı.</p><p>Dogru tone, kullaniciyla guven olusturur. Yanlis tone, kullaniciyi sasirtir. Bir finans uygulamasinda ciddi tone uygundur. Bir oyun uygulamasinda eglenceli tone daha uygun.</p><p>UX writing, tasarimin en guclu araclarindan biri. Dogru kullanildiginda, bir arayuz sadece goruntulenmez, anlasilir ve kullanilir.</p>'
        ]
    ];

    foreach ($postsToSeed as $post) {
        $slug = generateSlug($post['title']);
        
        // Zaten eklenmis mi kontrol et
        $stmt = $pdo->prepare('SELECT COUNT(*) FROM posts WHERE slug = ?');
        $stmt->execute([$slug]);
        
        if ((int) $stmt->fetchColumn() === 0) {
            $id = bin2hex(random_bytes(25));
            $stmt = $pdo->prepare('INSERT INTO posts (id, title, slug, category_id, read_time, lead, body, featured_image, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())');
            $stmt->execute([
                $id,
                $post['title'],
                $slug,
                $post['category_id'],
                $post['readTime'],
                $post['lead'],
                $post['body'],
                $post['featuredImage'],
                'published'
            ]);
            echo "- Gonderi eklendi: {$post['title']}\n";
        }
    }

    echo "\nMigrasyon ve tohumlama islemleri basariyla tamamlandi.\n";

} catch (PDOException $e) {
    echo "HATA: " . $e->getMessage() . "\n";
    exit(1);
}

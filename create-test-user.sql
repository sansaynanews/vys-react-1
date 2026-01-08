-- Test kullanıcısı oluşturma
USE valilik_yonetim;

-- Önce var olan admin kullanıcısını kontrol et
SELECT * FROM kullanicilar WHERE kullanici_adi = 'admin';

-- Eğer yoksa ekle (şifre: admin123)
INSERT INTO kullanicilar (kullanici_adi, sifre, ad_soyad, rol, aktif, created_at)
VALUES (
  'admin',
  '$2b$10$uakmdM2X7oe0uCvELFsg.ug8PbXM.QzUJIoiNcV60pSZ3zOl0w9xu',
  'Admin Kullanıcı',
  'makam',
  1,
  NOW()
)
ON DUPLICATE KEY UPDATE
  sifre = '$2b$10$uakmdM2X7oe0uCvELFsg.ug8PbXM.QzUJIoiNcV60pSZ3zOl0w9xu',
  aktif = 1;

-- Test kullanıcıları ekle
INSERT INTO kullanicilar (kullanici_adi, sifre, ad_soyad, rol, aktif, created_at)
VALUES
  ('protokol', '$2b$10$uakmdM2X7oe0uCvELFsg.ug8PbXM.QzUJIoiNcV60pSZ3zOl0w9xu', 'Protokol Kullanıcı', 'protokol', 1, NOW()),
  ('idari', '$2b$10$uakmdM2X7oe0uCvELFsg.ug8PbXM.QzUJIoiNcV60pSZ3zOl0w9xu', 'İdari Kullanıcı', 'idari', 1, NOW())
ON DUPLICATE KEY UPDATE
  sifre = VALUES(sifre),
  aktif = 1;

-- Kullanıcıları kontrol et
SELECT id, kullanici_adi, ad_soyad, rol, aktif FROM kullanicilar;

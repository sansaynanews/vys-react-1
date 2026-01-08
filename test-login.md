# Test Kullanıcısı Oluşturma

Eğer veritabanında kullanıcı yoksa, şu SQL komutunu çalıştırın:

```sql
-- XAMPP MySQL'de şu komutu çalıştırın (phpMyAdmin veya command line):
USE valilik_yonetim;

-- Test kullanıcısı ekle (şifre: admin123)
INSERT INTO kullanicilar (kullanici_adi, sifre, ad_soyad, rol, aktif, created_at)
VALUES (
  'admin',
  '$2a$10$YourHashedPasswordHere',  -- bcrypt hash
  'Admin User',
  'makam',
  1,
  NOW()
);
```

## Şifre Hash Oluşturma

Node.js ile şifre hash'i oluşturun:

```bash
cd C:\Users\harun\OneDrive\Desktop\vys-react
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('admin123', 10));"
```

Çıkan hash'i yukarıdaki SQL'deki `$2a$10$YourHashedPasswordHere` yerine yapıştırın.

## Login Bilgileri

- **URL**: http://localhost:3000
- **Kullanıcı Adı**: admin
- **Şifre**: admin123

## Sunucu Durumu

✅ Sunucu çalışıyor: http://localhost:3000
✅ Port 3000 dinleniyor
✅ Login sayfası yüklendi

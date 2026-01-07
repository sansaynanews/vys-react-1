# 07 - Mevcut Modül Listesi ve Eşleştirme

## 📋 Tüm PHP Sayfaları ve Next.js Karşılıkları

### Menü Kategori 1: Makam

| # | PHP Dosyası | Açıklama | Next.js Route | Durum |
|---|-------------|----------|---------------|-------|
| 1 | `gunluk-program.php` | Günlük Çalışma Programı | `/dashboard/gunluk-program` | ⬜ Yapılacak |
| 2 | `makam-randevu.php` | Makam Randevu Yönetimi | `/dashboard/makam-randevu` | ⬜ Yapılacak |

### Menü Kategori 2: Organizasyon

| # | PHP Dosyası | Açıklama | Next.js Route | Durum |
|---|-------------|----------|---------------|-------|
| 3 | `toplanti-yonetimi.php` | Toplantı Yönetimi | `/dashboard/toplanti` | ⬜ Yapılacak |
| 4 | `ust-duzey-ziyaret.php` | VIP / Protokol Ziyaret | `/dashboard/vip-ziyaret` | ⬜ Yapılacak |
| 5 | `protokol-etkinlik.php` | Protokol ve Resmi Tören | `/dashboard/protokol-etkinlik` | ⬜ Yapılacak |
| 6 | `resmidavet.php` | Resmi Davet ve Kabul | `/dashboard/resmi-davet` | ⬜ Yapılacak |

### Menü Kategori 3: İdari İşlemler

| # | PHP Dosyası | Açıklama | Next.js Route | Durum |
|---|-------------|----------|---------------|-------|
| 7 | `arac-planlama.php` | Taşıt Yönetimi | `/dashboard/arac` | ⬜ Yapılacak |
| 8 | `envanter.php` | Stok Takip Yönetimi | `/dashboard/envanter` | ⬜ Yapılacak |
| 9 | `kurum-amirleri.php` | Kurum Amirleri Yönetimi | `/dashboard/kurum-amirleri` | ⬜ Yapılacak |
| 10 | `ik-modulu.php` | İnsan Kaynakları Sistemi | `/dashboard/ik` | ⬜ Yapılacak |
| 11 | `muhtar.php` | Muhtar Bilgi Sistemi | `/dashboard/muhtar` | ⬜ Yapılacak |

### Menü Kategori 4: Belge & Takip

| # | PHP Dosyası | Açıklama | Next.js Route | Durum |
|---|-------------|----------|---------------|-------|
| 12 | `evrak.php` | Evrak Takip Yönetimi | `/dashboard/evrak` | ⬜ Yapılacak |
| 13 | `talimatlar.php` | Talimat Takip Sistemi | `/dashboard/talimat` | ⬜ Yapılacak |
| 14 | `ziyaretler.php` | Şehit ve Gazi Bilgi Sistemi | `/dashboard/ziyaretler` | ⬜ Yapılacak |
| 15 | `konusma-metin.php` | Resmi Metin Yönetimi | `/dashboard/konusma-metin` | ⬜ Yapılacak |
| 16 | `rehber.php` | Telefon Rehberi | `/dashboard/rehber` | ⬜ Yapılacak |

### Menü Kategori 5: Yönetim (Sadece Admin)

| # | PHP Dosyası | Açıklama | Next.js Route | Durum |
|---|-------------|----------|---------------|-------|
| 17 | `yonetim.php` | Kullanıcı ve Yetki Yönetimi | `/dashboard/yonetim` | ⬜ Yapılacak |

### Sistem Dosyaları

| # | PHP Dosyası | Açıklama | Next.js Karşılığı | Durum |
|---|-------------|----------|-------------------|-------|
| 18 | `index.php` | Giriş Sayfası | `/login` | ⬜ Yapılacak |
| 19 | `menu.php` | Ana Menü / Dashboard | `/dashboard` | ⬜ Yapılacak |
| 20 | `logout.php` | Çıkış | `/logout` (signOut) | ⬜ Yapılacak |
| 21 | `auth.php` | Kimlik Doğrulama | NextAuth.js | ⬜ Yapılacak |
| 22 | `db.php` | Veritabanı Bağlantısı | Prisma | ⬜ Yapılacak |
| 23 | `cikis.php` | Çıkış İşlemi | signOut() | ⬜ Yapılacak |

---

## 🔌 API Dosyaları Eşleştirmesi

| # | PHP API | Açıklama | Next.js API | Durum |
|---|---------|----------|-------------|-------|
| 1 | `arac_api.php` | Araç İşlemleri | `/api/arac` | ⬜ Yapılacak |
| 2 | `dashboard_api.php` | Dashboard Verileri | `/api/dashboard` | ⬜ Yapılacak |
| 3 | `envanter_api.php` | Envanter İşlemleri | `/api/envanter` | ⬜ Yapılacak |
| 4 | `evrak_api.php` | Evrak İşlemleri | `/api/evrak` | ⬜ Yapılacak |
| 5 | `ik_api.php` | İK İşlemleri | `/api/ik` | ⬜ Yapılacak |
| 6 | `kurum_api.php` | Kurum Amirleri İşlemleri | `/api/kurum` | ⬜ Yapılacak |
| 7 | `makam_randevu_api.php` | Randevu İşlemleri | `/api/randevu` | ⬜ Yapılacak |
| 8 | `muhtar_api.php` | Muhtar İşlemleri | `/api/muhtar` | ⬜ Yapılacak |
| 9 | `toplanti_api.php` | Toplantı İşlemleri | `/api/toplanti` | ⬜ Yapılacak |
| 10 | `yonetim_api.php` | Kullanıcı Yönetimi | `/api/yonetim` | ⬜ Yapılacak |
| 11 | `ziyaret_api.php` | Şehit/Gazi Ziyaretleri | `/api/ziyaret` | ⬜ Yapılacak |
| 12 | `randevu_durum_guncelle.php` | Randevu Durumu | `/api/randevu/durum` | ⬜ Yapılacak |

---

## 📊 Veritabanı Tabloları

| # | Tablo Adı | Açıklama | Prisma Model |
|---|-----------|----------|--------------|
| 1 | `kullanicilar` | Kullanıcılar | `Kullanici` |
| 2 | `randevular` | Randevular | `Randevu` |
| 3 | `araclar` | Araçlar | `Arac` |
| 4 | `arac_gecmis` | Araç Geçmişi | `AracGecmis` |
| 5 | `stok_kartlari` | Stok Kartları | `StokKarti` |
| 6 | `stok_hareketleri` | Stok Hareketleri | `StokHareketi` |
| 7 | `personeller` | Personeller | `Personel` |
| 8 | `personel_hareketleri` | Personel Hareketleri | `PersonelHareketi` |
| 9 | `personel_cv` | Personel CV | `PersonelCv` |
| 10 | `kurum_amirleri` | Kurum Amirleri | `KurumAmiri` |
| 11 | `amir_izinleri` | Amir İzinleri | `AmirIzni` |
| 12 | `toplanti_salonlari` | Toplantı Salonları | `ToplantiSalonu` |
| 13 | `salon_rezervasyonlari` | Salon Rezervasyonları | `SalonRezervasyonu` |
| 14 | `salon_rezervasyon_dokumanlari` | Rezervasyon Dökümanları | `SalonRezervasyonDokumani` |
| 15 | `muhtarlar` | Muhtarlar | `Muhtar` |
| 16 | `evraklar` | Evraklar | `Evrak` |
| 17 | `sehit_gazi_bilgi` | Şehit/Gazi Bilgi | `SehitGaziBilgi` |
| 18 | `ziyaret_sehit_gazi` | Şehit/Gazi Ziyaretleri | `ZiyaretSehitGazi` |
| 19 | `ziyaret_kamu` | Kamu Ziyaretleri | `ZiyaretKamu` |
| 20 | `projeler` | Projeler | `Proje` |

---

## 🔐 Yetki Matrisi

### Kullanıcı Rolleri

| Rol | Açıklama | Erişim |
|-----|----------|--------|
| `makam` | Makam (Tam Yetki) | Tüm sayfalar + Silme + Yönetim |
| `okm` | OKM (Tam Yetki) | Tüm sayfalar + Silme + Yönetim |
| `protokol` | Protokol (Tam Yetki) | Tüm sayfalar |
| `idari` | İdari Koordinatör | Kısıtlı sayfalar |
| `metin` | Konuşma Metni | Sadece konuşma-metin |
| `arac` | Araç Planlama | Sadece araç |
| `sekreterlik` | Sekreterlik | kurum-amirleri, muhtar, rehber |
| `destek` | Destek | Sadece envanter |

### Sayfa Bazlı Yetkiler

```typescript
const yetkiHaritasi = {
  makam: ['all'],
  okm: ['all'],
  protokol: ['all'],
  idari: [
    'toplanti',
    'vip-ziyaret',
    'envanter',
    'kurum-amirleri',
    'ik',
    'muhtar',
    'evrak',
    'talimat',
    'ziyaretler',
    'konusma-metin',
    'rehber'
  ],
  metin: ['konusma-metin'],
  arac: ['arac'],
  sekreterlik: ['kurum-amirleri', 'muhtar', 'rehber'],
  destek: ['envanter']
};
```

---

## 📁 Dosya Yükleme Dizinleri

| PHP Dizini | Next.js Dizini | Kullanım |
|------------|----------------|----------|
| `uploads/muhtarlar/` | `public/uploads/muhtarlar/` | Muhtar fotoğrafları |
| `uploads/personel/` | `public/uploads/personel/` | Personel CV'leri |
| `uploads/toplantida/` | `public/uploads/toplanti/` | Toplantı dökümanları |
| `uploads/sehit_gazi/` | `public/uploads/sehit-gazi/` | Şehit/Gazi fotoğrafları |

---

## 🎨 UI Özellikleri

### Renk Şeması (Mevcut PHP'den)

```css
/* Ana Renkler */
--blue-500: #3b82f6;    /* Makam bölümü */
--cyan-500: #06b6d4;    /* Organizasyon bölümü */
--amber-500: #f59e0b;   /* Yönetim bölümü */
--slate-800: #1e293b;   /* Sidebar arka plan */

/* Durum Renkleri */
--success: #10b981;     /* Başarılı işlemler */
--warning: #f59e0b;     /* Uyarılar */
--danger: #ef4444;      /* Hatalar */
--info: #3b82f6;        /* Bilgilendirme */
```

### Ortak Bileşenler

Her sayfada kullanılan ortak bileşenler:

1. **Sidebar** - Sol menü (kategorili)
2. **Header** - Üst bar (kullanıcı bilgisi, arama)
3. **DataTable** - Sayfalama, arama, sıralama
4. **Modal** - Form ve onay diyalogları
5. **Toast** - Bildirimler
6. **Badge** - Durum etiketleri

---

## ➡️ Sonraki Adım

[08-STATE-MANAGEMENT.md](./08-STATE-MANAGEMENT.md) - Zustand ve React Query ile state yönetimi

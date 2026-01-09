# Valilik Yönetim Sistemi (VYS) - Sistem Mimarisi ve Çalışma Şeması

Bu belge, sistemin mevcut çalışma yapısını, veri akışını ve entegre edilen yeni özellikleri özetler.

## 1. Genel Teknoloji Yığını
- **Frontend:** Next.js (React), Tailwind CSS, Lucide Icons.
- **Backend:** Next.js API Routes (Serverless Functions).
- **Veritabanı:** MySQL (Prisma ORM ile yönetiliyor).
- **Kimlik Doğrulama:** NextAuth.js (Session bazlı).

---

## 2. Veritabanı Yapısı (ER Diagram Özeti)
Sistemin kalbinde `randevular` tablosu yer alır. Diğer tablolar bu yapıyı destekler.

### Temel Tablolar
1. **randevular:** Tüm randevu kayıtları.
   - *Yeni Eklenenler:* `hediye_notu`, `arac_plaka`, `tekrar_id`, `tekrar_bilgisi`.
2. **guvenlik_kayitlari:** Kara liste ve riskli ziyaretçi veritabanı.
   - *Alanlar:* `ad_soyad`, `tc_kimlik`, `risk_seviyesi`, `durum_notu`.
3. **talimatlar:** Randevudan doğan görevler.
4. **kullanicilar:** Sisteme giriş yapan personel.

---

## 3. Randevu Yönetimi İş Akışı (Workflow)

Aşağıdaki şema, bir sekreter veya yetkili personelin yeni bir randevu oluştururken sistemin arka planda nasıl çalıştığını gösterir.

```mermaid
graph TD
    Start((Başlat)) --> UI[Randevu Modalını Aç]
    UI --> InputName[Ziyaretçi Adını Gir]
    
    %% Otomatik Kontroller
    InputName -->|Otomatik| CheckSecurity{Güvenlik & Geçmiş Kontrolü}
    CheckSecurity -->|API: /api/guvenlik/check| RiskCheck{Risk Var mı?}
    RiskCheck -- Evet --> ShowAlert[⚠️ Güvenlik Uyarısı Göster]
    RiskCheck -- Hayır --> Clean[Temiz]
    
    CheckSecurity -->|API: /api/randevu/check-history| HistoryCheck{Hediye Geçmişi Var mı?}
    HistoryCheck -- Evet --> ShowGift[🎁 Eski Hediyeleri Listele]
    HistoryCheck -- Hayır --> NoGift[Hediye Kaydı Yok]
    
    %% Veri Girişi
    ShowAlert --> FormFill[Formu Doldurmaya Devam Et]
    Clean --> FormFill
    ShowGift --> FormFill
    NoGift --> FormFill
    
    FormFill --> InputDetails[Tarih, Saat, Kurum, Notlar]
    FormFill --> InputExtra[Araç Plakası, Hediye Notu]
    
    %% Tekrarlayan Randevu
    InputDetails --> IsRecurring{Tekrarlayan mı?}
    IsRecurring -- Evet --> SetRepeat[Tekrar Tipi ve Bitiş Tarihi Seç]
    IsRecurring -- Hayır --> Single[Tek Kayıt]
    
    %% Kayıt
    SetRepeat --> Submit[Kaydet Butonu]
    Single --> Submit
    
    Submit -->|POST /api/randevu| API_Save{Veritabanı Kayıt}
    
    API_Save -->|Tekrarlı ise| LoopDB[Döngü ile Çoklu Kayıt Oluştur]
    API_Save -->|Tek ise| SingleDB[Tek Kayıt Oluştur]
    
    %% Sonrası
    SingleDB --> Notify{Bildirim Servisi}
    LoopDB --> Notify
    
    Notify -->|SMS Gönderimi| SMS[Ziyaretçiye SMS Git]
    Notify --> Response[Başarılı Yanıtı Dön]
    
    Response --> UI_Success[Listeyi Güncelle & Toast Mesajı]
    UI_Success --> CalendarBtn[📅 Takvime Ekle (.ics) Butonu Aktif]
```

---

## 4. Özellik Detayları

### A. Güvenlik Entegrasyonu (İstihbarat)
- **Amaç:** Riskli kişilerin randevu alırken tespit edilmesi.
- **Nasıl Çalışır:** İsim girildiği anda (`onBlur`), sistem `guvenlik_kayitlari` tablosunu tarar.
- **Tepki:** Eğer risk varsa, ekranda kırmızı/turuncu bir uyarı kutusu belirir ve personeli uyarır.

### B. Protokol Hafızası (Hediye Takibi)
- **Amaç:** Aynı kişiye mükerrer veya uygunsuz hediye verilmesini önlemek.
- **Nasıl Çalışır:** İsim girildiğinde geçmiş randevuları tarar (`hediye_notu` dolu olanlar).
- **Tepki:** "Bu kişiye 2024'te Porselen Tabak verildi" gibi bir bilgi notu gösterir.

### C. Periyodik Randevular
- **Amaç:** "Her Pazartesi Toplantı" gibi rutinleri tek seferde girmek.
- **Özellik:** Günlük, Haftalık, Aylık tekrar seçenekleri.
- **Teknik:** `tekrar_id` (UUID) ile gruplanır, böylece hepsi bir serinin parçası olarak bilinir.

### D. Araç Plakası ve Bildirimler
- **Araç:** Güvenlik kapısı için plaka bilgisi randevuya eklendi.
- **Bildirim:** Randevu oluştuğunda veya durumu "Ertelendi" olduğunda ziyaretçiye (SMS simülasyonu ile) bildirim gider.
- **Takvim:** Randevu detayında `.ics` dosyası oluşturularak Outlook/Google Takvim entegrasyonu sağlanır.

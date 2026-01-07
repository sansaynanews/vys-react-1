# 03 - Veritabanı ve Prisma ORM

## 📊 Mevcut Veritabanı Yapısı

Mevcut PHP projesinde kullanılan MySQL veritabanı: `valilik_yonetim`

---

## 🔧 Prisma Kurulumu

### Adım 1: Prisma Başlatma

```bash
npx prisma init
```

### Adım 2: .env Ayarları

```env
DATABASE_URL="mysql://root:@localhost:3306/valilik_yonetim"
```

### Adım 3: Mevcut DB'den Schema Çekme

```bash
# Mevcut veritabanından schema introspection
npx prisma db pull

# Prisma Client oluştur
npx prisma generate
```

---

## 📝 Prisma Schema (Tam)

`prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

// =============================================
// KULLANICI YÖNETİMİ
// =============================================

model Kullanici {
  id               Int       @id @default(autoincrement())
  kadi             String    @unique @db.VarChar(50)
  sifre            String    @db.VarChar(255)
  yetki            String    @db.VarChar(50)
  ozel_yetkiler    String?   @db.Text
  olusturma_tarihi DateTime  @default(now())
  
  @@map("kullanicilar")
}

// =============================================
// RANDEVU YÖNETİMİ
// =============================================

model Randevu {
  id          Int       @id @default(autoincrement())
  ad_soyad    String    @db.VarChar(255)
  kurum       String?   @db.VarChar(255)
  unvan       String?   @db.VarChar(255)
  tipi        String?   @db.VarChar(100)
  iletisim    String?   @db.VarChar(50)
  tarih       DateTime  @db.Date
  saat        String    @db.VarChar(10)
  katilimci   String?   @db.VarChar(255)
  notlar      String?   @db.Text
  durum       String    @default("Bekliyor") @db.VarChar(50)
  kayit_tipi  String?   @db.VarChar(50)
  giris_saati String?   @db.VarChar(10)
  created_at  DateTime  @default(now())
  
  @@map("randevular")
}

// =============================================
// ARAÇ YÖNETİMİ
// =============================================

model Arac {
  id           Int       @id @default(autoincrement())
  plaka        String    @unique @db.VarChar(20)
  marka        String    @db.VarChar(100)
  model        String?   @db.VarChar(100)
  kurum        String?   @db.VarChar(255)
  sofor        String?   @db.VarChar(255)
  telefon      String?   @db.VarChar(20)
  km           Int?
  muayene_bit  DateTime? @db.Date
  sigorta_bit  DateTime? @db.Date
  kasko_bit    DateTime? @db.Date
  egzoz_bit    DateTime? @db.Date
  created_at   DateTime  @default(now())
  
  gecmis       AracGecmis[]
  
  @@map("araclar")
}

model AracGecmis {
  id           Int       @id @default(autoincrement())
  arac_id      Int
  islem_turu   String    @db.VarChar(100)
  tarih        DateTime? @db.Date
  km           Int?
  aciklama     String?   @db.Text
  kullanici    String?   @db.VarChar(100)
  islem_tarihi DateTime  @default(now())
  
  arac         Arac      @relation(fields: [arac_id], references: [id])
  
  @@map("arac_gecmis")
}

// =============================================
// ENVANTER (STOK) YÖNETİMİ
// =============================================

model StokKarti {
  id          Int      @id @default(autoincrement())
  adi         String   @db.VarChar(255)
  cesit       String?  @db.VarChar(255)
  miktar      Int      @default(0)
  tur         String?  @db.VarChar(50)
  created_at  DateTime @default(now())
  
  @@map("stok_kartlari")
}

model StokHareketi {
  id          Int       @id @default(autoincrement())
  adi         String    @db.VarChar(255)
  cesit       String?   @db.VarChar(255)
  islem       String    @db.VarChar(50)  // 'giris' veya 'cikis'
  miktar      Int
  aciklama    String?   @db.Text
  tarih       DateTime  @db.Date
  created_at  DateTime  @default(now())
  
  @@map("stok_hareketleri")
}

// =============================================
// PERSONEL (İK) YÖNETİMİ
// =============================================

model Personel {
  id           Int       @id @default(autoincrement())
  ad_soyad     String    @db.VarChar(255)
  tc_kimlik    String?   @db.VarChar(11)
  unvan        String?   @db.VarChar(255)
  birim        String?   @db.VarChar(255)
  telefon      String?   @db.VarChar(20)
  email        String?   @db.VarChar(255)
  ise_giris    DateTime? @db.Date
  dogum_tarihi DateTime? @db.Date
  adres        String?   @db.Text
  silindi      Boolean   @default(false)
  created_at   DateTime  @default(now())
  
  hareketler   PersonelHareketi[]
  cvler        PersonelCv[]
  
  @@map("personeller")
}

model PersonelHareketi {
  id            Int       @id @default(autoincrement())
  personel_id   Int
  personel_ad   String?   @db.VarChar(255)
  tur           String    @db.VarChar(50)  // 'izin' veya 'mesai'
  turu          String?   @db.VarChar(100) // İzin türü
  baslangic     DateTime  @db.Date
  bitis         DateTime  @db.Date
  mesai_saati   Int?
  aciklama      String?   @db.Text
  created_at    DateTime  @default(now())
  
  personel      Personel  @relation(fields: [personel_id], references: [id])
  
  @@map("personel_hareketleri")
}

model PersonelCv {
  id              Int       @id @default(autoincrement())
  personel_id     Int
  dosya_adi       String    @db.VarChar(255)
  dosya_yolu      String    @db.VarChar(255)
  dosya_tipi      String?   @db.VarChar(100)
  dosya_boyut     Int?
  yukleme_tarihi  DateTime  @default(now())
  
  personel        Personel  @relation(fields: [personel_id], references: [id])
  
  @@map("personel_cv")
}

// =============================================
// KURUM AMİRLERİ
// =============================================

model KurumAmiri {
  id          Int       @id @default(autoincrement())
  kurum_adi   String    @db.VarChar(255)
  amir_ad     String    @db.VarChar(255)
  unvan       String?   @db.VarChar(255)
  telefon     String?   @db.VarChar(20)
  email       String?   @db.VarChar(255)
  created_at  DateTime  @default(now())
  
  @@map("kurum_amirleri")
}

model AmirIzni {
  id           Int       @id @default(autoincrement())
  kurum_adi    String    @db.VarChar(255)
  amir_ad      String    @db.VarChar(255)
  baslangic    DateTime  @db.Date
  bitis        DateTime  @db.Date
  vekil_ad     String?   @db.VarChar(255)
  vekil_unvan  String?   @db.VarChar(255)
  vekil_tel    String?   @db.VarChar(20)
  izin_turu    String?   @db.VarChar(100)
  created_at   DateTime  @default(now())
  
  @@map("amir_izinleri")
}

// =============================================
// TOPLANTI YÖNETİMİ
// =============================================

model ToplantiSalonu {
  id          Int       @id @default(autoincrement())
  ad          String    @db.VarChar(255)
  kapasite    Int?
  durum       String    @default("aktif") @db.VarChar(50)
  created_at  DateTime  @default(now())
  
  rezervasyonlar SalonRezervasyonu[]
  
  @@map("toplanti_salonlari")
}

model SalonRezervasyonu {
  id            Int       @id @default(autoincrement())
  salon_id      Int?
  salon_ad      String?   @db.VarChar(255)
  baslik        String    @db.VarChar(255)
  tarih         DateTime  @db.Date
  bas_saat      String    @db.VarChar(10)
  bit_saat      String    @db.VarChar(10)
  rez_sahibi    String?   @db.VarChar(255)
  departman     String?   @db.VarChar(255)
  telefon       String?   @db.VarChar(20)
  toplanti_turu String?   @db.VarChar(255)
  katilimci     String?   @db.Text
  aciklama      String?   @db.Text
  kararlar      String?   @db.Text
  durum         String    @default("bekliyor") @db.VarChar(50)
  created_at    DateTime  @default(now())
  
  salon         ToplantiSalonu? @relation(fields: [salon_id], references: [id])
  dokumanlar    SalonRezervasyonDokumani[]
  
  @@map("salon_rezervasyonlari")
}

model SalonRezervasyonDokumani {
  id              Int       @id @default(autoincrement())
  rezervasyon_id  Int
  dosya_adi       String    @db.VarChar(255)
  dosya_yolu      String    @db.VarChar(500)
  dosya_tipi      String?   @db.VarChar(100)
  dosya_boyut     Int?
  yukleme_tarihi  DateTime  @default(now())
  
  rezervasyon     SalonRezervasyonu @relation(fields: [rezervasyon_id], references: [id])
  
  @@map("salon_rezervasyon_dokumanlari")
}

// =============================================
// MUHTAR YÖNETİMİ
// =============================================

model Muhtar {
  id          Int       @id @default(autoincrement())
  ilce        String    @db.VarChar(255)
  mahalle_koy String    @db.VarChar(255)
  ad_soyad    String    @db.VarChar(255)
  gsm         String?   @db.VarChar(20)
  sabit_tel   String?   @db.VarChar(20)
  email       String?   @db.VarChar(255)
  foto        String?   @db.VarChar(255)
  created_at  DateTime  @default(now())
  
  @@map("muhtarlar")
}

// =============================================
// EVRAK TAKİP
// =============================================

model Evrak {
  id            Int       @id @default(autoincrement())
  gelen_kurum   String?   @db.VarChar(255)
  tur           String?   @db.VarChar(100)
  konu          String?   @db.Text
  notlar        String?   @db.Text
  evrak_tarih   DateTime? @db.Date
  evrak_sayi    String?   @db.VarChar(100)
  gelis_tarih   DateTime? @db.Date
  teslim_alan   String?   @db.VarChar(255)
  cikis_tarihi  DateTime? @db.Date
  sunus_tarihi  DateTime? @db.Date
  created_at    DateTime  @default(now())
  
  @@map("evraklar")
}

// =============================================
// ŞEHİT GAZİ BİLGİ SİSTEMİ
// =============================================

model SehitGaziBilgi {
  id          Int       @id @default(autoincrement())
  ad_soyad    String    @db.VarChar(255)
  tur         String    @db.VarChar(50)  // 'sehit' veya 'gazi'
  kurum       String?   @db.VarChar(255)
  olay_yeri   String?   @db.VarChar(255)
  olay_tarihi DateTime? @db.Date
  adres       String?   @db.Text
  telefon     String?   @db.VarChar(20)
  notlar      String?   @db.Text
  foto        String?   @db.VarChar(255)
  created_at  DateTime  @default(now())
  
  ziyaretler  ZiyaretSehitGazi[]
  
  @@map("sehit_gazi_bilgi")
}

model ZiyaretSehitGazi {
  id          Int       @id @default(autoincrement())
  sg_id       Int
  tarih       DateTime  @db.Date
  saat        String?   @db.VarChar(10)
  yer         String?   @db.VarChar(255)
  aciklama    String?   @db.Text
  created_at  DateTime  @default(now())
  
  sehitGazi   SehitGaziBilgi @relation(fields: [sg_id], references: [id])
  
  @@map("ziyaret_sehit_gazi")
}

model ZiyaretKamu {
  id          Int       @id @default(autoincrement())
  kurum       String    @db.VarChar(255)
  yer         String?   @db.VarChar(255)
  tarih       DateTime  @db.Date
  saat        String?   @db.VarChar(10)
  talepler    String?   @db.Text
  created_at  DateTime  @default(now())
  
  @@map("ziyaret_kamu")
}

// =============================================
// PROJELER
// =============================================

model Proje {
  id          Int       @id @default(autoincrement())
  konu        String    @db.VarChar(255)
  kurum       String?   @db.VarChar(255)
  baslangic   DateTime? @db.Date
  bitis       DateTime? @db.Date
  durum       String?   @db.VarChar(50)
  notlar      String?   @db.Text
  created_at  DateTime  @default(now())
  
  @@map("projeler")
}
```

---

## 🔄 Prisma Komutları

```bash
# Schema değişikliklerini DB'ye uygula
npx prisma db push

# Migration oluştur (production için)
npx prisma migrate dev --name init

# Prisma Studio (DB görselleştirme)
npx prisma studio

# Client'ı yeniden oluştur
npx prisma generate
```

---

## 📦 Prisma Client Kullanımı

### src/lib/prisma.ts

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

### API Route'da Kullanım Örneği

```typescript
// app/api/arac/route.ts
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const araclar = await prisma.arac.findMany({
    include: {
      gecmis: {
        orderBy: { islem_tarihi: 'desc' },
        take: 5,
      },
    },
    orderBy: { created_at: 'desc' },
  });

  return NextResponse.json(araclar);
}

export async function POST(request: Request) {
  const body = await request.json();
  
  const arac = await prisma.arac.create({
    data: {
      plaka: body.plaka,
      marka: body.marka,
      model: body.model,
      kurum: body.kurum,
      sofor: body.sofor,
      telefon: body.telefon,
      km: body.km,
      muayene_bit: body.muayene_bit ? new Date(body.muayene_bit) : null,
      sigorta_bit: body.sigorta_bit ? new Date(body.sigorta_bit) : null,
    },
  });

  return NextResponse.json(arac, { status: 201 });
}
```

---

## ➡️ Sonraki Adım

[04-AUTHENTICATION.md](./04-AUTHENTICATION.md) - NextAuth.js ile kimlik doğrulama sistemi

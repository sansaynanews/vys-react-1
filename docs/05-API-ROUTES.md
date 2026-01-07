# 05 - API Routes Tasarımı

## 📊 Mevcut PHP API → Next.js API Eşleştirmesi

| PHP API | Next.js API | HTTP Methods |
|---------|-------------|--------------|
| `arac_api.php` | `/api/arac` | GET, POST, PUT, DELETE |
| `dashboard_api.php` | `/api/dashboard` | GET |
| `envanter_api.php` | `/api/envanter` | GET, POST, PUT, DELETE |
| `evrak_api.php` | `/api/evrak` | GET, POST, PUT, DELETE |
| `ik_api.php` | `/api/ik` | GET, POST, PUT, DELETE |
| `kurum_api.php` | `/api/kurum` | GET, POST, PUT, DELETE |
| `makam_randevu_api.php` | `/api/randevu` | GET, POST, PUT, DELETE |
| `muhtar_api.php` | `/api/muhtar` | GET, POST, PUT, DELETE |
| `toplanti_api.php` | `/api/toplanti` | GET, POST, PUT, DELETE |
| `yonetim_api.php` | `/api/yonetim` | GET, POST, PUT, DELETE |
| `ziyaret_api.php` | `/api/ziyaret` | GET, POST, PUT, DELETE |

---

## 🔧 API Route Şablonu

Her API route için temel yapı:

```typescript
// app/api/[modul]/route.ts
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation schema
const createSchema = z.object({
  // ... alanlar
});

// GET - Liste
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const search = searchParams.get("search") || "";

  // ... veri çekme ve response
}

// POST - Oluştur
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const body = await request.json();
  
  // Validation
  const validated = createSchema.safeParse(body);
  if (!validated.success) {
    return NextResponse.json(
      { error: "Geçersiz veri", details: validated.error.errors },
      { status: 400 }
    );
  }

  // ... kayıt oluşturma
}
```

---

## 📁 Detaylı API Implementasyonları

### 1. Araç API

#### app/api/arac/route.ts

```typescript
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const aracSchema = z.object({
  plaka: z.string().min(1, "Plaka gerekli"),
  marka: z.string().min(1, "Marka gerekli"),
  model: z.string().optional(),
  kurum: z.string().optional(),
  sofor: z.string().optional(),
  telefon: z.string().optional(),
  km: z.number().optional(),
  muayene_bit: z.string().optional(),
  sigorta_bit: z.string().optional(),
  kasko_bit: z.string().optional(),
  egzoz_bit: z.string().optional(),
});

// GET - Araç listesi (pagination + search)
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const search = searchParams.get("search") || "";

  const skip = (page - 1) * limit;

  const where = search
    ? {
        OR: [
          { plaka: { contains: search } },
          { marka: { contains: search } },
          { kurum: { contains: search } },
          { model: { contains: search } },
        ],
      }
    : {};

  const [araclar, total] = await Promise.all([
    prisma.arac.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: "desc" },
    }),
    prisma.arac.count({ where }),
  ]);

  return NextResponse.json({
    data: araclar,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

// POST - Yeni araç ekle
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const body = await request.json();
  const validated = aracSchema.safeParse(body);

  if (!validated.success) {
    return NextResponse.json(
      { error: "Geçersiz veri", details: validated.error.errors },
      { status: 400 }
    );
  }

  const data = validated.data;

  try {
    const arac = await prisma.arac.create({
      data: {
        plaka: data.plaka,
        marka: data.marka,
        model: data.model,
        kurum: data.kurum,
        sofor: data.sofor,
        telefon: data.telefon,
        km: data.km,
        muayene_bit: data.muayene_bit ? new Date(data.muayene_bit) : null,
        sigorta_bit: data.sigorta_bit ? new Date(data.sigorta_bit) : null,
        kasko_bit: data.kasko_bit ? new Date(data.kasko_bit) : null,
        egzoz_bit: data.egzoz_bit ? new Date(data.egzoz_bit) : null,
      },
    });

    return NextResponse.json(
      { success: true, message: "Araç eklendi", data: arac },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Bu plaka zaten kayıtlı" },
        { status: 400 }
      );
    }
    throw error;
  }
}
```

#### app/api/arac/[id]/route.ts

```typescript
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Tek araç
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const arac = await prisma.arac.findUnique({
    where: { id: parseInt(params.id) },
    include: {
      gecmis: {
        orderBy: { islem_tarihi: "desc" },
      },
    },
  });

  if (!arac) {
    return NextResponse.json({ error: "Araç bulunamadı" }, { status: 404 });
  }

  return NextResponse.json(arac);
}

// PUT - Araç güncelle
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const body = await request.json();
  const id = parseInt(params.id);

  const arac = await prisma.arac.update({
    where: { id },
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
      kasko_bit: body.kasko_bit ? new Date(body.kasko_bit) : null,
      egzoz_bit: body.egzoz_bit ? new Date(body.egzoz_bit) : null,
    },
  });

  // Geçmişe kaydet
  await prisma.aracGecmis.create({
    data: {
      arac_id: id,
      islem_turu: "Güncelleme",
      tarih: new Date(),
      km: body.km,
      aciklama: "Araç bilgileri güncellendi",
      kullanici: session.user.name || "Sistem",
    },
  });

  return NextResponse.json({ success: true, data: arac });
}

// DELETE - Araç sil
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  // Sadece makam ve okm silebilir
  if (!["makam", "okm"].includes(session.user.role)) {
    return NextResponse.json(
      { error: "Bu işlem için yetkiniz yok" },
      { status: 403 }
    );
  }

  const id = parseInt(params.id);

  // Önce geçmişi sil
  await prisma.aracGecmis.deleteMany({ where: { arac_id: id } });
  
  // Sonra aracı sil
  await prisma.arac.delete({ where: { id } });

  return NextResponse.json({ success: true, message: "Araç silindi" });
}
```

---

### 2. Dashboard API

#### app/api/dashboard/route.ts

```typescript
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import dayjs from "dayjs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const bugun = dayjs().format("YYYY-MM-DD");
  const yarin = dayjs().add(1, "day").format("YYYY-MM-DD");

  const tumVeriler: any[] = [];

  // 1. Randevular
  const randevular = await prisma.randevu.findMany({
    where: {
      tarih: { in: [new Date(bugun), new Date(yarin)] },
    },
  });

  randevular.forEach((r) => {
    tumVeriler.push({
      modul: "Randevu",
      baslik: r.ad_soyad,
      saat: r.saat,
      detay: r.kurum || "",
      tur: r.tipi || "Randevu",
      tarih: dayjs(r.tarih).format("YYYY-MM-DD") === bugun ? "bugun" : "yarin",
      renk: "blue",
    });
  });

  // 2. Toplantılar
  const toplantilar = await prisma.salonRezervasyonu.findMany({
    where: {
      tarih: { in: [new Date(bugun), new Date(yarin)] },
    },
  });

  toplantilar.forEach((t) => {
    tumVeriler.push({
      modul: "Toplantı",
      baslik: t.baslik,
      saat: t.bas_saat,
      detay: t.salon_ad || "",
      tur: t.toplanti_turu || "Toplantı",
      tarih: dayjs(t.tarih).format("YYYY-MM-DD") === bugun ? "bugun" : "yarin",
      renk: "orange",
    });
  });

  // 3. Araç İşlemleri (Muayene/Sigorta biten)
  const araclar = await prisma.arac.findMany({
    where: {
      OR: [
        { muayene_bit: { in: [new Date(bugun), new Date(yarin)] } },
        { sigorta_bit: { in: [new Date(bugun), new Date(yarin)] } },
      ],
    },
  });

  araclar.forEach((a) => {
    const muayeneBugun = a.muayene_bit && dayjs(a.muayene_bit).format("YYYY-MM-DD") === bugun;
    const muayeneYarin = a.muayene_bit && dayjs(a.muayene_bit).format("YYYY-MM-DD") === yarin;
    
    if (muayeneBugun || muayeneYarin) {
      tumVeriler.push({
        modul: "Ulaşım",
        baslik: `${a.plaka} - ${a.marka}`,
        saat: "09:00",
        detay: "Muayene Bitiş",
        tur: "Araç İşlemi",
        tarih: muayeneBugun ? "bugun" : "yarin",
        renk: "yellow",
      });
    }
  });

  // 4. Personel İzinleri
  const izinler = await prisma.personelHareketi.findMany({
    where: {
      tur: "izin",
      baslangic: { lte: new Date(yarin) },
      bitis: { gte: new Date(bugun) },
    },
  });

  izinler.forEach((i) => {
    tumVeriler.push({
      modul: "İK-İzin",
      baslik: i.personel_ad || "",
      saat: "08:00",
      detay: i.turu || "İzin",
      tur: "İzinli",
      tarih: "bugun",
      renk: "gray",
    });
  });

  // Saate göre sırala
  tumVeriler.sort((a, b) => a.saat.localeCompare(b.saat));

  return NextResponse.json({
    bugun: tumVeriler.filter((v) => v.tarih === "bugun"),
    yarin: tumVeriler.filter((v) => v.tarih === "yarin"),
    meta: {
      toplam_bugun: tumVeriler.filter((v) => v.tarih === "bugun").length,
      tarih_bugun: dayjs().format("DD.MM.YYYY"),
      tarih_yarin: dayjs().add(1, "day").format("DD.MM.YYYY"),
    },
  });
}
```

---

### 3. Kullanıcı Yönetimi API

#### app/api/yonetim/route.ts

```typescript
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const yetkiSecenekleri = {
  makam: "Makam (Tam Yetki)",
  okm: "OKM (Tam Yetki)",
  protokol: "Protokol (Tam Yetki)",
  idari: "İdari Koordinatör",
  metin: "Konuşma Metni",
  arac: "Araç Planlama",
  sekreterlik: "Sekreterlik",
  destek: "Destek (Envanter)",
};

const createUserSchema = z.object({
  kadi: z.string().min(1, "Kullanıcı adı gerekli"),
  sifre: z.string().min(4, "Şifre en az 4 karakter olmalı"),
  yetki: z.string().min(1, "Yetki seçimi gerekli"),
});

// Yetki kontrolü middleware
async function checkAdminAccess() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { error: "Yetkisiz", status: 401 };
  }
  if (!["makam", "okm"].includes(session.user.role)) {
    return { error: "Bu işlem için yetkiniz yok", status: 403 };
  }
  return { session };
}

// GET - Kullanıcı listesi
export async function GET() {
  const check = await checkAdminAccess();
  if ("error" in check) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }

  const kullanicilar = await prisma.kullanici.findMany({
    select: {
      id: true,
      kadi: true,
      yetki: true,
      ozel_yetkiler: true,
      olusturma_tarihi: true,
    },
    orderBy: { id: "asc" },
  });

  return NextResponse.json({
    success: true,
    data: kullanicilar,
    yetki_secenekleri: yetkiSecenekleri,
  });
}

// POST - Yeni kullanıcı ekle
export async function POST(request: Request) {
  const check = await checkAdminAccess();
  if ("error" in check) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }

  const body = await request.json();
  const validated = createUserSchema.safeParse(body);

  if (!validated.success) {
    return NextResponse.json(
      { error: "Geçersiz veri", details: validated.error.errors },
      { status: 400 }
    );
  }

  // Kullanıcı adı kontrolü
  const existing = await prisma.kullanici.findUnique({
    where: { kadi: validated.data.kadi },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Bu kullanıcı adı zaten kullanılıyor" },
      { status: 400 }
    );
  }

  // Yetki kontrolü
  if (!(validated.data.yetki in yetkiSecenekleri)) {
    return NextResponse.json(
      { error: "Geçersiz yetki türü" },
      { status: 400 }
    );
  }

  const hashedPassword = await bcrypt.hash(validated.data.sifre, 10);

  const user = await prisma.kullanici.create({
    data: {
      kadi: validated.data.kadi,
      sifre: hashedPassword,
      yetki: validated.data.yetki,
    },
  });

  return NextResponse.json(
    { success: true, message: "Kullanıcı eklendi" },
    { status: 201 }
  );
}

// PUT - Kullanıcı güncelle
export async function PUT(request: Request) {
  const check = await checkAdminAccess();
  if ("error" in check) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }

  const body = await request.json();
  const { id, yeni_sifre, yetki, ozel_yetkiler } = body;

  if (!id) {
    return NextResponse.json({ error: "ID gerekli" }, { status: 400 });
  }

  // Şifre güncelleme
  if (yeni_sifre) {
    const hashedPassword = await bcrypt.hash(yeni_sifre, 10);
    await prisma.kullanici.update({
      where: { id },
      data: { sifre: hashedPassword },
    });
    return NextResponse.json({ success: true, message: "Şifre güncellendi" });
  }

  // Yetki güncelleme
  if (yetki) {
    await prisma.kullanici.update({
      where: { id },
      data: { yetki, ozel_yetkiler: null },
    });
    return NextResponse.json({ success: true, message: "Yetki güncellendi" });
  }

  // Özel yetkiler
  if (ozel_yetkiler !== undefined) {
    await prisma.kullanici.update({
      where: { id },
      data: { ozel_yetkiler },
    });
    return NextResponse.json({ success: true, message: "Özel yetkiler güncellendi" });
  }

  return NextResponse.json({ error: "Güncellenecek veri yok" }, { status: 400 });
}

// DELETE - Kullanıcı sil
export async function DELETE(request: Request) {
  const check = await checkAdminAccess();
  if ("error" in check) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }

  const { searchParams } = new URL(request.url);
  const id = parseInt(searchParams.get("id") || "0");

  if (!id) {
    return NextResponse.json({ error: "ID gerekli" }, { status: 400 });
  }

  // Kendini silemesin
  const silinecek = await prisma.kullanici.findUnique({ where: { id } });
  if (silinecek?.kadi === check.session.user.username) {
    return NextResponse.json(
      { error: "Kendinizi silemezsiniz" },
      { status: 400 }
    );
  }

  await prisma.kullanici.delete({ where: { id } });

  return NextResponse.json({ success: true, message: "Kullanıcı silindi" });
}
```

---

## 📝 Validation Şemaları

### src/lib/validations.ts

```typescript
import { z } from "zod";

// Araç
export const aracSchema = z.object({
  plaka: z.string().min(1, "Plaka gerekli").max(20),
  marka: z.string().min(1, "Marka gerekli").max(100),
  model: z.string().max(100).optional(),
  kurum: z.string().max(255).optional(),
  sofor: z.string().max(255).optional(),
  telefon: z.string().max(20).optional(),
  km: z.number().optional(),
  muayene_bit: z.string().optional(),
  sigorta_bit: z.string().optional(),
});

// Randevu
export const randevuSchema = z.object({
  ad_soyad: z.string().min(1, "Ad soyad gerekli").max(255),
  kurum: z.string().max(255).optional(),
  unvan: z.string().max(255).optional(),
  tipi: z.string().max(100).optional(),
  iletisim: z.string().max(50).optional(),
  tarih: z.string().min(1, "Tarih gerekli"),
  saat: z.string().min(1, "Saat gerekli"),
  katilimci: z.string().max(255).optional(),
  notlar: z.string().optional(),
});

// Personel
export const personelSchema = z.object({
  ad_soyad: z.string().min(1, "Ad soyad gerekli").max(255),
  tc_kimlik: z.string().length(11, "TC 11 haneli olmalı").optional(),
  unvan: z.string().max(255).optional(),
  birim: z.string().max(255).optional(),
  telefon: z.string().max(20).optional(),
  email: z.string().email("Geçersiz email").optional().or(z.literal("")),
  ise_giris: z.string().optional(),
  dogum_tarihi: z.string().optional(),
  adres: z.string().optional(),
});

// Muhtar
export const muhtarSchema = z.object({
  ilce: z.string().min(1, "İlçe gerekli").max(255),
  mahalle_koy: z.string().min(1, "Mahalle/Köy gerekli").max(255),
  ad_soyad: z.string().min(1, "Ad soyad gerekli").max(255),
  gsm: z.string().max(20).optional(),
  sabit_tel: z.string().max(20).optional(),
  email: z.string().email().optional().or(z.literal("")),
});

// Evrak
export const evrakSchema = z.object({
  gelen_kurum: z.string().max(255).optional(),
  tur: z.string().max(100).optional(),
  konu: z.string().optional(),
  notlar: z.string().optional(),
  evrak_tarih: z.string().optional(),
  evrak_sayi: z.string().max(100).optional(),
  gelis_tarih: z.string().optional(),
});
```

---

## ➡️ Sonraki Adım

[06-SAYFALAR-VE-COMPONENTLER.md](./06-SAYFALAR-VE-COMPONENTLER.md) - Frontend komponentleri ve sayfalar

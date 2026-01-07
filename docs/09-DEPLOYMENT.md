# 09 - Deployment (Vercel & Docker)

Bu dokümanda, Next.js projesinin production ortamına deploy edilmesi için gerekli tüm adımlar detaylı şekilde açıklanmaktadır.

---

## İçindekiler

1. [Genel Bakış](#1-genel-bakış)
2. [Ortam Değişkenleri](#2-ortam-değişkenleri)
3. [Vercel Deployment](#3-vercel-deployment)
4. [Docker Deployment](#4-docker-deployment)
5. [VPS / Sunucu Kurulumu](#5-vps--sunucu-kurulumu)
6. [Database Migration](#6-database-migration)
7. [CI/CD Pipeline](#7-cicd-pipeline)
8. [Monitoring & Logging](#8-monitoring--logging)
9. [Güvenlik Kontrolleri](#9-güvenlik-kontrolleri)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Genel Bakış

### Deployment Seçenekleri

| Platform | Avantajları | Dezavantajları | Uygunluk |
|----------|-------------|----------------|----------|
| **Vercel** | Kolay, otomatik CI/CD, edge | Maliyet (ölçekte), vendor lock-in | Hızlı başlangıç |
| **Docker + VPS** | Tam kontrol, maliyet etkin | Manuel kurulum, bakım | Kurumsal |
| **Docker + K8s** | Ölçeklenebilir, HA | Karmaşık | Büyük ölçek |

### Önerilen Mimari (Kurumsal)

```
                    ┌─────────────┐
                    │   Nginx     │
                    │ (Reverse    │
                    │  Proxy)     │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
        ┌─────┴─────┐ ┌────┴────┐ ┌─────┴─────┐
        │  Next.js  │ │ Next.js │ │  Next.js  │
        │ Instance 1│ │Instance2│ │ Instance 3│
        └─────┬─────┘ └────┬────┘ └─────┬─────┘
              │            │            │
              └────────────┼────────────┘
                           │
                    ┌──────┴──────┐
                    │   MySQL     │
                    │  (Master)   │
                    └─────────────┘
```

---

## 2. Ortam Değişkenleri

### .env.example

```bash
# ===========================================
# DATABASE
# ===========================================
DATABASE_URL="mysql://user:password@localhost:3306/valilik_yonetim"

# ===========================================
# NEXTAUTH
# ===========================================
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-super-secret-key-min-32-chars"

# ===========================================
# APPLICATION
# ===========================================
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://your-domain.com"
NEXT_PUBLIC_APP_NAME="Valilik Yönetim Sistemi"

# ===========================================
# FILE UPLOAD
# ===========================================
UPLOAD_DIR="/var/www/uploads"
MAX_FILE_SIZE="10485760"

# ===========================================
# SESSION
# ===========================================
SESSION_MAX_AGE="1800"

# ===========================================
# LOGGING
# ===========================================
LOG_LEVEL="info"
```

### Secret Oluşturma

```bash
# NextAuth Secret
openssl rand -base64 32

# Veya Node.js ile
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## 3. Vercel Deployment

### 3.1 Vercel CLI Kurulumu

```bash
npm install -g vercel
vercel login
```

### 3.2 Proje Bağlama

```bash
cd valilik-yonetim-nextjs
vercel link
```

### 3.3 Ortam Değişkenleri

```bash
# Production
vercel env add DATABASE_URL production
vercel env add NEXTAUTH_SECRET production
vercel env add NEXTAUTH_URL production

# Preview
vercel env add DATABASE_URL preview
vercel env add NEXTAUTH_SECRET preview
vercel env add NEXTAUTH_URL preview
```

### 3.4 Deploy

```bash
# Preview deployment
vercel

# Production deployment
vercel --prod
```

### 3.5 vercel.json Yapılandırması

```json
{
  "framework": "nextjs",
  "buildCommand": "prisma generate && next build",
  "regions": ["fra1"],
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "no-store, must-revalidate" }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/uploads/:path*",
      "destination": "/api/files/:path*"
    }
  ]
}
```

### 3.6 Vercel + External MySQL

Vercel serverless fonksiyonları external MySQL'e bağlanırken connection pooling gerekir:

**prisma/schema.prisma (güncelleme)**
```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
  relationMode = "prisma"
}
```

**src/lib/prisma.ts (güncelleme)**
```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

---

## 4. Docker Deployment

### 4.1 Dockerfile

```dockerfile
# ==================================
# Base Image
# ==================================
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl

# ==================================
# Dependencies
# ==================================
FROM base AS deps
WORKDIR /app

COPY package.json package-lock.json* ./
COPY prisma ./prisma/

RUN npm ci

# ==================================
# Builder
# ==================================
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Prisma generate
RUN npx prisma generate

# Build
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# ==================================
# Runner
# ==================================
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Create upload directory
RUN mkdir -p /app/uploads && chown nextjs:nodejs /app/uploads

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### 4.2 .dockerignore

```
Dockerfile
.dockerignore
node_modules
npm-debug.log
.next
.git
.gitignore
README.md
.env
.env.*
!.env.example
```

### 4.3 next.config.js (Standalone için)

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'your-domain.com',
      },
    ],
  },
};

module.exports = nextConfig;
```

### 4.4 docker-compose.yml

```yaml
version: '3.8'

services:
  # Next.js Application
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: valilik-app
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=mysql://valilik:${DB_PASSWORD}@db:3306/valilik_yonetim
      - NEXTAUTH_URL=${NEXTAUTH_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - NODE_ENV=production
    volumes:
      - uploads:/app/uploads
    depends_on:
      db:
        condition: service_healthy
    networks:
      - valilik-network

  # MySQL Database
  db:
    image: mysql:8.0
    container_name: valilik-db
    restart: unless-stopped
    environment:
      - MYSQL_ROOT_PASSWORD=${DB_ROOT_PASSWORD}
      - MYSQL_DATABASE=valilik_yonetim
      - MYSQL_USER=valilik
      - MYSQL_PASSWORD=${DB_PASSWORD}
    volumes:
      - mysql-data:/var/lib/mysql
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql:ro
    ports:
      - "3306:3306"
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - valilik-network

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: valilik-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - uploads:/var/www/uploads:ro
    depends_on:
      - app
    networks:
      - valilik-network

volumes:
  mysql-data:
  uploads:

networks:
  valilik-network:
    driver: bridge
```

### 4.5 docker-compose.env

```bash
# Database
DB_ROOT_PASSWORD=your_root_password_here
DB_PASSWORD=your_app_password_here

# NextAuth
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your_secret_here
```

### 4.6 Nginx Konfigürasyonu

**nginx/nginx.conf**
```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log warn;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

    # Upstream
    upstream nextjs {
        server app:3000;
        keepalive 64;
    }

    # HTTP -> HTTPS redirect
    server {
        listen 80;
        server_name your-domain.com;
        return 301 https://$server_name$request_uri;
    }

    # HTTPS Server
    server {
        listen 443 ssl http2;
        server_name your-domain.com;

        # SSL
        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        ssl_session_timeout 1d;
        ssl_session_cache shared:SSL:50m;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
        ssl_prefer_server_ciphers off;

        # Security Headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;

        # Max upload size
        client_max_body_size 50M;

        # Static files (uploads)
        location /uploads/ {
            alias /var/www/uploads/;
            expires 30d;
            add_header Cache-Control "public, immutable";
        }

        # API rate limiting
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://nextjs;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # Login rate limiting
        location /api/auth/ {
            limit_req zone=login burst=5 nodelay;
            proxy_pass http://nextjs;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Next.js
        location / {
            proxy_pass http://nextjs;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # Next.js static files
        location /_next/static/ {
            proxy_pass http://nextjs;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

### 4.7 Docker Komutları

```bash
# Build
docker-compose build

# Start (background)
docker-compose up -d

# Logs
docker-compose logs -f app

# Stop
docker-compose down

# Rebuild and restart
docker-compose up -d --build

# Database migration
docker-compose exec app npx prisma migrate deploy

# Shell access
docker-compose exec app sh
```

---

## 5. VPS / Sunucu Kurulumu

### 5.1 Sunucu Gereksinimleri

- **CPU**: 2+ core
- **RAM**: 4GB+ (önerilen 8GB)
- **Disk**: 50GB+ SSD
- **OS**: Ubuntu 22.04 LTS

### 5.2 Sunucu Hazırlığı

```bash
# Sistem güncelleme
sudo apt update && sudo apt upgrade -y

# Gerekli paketler
sudo apt install -y curl git ufw

# Docker kurulumu
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Docker Compose kurulumu
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Kullanıcıyı docker grubuna ekle
sudo usermod -aG docker $USER

# Firewall ayarları
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 5.3 SSL Sertifikası (Let's Encrypt)

```bash
# Certbot kurulumu
sudo apt install -y certbot

# Sertifika alma (nginx durdurup)
sudo certbot certonly --standalone -d your-domain.com

# Sertifikaları kopyala
sudo mkdir -p /path/to/project/nginx/ssl
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem /path/to/project/nginx/ssl/
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem /path/to/project/nginx/ssl/

# Otomatik yenileme
sudo certbot renew --dry-run
```

### 5.4 Deployment Script

**deploy.sh**
```bash
#!/bin/bash

set -e

echo "🚀 Deployment başlıyor..."

# Değişkenler
PROJECT_DIR="/var/www/valilik-yonetim"
REPO_URL="git@github.com:your-org/valilik-yonetim-nextjs.git"
BRANCH="main"

# Git pull
echo "📥 Kod çekiliyor..."
cd $PROJECT_DIR
git fetch origin
git reset --hard origin/$BRANCH

# Build ve restart
echo "🔨 Build ve restart..."
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Migration
echo "📊 Database migration..."
docker-compose exec -T app npx prisma migrate deploy

# Temizlik
echo "🧹 Temizlik..."
docker system prune -f

# Health check
echo "🏥 Health check..."
sleep 10
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ Deployment başarılı!"
else
    echo "❌ Health check başarısız!"
    docker-compose logs app
    exit 1
fi
```

---

## 6. Database Migration

### 6.1 Mevcut Veritabanını Koruma

```bash
# Backup al
mysqldump -u root -p valilik_yonetim > backup_$(date +%Y%m%d).sql

# Prisma ile mevcut şemayı çek
npx prisma db pull

# Schema'yı kontrol et
cat prisma/schema.prisma
```

### 6.2 Migration Stratejisi

```bash
# Development ortamında
npx prisma migrate dev --name init

# Production ortamında (sadece uygula)
npx prisma migrate deploy

# Acil durumda (force)
npx prisma db push --force-reset  # DİKKAT: Veri kaybı!
```

### 6.3 Migration Script

**scripts/migrate.sh**
```bash
#!/bin/bash

echo "Database migration başlıyor..."

# Backup
BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
docker-compose exec -T db mysqldump -u root -p$DB_ROOT_PASSWORD valilik_yonetim > backups/$BACKUP_FILE

# Migration
docker-compose exec -T app npx prisma migrate deploy

if [ $? -eq 0 ]; then
    echo "✅ Migration başarılı!"
else
    echo "❌ Migration başarısız! Backup'tan restore yapılıyor..."
    docker-compose exec -T db mysql -u root -p$DB_ROOT_PASSWORD valilik_yonetim < backups/$BACKUP_FILE
    exit 1
fi
```

---

## 7. CI/CD Pipeline

### 7.1 GitHub Actions

**.github/workflows/deploy.yml**
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch:

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Run type check
        run: npm run type-check
      
      - name: Run tests
        run: npm test

  build:
    needs: test
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: |
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: production
    
    steps:
      - name: Deploy to server
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          script: |
            cd /var/www/valilik-yonetim
            docker-compose pull
            docker-compose up -d
            docker-compose exec -T app npx prisma migrate deploy
            docker system prune -f
```

### 7.2 GitHub Secrets

Repository Settings → Secrets and variables → Actions:

- `SERVER_HOST`: Sunucu IP adresi
- `SERVER_USER`: SSH kullanıcı adı
- `SERVER_SSH_KEY`: SSH private key

---

## 8. Monitoring & Logging

### 8.1 Health Check Endpoint

**src/app/api/health/route.ts**
```typescript
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Database check
    await prisma.$queryRaw`SELECT 1`;
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: 'Database connection failed',
      },
      { status: 503 }
    );
  }
}
```

### 8.2 Logging Setup

**src/lib/logger.ts**
```typescript
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const currentLevel = LOG_LEVELS[process.env.LOG_LEVEL as keyof typeof LOG_LEVELS] ?? LOG_LEVELS.info;

function formatMessage(level: string, message: string, meta?: object) {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
  });
}

export const logger = {
  error: (message: string, meta?: object) => {
    if (currentLevel >= LOG_LEVELS.error) {
      console.error(formatMessage('error', message, meta));
    }
  },
  warn: (message: string, meta?: object) => {
    if (currentLevel >= LOG_LEVELS.warn) {
      console.warn(formatMessage('warn', message, meta));
    }
  },
  info: (message: string, meta?: object) => {
    if (currentLevel >= LOG_LEVELS.info) {
      console.log(formatMessage('info', message, meta));
    }
  },
  debug: (message: string, meta?: object) => {
    if (currentLevel >= LOG_LEVELS.debug) {
      console.log(formatMessage('debug', message, meta));
    }
  },
};
```

### 8.3 Error Tracking (Sentry)

```bash
npm install @sentry/nextjs
```

**sentry.client.config.ts**
```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
});
```

---

## 9. Güvenlik Kontrolleri

### 9.1 Deployment Öncesi Checklist

- [ ] Tüm secret'lar environment variable olarak ayarlandı
- [ ] Database backup alındı
- [ ] SSL sertifikası aktif
- [ ] Rate limiting yapılandırıldı
- [ ] CORS ayarları kontrol edildi
- [ ] Security header'lar eklendi
- [ ] Input validation aktif
- [ ] SQL injection koruması (Prisma)
- [ ] XSS koruması

### 9.2 Security Headers

**next.config.js**
```javascript
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = nextConfig;
```

---

## 10. Troubleshooting

### Yaygın Sorunlar ve Çözümleri

| Sorun | Olası Neden | Çözüm |
|-------|-------------|-------|
| `ECONNREFUSED` | DB bağlantı hatası | DATABASE_URL kontrol, MySQL servisi |
| `ERR_MODULE_NOT_FOUND` | Prisma generate yapılmadı | `npx prisma generate` |
| `NEXTAUTH_URL mismatch` | URL uyuşmazlığı | Environment değişkeni kontrol |
| `504 Gateway Timeout` | API timeout | Nginx timeout ayarları |
| `413 Entity Too Large` | Dosya boyutu limiti | `client_max_body_size` artır |

### Debug Komutları

```bash
# Container logları
docker-compose logs -f app

# Database bağlantı testi
docker-compose exec app npx prisma db execute --stdin <<< "SELECT 1"

# Network kontrolü
docker network inspect valilik-network

# Disk kullanımı
docker system df

# Container içi shell
docker-compose exec app sh
```

---

## Sonraki Adımlar

Deployment tamamlandıktan sonra:
1. ✅ Health check endpoint'i test et
2. ✅ SSL sertifikasını doğrula
3. ✅ Monitoring araçlarını yapılandır
4. ✅ Backup stratejisini belirle
5. ✅ Migration checklist'i tamamla

Devam: [10-MIGRATION-CHECKLIST.md](./10-MIGRATION-CHECKLIST.md)

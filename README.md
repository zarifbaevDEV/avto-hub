# 🚗 AVTOHUB — Automotive Super Platform Backend

[![Python](https://img.shields.io/badge/Python-3.12+-blue.svg)](https://www.python.org/)
[![Django](https://img.shields.io/badge/Django-5.1-green.svg)](https://www.djangoproject.com/)
[![DRF](https://img.shields.io/badge/DRF-3.17-red.svg)](https://www.django-rest-framework.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg)](https://www.docker.com/)

**AvtoHub** — avtomobil bozori (Marketplace), Dilerlik CRM, Avtoservis CRM, Ehtiyot qismlar do'koni, POS kassa, Avtokredit va AI-verifikatsiyani bitta ekotizimga birlashtirgan super platformaning production-darajadagi backend tizimi.

---

## 🏗️ Arxitektura va Texnologiyalar

- **Asosiy freymvork:** Python 3.12+ / Django 5+ / Django REST Framework
- **Arxitektura:** Modular Monolith (kelgusida microservices'ga ajratishga tayyor)
- **Autentifikatsiya:** JWT (SimpleJWT) + Telefon OTP
- **Ma'lumotlar bazasi:** PostgreSQL (lokal tezkor testlar uchun SQLite fallback qo'llab-quvvatlanadi)
- **Kesh & Xabarlar brokeri:** Redis
- **Asinxron vazifalar:** Celery & Celery Beat
- **Hujjatlashtirish:** OpenAPI 3.0 / Swagger UI & Redoc (`drf-spectacular`)
- **Konteynerizatsiya:** Docker & Docker Compose

---

## 📁 Loyiha tuzilishi

```text
avtohub/
│
├── config/                  # Asosiy Django sozlamalari (Split settings)
│   ├── settings/
│   │   ├── base.py          # Umumiy sozlamalar (JWT, Celery, REST, CORS)
│   │   ├── development.py   # Rivojlantirish sozlamalari
│   │   └── production.py    # Production xavfsizlik sozlamalari
│   ├── urls.py              # Root routing va Swagger UI
│   ├── asgi.py              # Asynchronous ASGI entrypoint
│   └── wsgi.py              # WSGI entrypoint
│
├── apps/                    # Modulli ilovalar
│   ├── accounts/            # Custom User, rollar (RBAC), OTP, profillar
│   ├── vehicles/            # Marka, Model, Avlod, Modifikatsiya, Avtomobillar katalogi
│   ├── marketplace/         # E'lonlar (Listings), rasmlar, saralanganlar (Favorites)
│   ├── moderation/          # Moderatsiya navbati, shikoyatlar (Reports)
│   └── audit/               # Tizim harakatlari jurnali (AuditLog)
│
├── common/                  # Qayta ishlatiluvchi komponentlar
│   ├── models.py            # TimeStampedModel, UUIDModel
│   ├── responses.py         # Yagona API response formati
│   ├── pagination.py        # Standart pagination klassi
│   ├── exceptions.py        # Maxsus exception handler
│   ├── permissions.py       # Rol va obyekt darajasidagi ruxsatlar
│   └── utils.py             # Telefon formatlash, OTP generator, VIN tekshiruv
│
├── docker/                  # Dockerfile va entrypoint skripti
├── docker-compose.yml       # Postgres, Redis, Backend, Celery servislar
├── requirements/            # base.txt, local.txt, production.txt
├── manage.py
└── .env.example
```

---

## ⚡ Tezkor ishga tushirish (Quickstart)

### 1-usul: Docker orqali (Tavsiya etiladi)

```bash
# Loyiha sozlamalarini nusxalash
cp .env.example .env

# Docker konteynerlarini ishga tushirish
docker compose up --build -d

# Boshlang'ich avtomobillar katalogini bazaga yuklash
docker compose exec backend python manage.py seed_vehicles
```

### 2-usul: Mahalliy muhitda (Local Python Virtualenv)

```bash
# 1. Virtual muhit yaratish va faollashtirish
python3 -m venv venv
source venv/bin/activate

# 2. Kutubxonalarni o'rnatish
pip install -r requirements/base.txt

# 3. .env faylni tayyorlash
cp .env.example .env

# 4. Migratsiyalarni amalga oshirish
python manage.py migrate

# 5. Real avtomobillar katalogini bazaga yuklash
python manage.py seed_vehicles

# 6. Serverni ishga tushirish
python manage.py runserver
```

Server ishga tushadi: `http://127.0.0.1:8000/`

---

## 📖 API Hujjatlari (Swagger / OpenAPI)

API bilan interaktiv tanishish va test qilish uchun brauzerda oching:

- **Swagger UI:** `http://127.0.0.1:8000/api/docs/`
- **Redoc UI:** `http://127.0.0.1:8000/api/redoc/`
- **OpenAPI Schema (JSON/YAML):** `http://127.0.0.1:8000/api/schema/`

---

## 🔌 Asosiy API Endpointlar (v1)

### 🔐 Autentifikatsiya (`/api/v1/auth/`)
- `POST /api/v1/auth/send-otp/` — Telefon raqamiga OTP kod yuborish
- `POST /api/v1/auth/verify-otp/` — OTP kodni tasdiqlash va JWT token olish
- `POST /api/v1/auth/register/` — Yangi hisob yaratish
- `POST /api/v1/auth/login/` — Telefon va parol orqali kirish
- `POST /api/v1/auth/refresh/` — JWT access tokenni yangilash
- `GET /api/v1/auth/me/` — Joriy foydalanuvchi ma'lumotlari
- `PATCH /api/v1/auth/me/` — Foydalanuvchi profilini yangilash
- `POST /api/v1/auth/change-password/` — Parolni o'zgartirish
- `POST /api/v1/auth/logout/` — Tizimdan chiqish (Token blacklist)

### 🚘 Avtomobillar katalogi (`/api/v1/vehicles/`)
- `GET /api/v1/vehicles/brands/` — Markalar (Chevrolet, BYD, Toyota, Kia...)
- `GET /api/v1/vehicles/models/?brand={id}` — Modellar (Cobalt, Gentra, Song Plus...)
- `GET /api/v1/vehicles/generations/?model={id}` — Avlodlar
- `GET /api/v1/vehicles/modifications/?generation={id}` — Modifikatsiyalar
- `GET, POST /api/v1/vehicles/catalog/` — Foydalanuvchi avtomobillari

### 🏪 E'lonlar bozori (`/api/v1/marketplace/`)
- `GET /api/v1/marketplace/listings/` — Faol e'lonlar (Faqat `ACTIVE` statusdagi)
- `POST /api/v1/marketplace/listings/` — Yangi e'lon berish (`PENDING_MODERATION` ga tushadi)
- `GET /api/v1/marketplace/listings/{id}/` — E'lon tafsiloti (Ko'rishlar soni avtomatik oshadi)
- `GET /api/v1/marketplace/listings/my-listings/` — Sotuvchining barcha e'lonlari
- `POST /api/v1/marketplace/listings/{id}/favorite/` — E'lonni saqlanganlarga qo'shish / olib tashlash
- `POST /api/v1/marketplace/listings/{id}/images/` — E'longa rasm yuklash
- `POST /api/v1/marketplace/listings/{id}/mark-sold/` — Avtomobilni sotilgan deb belgilash
- `GET /api/v1/marketplace/favorites/` — Foydalanuvchi saralagan e'lonlar ro'yxati

### 🛡️ Moderatsiya va Shikoyatlar (`/api/v1/moderation/`)
- `GET /api/v1/moderation/pending-listings/` — Moderatsiya kutilayotgan e'lonlar
- `POST /api/v1/moderation/listings/{id}/decide/` — E'lonni tasdiqlash (`approve`), rad etish (`reject`) yoki bloklash (`block`)
- `POST /api/v1/moderation/reports/` — Qoidabuzarlik yoki soxta e'lon haqida shikoyat yuborish

### 📝 Audit jurnali (`/api/v1/audit/`)
- `GET /api/v1/audit/logs/` — Tizimdagi barcha o'zgarishlar va amallar tarixi (Admin)

---

## 🧪 Avtomatlashtirilgan testlarni ishga tushirish

```bash
./venv/bin/python manage.py test apps
```
Barcha testlar muvaffaqiyatli yakunlanadi.

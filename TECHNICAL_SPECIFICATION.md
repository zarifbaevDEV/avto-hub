# 🚗 AVTOHUB — BACKEND TECHNICAL SPECIFICATION & ARCHITECTURE

**Loyiha:** AvtoHub  
**Turi:** Automotive Super Platform / Marketplace & Ecosystem  
**Backend:** Python 3.12+ / Django 5+ / Django REST Framework  
**Database:** PostgreSQL  
**Cache & Broker:** Redis  
**Background Tasks:** Celery & Celery Beat  
**Realtime:** Django Channels / WebSocket  
**Authentication:** JWT (SimpleJWT) + OTP / Phone Auth  
**API:** Versioned REST API (`/api/v1/`)  
**Storage:** S3-compatible object storage (MinIO / AWS S3)  
**AI Services:** Computer Vision (Vehicle Brand/Model verification) + LLM Assistant  
**Deployment:** Docker + Docker Compose + Nginx + Gunicorn / Uvicorn  
**Arxitektura:** Modular Monolith (kelgusida microservices'ga ajratishga tayyor)

---

## 1. 🎯 ASOSIY MAQSAD VA EKOTIZIM

AvtoHub foydalanuvchiga bitta uzluksiz ekotizim taqdim etadi:
> **Avtomobil qidirish → Ko‘rik / AI tekshiruvi → Xarid / Bron → Kredit / Lizing → Sug‘urta → Servis & Ta'mirlash → Ehtiyot qismlar (Parts) → POS to‘lov → Tarix / Audit**

Backend boshqaradigan asosiy ustunlar:
- **Marketplace & Listings:** Avtomobillar, e'lonlar, filtrlash, rasmlar, AI-moderattsiya.
- **CRM Tizimlari:** Dealer CRM (leads, test drive, sales) va Service CRM (booking, ustalar, xizmatlar).
- **Commerce & POS:** Ehtiyot qismlar katalogi, ombor (inventory), POS kassa tizimi, cheklar va kvitansiyalar.
- **Finance & Insurance:** Kredit arizalari, sug'urta polislari va to'lov shlyuzlari (Click, Payme, Uzum va b.).
- **Realtime & AI:** WebSocket chat, bildirishnomalar (SMS, Push, Telegram, Email), AI Vision model match tekshiruvi.
- **Admin & Audit:** Markazlashgan Super Admin, Moderatsiya markazi va har bir o'zgarishning Audit loglari.

---

## 2. 🧱 LOYIHA TUZILISHI (MODULAR MONOLITH)

```text
avtohub/
│
├── config/
│   ├── settings/
│   │   ├── __init__.py
│   │   ├── base.py
│   │   ├── development.py
│   │   └── production.py
│   ├── urls.py
│   ├── asgi.py
│   └── wsgi.py
│
├── apps/
│   ├── accounts/          # Custom User, rollar, profil, RBAC, telefon OTP
│   ├── vehicles/          # Markalar, modellar, avlodlar, modifikatsiyalar, VIN
│   ├── marketplace/       # E'lonlar (Listings), statuslar, VIP/Featured, saqlanganlar
│   ├── dealers/           # Dilerlik markazlari, filiallar, xodimlar
│   ├── crm/               # Diler CRM: Mijozlar, Leadlar, Funnel, Test Drive
│   ├── services/          # Avtoservislar, xizmatlar, Service CRM & Booking
│   ├── parts/             # Ehtiyot qismlar katalogi, kategoriyalar, moslik (compatibility)
│   ├── inventory/         # Omborlar, qoldiqlar (stock), harakatlar (IN/OUT/RETURN)
│   ├── pos/               # POS kassa, kassa buyurtmalari, cheklar
│   ├── orders/            # Universal buyurtmalar, savat (cart), yetkazib berish
│   ├── payments/          # To'lov abstraksiyasi, tranzaksiyalar, provayder adapterlari
│   ├── finance/           # Avtokredit arizalari, bank integratsiyasi
│   ├── insurance/         # Sug'urta mahsulotlari va arizalari
│   ├── chat/              # Realtime WebSocket chat (Channels)
│   ├── notifications/     # Multi-kanal bildirishnomalar (Web, SMS, Push, Telegram)
│   ├── reviews/           # Sharhlar va baholash (faqat real tranzaksiyadan so'ng)
│   ├── moderation/        # E'lonlar va kontent moderatsiyasi, shikoyatlar (reports)
│   ├── verification/      # Sotuvchi, diler va avtomobil hujjatlari verifikatsiyasi
│   ├── ai/                # AI Vision (marka/model match), narx tahlili, tavsif generatsiyasi
│   ├── subscriptions/     # Diler va sotuvchi tarif rejalari (Free/Pro/Business)
│   ├── analytics/         # Hodisalar (event tracking), savdo va konversiya analitikasi
│   └── audit/             # Tizim harakatlari jurnali (AuditLog)
│
├── common/
│   ├── permissions/       # Rollar va obyekt darajasidagi huquqlar
│   ├── exceptions/        # Maxsus xatoliklar va custom exception handler
│   ├── pagination/        # Standart pagination format
│   ├── responses/         # Yagona API Response wrapper (`success`, `data`, `errors`)
│   ├── utils/             # Yordamchi vositalar, slugify, generatorlar
│   └── storage/           # S3 storage, fayl validatorlari
│
├── requirements/
│   ├── base.txt
│   ├── local.txt
│   └── production.txt
│
├── docker/
│   ├── Dockerfile
│   ├── nginx/
│   └── entrypoint.sh
│
├── docker-compose.yml
├── manage.py
└── .env.example
```

---

## 3. 👥 FOYDALANUVCHILAR VA ROLLARI (RBAC)

**Rollar:**
- `USER` (Oddiy xaridor / jismoniy shaxs sotuvchi)
- `DEALER` (Avtosalon egasi)
- `SERVICE_OWNER` (Avtoservis markazi egasi)
- `PARTS_SELLER` (Ehtiyot qismlar do'koni egasi)
- `EMPLOYEE` (Diler yoki servis xodimi / sotuvchi / usta)
- `ACCOUNTANT` (Buxgalter / Kassa xodimi)
- `MANAGER` (Menejer / CRM operatori)
- `MODERATOR` (E'lonlar va kontent moderatori)
- `ADMIN` (Tizim administratori)
- `SUPER_ADMIN` (Platforma boshqaruvchisi)

---

## 4. 🚀 ISH BOSQICHLARI (ROADMAP)

- [ ] **Phase 1: Core Foundation & Infrastructure**
  - Docker & Docker Compose (Django, PostgreSQL, Redis, Celery)
  - Django konfiguratsiyasi (Split settings, API versioning `/api/v1/`)
  - Standart API Response & Exception Handler
  - `accounts`: Custom User, JWT + OTP Auth, Rollar va Ruxsatlar
  - `vehicles`: Brand, Model, Generation, Modification, Vehicle ma'lumotlar bazasi
  - `marketplace`: Listings, rasmlar, status mashinasi (Draft -> Active -> Sold)
  - `moderation` & `audit`: AuditLog signallari, moderatsiya navbati

- [ ] **Phase 2: Seller & Dealer Ecosystem, CRM**
  - `dealers`: Avtosalonlar, xodimlar, filiallar
  - `verification`: Sotuvchi va diler verifikatsiyasi (passport, guvohnoma)
  - `crm`: Dealer CRM (Customers, Leads, Test Drive, Funnel)
  - `chat`: Realtime WebSocket chat (Channels)
  - `reviews`: Baholash tizimi

- [ ] **Phase 3: Service CRM & Parts Marketplace & POS**
  - `services`: Avtoservislar, xizmat turlari, masterlar, vaqt slotlari
  - `parts`: Ehtiyot qismlar katalogi, avtomobil mosligi (compatibility matrix)
  - `inventory`: Ombor boshqaruvi, qoldiqlar (Stock IN/OUT/RETURN)
  - `pos`: POS kassa terminali, cheklar va kvitansiyalar
  - `orders` & `payments`: Savat, buyurtmalar, to'lov adapterlari

- [ ] **Phase 4: Finance, Insurance & AI Integration**
  - `finance`: Avtokredit kalkulyatori va bank integratsiya arizalari
  - `insurance`: KASKO / OSAGO sug'urta mahsulotlari
  - `ai`: AI Vision tekshiruvi (Cobalt e'loni + BMW rasmi = REJECT), bozor narxini baholash

- [ ] **Phase 5: Super Admin Dashboard, Analytics, Production Hardening**
  - `analytics`: Event tracking, biznes metrikalar, konversiyalar
  - `notifications`: Celery orqali SMS/Push/Telegram xabarnomalar
  - Xavfsizlik, Rate limiting, Celery Beat davriy vazifalari
  - Production deployment (Nginx, SSL, Gunicorn/Uvicorn, S3)

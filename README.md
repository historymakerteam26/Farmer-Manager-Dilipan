# 🐄 Farmer Manager CRM - Full-Stack Dairy Cattle & AI Management

A production-ready, full-stack **Farmer Management CRM** built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, and **MongoDB Atlas**. Designed specifically for dairy cooperatives, artificial inseminators, veterinary field officers, and dairy farmers to track cattle artificial insemination (AI), heat checks, pregnancy diagnosis (PD), and calving records.

---

## 🌟 Key Highlights & Features

- **🌾 Agricultural SaaS Design System**: High-contrast, mobile-first design with dark green primary branding (`#166534`), light green highlights (`#DCFCE7`), Inter typography, and responsive drawer navigation.
- **🔐 Role-Based Access Control (RBAC)**:
  - **Admin**: Complete CRUD control, delete protections, database JSON backup/restore, activity audit trail.
  - **Staff**: Fast field registration for farmers, cow AI logging, follow-up tracking, and diagnosis updates.
- **📊 Real-time MongoDB Dashboard**: 6 key operational metrics and dynamic analytics charts (monthly insemination trends, village cluster distribution, PD positive/negative breakdown, and calving counts) computed via real-time MongoDB aggregation pipelines.
- **🐄 Cow AI & Pedigree Tracking**: Tracks cow ear tags, breeds, semen source, bull pedigree, and straw batch codes.
- **⏰ Automated Biological Schedules**:
  - Automatically computes **Heat Check Date** (21 days post-AI).
  - Automatically schedules **Pregnancy Diagnosis (PD) Date** (90 days post-AI).
  - Dynamic **Overdue vs Today vs Upcoming** calculation in Indian Standard Time (`Asia/Kolkata`).
  - Completed records (Pregnant / Not Pregnant) are cleanly excluded from overdue queues.
- **📸 Flexible Photo Uploading**: Integrated Cloudinary support with instant local DataURL fallback. Works with direct mobile camera capture.
- **📑 Excel & CSV Exports**: Formatted Excel export generated using **ExcelJS** with custom branding, color fills, and column widths, plus full CSV streaming.
- **💾 Admin Disaster Recovery**: Full database JSON snapshot download and safe restore with schema validation and confirmation dialogs.

---

## 🏗️ Technology Stack

| Layer | Technologies |
|---|---|
| **Framework** | Next.js 14 (App Router, Server Actions, Route Handlers) |
| **Language** | TypeScript (Strict Mode) |
| **Styling** | Tailwind CSS, Lucide React Icons |
| **Charts** | Recharts (Responsive bar, line, and donut charts) |
| **Database** | MongoDB Atlas with Mongoose ODM (Connection caching) |
| **Auth** | JWT in HTTP-Only Cookies, bcryptjs password hashing |
| **Storage** | Cloudinary API with fallback for mobile camera uploads |
| **Reports** | ExcelJS (custom XLSX styling) & CSV |
| **Timezone** | `Asia/Kolkata` (Indian Standard Time, `DD-MM-YYYY`) |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18.17+ or v20+ (tested on Node v24)
- **MongoDB Atlas** cluster or local MongoDB instance

### 2. Environment Variables Setup
Copy `.env.example` to `.env.local` and configure your credentials:

```bash
cp .env.example .env.local
```

Example `.env.local`:
```env
# MongoDB Atlas Connection URI
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.wrxmnvi.mongodb.net/farmer_crm?retryWrites=true&w=majority

# JWT Secret for Session & Tokens
JWT_SECRET=farmer_crm_jwt_secret_super_secure_key_2025_9999

# Public App Name
NEXT_PUBLIC_APP_NAME=Farmer Manager CRM

# Cloudinary (Optional - local preview/base64 fallback is enabled if left blank)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Seed the Database
Populate the database with default administrator accounts, field staff, sample Indian dairy farmers, cattle, and AI records:

```bash
npm run seed
```

*Alternatively, click **"Reset & Seed Sample Indian Dairy Data"** directly on the Login page or in Settings!*

### 5. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your mobile or desktop browser.

---

## 🔑 Default Credentials

| Role | Username / Identifier | Password | Access Privileges |
|---|---|---|---|
| **Admin** | `@admin` (or `admin@farmer.com`) | `admin4321` | Full access, Delete Farmer, Backup/Restore JSON, Reports |
| **Staff** | `staff@farmer.com` | `staff123` | Farmer registration, AI records, Follow-up updating |

---

## 📁 Project Architecture

```
farmer-crm/
├── scripts/
│   └── seed.mjs               # Standalone database seeder script
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/          # Login, Logout, Session verification
│   │   │   ├── farmers/       # CRUD endpoints for farmers
│   │   │   ├── ai-records/    # Insemination records & advanced filters
│   │   │   ├── follow-ups/    # Dedicated PD & heat check updates
│   │   │   ├── reports/       # ExcelJS and CSV export handlers
│   │   │   ├── backup/        # Full JSON database backup and restore
│   │   │   └── upload/        # Cloudinary image uploader
│   │   ├── login/             # Login page with demo buttons
│   │   ├── dashboard/         # Real-time analytics, cards & charts
│   │   ├── farmers/           # Directory, new farmer, profile, edit
│   │   ├── ai-records/        # Registry, record details, new AI entry
│   │   ├── follow-ups/        # Dedicated urgent/overdue action tracker
│   │   ├── reports/           # Excel and CSV export dashboard
│   │   ├── backup/            # Admin disaster recovery center
│   │   ├── settings/          # System configuration & session info
│   │   ├── globals.css        # Tailwind styles & theme variables
│   │   └── layout.tsx         # Root responsive HTML layout
│   ├── components/
│   │   ├── layout/            # Sidebar, Navbar, and AppLayout wrappers
│   │   ├── common/            # Toast, ConfirmationDialog, ImageUploader, StatusBadge
│   │   ├── dashboard/         # StatCard and metric widgets
│   │   ├── farmers/           # FarmerForm
│   │   ├── ai-records/        # AIRecordForm
│   │   └── follow-ups/        # Fast FollowUpModal
│   ├── lib/
│   │   ├── mongodb.ts         # Cached MongoDB connection pool
│   │   ├── auth.ts            # JWT signing, cookie parsing, server RBAC
│   │   ├── utils.ts           # Indian date formatting (DD-MM-YYYY, Asia/Kolkata)
│   │   ├── activity-logger.ts # Live system audit trail logger
│   │   ├── id-generator.ts    # Sequential unique ID generators
│   │   └── cloudinary.ts      # Cloudinary upload handler
│   ├── models/                # Mongoose schemas: User, Farmer, AIRecord, ActivityLog
│   └── types/                 # Strict TypeScript interfaces
```

---

## 🗄️ Database Models & Indexes

### 1. `Farmer`
- `farmerId`: Unique indexed string (`FRM-YYMM-XXX-RAND`)
- `name`, `mobile`, `village`: Indexed for fast search
- `address`, `notes`, `photoUrl`
- `isDeleted`: Soft deletion flag protecting historical AI references

### 2. `AIRecord`
- `aiRecordId`: Unique indexed string (`AI-YYMM-XXX-RAND`)
- `farmerId`: MongoDB ObjectId reference to `Farmer`
- `cowName`, `cowId` (Ear Tag), `cowBreed`, `cowPhotoUrl`
- `aiDate`: Insemination date
- `semenBreed`, `bullName`, `strawCode`
- `heatCheckDate`, `heatResult` (`Not Checked`, `Heat Detected`, `No Heat`, `Recheck Required`)
- `pdDate`, `pdStatus` (`Pending`, `Pregnant`, `Not Pregnant`, `Recheck Required`, `Failed`)
- `calvingDate`, `calfPhotoUrl`, `remarks`

### 3. `ActivityLog`
- Audit log recording every login, farmer registration, record creation, update, and database restore.

---

## 🌐 API Endpoints Reference

### Authentication
- `POST /api/auth/login` – Authenticate with email/password, sets HTTP-only JWT cookie
- `POST /api/auth/logout` – Clear session cookie
- `GET /api/auth/me` – Current authenticated user details

### Farmers
- `GET /api/farmers` – Query farmers with search, village filter, pagination, and AI counts
- `POST /api/farmers` – Register farmer (validates 10-digit mobile, checks duplicates)
- `GET /api/farmers/:id` – Farmer profile with full cow insemination history
- `PUT /api/farmers/:id` – Update farmer information
- `DELETE /api/farmers/:id` – Admin safe soft-deletion (preserves cow records)

### AI Records
- `GET /api/ai-records` – Search by cow, tag, farmer, straw code; filters by village, dates, PD status
- `POST /api/ai-records` – Create AI record, auto-calculates heat check (Day 21) & PD date (Day 90)
- `GET /api/ai-records/:id` – Full record details with breeding progress timeline
- `PUT /api/ai-records/:id` – Update AI record
- `DELETE /api/ai-records/:id` – Admin delete record

### Follow-ups
- `GET /api/follow-ups` – Filter queues by `overdue`, `today`, `upcoming`, `pending`, `completed`
- `PUT /api/follow-ups/:id` – Fast update of PD result, heat check, calving, and remarks

### Reports & Backup
- `GET /api/reports/dashboard` – Aggregation data for 6 metric cards and 4 charts
- `GET /api/reports/farmers?format=csv` – Export farmer roster
- `GET /api/reports/ai-records?format=excel|csv` – ExcelJS styled `.xlsx` or CSV download
- `GET /api/backup/export` – Admin database JSON download
- `POST /api/backup/restore` – Admin JSON backup upload and safe restore

---

## 🚢 Deployment Instructions

### Vercel Deployment (Recommended)
1. Push this repository to GitHub.
2. Import the repository in [Vercel](https://vercel.com).
3. Under **Project Settings > Environment Variables**, add:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `NEXT_PUBLIC_APP_NAME`
   - (Optional) `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
4. Click **Deploy**. Vercel will build the Next.js App Router application automatically.

### Production Build & Local Start
```bash
npm run build
npm run start
```

---

## 📄 License
MIT License. Built for dairy farmers and veterinary field workers.

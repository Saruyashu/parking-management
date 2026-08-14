# Parking Management System

Full-stack parking lot management system for Indian parking lot owners. Built as a monorepo with three apps:

```
parking-management/
├── mobile/   React Native (Expo) mobile app for attendants/owner
├── web/      React (Vite + Tailwind) admin dashboard for the owner
└── backend/  Express + Prisma + PostgreSQL REST API
```

## Quick Start

### 1. Database

PostgreSQL 15+ is required. Using Homebrew on macOS:

```bash
brew services start postgresql@16
createdb parking_management
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env DATABASE_URL to match your local Postgres user:
#   postgresql://<your-user>@localhost:5432/parking_management?schema=public

npm install
npx prisma migrate dev   # creates schema
npm run db:seed          # seeds sample data
npm run dev              # starts on http://localhost:3000
```

### 3. Web Dashboard

```bash
cd web
npm install
npm run dev              # starts on http://localhost:3001 (proxies /api to :3000)
```

### 4. Mobile App

```bash
cd mobile/ParkingOwner
npm install
npx expo run:ios         # or: npx expo start
```

## Seed Data

Default login: `owner@example.com` / `owner123`

The seed creates a realistic Andheri West parking lot:
- **120 slots**: 80 four-wheeler, 30 two-wheeler, 8 EV (with chargers), 2 handicapped
- **Pricing** (in paise): 4W ₹40/hr ₹200/day ₹3,000/mo, 2W ₹20/hr ₹80/day ₹1,200/mo, EV ₹50/hr ₹4,000/mo
- **Staff**: 6 members (security, attendants, supervisor, cashier, cleaner)
- **Customers**: 5 with monthly passes (2 expiring soon)
- **Expenses**: ~₹48,400 monthly across utilities, wages, rent, maintenance
- **Vendors, assets, budgets, documents**: populated

## Architecture

### Backend (`backend/`)
- **Express** REST API with JWT auth (owner/supervisor/attendant roles)
- **Prisma ORM** with PostgreSQL
- **Modules**: auth, users, slots, vehicles (entry/exit billing), expenses (with approval workflow), staff + attendance + payroll, customers + monthly passes, assets + maintenance, vendors + purchase orders, reports, dashboard
- Money stored as **integers in paise**; GST computed at billing
- Security: helmet, CORS, rate limiting, zod validation, audit logging
- Payments: Razorpay integration (configure keys in `.env`)

### Web (`web/`)
- **Vite + React + TypeScript + Tailwind** admin dashboard
- **Redux Toolkit** state + **Recharts** for reports
- Pages: Login, Overview, Expenses, Revenue, Staff, Customers, Reports
- Dark-first design: `#0D0D0D` ink / `#161616` surface / `#C8A97E` brass accent
- Fonts: DM Serif Display (numbers), DM Sans (body), JetBrains Mono (amounts)
- Indian number formatting (₹1,48,200)

### Mobile (`mobile/ParkingOwner/`)
- **Expo + React Native + TypeScript**
- **React Navigation** bottom tabs: Home, Expenses, Vehicles, Staff, Approvals, Reports
- **Redux Toolkit** + axios API client
- Vehicle entry/exit with live slot selection and billing
- Expense creation + approval flows

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login (JWT) |
| GET | `/api/dashboard/overview` | Today's revenue, occupancy, alerts |
| GET | `/api/slots` | Slot listing with zone/filter |
| POST | `/api/vehicles/entry` | Log vehicle entry |
| POST | `/api/vehicles/exit/:id` | Process exit + billing |
| GET/POST | `/api/expenses` | Expense list/create |
| PATCH | `/api/expenses/:id/approve` | Approve expense (owner) |
| GET | `/api/staff` | Staff list |
| GET | `/api/staff/attendance/today` | Today's attendance |
| GET | `/api/customers` | Monthly passes |
| GET | `/api/payroll/batch` | Payroll batch |
| GET | `/api/reports/monthly` | Monthly report |
| GET | `/api/assets` | Assets with service schedule |

## Docker

A `docker-compose.yml` is provided for Postgres, Redis, backend, and web. Start Docker Desktop first, then:

```bash
docker compose up -d
```

## Environment Notes

- The mobile app points at `http://localhost:3000/api`. For a physical device, change `API_BASE_URL` in `mobile/ParkingOwner/src/services/api.ts` to your machine's LAN IP.
- Razorpay, Firebase, Twilio, SendGrid are optional integrations; the app runs without their keys.

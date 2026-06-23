# 🛕 Kailash Mahadev Temple — Digital Platform

A full-stack **Temple ERP System** built as a Progressive Web App (PWA) for **Kailash Mahadev Mandir, Agra**. Serves as both a responsive website and an installable mobile app with native-like experience for devotees, priests, and administrators.

🔗 **Live:** [kailashmahadev.in](https://kailashmahadev.in)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Modules](#modules)
- [Authentication & Roles](#authentication--roles)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Schema](#database-schema)
- [Edge Functions](#edge-functions)
- [PWA & Mobile](#pwa--mobile)
- [Internationalization](#internationalization)
- [Performance](#performance)
- [Deployment](#deployment)

---

## Overview

This application digitizes all operations of a Hindu temple, providing:

- **Public Portal** — Darshan timings, live streaming, event calendar, photo gallery, online donations, and puja booking.
- **Devotee Dashboard** — Booking history, donation receipts, favorite pujas, and profile management.
- **Priest Panel** — Assigned puja schedule, temple notices, and profile.
- **Admin Panel** — Full ERP with user management, priest management, puja catalog, event & gallery management, inventory tracking, notice board, donation oversight, audit logging, and system settings.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Client (Browser / PWA)             │
│                                                      │
│  React 18 + TypeScript + Vite                        │
│  ┌────────────┐ ┌────────────┐ ┌──────────────────┐ │
│  │ Public Site │ │ Dashboards │ │ Admin Panel      │ │
│  │ (6 pages)  │ │ (User/     │ │ (12 sub-modules) │ │
│  │            │ │  Priest)   │ │                  │ │
│  └────────────┘ └────────────┘ └──────────────────┘ │
│         │              │              │              │
│         └──────────────┼──────────────┘              │
│                        │                             │
│              React Router v6 (nested)                │
│              TanStack React Query (cache)            │
└────────────────────────┼─────────────────────────────┘
                         │ HTTPS
┌────────────────────────┼─────────────────────────────┐
│                      Supabase                         │
│                        │                             │
│  ┌──────────┐ ┌────────┴───────┐ ┌────────────────┐ │
│  │ Auth     │ │ PostgreSQL DB  │ │ Edge Functions  │ │
│  │ (email)  │ │ (14 tables)    │ │ (11 functions)  │ │
│  └──────────┘ └────────────────┘ └────────────────┘ │
│                                                      │
│  ┌──────────┐ ┌────────────────┐ ┌────────────────┐ │
│  │ Storage  │ │ Row-Level      │ │ Realtime       │ │
│  │ (files)  │ │ Security (RLS) │ │ (subscriptions)│ │
│  └──────────┘ └────────────────┘ └────────────────┘ │
└──────────────────────────────────────────────────────┘
```

### Routing Architecture

| Path | Layout | Access |
|------|--------|--------|
| `/` `/about` `/gallery` `/contact` `/darshan-timings` `/live-darshan` `/donate` `/pujas` `/events` | Public (Header + Footer + Bottom Nav) | Everyone |
| `/dashboard/*` | UserLayout (Sidebar + Topbar) | Authenticated users |
| `/priest/*` | PriestLayout (Sidebar + Topbar) | Priests & Admins |
| `/admin/*` | AdminLayout (Sidebar + Topbar) | Admins & Super Admin |
| `/auth` `/reset-password` | Minimal | Unauthenticated |

---

## Technology Stack

| Category | Technology | Purpose |
|----------|-----------|---------|
| **UI Framework** | React 18 | Component-based UI |
| **Language** | TypeScript | Type safety |
| **Build Tool** | Vite 5 | Fast HMR & bundling |
| **Styling** | Tailwind CSS 3 | Utility-first CSS |
| **Components** | shadcn/ui | Accessible UI primitives |
| **Routing** | React Router v6 | Nested route layouts |
| **Server State** | TanStack React Query v5 | Caching, refetching, pagination |
| **Forms** | React Hook Form + Zod | Validation & type-safe forms |
| **Backend** | Supabase | Auth, DB, Edge Functions, Storage |
| **Payments** | Razorpay | Donation & puja payment processing |
| **Live Video** | HLS.js | Adaptive bitrate live streaming |
| **Charts** | Recharts | Admin analytics & dashboards |
| **PDF** | jsPDF | Donation & booking receipts |
| **QR Codes** | qrcode.react | UPI donation QR generation |
| **Carousel** | Embla Carousel | Swipeable mobile card sections |
| **Theming** | next-themes | Dark / light mode toggle |
| **Notifications** | Sonner | Toast notifications |
| **i18n** | Custom context | English ↔ Hindi bilingual |

---

## Project Structure

```
src/
├── assets/                  # Static images & icons
├── components/
│   ├── ui/                  # shadcn/ui primitives (40+ components)
│   ├── admin/               # Admin-specific components
│   ├── layouts/             # AdminLayout, UserLayout, PriestLayout
│   ├── Header.tsx           # Public site header
│   ├── Footer.tsx           # Public site footer
│   ├── MobileBottomNav.tsx  # Bottom tab navigation (mobile)
│   ├── MobileHomeCards.tsx  # Swipeable home cards (mobile)
│   ├── Hero.tsx             # Landing hero section
│   └── ...                  # 50+ feature components
├── contexts/
│   ├── AuthContext.tsx       # Authentication state
│   └── LanguageContext.tsx   # i18n provider
├── hooks/
│   ├── useUserRole.ts       # Role-based access
│   ├── useAdminCheck.ts     # Admin verification
│   ├── useBookingEmail.ts   # Booking email trigger
│   └── ...                  # Custom hooks
├── pages/
│   ├── Index.tsx            # Home page
│   ├── Auth.tsx             # Login / Sign up
│   ├── admin/               # 12 admin sub-pages
│   ├── priest/              # 3 priest sub-pages
│   └── user/                # 5 user sub-pages
├── translations/
│   ├── en.ts                # English strings
│   └── hi.ts                # Hindi strings
├── integrations/supabase/
│   ├── client.ts            # Auto-generated client
│   └── types.ts             # Auto-generated DB types
├── lib/
│   ├── utils.ts             # Utility functions
│   ├── generateReceipt.ts   # PDF receipt generator
│   └── exportCsv.ts         # CSV export helper
├── App.tsx                  # Root with lazy-loaded routes
├── main.tsx                 # Entry point
└── index.css                # Design system tokens

supabase/
├── config.toml              # Edge function config
└── functions/
    ├── create-donation-order/
    ├── verify-donation-payment/
    ├── create-razorpay-order/
    ├── verify-razorpay-payment/
    ├── send-booking-email/
    ├── send-booking-reminders/
    ├── create-priest/
    ├── delete-user/
    ├── seed-super-admin/
    └── toggle-live-stream/
```

---

## Modules

### 🌐 Public Site

| Module | Page | Description |
|--------|------|-------------|
| **Home** | `/` | Hero, featured pujas carousel, upcoming events, gallery preview, mobile cards |
| **About** | `/about` | Temple history timeline, priest info, daily rituals, trust details |
| **Darshan Timings** | `/darshan-timings` | Weekly schedule with day-wise slots, next aarti countdown |
| **Live Darshan** | `/live-darshan` | HLS live stream player with viewer count |
| **Gallery** | `/gallery` | Categorized photo grid with lightbox |
| **Events** | `/events` | Upcoming & past events calendar |
| **Pujas** | `/pujas` | Puja catalog with booking dialog, Razorpay payment |
| **Donations** | `/donate` | Tiered donations with UPI QR and Razorpay |
| **Contact** | `/contact` | Contact form, map, temple address |
| **Notice Board** | `/notices` | Active temple announcements |

### 👤 User Dashboard (`/dashboard/*`)

| Module | Description |
|--------|-------------|
| **Home** | Quick stats, recent bookings, upcoming events |
| **Bookings** | Puja booking history, cancel/reschedule, download receipts |
| **Donations** | Donation history with receipt download |
| **Favorites** | Saved/favorite pujas |
| **Profile** | Edit name, phone, avatar; change password; security settings |

### 🙏 Priest Panel (`/priest/*`)

| Module | Description |
|--------|-------------|
| **Dashboard** | Assigned pujas, upcoming schedule |
| **Notices** | Temple-wide announcements |
| **Profile** | Personal profile management |

### ⚙️ Admin Panel (`/admin/*`)

| Module | Description |
|--------|-------------|
| **Dashboard** | KPI cards, charts, recent activity |
| **Users** | User list, role management *(Super Admin only)* |
| **Priests** | Add/manage priests, assign to bookings |
| **Pujas** | CRUD puja catalog |
| **Bookings** | All bookings, assign priests, update status |
| **Events** | Create/edit temple events |
| **Gallery** | Upload/manage gallery photos |
| **Notices** | Publish/expire announcements |
| **Donations** | View all donations, export CSV |
| **Inventory** | Pooja samagri stock tracking |
| **Profile** | Admin profile with audit logging |
| **Settings** | System configuration *(Super Admin only)* |

---

## Authentication & Roles

The system uses **email-based authentication** with email verification required before sign-in.

### Role Hierarchy

```
super_admin  →  Full system access, user role management
admin        →  All admin modules except Users & Settings
priest       →  Priest dashboard, notices, profile
user         →  User dashboard, bookings, donations
(anonymous)  →  Public pages only
```

Roles are stored in a dedicated `user_roles` table (never on the profiles table) with a `has_role()` security definer function to prevent RLS recursion.

### Password Reset Flow
- Forgot password link on login page
- Email-based reset with secure token
- Password change available in profile settings

---

## Getting Started

### Prerequisites
- Node.js 18+ & npm

### Local Development

```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:8080`.

### Running Tests

```bash
npm test
```

---

## Environment Variables

The project reads Supabase credentials from environment variables. For local development, copy `.env.example` to `.env` and replace the placeholder values with your own Supabase project settings.

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase API URL for the frontend |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon public key |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon public key alternate name |
| `VITE_SUPABASE_PROJECT_ID` | Supabase project identifier |
| `SUPABASE_URL` | Supabase API URL for server functions |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase anon public key for server functions |
| `SUPABASE_ANON_KEY` | Supabase anon key for server functions |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key for secure admin operations |
| `SUPABASE_DB_URL` | Supabase Postgres URL used by server-side scripts |
| `AI_API_URL` | AI provider endpoint used by Supabase AI functions |
| `AI_API_KEY` | AI provider API key used by Supabase AI functions |
| `RAZORPAY_KEY_ID` | Razorpay key ID used for payment verification |
| `RAZORPAY_KEY_SECRET` | Razorpay secret used for payment verification |
| `RESEND_API_KEY` | Resend API key used for transactional emails |

> ⚠️ Keep `.env` private. Do not commit your real keys to Git.

If your hosting platform auto-configures environment variables, use that setup. Otherwise, create a custom `.env` from `.env.example` with your Supabase project values.

---

## Database Schema

### Tables (14)

| Table | Purpose |
|-------|---------|
| `profiles` | User profile data (name, phone, avatar) |
| `user_roles` | Role assignments (admin, priest, user, super_admin) |
| `pujas` | Puja catalog (name, price, duration, category) |
| `puja_bookings` | Booking records with payment & priest assignment |
| `donations` | Donation records with payment status |
| `events` | Temple events with dates & descriptions |
| `gallery_photos` | Photo gallery with categories & ordering |
| `notices` | Announcements with priority & expiry |
| `darshan_schedule` | Weekly darshan time slots |
| `live_stream_settings` | Live stream URL & status |
| `pooja_samagri` | Inventory items with stock tracking |
| `favorite_pujas` | User's saved pujas |
| `role_change_requests` | Admin role change audit trail |
| `audit_log` | System-wide audit events |

### Security Functions

| Function | Purpose |
|----------|---------|
| `has_role(_user_id, _role)` | Check user role (SECURITY DEFINER) |
| `get_user_role(_user_id)` | Get user's current role |
| `log_audit_event(...)` | Record audit trail entry |
| `reassign_super_admin(...)` | Transfer super admin role |

---

## Edge Functions

| Function | Trigger | Purpose |
|----------|---------|---------|
| `create-razorpay-order` | Puja booking | Create Razorpay payment order |
| `verify-razorpay-payment` | Payment callback | Verify & confirm puja payment |
| `create-donation-order` | Donation | Create donation payment order |
| `verify-donation-payment` | Payment callback | Verify & confirm donation |
| `send-booking-email` | Booking confirmed | Email confirmation to devotee |
| `send-booking-reminders` | Scheduled (cron) | Upcoming puja reminders |
| `create-priest` | Admin action | Create priest user account |
| `delete-user` | Admin action | Remove user account |
| `seed-super-admin` | Setup | Initialize first super admin |
| `toggle-live-stream` | Admin action | Start/stop live darshan |

---

## PWA & Mobile

The app is a **Progressive Web App** installable on Android and iOS:

- **Web App Manifest** — `public/manifest.json` with icons & theme color
- **Install Banner** — Smart banner prompts mobile users to install
- **Bottom Tab Navigation** — Native-like tab bar on mobile (Home, Darshan, Pujas, Account)
- **Swipeable Carousels** — Auto-playing card carousels for featured pujas, events, and gallery
- **Touch-Optimized** — 48px+ touch targets, card-based layouts, large fonts on mobile
- **Offline Support** — Service worker caching for static assets

---

## Internationalization

The app supports **English** and **Hindi** with instant switching:

- Language context provider (`LanguageContext.tsx`)
- Translation files in `src/translations/` (`en.ts`, `hi.ts`)
- Floating language toggle button on all public pages

---

## Performance

### Optimizations Applied

- **Route-level code splitting** — `React.lazy()` for all routes
- **Selective column queries** — Only fetch needed columns from database
- **React Query caching** — 5-minute stale time, 10-minute garbage collection
- **Image lazy loading** — Native `loading="lazy"` on all images
- **Auto-play carousels** — Pause on interaction, resume on release

---

## Deployment

### Deployment

Deploy this project using your chosen hosting provider. If you are using Supabase for the backend, make sure your environment variables are set and your frontend build is published to a static host.

### Custom Domain

Connect your custom domain through your hosting provider or deployment platform settings.

---

## License

Private — All rights reserved. Built for Kailash Mahadev Mandir, Agra.

---

<p align="center">
  <strong>🙏 हर हर महादेव 🙏</strong><br/>
  <em>Built for Kailash Mahadev Mandir, Agra</em>
</p>

# TechRescue Digital Menu — Production QR Digital Menu SaaS

A production-minded, multi-tenant QR Digital Menu SaaS platform owned and operated by **TechRescue** ([techrescue.in](https://techrescue.in)).

TechRescue Digital Menu helps restaurants, cafes, food trucks, and family dining rooms eliminate paper menu printing costs, manage food items and live prices, and serve contactless digital menus instantly via scannable QR codes.

---

## 1. Key Features

- **Public Restaurant Menus (`/menu/:slug`)**:
  - Unique shareable URL per restaurant (e.g. `menu.techrescue.in/menu/cafe-raj`).
  - Mobile-first, fast-loading interface with zero app installs required for diners.
  - Sticky category navigation, live dish search, high-res photos, and detailed descriptions.
  - Real-time pricing in local currency (defaults to INR ₹), promotional discount pricing with strikethroughs.
  - FSSAI dietary badges: Vegetarian (green dot), Non-Vegetarian (red triangle), Egg (amber), and Vegan (leaf).
  - Allergen transparency (Dairy, Gluten, Nuts, Shellfish, etc.).
  - Kitchen operational schedule with real-time "Open for Dining" or "Kitchen Closed" indicator.

- **Restaurant Owner Dashboard (`/dashboard`)**:
  - Secure tenant isolation powered by Supabase PostgreSQL Row Level Security (RLS).
  - **Overview**: Real-time stats on active categories, total dishes, and in-stock vs 86'd items.
  - **Restaurant Profile**: Update restaurant branding, address, reservation phone, operating hours, currency, and logo.
  - **Categories CRUD**: Create, reorder, toggle public visibility, and safely delete menu sections.
  - **Menu Items CRUD**: Real-time availability toggle (86ing), price and discount validation, chef specials, and photo uploads.
  - **QR Code & Standee Engine**: High-resolution PNG (1024px), vector SVG, and print-ready tabletop acrylic standee templates.
  - **Customer Menu Preview**: In-dashboard smartphone simulator to inspect live customer experiences.

- **Platform Administration Area (`/admin`)**:
  - Protected platform controller with server-side authorization (`platform_admins` table & SQL functions).
  - High-level telemetry: total registered outlets, published vs draft vs suspended breakdown, total platform dishes.
  - Audit directory with instant search and suspension/reactivation controls.

---

## 2. Technology Stack

- **Frontend**: React 19, TypeScript, Vite 8
- **Styling**: Tailwind CSS v4, Lucide React icons
- **Routing**: React Router 7 (`react-router-dom`)
- **Backend & Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth (Email & Password, Session persistence, Password Recovery)
- **File Storage**: Supabase Storage (`restaurant-assets` public bucket)
- **QR Code Generation**: `qrcode.react` (Canvas & SVG renderers)
- **Hosting**: Cloudflare Pages (Serverless SPA)
- **Domain**: `techrescue.in` (GoDaddy DNS)

---

## 3. Database Architecture & Migrations

All table definitions, indexes, foreign keys, triggers, helper functions, and Row Level Security policies are located in:
```
supabase/migrations/20261024000000_techrescue_digital_menu.sql
```

### Tables Overview
1. `profiles`: User account details synced automatically from `auth.users`.
2. `restaurants`: Multi-tenant restaurant profiles, URL slugs, operating hours JSONB, currency, and status (`draft`, `published`, `suspended`).
3. `restaurant_members`: Role-based access control linking owners and managers to specific restaurants.
4. `categories`: Food courses and categories with sort orders and active flags.
5. `menu_items`: Food dishes with validated pricing, dietary indicators, allergen arrays, and live availability toggles.
6. `platform_admins`: Secure server-side administrator user IDs.

---

## 4. Supabase Setup Instructions

1. **Create Project**: Go to [supabase.com](https://supabase.com) and create a new project.
2. **Execute Database Migration**:
   - Open **SQL Editor** in your Supabase dashboard.
   - Copy the entire contents of `supabase/migrations/20261024000000_techrescue_digital_menu.sql`.
   - Click **Run**.
3. **Configure Authentication**:
   - Go to **Authentication > URL Configuration**.
   - Set **Site URL** to `https://techrescue.in` (or your Cloudflare Pages URL).
   - Under **Redirect URLs**, add:
     - `https://techrescue.in/**`
     - `https://menu.techrescue.in/**`
     - `http://localhost:3000/**`
4. **Provision Platform Administrator**:
   To grant yourself super-admin access for `/admin`, run this in the Supabase SQL Editor:
   ```sql
   INSERT INTO public.platform_admins (user_id)
   VALUES ('YOUR_SUPABASE_USER_UUID');
   ```

---

## 5. Environment Configuration

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Fill in your configuration:
```env
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-public-key"
VITE_APP_URL="https://techrescue.in"
```

---

## 6. Local Development & Testing

```bash
# Install dependencies
npm install

# Run workflow automated tests
npm test

# Start local development server (Port 3000)
npm run dev

# Run TypeScript lint check
npm run lint

# Build for production
npm run build
```

---

## 7. Cloudflare Pages Deployment Guide

1. Log in to your [Cloudflare Dashboard](https://dash.cloudflare.com) and navigate to **Workers & Pages > Create application > Pages > Connect to Git**.
2. Select your GitHub repository (`restaurants`).
3. Configure build settings:
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Node.js version**: `20` or higher
4. Add Environment Variables:
   - `VITE_SUPABASE_URL`: Your Supabase URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Key
   - `VITE_APP_URL`: `https://techrescue.in` (or `https://menu.techrescue.in`)
5. Click **Save and Deploy**.
6. Under **Pages Settings > Single Page Application (SPA)**, ensure fallback is set to `/index.html` (or add a `public/_redirects` file with `/* /index.html 200`).

---

## 8. GoDaddy Custom Domain DNS Setup

To connect your domain `techrescue.in` or subdomain `menu.techrescue.in` to Cloudflare Pages:

1. In Cloudflare Pages, go to **Custom Domains > Set up a domain**.
2. Enter `techrescue.in` or `menu.techrescue.in`.
3. Log in to your **GoDaddy DNS Management Console** for `techrescue.in`.
4. Add the following DNS record:
   - **Type**: `CNAME`
   - **Name**: `@` (or `menu` for subdomain)
   - **Value**: `<your-project>.pages.dev`
   - **TTL**: 1 Hour (or Automatic)
5. Cloudflare will automatically provision a free, managed SSL/TLS certificate with automatic renewal.

---

## 9. Security & Tenant Isolation Standards

- **Zero Client Trust**: All data operations are validated at the PostgreSQL database level using Row Level Security.
- **Tenant Isolation**: Restaurant owners can only query and mutate restaurants where their `auth.uid()` has membership in `restaurant_members`.
- **Public Visibility Guard**: Draft and suspended restaurant menus return 404/Not Found to unauthorized public visitors.
- **Admin Shield**: Platform admin rights are validated via `is_admin()` SQL function against `platform_admins`, never through client-provided tokens.

---

© 2026 TechRescue. All rights reserved. Built for high performance and reliability.

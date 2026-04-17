# Azalea by Zehra — Project Guide for Claude Code

## What this project is
A full-stack Indian ethnic wear e-commerce site for a client called "Azalea by Zehra".
Built with Next.js 14 App Router, Prisma, PostgreSQL, NextAuth v5, Zustand, Tailwind CSS.
The store sells kurtis, anarkalis, co-ords, and other ethnic wear.

## Running the project
```bash
cd "C:/Users/Elite/Desktop/claude projects/zara-kurtis"
npm run dev        # runs on http://localhost:3001
```
Database: local PostgreSQL — `postgresql://postgres:1249Fsrm%40@localhost:5432/zara_kurtis`
After schema changes: `npx prisma db push` then `npx prisma generate`

## Tech stack
- **Framework**: Next.js 14 App Router (TypeScript)
- **Database**: PostgreSQL via Prisma v7. Schema at `prisma/schema.prisma`. Generated client at `src/generated/prisma` (NOT `@prisma/client` — always import from `@/lib/prisma`)
- **Auth**: NextAuth v5 (`lib/auth.ts`) — two providers: `password-credentials` (email/phone + password) and `otp-credentials` (OTP sign-in for forgot password)
- **State**: Zustand with persist middleware — `store/cartStore.ts`, `store/wishlistStore.ts`
- **Email**: Resend (`lib/resend.ts`)
- **SMS**: Twilio (`lib/twilio.ts`)
- **Payments**: Razorpay (`lib/razorpay.ts`)
- **Styling**: Tailwind CSS with custom design tokens (rose-gold, charcoal, ivory, mauve)
- **Fonts**: Playfair Display (headings), Inter (body)

## Admin panel
- URL: `/admin` — protected by NextAuth session with `role === "ADMIN"`
- Admin login: `/admin/login` — uses `password-credentials` provider, field name is `contact` (not `email`)
- Admin OTP login also works via `otp-credentials` provider
- Admin password can be set/changed at `/admin/settings`

## Authentication flow
- **Register**: `/register` — Step 1: name + email/phone + password → sends OTP. Step 2: verify OTP → calls `POST /api/auth/register-otp` → auto sign-in
- **Login**: `/login` — email/phone + password only. Forgot password sends OTP → `signIn("otp-credentials")` → direct sign-in (no password reset)
- **OTP rate limit**: max 3 per contact per 10 minutes (`lib/rateLimit.ts`)

## Key architectural decisions
- `lib/prisma.ts` exports the singleton Prisma client — always import from here
- `lib/auth.ts` exports `auth()` for server-side session — use instead of `getServerSession`
- Cart and wishlist persist to localStorage via Zustand `persist`. On sign-in, `CartSync` component merges local + server DB state
- Server-side order total recalculation — client `totalAmount` is IGNORED. Server recalculates: `subtotal + shipping - discount`
- `lib/rateLimit.ts` — in-memory rate limiter (resets on server restart). Used for OTP and promo validation
- `ProductVariant` table tracks per size+color stock. `product.stock` is kept in sync as the sum of all variants

## Folder structure (key files)
```
app/
  admin/(protected)/          ← admin pages (dashboard, products, orders, reports, settings, etc.)
  api/
    auth/register-otp/        ← OTP-verified registration endpoint
    products/route.ts         ← GET with filters (category, price, colors, sizes, fabric, sort)
    products/[id]/variants/   ← GET + PUT variant stock
    orders/route.ts           ← POST creates order (server-recalculates total)
    orders/[id]/route.ts      ← GET, PATCH (customer cancel), PUT (admin update + ship email)
    cart/route.ts             ← GET + PUT for DB cart sync
    wishlist/route.ts         ← GET + PUT for DB wishlist sync
    otp/send/route.ts         ← rate-limited OTP send
    promo/validate/route.ts   ← rate-limited promo validation
    account/addresses/route.ts ← validates 10-digit phone + 6-digit pincode
    config/store/route.ts     ← storeName, contactEmail, lowStockThreshold, adminEmail
    config/shipping/route.ts  ← shippingFee, freeShippingThreshold
    admin/csv/export/         ← CSV product export
    admin/csv/import/         ← CSV product import (bulk create/update)
components/
  admin/
    AdminSidebar.tsx          ← nav: Dashboard, Products, Orders, Reports, Customers, Categories, Promo Codes, Subscribers, Settings
    AdminProductsClient.tsx   ← variant stock grid, image reorder + alt text, CSV export/import
    AdminOrdersClient.tsx     ← order management, status update, tracking ID, print invoice/label
    AdminReportsClient.tsx    ← revenue chart, top products, status breakdown
  products/
    ProductDetailClient.tsx   ← variant-aware stock (disables OOS size/color buttons)
    FilterSidebar.tsx         ← filters: sort, price, size, color, fabric (all working)
    ProductsPageClient.tsx    ← fetches /api/products with filter params
  checkout/
    CheckoutPageClient.tsx    ← saved address selection, Zustand promo state, Razorpay
  layout/
    MainLayout.tsx            ← wraps shop, includes CartSync
    CartSync.tsx              ← merges local + server cart/wishlist on sign-in; debounce-pushes changes
  auth/
    LoginPageClient.tsx       ← login + forgot password flow
store/
  cartStore.ts                ← items, appliedPromo, setItems, addItem, removeItem, etc.
  wishlistStore.ts            ← items, setItems, addItem, removeItem, hasItem
lib/
  auth.ts                     ← NextAuth config with password-credentials + otp-credentials
  resend.ts                   ← sendOrderConfirmationEmail, sendShipmentEmail, sendLowStockAlert, sendOTPEmail
  twilio.ts                   ← sendOrderConfirmationSMS, sendShipmentSMS, sendOTPSMS
  rateLimit.ts                ← checkRateLimit(key, maxRequests, windowMs) → boolean
  prisma.ts                   ← Prisma singleton
  utils.ts                    ← formatPrice, slugify, generateOTP, cn
prisma/
  schema.prisma               ← full schema (User, Product, ProductVariant, Order, Cart, Wishlist, etc.)
types/
  index.ts                    ← all TypeScript interfaces
```

## Prisma schema summary
Models: `User`, `OTPRecord`, `Category`, `Product`, `ProductVariant`, `Cart`, `CartItem`, `Wishlist`, `Address`, `Order`, `OrderItem`, `Review`, `Settings`, `NewsletterSubscriber`, `PromoCode`

Key fields added in v2.0:
- `Product.imageAlts String[]`
- `Product.variants ProductVariant[]`
- `ProductVariant` — `@@unique([productId, size, color])`
- `Settings.lowStockThreshold Int @default(5)`
- `Settings.adminEmail String`

## What's been built (complete feature list)
### Shop
- Homepage with hero, featured products, new arrivals, newsletter signup
- Product listing page with filters (category, price, size, color, fabric, sort) — all working
- Product detail with image zoom, size/color selector (OOS variants disabled), reviews, recently viewed
- Cart drawer with promo code (persisted in Zustand)
- Checkout with saved address selection, Razorpay payment
- Order success page
- Account pages: orders, profile, saved addresses
- Wishlist page
- Login/Register with OTP verification

### Admin panel (`/admin`)
- Dashboard with stats
- Products: full CRUD, variant stock grid (size × color matrix), image reorder + alt text, CSV import/export, low stock indicator
- Orders: status management, tracking ID, shipment email/SMS trigger, print shipping label, print invoice
- Reports: revenue chart (12 months), top 5 products, orders by status breakdown
- Customers: list view
- Categories: CRUD
- Promo Codes: CRUD
- Subscribers: newsletter list
- Settings: store info, shipping fees, stock alert config, admin password change

## Things still to do / known gaps
- No proper `popular` sort (currently falls back to `createdAt desc`) — would need order count join
- No search page (search works via query param on products page)
- No COD (Cash on Delivery) payment option — only Razorpay
- CartItem in DB doesn't store `price` — sync uses `product.price` which could drift if price changes
- Settings page: `lowStockThreshold` label says "Low Stock Threshold" — min value should be validated
- No email templates for newsletter
- `product-import-template.csv` and `instagram-to-csv-prompt.md` in project root are helper files for the client to add products via CSV

## Environment variables needed (.env.local)
```
DATABASE_URL=postgresql://postgres:PASSWORD@localhost:5432/zara_kurtis
NEXTAUTH_SECRET=any-long-random-string
NEXTAUTH_URL=http://localhost:3001
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
RESEND_API_KEY=
EMAIL_FROM=orders@azaleabyzehra.com
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
NEXT_PUBLIC_RAZORPAY_KEY_ID=
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

## Coding conventions for this project
- Always import Prisma from `@/lib/prisma` — never `new PrismaClient()` directly
- Always import `auth` from `@/lib/auth` for session checks
- Admin role check: `(session?.user as { role?: string })?.role === "ADMIN"`
- Do NOT use `window.location.href` for navigation — use Next.js `router.push()` or `<Link>`
- Do NOT spread objects into `prisma.$transaction` — use sequential awaits or array of promises
- Run `npx prisma db push` after any schema change, then `npx prisma generate`
- The `category_slug` in CSV import must match an existing category slug in the DB
- `npm run build` must be run from `C:/Users/Elite/Desktop/claude projects/zara-kurtis` — not from parent folders
- Git remote: `https://github.com/faheem0704/azaleabyzehra` (branch: `master`)

## Design tokens (Tailwind)
- `rose-gold` — primary brand color (pinkish gold)
- `charcoal` / `charcoal-dark` / `charcoal-light` — dark text hierarchy
- `ivory` / `ivory-200` — light backgrounds
- `mauve` — muted secondary text
- Font classes: `font-playfair` (headings), `font-inter` (body)
- Section padding utility: `section-padding`
- Button utilities: `btn-primary`, `btn-outline`

---

## Karpathy Coding Principles

Behavioral guidelines to reduce common LLM coding mistakes.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

### 1. Think Before Coding
**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First
**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### 3. Surgical Changes
**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution
**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

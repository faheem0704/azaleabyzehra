# Azalea by Zehra — Manual Testing Checklist
> Pre-production QA sign-off. Tick every box before going live.
> Engineers: QA · Web Dev · Logic · Algorithms

---

## HOW TO USE
- [ ] = not tested
- [x] = passed
- [~] = partial / needs recheck
- Mark date and tester initials next to any failures

---

## 1. AUTHENTICATION

### 1.1 Registration
- [ ] Register with email — OTP sent to that email
- [ ] Register with phone number — OTP sent via SMS
- [ ] OTP expires / is wrong → shows error, does not register
- [ ] OTP correct → account created → auto signed-in → redirected to home
- [ ] Duplicate email registration → shows "already registered" error
- [ ] Duplicate phone registration → shows "already registered" error
- [ ] OTP rate limit: attempt 4 OTPs in 10 minutes → 4th blocked with rate-limit message
- [ ] Password minimum length enforced on register form

### 1.2 Login
- [ ] Login with email + correct password → signed in
- [ ] Login with phone + correct password → signed in
- [ ] Wrong password → error message shown, not signed in
- [ ] Non-existent account → appropriate error (not "wrong password" leaking info)
- [ ] Forgot Password → enter email/phone → OTP sent
- [ ] Forgot Password OTP correct → signed in directly (no password reset page)
- [ ] Forgot Password OTP wrong → error shown

### 1.3 Session & Logout
- [ ] Refresh page while logged in → stays logged in
- [ ] Sign out → session cleared, cart icon resets
- [ ] Accessing `/account` while logged out → redirect to login
- [ ] Accessing `/checkout` while logged out → redirect to login

---

## 2. HOMEPAGE

- [ ] Hero section loads with correct image/text
- [ ] Featured products section renders product cards
- [ ] New Arrivals section renders product cards
- [ ] Newsletter signup — enter email → success message shown
- [ ] Newsletter signup — duplicate email → appropriate message (no crash)
- [ ] All navigation links in header go to correct pages
- [ ] Mobile hamburger menu opens/closes correctly
- [ ] Search bar opens on click; pressing Enter or clicking search icon goes to `/products?search=…`
- [ ] Search does NOT use `window.location.href` (should use Next.js router — no full page reload)

---

## 3. PRODUCT LISTING PAGE (`/products`)

### 3.1 Display
- [ ] All products load on first visit
- [ ] Product cards show name, price, compare-at price (if set), discount badge, images
- [ ] "New" badge appears only on products marked `isNewArrival`
- [ ] "Sold Out" badge appears when `stock === 0`
- [ ] "Only N left" badge appears when `0 < stock < 5`
- [ ] Color swatches render with correct background colors
- [ ] Hovering a card shows the action bar (Quick Add / Quick View / Eye icon)

### 3.2 Filtering & Sorting
- [ ] Filter by Category → only that category's products shown
- [ ] Filter by Price range → only products within range shown
- [ ] Filter by Size → only products with that size shown
- [ ] Filter by Color → only products with that color shown
- [ ] Filter by Fabric → only products with that fabric shown
- [ ] Sort by "Price: Low to High" → correct order
- [ ] Sort by "Price: High to Low" → correct order
- [ ] Sort by "Newest" → most recent products first
- [ ] Combining two filters (e.g. Category + Color) → both applied simultaneously
- [ ] Clearing filters → all products return
- [ ] Search query (`?search=kurti`) → only matching products shown

### 3.3 Quick Add / Quick View
- [ ] Product with exactly 1 size AND 1 color → "Quick Add" button → adds to cart directly, cart drawer opens
- [ ] Product with multiple sizes OR multiple colors → button shows "Quick View" → opens Quick View modal (NOT silently adding an OOS variant)  ← **BUG-FIX regression**
- [ ] Sold Out product → button shows "Sold Out", is disabled
- [ ] Eye icon opens Quick View modal for any product

### 3.4 Wishlist from card
- [ ] Clicking heart on a product card → product added to wishlist, heart fills
- [ ] Clicking filled heart → product removed from wishlist
- [ ] Wishlist state persists after page refresh (Zustand persist)

---

## 4. PRODUCT DETAIL PAGE (`/products/[slug]`)

- [ ] All product images load; clicking thumbnail switches main image
- [ ] Image zoom works on hover/click
- [ ] Size buttons render; selecting a size highlights it
- [ ] Color buttons render; selecting a color highlights it
- [ ] **Out-of-stock size is disabled** (cannot be clicked) ← **BUG-FIX regression**
- [ ] **Out-of-stock color is disabled** when selected size has no stock for that color ← **BUG-FIX regression**
- [ ] For products with NO variant records, OOS state falls back to `product.stock <= 0` ← **BUG-FIX regression**
- [ ] "Add to Cart" disabled when selected size+color combination is out of stock
- [ ] "Add to Cart" with valid selection → item in cart, drawer opens
- [ ] Quantity selector cannot exceed available variant stock ← **BUG-FIX regression**
- [ ] Product description, fabric, care instructions display correctly
- [ ] Reviews section loads; logged-in user can submit a review
- [ ] "Recently Viewed" section populates after visiting multiple products
- [ ] Breadcrumb navigation works (Home → Category → Product)

---

## 5. CART

### 5.1 Cart Drawer
- [ ] Cart icon in header shows correct item count badge
- [ ] Opening cart drawer shows all added items with image, name, size, color, price
- [ ] Increasing quantity via `+` button works
- [ ] **`+` button is disabled at variant-level stock cap** (e.g. size M has 5 stock → cannot go above 5) ← **BUG-FIX regression**
- [ ] Decreasing quantity to 0 removes the item
- [ ] Trash icon removes item directly
- [ ] Cart persists after page refresh (Zustand persist)
- [ ] Cart syncs to DB after sign-in (CartSync component)

### 5.2 Promo Codes
- [ ] Enter valid promo code → discount applied, shown in totals
- [ ] Enter expired promo code → error message
- [ ] Enter promo exceeding usage limit → error message
- [ ] Promo with `minOrderAmount` → rejected when subtotal is below threshold, accepted above
- [ ] Promo with product restriction → discount applies only to eligible products
- [ ] `maxDiscount` cap → discount never exceeds the cap even on large orders
- [ ] Remove promo code (X button) → discount removed, total recalculates
- [ ] Promo code persists in cart after page refresh

### 5.3 Totals
- [ ] Subtotal = sum of (price × quantity) for all items
- [ ] Discount shown when promo applied
- [ ] "Shipping calculated at checkout" message shown in cart

---

## 6. CHECKOUT

### 6.1 Address
- [ ] Logged-in user sees saved addresses; can select one
- [ ] Selecting a saved address fills the form correctly
- [ ] New address form: all fields required → submitting empty → validation error
- [ ] Phone number validation: non-10-digit or non-Indian number → error ← **BUG-FIX regression**
- [ ] Pincode validation: non-6-digit → error ← **BUG-FIX regression**
- [ ] Valid new address → saved and used for order

### 6.2 Order Summary
- [ ] Items list matches cart
- [ ] Subtotal matches cart subtotal
- [ ] Discount matches cart promo discount
- [ ] Shipping: free when subtotal ≥ threshold (check Settings); otherwise shows fee
- [ ] Final total = subtotal + shipping − discount

### 6.3 Payment (Razorpay)
- [ ] "Pay Now" opens Razorpay modal with correct amount
- [ ] Razorpay amount = server-calculated total (NOT client-sent total) ← **SECURITY regression**
- [ ] Cancelling Razorpay modal → stays on checkout page, no order created
- [ ] Completing payment → signature verified → order creation API called
- [ ] Same Razorpay `paymentId` cannot be reused to place a second order ← **BUG-FIX regression**
- [ ] Successful order → redirected to `/order-success/[id]` page

### 6.4 Stock check at order placement
- [ ] If an item goes out of stock between adding to cart and checking out → order blocked with clear error
- [ ] **Multiple line items of same no-variant product** (e.g. size M qty 3 + size S qty 3, total stock 5) → order blocked with "only 5 left" error ← **BUG-FIX regression**
- [ ] Stock decrements correctly after successful order

---

## 7. ORDER SUCCESS & CUSTOMER ORDERS

- [ ] `/order-success/[id]` shows order ID, items, total, address
- [ ] Customer receives confirmation email after order
- [ ] Customer receives confirmation SMS after order (if phone number on account)
- [ ] `/account/orders` shows all customer orders
- [ ] Clicking an order shows detail: items, status, address, total
- [ ] Customer can cancel a PENDING or PROCESSING order
- [ ] Cancelled order → status shows "CANCELLED" in account

---

## 8. ACCOUNT PAGES

- [ ] `/account/profile` — shows name, email, phone; can edit and save
- [ ] `/account/addresses` — lists saved addresses; can add new, delete existing
- [ ] `/account/wishlist` — shows wishlisted products; clicking removes from wishlist
- [ ] All account pages redirect to login if not authenticated

---

## 9. ADMIN — LOGIN & ACCESS

- [ ] `/admin/login` with correct admin email + password → signed in to admin panel
- [ ] Wrong admin credentials → error, not signed in
- [ ] Non-admin user trying to access `/admin/*` → redirected (access denied)
- [ ] Admin session persists across page refreshes

---

## 10. ADMIN — DASHBOARD

- [ ] Stats cards show: total revenue, total orders, total products, total customers
- [ ] Numbers are correct (spot-check against known data)

---

## 11. ADMIN — PRODUCTS

- [ ] Product list loads with search and pagination
- [ ] Create new product: all fields save correctly (name, price, category, images, sizes, colors, fabric, description)
- [ ] Images upload to Cloudinary; reordering works (drag handles)
- [ ] Alt text field for each image saves correctly
- [ ] Edit existing product → changes persist
- [ ] Delete product → removed from list and shop
- [ ] **Low stock indicator** shown on products below threshold ← verify threshold from Settings
- [ ] Variant stock grid (size × color matrix): edit a cell → stock updates
- [ ] CSV export → downloads a valid CSV with all products
- [ ] CSV import → upload CSV → products created/updated correctly
- [ ] CSV import with invalid `category_slug` → shows error, does not crash

---

## 12. ADMIN — ORDERS

- [ ] Orders list loads; all orders visible (up to 200)
- [ ] Filter by status (PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED, RETURNED) works
- [ ] Filter by payment status (ALL, PENDING, PAID, FAILED, REFUNDED) works
- [ ] Filter by date range (Today, 7 days, 30 days, All) works
- [ ] Combining status + payment + date filters works correctly
- [ ] Click order row → order detail expands/opens
- [ ] Update order status (PENDING → PROCESSING → SHIPPED → DELIVERED) works
- [ ] Adding tracking ID when marking as SHIPPED → saves correctly
- [ ] **Mark as RETURNED → payment status automatically set to REFUNDED** ← **BUG-FIX regression**
- [ ] Shipment email sent to customer when status set to SHIPPED (and email exists)
- [ ] Shipment SMS sent to customer when status set to SHIPPED (and phone exists)
- [ ] **WhatsApp 1-click: Order Confirmation** → opens WhatsApp with correct pre-filled message
- [ ] **WhatsApp 1-click: Shipping Update** → only appears when tracking ID is set; opens WhatsApp
- [ ] **WhatsApp 1-click: Custom/Support** → opens WhatsApp with blank message to customer
- [ ] WhatsApp buttons correctly format 10-digit Indian numbers to +91 format
- [ ] Print Invoice → opens printable invoice with order details
- [ ] Print Shipping Label → opens printable label with address
- [ ] Admin receives new-order notification email for every order placed ← **BUG-FIX regression**

---

## 13. ADMIN — REPORTS

- [ ] Revenue chart loads showing last 12 months
- [ ] Top 5 products section shows correct products by revenue/sales
- [ ] Orders by status breakdown (pie/bar chart) reflects actual order counts
- [ ] Date range changes update the chart

---

## 14. ADMIN — CUSTOMERS

- [ ] Customer list loads with name, email, phone, join date, order count
- [ ] Deleting a customer → user, addresses anonymized but orders preserved (not hard-deleted)
- [ ] Deleted user cannot log in with old credentials

---

## 15. ADMIN — CATEGORIES

- [ ] Create category → appears in shop filter and product creation form
- [ ] Edit category name/slug → updates across shop
- [ ] Delete category → removed (check products in that category are handled gracefully)

---

## 16. ADMIN — PROMO CODES

- [ ] Create promo code with: discount %, expiry date, usage limit, min order amount, max discount cap
- [ ] Promo code appears in list
- [ ] Toggle active/inactive → affects whether code works in cart
- [ ] Usage count increments only after an order using that code is successfully placed ← **BUG-FIX regression**
- [ ] Expired promo → rejected in cart
- [ ] Usage-limit-reached promo → rejected in cart
- [ ] Delete promo code → removed

---

## 17. ADMIN — SUBSCRIBERS

- [ ] Newsletter subscriber list loads
- [ ] New subscriber from homepage signup appears here

---

## 18. ADMIN — SETTINGS

- [ ] Store name saves and reflects in emails
- [ ] Admin email saves → new-order alerts go to this address
- [ ] Contact email saves
- [ ] Shipping fee saves → checkout uses new fee
- [ ] Free shipping threshold saves → checkout correctly applies free shipping above threshold
- [ ] Low stock threshold saves → product list shows low-stock indicator at correct count
- [ ] Admin password change → old password rejected, new password works

---

## 19. SECURITY REGRESSION TESTS

- [ ] **Price manipulation**: manually send a POST to `/api/orders` with `price: 1` for each item → server ignores client price, uses DB price ← **SECURITY fix**
- [ ] **Price manipulation (payment)**: POST to `/api/payment/create` with `price: 1` → Razorpay order amount uses DB price ← **SECURITY fix**
- [ ] **PaymentId reuse**: use the same `paymentId` from a completed order to POST `/api/orders` again → rejected with "This payment has already been used" ← **BUG-FIX regression**
- [ ] **Address ownership**: POST `/api/orders` with `selectedAddressId` belonging to another user → rejected ← **BUG-FIX regression**
- [ ] **Promo on payment route**: promo with `minOrderAmount=1000` applied to a 500-item order at checkout → Razorpay amount not discounted ← **SECURITY fix**
- [ ] **Unauthenticated order**: POST `/api/orders` without a session → 401 returned
- [ ] **Unauthenticated cart/wishlist**: GET/PUT `/api/cart` and `/api/wishlist` without session → 401 returned
- [ ] **OTP rate limit**: 4th OTP request within 10 minutes → blocked
- [ ] **Promo rate limit**: rapid repeated promo validation requests → rate limited after threshold
- [ ] **Admin-only routes**: GET `/api/admin/*` without ADMIN role → 401/403

---

## 20. EMAIL & SMS NOTIFICATIONS

| Trigger | Channel | Recipient | Check |
|---|---|---|---|
| New order placed | Email | Customer | [ ] |
| New order placed | SMS | Customer | [ ] |
| New order placed | Email | Admin (`adminEmail` in Settings) | [ ] |
| Order shipped | Email | Customer (with tracking ID) | [ ] |
| Order shipped | SMS | Customer | [ ] |
| Low stock reached | Email | Admin | [ ] |
| OTP (register / forgot password) | Email | User | [ ] |
| OTP (register / forgot password) | SMS | User | [ ] |

---

## 21. RESPONSIVE / MOBILE

- [ ] Homepage renders correctly on 375px (iPhone SE)
- [ ] Product listing — 2-column grid on mobile
- [ ] Product detail — image, size/color selector, add to cart usable on mobile
- [ ] Cart drawer full-screen on mobile
- [ ] Checkout form usable on mobile keyboard
- [ ] Admin panel usable on tablet (1024px)
- [ ] Header hamburger menu works on mobile

---

## 22. EDGE CASES & ERROR STATES

- [ ] Navigate to `/products/non-existent-slug` → 404 page (not crash)
- [ ] Navigate to `/order-success/fake-id` → appropriate error (not crash)
- [ ] Add product to cart, then product is deleted from DB → checkout shows stock error gracefully
- [ ] Place order when Resend/Twilio is down → order still created, email/SMS failure is non-fatal (logged, not thrown)
- [ ] Place order when promo usage-count update fails → order still committed (non-fatal) ← **BUG-FIX regression**
- [ ] Upload non-image file in product image upload → appropriate error
- [ ] Submit empty search → no crash, shows all products or empty state

---

## 23. PERFORMANCE SPOT-CHECKS

- [ ] Product listing page first load < 3 seconds on average connection
- [ ] Admin orders list (200 orders) loads without timeout
- [ ] Image uploads (Cloudinary) complete in reasonable time
- [ ] Cart drawer opens within 500ms (stock fetch is non-blocking)

---

## SIGN-OFF

| Area | Tester | Date | Pass/Fail |
|---|---|---|---|
| Authentication | | | |
| Shop — Listing & Filters | | | |
| Shop — Product Detail | | | |
| Cart & Promo | | | |
| Checkout & Payment | | | |
| Orders (Customer) | | | |
| Admin — Products | | | |
| Admin — Orders | | | |
| Admin — Settings | | | |
| Security Regression | | | |
| Email / SMS | | | |
| Mobile Responsive | | | |

---

## BUGS ADDRESSED (for regression reference)

| # | Bug | File | Status |
|---|---|---|---|
| 1 | PaymentId reuse exploit — same payment creates multiple orders | `api/orders/route.ts` | Fixed |
| 2 | Promo usage count incremented before order committed (race) | `api/orders/route.ts` | Fixed |
| 3 | Cart `+` button capped at total product stock, not variant stock | `CartDrawer.tsx` + new `variant-stock` endpoint | Fixed |
| 4 | Quick Add silently adding OOS variant for multi-variant products | `ProductCard.tsx` | Fixed |
| 5 | `isColorOutOfStock` didn't fall back for products with no variant records | `ProductDetailClient.tsx` | Fixed |
| 6 | `isSizeOutOfStock` didn't fall back for products with no variant records | `ProductDetailClient.tsx` | Fixed |
| 7 | Stock race condition: two variants of same product decrement product.stock concurrently → wrong total | `api/orders/route.ts` | Fixed |
| 8 | Stock oversell: multiple line items of same no-variant product each passed individual stock check | `api/orders/route.ts` | Fixed |
| 9 | Client-sent item prices used in Razorpay order amount (payment/create) | `api/payment/create/route.ts` | Fixed |
| 10 | Promo minOrderAmount not checked in payment/create (only in validate) | `api/payment/create/route.ts` | Fixed |
| 11 | Address ownership not verified when using `selectedAddressId` | `api/orders/route.ts` | Fixed |
| 12 | Phone/pincode not validated for new addresses at order time | `api/orders/route.ts` | Fixed |
| 13 | `window.location.href` used for search navigation (full reload, loses state) | `Header.tsx` | Fixed |
| 14 | Account dropdown had no click-outside-to-close behavior | `Header.tsx` | Fixed |
| 15 | RETURNED status did not automatically set paymentStatus to REFUNDED | `api/orders/[id]/route.ts` | Fixed |
| 16 | Admin had no new-order notification email | `api/orders/route.ts` + `lib/resend.ts` | Fixed |

---

*Last updated: 2026-04-16*

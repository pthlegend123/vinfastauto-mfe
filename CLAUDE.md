# vinfastauto_mfe — Customer Frontend Reference

> Last scanned: 2026-04-25 (forgot password feature added)
> Port: 5173 (Vite default)

---

## Tech Stack

| Technology | Version | Notes |
|---|---|---|
| React | 19.2.4 | |
| TypeScript | 5.9 | |
| Vite | 8.0.1 | Dev server |
| react-router-dom | 7.1.1 | SPA routing |
| lucide-react | 1.7.0 | Icons |

---

## Running

```bash
cd vinfastauto_mfe
npm install
npm run dev   # http://localhost:5173
```

---

## Source Structure

```
src/
├── App.tsx                         — Router setup, AuthProvider wrapper, scroll listener on /
├── main.tsx                        — React DOM entry point
├── index.css
├── assets/
├── context/
│   ├── AuthContext.tsx             — AuthProvider, useAuth() hook
│   └── ModalContext.tsx            — ModalProvider, useModal() hook (TestDrive + Order modals)
├── services/
│   ├── apiClient.ts                — fetch wrapper, BASE_URL = http://localhost:8080/api/v1
│   ├── auth.service.ts             — login, OTP flow, session management
│   ├── product.service.ts          — getAllProducts(), getProductByCode(code)
│   ├── testDrive.service.ts        — test drive booking, rescheduling, cancellation
│   ├── order.service.ts            — createOrder(), getMyOrders(), getOrderByCode(), cancelOrder()
│   ├── maintenance.service.ts      — bookMaintenance(), getMyBookings(), getBookingByCode(), cancelBooking()
│   └── shared-data.service.ts      — in-memory singleton product cache
├── types/
│   ├── product.types.ts            — all shared TypeScript interfaces
│   ├── testDrive.types.ts          — TestDriveDto, TestDriveCreateRequest, etc.
│   ├── order.types.ts              — OrderResponse, CreateOrderRequest, OrderCancelRequest, OrderStatus
│   └── maintenance.types.ts        — MaintenanceBookingDto, CreateMaintenanceBookingRequest, MaintenanceCancelRequest, MaintenanceServiceType, MaintenanceStatus
├── components/
│   ├── Header.tsx + Header.css
│   ├── Footer.tsx + Footer.css
│   ├── Hero.tsx + Hero.css
│   ├── LoginModal.tsx + LoginModal.css
│   ├── ModelsShowcase.tsx + ModelsShowcase.css
│   ├── TestDriveModal.tsx + TestDriveModal.css  — Global test drive booking overlay
│   ├── OrderModal.tsx + OrderModal.css          — Global deposit/order overlay (with payment method selector)
│   ├── CardPaymentModal.tsx + CardPaymentModal.css — Bank card info modal (opens on top of OrderModal)
│   └── Promotions.tsx + Promotions.css
└── pages/
    ├── Home.tsx                    — Landing page; uses Hero, ModelsShowcase, Promotions
    ├── CarDetail.tsx               — Product detail; calls openOrderModal / openTestDriveModal via ModalContext
    ├── MyTestDrives.tsx            — List all customer test drive bookings
    ├── TestDriveDetail.tsx         — Test drive detail view with reschedule/cancel actions
    ├── MyOrders.tsx                — List all customer orders with status badges (requires auth)
    ├── OrderDetail.tsx             — Order detail view with cancel action (requires auth)
    ├── Profile.tsx                 — Customer profile view and KYC submission
    ├── MaintenancePage.tsx         — Maintenance booking form (service type, showroom, date, vehicle info)
    ├── MyMaintenance.tsx           — List all customer maintenance bookings with status badges (requires auth)
    └── MaintenanceDetail.tsx       — Maintenance booking detail view with cancel action for PENDING (requires auth)
```

---

## Routes

| Path | Component | Notes |
|---|---|---|
| `/` | `Home` | Scroll listener active; shows hero + product showcase |
| `/car-detail/:productId` | `CarDetail` | Fetches product by `productId` param |
| `/my-test-drives` | `MyTestDrives` | List all customer test drive bookings (requires auth) |
| `/my-test-drives/:testDriveCode` | `TestDriveDetail` | Detail view with reschedule/cancel actions (requires auth) |
| `/my-orders` | `MyOrders` | List all customer orders with status badges (requires auth) |
| `/my-orders/:orderCode` | `OrderDetail` | Order detail view with cancel action (requires auth) |
| `/profile` | `Profile` | Customer profile and KYC submission (requires auth) |
| `/maintenance` | `MaintenancePage` | Book a new maintenance appointment |
| `/my-maintenance` | `MyMaintenance` | List all customer maintenance bookings (requires auth) |
| `/my-maintenance/:bookingCode` | `MaintenanceDetail` | Maintenance detail view with cancel action (requires auth) |

All routes are wrapped in `<AuthProvider>` and `<ModalProvider>`.

---

## Services

### `apiClient.ts`

- `BASE_URL = "http://localhost:8080/api/v1"`
- Thin `fetch` wrapper handling JSON serialization and response parsing
- Attaches `Authorization: Bearer <token>` from localStorage when present

### `auth.service.ts`

#### Interfaces

```typescript
interface LoginRequest { username: string; password: string }
interface CustomerInfo { customerCode: string; fullName: string; phone: string; email?: string }
interface LoginResponse { accessToken: string; customer: CustomerInfo }
interface ApiResponse<T> { success: boolean; data: T; message: string; errorCode?: string }
```

#### Methods

| Method | Description |
|---|---|
| `login(req: LoginRequest)` | POST `/auth/customer/login`, returns `LoginResponse` |
| `saveSession(token, user)` | Stores token → `auth_token`, user → `auth_user` in localStorage |
| `clearSession()` | Removes `auth_token` and `auth_user` from localStorage |
| `getStoredUser()` | Parses `auth_user` from localStorage, returns `CustomerInfo \| null` |
| `isLoggedIn()` | Returns `true` if `auth_token` is present in localStorage |
| `otpSend(phone)` | POST `/otp/send` |
| `otpVerify(phone, otpCode)` | POST `/otp/verify` |
| `otpRegister(phone, fullName, password)` | POST `/otp/register` |
| `sendForgotPasswordOtp(phone)` | POST `/auth/customer/forgot-password/send-otp` |
| `verifyForgotPasswordOtp(phone, otpCode)` | POST `/auth/customer/forgot-password/verify-otp` |
| `resetCustomerPassword(phone, newPassword)` | POST `/auth/customer/forgot-password/reset` |

### `product.service.ts`

| Method | Endpoint | Description |
|---|---|---|
| `getAllProducts(page?, size?)` | GET `/products/get-all` | Returns `PagedResponse<Product>` |
| `getProductByCode(code)` | GET `/products/{code}` | Returns single `Product` |

### `testDrive.service.ts`

All methods require authentication (Bearer token from localStorage).

| Method | Endpoint | Description |
|---|---|---|
| `bookTestDrive(req)` | POST `/test-drives/book` | Create a new test drive booking |
| `getCustomerBookings()` | GET `/test-drives/my-bookings` | Fetch all bookings for logged-in customer |
| `getTestDriveById(code)` | GET `/test-drives/{code}` | Fetch single test drive by code |
| `rescheduleTestDrive(code, req)` | PUT `/test-drives/{code}/reschedule` | Reschedule an existing booking |
| `cancelTestDrive(code, req)` | POST `/test-drives/{code}/cancel` | Cancel an existing booking |

### `order.service.ts`

All methods require authentication (Bearer token from localStorage).

| Method | Endpoint | Description |
|---|---|---|
| `createOrder(req)` | POST `/orders/create` | Create a new deposit order |
| `getMyOrders(page?, size?)` | GET `/orders/my-orders` | Paginated list of customer's own orders |
| `getOrderByCode(orderCode)` | GET `/orders/{orderCode}` | Get order detail |
| `cancelOrder(orderCode, req)` | POST `/orders/{orderCode}/cancel` | Cancel an order |

#### `CreateOrderRequest` (maps to backend `OrderCreateRequest`)

```typescript
interface CreateOrderRequest {
  sku: string           // ProductSku.sku — the exact SKU string from backend
  depositAmount: number // deposit amount in VND entered by customer
  totalPrice: number    // variant.price — full price of selected variant
  testDriveDate?: string // ISO datetime string (optional)
  note?: string
}
```

#### `OrderResponse` (maps to backend `OrderDto`)

```typescript
interface OrderResponse {
  orderCode: string
  customerCode: string
  customerName?: string
  sku: string
  productName: string
  assignedEmployeeCode?: string
  assignedEmployeeName?: string
  depositAmount: number
  totalPrice: number
  status: OrderStatus
  testDriveDate?: string
  handoverDate?: string
  createdAt: string
  updatedAt?: string
}
```

#### `OrderStatus`

```typescript
type OrderStatus =
  | 'PENDING_DEPOSIT'
  | 'DEPOSIT_PAID'
  | 'SALES_CONFIRMED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUND_PENDING'
  | 'REFUNDED'
```

### `maintenance.service.ts`

All methods require authentication (Bearer token from localStorage).

| Method | Endpoint | Description |
|---|---|---|
| `bookMaintenance(req)` | POST `/maintenance/book` | Create a new maintenance booking |
| `getMyBookings()` | GET `/maintenance/my-bookings` | Fetch all maintenance bookings for logged-in customer |
| `getBookingByCode(code)` | GET `/maintenance/{code}` | Fetch single maintenance booking by code |
| `cancelBooking(code, req)` | POST `/maintenance/{code}/cancel` | Cancel a PENDING maintenance booking |

#### `CreateMaintenanceBookingRequest`

```typescript
interface CreateMaintenanceBookingRequest {
  serviceType: MaintenanceServiceType  // PERIODIC_MAINTENANCE | REPAIR | INSPECTION | TIRE_CHANGE | BATTERY_CHECK
  showroom: string
  scheduledDate: string               // ISO datetime string
  licensePlate?: string
  vin?: string
  mileage?: number
  notes?: string
}
```

#### `MaintenanceBookingDto`

```typescript
interface MaintenanceBookingDto {
  bookingCode: string
  customerCode: string
  customerName?: string
  technicianCode?: string
  technicianName?: string
  serviceType: MaintenanceServiceType
  showroom: string
  scheduledDate: string
  licensePlate?: string
  vin?: string
  mileage?: number
  notes?: string
  cancellationReason?: string
  status: MaintenanceStatus           // PENDING | CONFIRMED | IN_PROGRESS | COMPLETED | CANCELLED
  createdAt: string
  updatedAt?: string
}
```

---

### `shared-data.service.ts`

Singleton module-level in-memory cache to avoid redundant API calls between pages.

```typescript
// State
let products: Product[] = []
let hasFetchedProducts: boolean = false
```

| Method | Description |
|---|---|
| `setProducts(list)` | Overwrites cache, sets `hasFetchedProducts = true` |
| `getProducts()` | Returns cached product list |
| `getProductByCode(code)` | Returns single product from cache by `product_code` |
| `updateProduct(code, partial)` | Merges partial update into cached product |
| `addProduct(product)` | Appends product to cache |
| `removeProduct(code)` | Removes product from cache by code |
| `clearData()` | Resets cache to empty, `hasFetchedProducts = false` |

---

## Context

### `AuthContext.tsx`

Provides global auth state via React context.

```typescript
const { isLoggedIn, user, loginModalOpen, setLoginModalOpen, pendingCallback } = useAuth()
```

| Property | Type | Description |
|---|---|---|
| `isLoggedIn` | `boolean` | Whether a session token is present |
| `user` | `CustomerInfo \| null` | Currently logged-in customer |
| `loginModalOpen` | `boolean` | Controls `<LoginModal>` visibility |
| `setLoginModalOpen` | `(open: boolean) => void` | Toggle the login modal |
| `pendingCallback` | `(() => void) \| null` | Action to run after successful login |

### `ModalContext.tsx`

Provides global overlay state for test drive and order modals.

```typescript
const { openTestDriveModal, closeTestDriveModal, openOrderModal, closeOrderModal } = useModal()
```

| Function | Signature | Description |
|---|---|---|
| `openTestDriveModal` | `(productCode?: string, variantCode?: string) => void` | Opens `<TestDriveModal>`; no args = picker mode (lets user choose product) |
| `closeTestDriveModal` | `() => void` | Closes test drive modal |
| `openOrderModal` | `(product: Product) => void` | Opens `<OrderModal>` pre-loaded with given product |
| `closeOrderModal` | `() => void` | Closes order modal |

---

## Types (`product.types.ts`)

```typescript
interface Product {
  productCode: string
  name: string
  type: 'CAR' | 'MOTORCYCLE'
  description: string
  car?: CarSpec
  motorcycle?: MotorcycleSpec
  variants: ProductVariant[]
}

interface ProductVariant {
  variantCode: string
  variantName: string
  price: number
  batteryCapacity: string
  rangePerCharge: number
  skus: ProductSku[]
}

interface ProductSku {
  sku: string
  stockQuantity: number
  color: MasterColor
  images: ProductImage[]
}

interface ProductImage {
  imageUrl: string
  isThumbnail: boolean
  displayOrder: number
}

interface MasterColor {
  colorCode: string
  colorName: string
  colorHex: string
  colorHex2?: string
}

interface CarSpec {
  seatingCapacity: number
  drivetrain: string
  adasLevel: string
  airbags: number
}

interface PagedResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

interface ApiResponse<T> {
  success: boolean
  data: T
  message: string
  errorCode?: string
}

interface TestDriveDto {
  testDriveCode: string
  customerCode: string
  productCode: string
  variantCode?: string
  scheduledDate: string
  location: string
  expectedDurationMinutes: number
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'
  assignedEmployeeCode?: string
  note?: string
  cancelReason?: string
  createdAt: string
  updatedAt?: string
}

interface TestDriveCreateRequest {
  productCode: string
  variantCode?: string
  scheduledDate: string
  location: string
  expectedDurationMinutes?: number
  note?: string
}

interface TestDriveUpdateRequest {
  newScheduledDate: string
  note?: string
}

interface TestDriveCancelRequest {
  cancellationReason: string
}
```

---

## Components

| Component | Description |
|---|---|
| `Header` | Top navigation bar with logo and nav links; integrates auth state to show login/user menu; "Đăng ký lái thử" button navigates to `/my-test-drives`; account dropdown includes "Lịch sử lái thử" link |
| `Footer` | Site footer |
| `Hero` | Full-screen landing hero section |
| `LoginModal` | Auth modal — tab-switches between direct login and OTP phone registration flow; includes "Quên mật khẩu?" link that opens `ForgotPasswordModal` |
| `ForgotPasswordModal` | Forgot-password modal overlay triggered from `LoginModal`; 3-step OTP flow: enter phone → enter OTP (digit-by-digit, 60s resend timer) → set new password; success state with "Quay lại đăng nhập" button |
| `ModelsShowcase` | Product grid/carousel populated from `shared-data.service` or product API |
| `Promotions` | Promotional banners section |
| `OrderModal` | Global deposit overlay; contains variant/SKU selector, deposit amount input, notes, and payment method selector (BANK_CARD / VNPAY) |
| `CardPaymentModal` | Bank card info form modal; opens on top of `OrderModal` (z-index 1100 vs 1000); includes live card preview, card type detection (Visa/Mastercard/JCB), auto-formatted inputs, CVV show/hide, client-side validation |

---

## Auth Flow — OTP Phone Registration

1. User enters phone → `otpSend(phone)` → POST `/otp/send`
2. User enters received OTP code → `otpVerify(phone, code)` → POST `/otp/verify`
3. User enters full name + password → `otpRegister(phone, fullName, password)` → POST `/otp/register`
4. On success → `saveSession(token, user)` → context updates `isLoggedIn = true`

## Auth Flow — Forgot Password

1. User clicks "Quên mật khẩu?" in `LoginModal` → `ForgotPasswordModal` opens
2. User enters phone → `sendForgotPasswordOtp(phone)` → POST `/auth/customer/forgot-password/send-otp`
3. User enters 6-digit OTP (digit-by-digit input; 60s resend timer) → `verifyForgotPasswordOtp(phone, code)` → POST `/auth/customer/forgot-password/verify-otp`
4. User enters new password + confirmation (min 6 chars) → `resetCustomerPassword(phone, newPassword)` → POST `/auth/customer/forgot-password/reset`
5. On success: shows success state with "Quay lại đăng nhập" button → calls `onClose()` to return to `LoginModal`

## Auth Flow — Direct Login

1. User enters username + password → `login({ username, password })` → POST `/auth/customer/login`
2. On success → `saveSession(token, user)` → context updates `isLoggedIn = true`

## Order (Deposit) Flow

1. User clicks "ĐẶT CỌC" button on product detail page (`CarDetail.tsx`)
2. If not logged in: login modal appears; after login, deposit modal opens
3. `OrderModal` — Step 1: user selects variant, color/SKU, deposit amount (default = 10% of variant price), optional notes, and **payment method**
4. User clicks "Tiếp tục":
   - **BANK_CARD selected** → `CardPaymentModal` opens for card info entry
   - **VNPAY selected** → submits order directly (placeholder, VNPay integration pending)
5. `CardPaymentModal` — user fills card number, cardholder name, expiry (MM/YY), CVV → clicks confirm
6. On confirm: `createOrder({ sku, depositAmount, totalPrice: variant.price })` → POST `/orders/create`
7. On success: both modals close → redirect to `/my-orders`
8. User views all orders at `/my-orders` with status badges
9. User clicks an order row to view details at `/my-orders/:orderCode`
10. On detail page, user can cancel the order (if status allows)

### `CardPaymentModal` Props

```typescript
interface CardPaymentModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void   // calls parent handleOrderSubmit
  loading: boolean
  depositAmount: number
  productName: string
}
```

### Card Validation Rules

| Field | Rule |
|---|---|
| Card number | Exactly 16 digits; auto-formatted as `XXXX XXXX XXXX XXXX` |
| Cardholder name | Not empty; auto-uppercased |
| Expiry | MM/YY format, YY = 2 digits, month 01–12, not expired |
| CVV | 3–4 digits; shown as password type by default |

### Card Type Detection

| Type | Pattern | Preview colour |
|---|---|---|
| Visa | Starts with `4` | Deep blue gradient |
| Mastercard | Starts with `5[1-5]` or `2[2-7]` | Red gradient |
| JCB | Starts with `35` | Green gradient |

**Note:** `variantName` and `colorName` are NOT returned by the backend `OrderDto`. Those fields show `'—'` in UI.
**Note:** Card info entered in `CardPaymentModal` is UI-only — not sent to the backend. The card modal is a UX gate before calling the existing `createOrder` endpoint.

---

## Test Drive Booking Flow

1. User clicks "LÁI THỬ" button on product detail or "Đăng ký lái thử" in header
2. If not logged in: login modal appears; after login, user redirected to test drive booking page
3. User fills form: variant (if available), date/time (min. 1 hour from now), location, duration, optional notes
4. On submit: `bookTestDrive()` → POST `/test-drives/book` → redirect to `/my-test-drives` on success
5. User can view all bookings in `/my-test-drives` table with status badges
6. User can click "Chi tiết" to view details at `/my-test-drives/:testDriveCode`
7. On detail page, user can:
   - Reschedule (PENDING/CONFIRMED status) — inline form with new date + notes
   - Cancel (PENDING/CONFIRMED status) — inline form with cancellation reason
   - View read-only details for COMPLETED/CANCELLED bookings

---

## Maintenance Booking Flow

1. User clicks "Bảo dưỡng" in header or navigates to `/maintenance`
2. If not logged in: login modal appears; after login, booking form opens
3. User fills form: service type, showroom, scheduled date/time, license plate, VIN (optional), mileage (optional), notes
4. On submit: `bookMaintenance()` → POST `/maintenance/book` → redirect to `/my-maintenance` on success
5. User can view all bookings in `/my-maintenance` table with status badges
6. User can click "Chi tiết" to view details at `/my-maintenance/:bookingCode`
7. On detail page:
   - PENDING status: cancel form is shown; requires `cancellationReason`; calls `cancelBooking()`
   - Other statuses: read-only view

### Service Types

| Value | Vietnamese Label |
|---|---|
| `PERIODIC_MAINTENANCE` | Bảo dưỡng định kỳ |
| `REPAIR` | Sửa chữa |
| `INSPECTION` | Kiểm tra tổng quát |
| `TIRE_CHANGE` | Thay lốp |
| `BATTERY_CHECK` | Kiểm tra pin |

### Maintenance Status Flow

`PENDING → CONFIRMED → IN_PROGRESS → COMPLETED`
`PENDING → CANCELLED`

---

## Development Notes

1. **API base URL** is hardcoded in `apiClient.ts` as `http://localhost:8080/api/v1`. Change for production.
2. **Session storage** uses `localStorage` keys `auth_token` and `auth_user`.
3. **Shared data service** acts as a simple in-memory cache — not persisted across page refreshes.
4. **OTP dev stub** — backend logs OTP to console, no real SMS in dev.
5. **Test drive date validation** — backend enforces minimum 1 hour from current time.
6. **Location options** — hardcoded as: Hà Nội Showroom, TP.HCM Showroom, Đà Nẵng Showroom, Cần Thơ Showroom.
7. **Duration limits** — validated client-side as 15–240 minutes.
8. **Status badges** — color-coded: PENDING=amber, CONFIRMED=blue, COMPLETED=green, CANCELLED=gray.

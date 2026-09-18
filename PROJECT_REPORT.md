# Tutor-Connect — MongoDB Full-Stack Migration Report

Final deliverable of the 15-phase plan. The React + Vite frontend is preserved
unchanged (same UI/UX); the Express "mock" backend was replaced with a MongoDB +
Mongoose API and all production wiring was completed and verified.

---

## 1. What Was Implemented

### Architecture
- **Frontend**: React 18 + Vite + TailwindCSS (unchanged UI, `src/`).
- **Backend**: Express + Mongoose (`backend/`), JWT auth, role-based access.
- **Database**: MongoDB (default `mongodb://127.0.0.1:27017/tutor_connect`).
  No local MongoDB needed for dev/test — `mongodb-memory-server` boots an
  ephemeral database.
- **Payments**: Server-side verified. Razorpay orders + HMAC signature
  verification when `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET` are set; otherwise a
  sandbox payment flow so the app works fully offline.

### End-to-end flows implemented (all server-backed, no mocks)
1. Register / login / JWT auth, password hashing (bcrypt), profile-by-role.
2. Student: browse filters, book & pay, history, review + rating, payment history.
3. Teacher: profile CRUD, discoverable listing, manage bookings (accept / reject /
   complete), payment history, earnings/rating stats.
4. Admin: approve tutors, user management, analytics, all-payments view, payout
   processing.
5. Robustness: clean network-failure message, 401 auto-logout, silent empty
   states (per existing UI patterns), 409 conflict on double-booking, 400 on
   past-datetime bookings.

---

## 2. Models & Relationships

| Model | Fields (client-facing names kept) |
|---|---|
| `User` | name, email (unique), passwordHash, role (student/teacher/admin), approved, createdAt |
| `TutorProfile` | userId (ref User), subject, rate, experience, bio, timings, location, verified, rating, earnings |
| `Booking` | bookingId, studentId, teacherId, subject, datetime, rate, status (pending/accepted/rejected/completed), createdAt |
| `Payment` | paymentId, paymentBookingId (ref Booking), method, amount, transactionId, status (pending/completed/failed), createdAt |
| `Review` | reviewId, studentId, teacherId, bookingId, rating, comment, createdAt |

**Relationships**
- User 1:1 TutorProfile; User 1:N Bookings (student and teacher refs); Booking 1:1
  Payment; Booking 1:1 Review; Teacher 1:N Reviews.

**Constraints / indexes**
- `email` unique on User; `(teacherId, datetime)` partial unique index on
  Bookings for status `{pending, accepted}` + explicit 409 pre-check
  (duplicate-slot protection).
- Tutor availability lives in `TutorProfile.timings` (availability model
  intentionally skipped per plan: unnecessary model).

---

## 3. API Reference

Base: `http://localhost:5000` (mounted at root to match the original frontend's
`AuthContext` calls; no `/api` prefix — plus `GET /api/health`).

### Auth (`/auth`)
| Method | Path | Body/Params | Access | Notes |
|---|---|---|---|---|
| POST | `/auth/register` | name, email, password, role | public | tutors start unapproved |
| POST | `/auth/login` | email, password | public | returns token + user |
| GET | `/auth/me` | — | any user | current profile (fresh from DB) |

### Students (`/students`)
| Method | Path | Body | Access |
|---|---|---|---|
| GET | `/students/me` | — | student |
| PUT | `/students/me` | name, email, phone | student |
| GET | `/students/teachers` | query: subject, location, mode, minRate, maxRate | student |
| DELETE | `/students/me/bookings/:id` | — | student (pending own) |

Student bookings are listed via `GET /bookings` (below).

### Teachers (`/teachers`)
| Method | Path | Body | Access |
|---|---|---|---|
| GET | `/teachers/me` | — | tutor |
| PUT | `/teachers/me` | subjects, rate, experience, timings, mode, areas, bio, qualifications | tutor |
| GET | `/teachers/bookings` | — | tutor (own) |
| POST | `/teachers/bookings/:id/accept` | — | tutor (own pending) |
| POST | `/teachers/bookings/:id/reject` | — | tutor (own pending) |
| GET | `/teachers/me/reviews` | — | tutor (own) |
| GET | `/teachers/me/payments` | — | tutor (own) |
| GET | `/teachers/my-stats` | — | tutor (earnings, completed, avg rating) |

### Bookings (`/bookings`)
| Method | Path | Body | Access |
|---|---|---|---|
| POST | `/bookings` | teacherId, subject, mode, datetime, price | student | 409 duplicate / 400 past datetime / 400 slot conflict / 400 invalid rates |
| GET | `/bookings` | — | student/tutor (own), admin (all) |
| GET | `/bookings/:id` | — | owner |
| PUT | `/bookings/:id` | subject, mode, datetime, price | student (own) |
| POST | `/bookings/:id/complete` | — | tutor (own accepted) |

### Payments (`/payments`)
| Method | Path | Body | Access |
|---|---|---|---|
| POST | `/payments/pay` | bookingId | student (owner) | sandbox: creates server-confirmed payment |
| POST | `/payments/create-order` | bookingId | student (owner) | Razorpay order (or sandbox order) |
| POST | `/payments/verify` | orderId, paymentId, signature, bookingId | student (owner) | HMAC-SHA256 verify via Razorpay |
| GET | `/payments/me` | — | student/tutor (own), admin (all) |

### Reviews (`/reviews`)
| Method | Path | Body | Access |
|---|---|---|---|
| POST | `/reviews` | bookingId, rating, comment | student (own completed) |
| GET | `/reviews/me` | — | student (own) |
| GET | `/reviews/teacher/:teacherId` | — | public (teacher rating) |
| GET | `/reviews/teacher/all` | — | admin (all) |
| DELETE | `/reviews/:id` | — | admin (moderation, recomputes rating) |

### Admin (`/admin`)
| Method | Path | Body | Access |
|---|---|---|---|
| GET | `/admin/users` | — | admin |
| GET | `/admin/bookings` | — | admin |
| GET | `/admin/analytics` | — | admin |
| POST | `/admin/teachers/:id/approve` | — | admin |
| POST | `/admin/payouts/release` | bookingId | admin |
| GET | `/api/health` | — | public |

Rating recompute: a review updates the teacher's TutorProfile.rating average and
the teacher's `earnings` reflects completed bookings.

---

## 4. Environment Configuration

`.env` (root, git-ignored):
```env
PORT=5000
JWT_SECRET=your_super_secret_jwt_key_change_in_production
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/tutor_connect
CORS_ORIGINS=http://localhost:3000
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
```
`JWT_SECRET` is required — the server refuses to boot without it (no hardcoded
production secret). `backend/.env.example` documents all variables.

---

## 5. Setup & Running

```bash
npm install
npm run dev:full     # ephemeral MongoDB (auto-seeded) + API on :5000
# or, with your own MongoDB:
#   npm run server   # after setting MONGODB_URI + npm run seed
npm run dev          # frontend on :3000 (new terminal)
```

Scripts in `package.json`: `dev`, `build`, `preview`, `server`/`start`
(`node backend/server.js`), `seed`, `dev:full`, `test:api`, `test:prod`,
`test:white` (white-box with coverage), `postinstall` (build).

Demo accounts (seeded): admin `admin@tutorconnect.com` / `admin123`;
tutors `sarah@example.com`, `michael@example.com`, `emily@example.com`;
students `raj@123com`, `jessica@example.com` — all `admin123`. Demo data
uses Indian names, +91 phones and ₹ rates (see `backend/seedData.js`).

---

## 6. Test Results

- **API suite** (`npm run test:api`, 67 assertions across phases 1–9):
  health, register, duplicate email, bad credentials, JWT/role guards, profile
  CRUD, tutor discovery filters, booking + slot-conflict + past-datetime,
  payments + duplicate-pay + create-order + verify, accept/reject/complete,
  reviews + rating recompute + admin review moderation, admin
  users/analytics/approve/payout/teacher-detail.
  **Result: 67 pass / 0 fail.**
- **White-box suite** (`npm run test:white`, node:test + `--experimental-test-coverage`): unit
  tests (token, serialize, ApiError, validators, error middleware) plus HTTP pipeline
  branch probes — health, auth guards, booking branches (server price, slot conflict,
  past datetime, invalid ids), review lifecycle + rating recompute, payment
  order/verify + ownership, admin approve + payout idempotency, and
  teacher/student profiles + stats + admin analytics.
  **Result: 27 tests pass / 0 fail; coverage ≈ 91.7% lines / 73.5% branches**
  (previously ~86% lines — expanded coverage of teacher/student/admin controllers
  via the newly verified routes below).
- **Frontend build** (`npm run build`): exit 0.
- **Production smoke test** (`npm run test:prod`): boots `backend/server.js` with
  `NODE_ENV=production` + ephemeral MongoDB, seeds, asserts health JSON, serves
  `dist/index.html` on :5000, admin login returns token+role.
  **Result: passed.**
- **Live-UI bugfixes verified by tests**: student booking now sends a *future*
  session time chosen in a booking modal (was: always `Date.now()` → server rejected
  every booking as past); the dashboard loads the student's own reviews from
  `GET /reviews/me`, so "Leave a Review" only shows for sessions that actually
  haven't been reviewed yet (was: always visible → 409 duplicate).

---

## 7. Remaining Issues / Notes

- **Vercel serverless**: `vercel.json` routes to `backend/server.js` as a serverless
  function with `/dist` static fallback; Express + Vite SPA on serverless has
  cold-start/memory limits — Railway/Render/Heroku (Procfile) is recommended.
- **Razorpay sandbox vs live**: no payment UI was added (existing `/payments/pay`
  sandbox path preserved). Real money flows require Razorpay dashboard keys,
  HTTPS domain, and a client-side checkout (Razorpay Checkout.js) — the order
  create/verify endpoints are ready; the checkout UI is not included.
- **Rate limiting** on `/auth/login` is not implemented — recommended before
  public deployment.
- **Stale token approval**: local `approved` stored in localStorage is only
  refreshed on login; an admin-approved tutor must re-login (token stays valid).
- **No browser E2E** (Playwright/Cypress) — full API + build + smoke coverage only.
- **`.env` present locally** but git-ignored; redeployers must create their own.

---

## 8. File Map (new/changed)

- `backend/` — config/, controllers/, middleware/, models/, routes/, services/,
  utils/, validators/, `server.js`, `seed.js`, `seedData.js`, `.env.example`,
  scripts/ (`api-test.js`, `helpers.js`, `start-dev.js`, `test-prod.js`).
- Changed: `package.json`, `Procfile`, `vercel.json`, `src/context/AuthContext.jsx`,
  `README.md`, deploy guides, `.env`.
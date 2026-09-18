# 🎓 TutorConnect

> A tutoring platform I built to connect students with great teachers in India —
> bookings, payments, reviews, the whole thing. It just works. No confusing setup.

![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![React](https://img.shields.io/badge/React-18.2.0-blue)
![Node.js](https://img.shields.io/badge/Backend-Express-green)
![MongoDB](https://img.shields.io/badge/DB-MongoDB-green)
![Currency](https://img.shields.io/badge/Currency-INR%20(₹)-orange)

## ✨ What it can do

**For students**
- Search teachers by subject, location, ratings, and teaching mode
- Book sessions in a couple of clicks (stripe-free, India-first payments)
- Review teachers after a completed session
- Dashboard with booking history, payments, and progress

**For teachers**
- Manage your profile, rates, subjects, and availability
- Accept or reject bookings
- See what you've earned and your stats at a glance
- Grow your reputation through student reviews

**For the admin (you)**
- Approve teachers, manage every user, review payments and payouts
- Moderate reviews with a click
- One dashboard to run the whole platform

**Nice touches**
- Dark/light mode that remembers your preference
- Works great on mobile
- Smooth animations — the UI honestly feels polished

## 🧰 Built with

- **React 18** + React Router + TailwindCSS (yes, it's pretty)
- **Node.js + Express** on the backend
- **MongoDB + Mongoose** for the database
- **JWT + bcrypt** for secure logins
- **Razorpay** for payments — with a built-in sandbox mode so it works offline too

## 🚀 Getting started

You'll need **Node.js** (v16+).

```bash
git clone https://github.com/rajaryan1303/Tutor-connect.git
cd Tutor-connect
npm install
```

Then run the backend:

```bash
npm run server
```

And seed the database (first time only):

```bash
npm run seed
```

In another terminal, start the frontend:

```bash
npm run dev
```

Open `http://localhost:3000` and you're in. 🎉

> Don't have MongoDB installed? Run `npm run dev:full` — it boots up an
> ephemeral, pre-seeded database plus the API for you. Zero setup.

## 🔐 Demo logins

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@tutorconnect.com` | `admin123` |
| Teacher | `sarah@example.com` | `admin123` |
| Student | `raj@123com` | `admin123` |

The sample data is India-focused — Indian names, +91 phone numbers, and rates in ₹.

## 📁 How it's organised

```
├── src/                # React frontend
│   ├── pages/          # Home, Login, Student/Teacher/Admin dashboards
│   ├── context/        # Auth + theme state
│   └── App.jsx
├── backend/            # Express API
│   ├── routes/         # All API endpoints
│   ├── controllers/    # Request handlers
│   ├── models/         # Mongoose schemas
│   ├── utils/          # Token, helpers, name enrichment
│   ├── seed.js         # Demo data
│   └── server.js       # Entry point
└── package.json
```

## ⚙️ Environment variables

Copy the root `.env` (or `backend/.env.example`) and give it real values. For
local development, the defaults are fine:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/tutor_connect
JWT_SECRET=some_long_random_string
CORS_ORIGINS=http://localhost:3000
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
```

> `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` are optional. Leave them empty for
> the built-in sandbox payments; set them for real Razorpay transactions.

## 💳 How payments work

The server always verifies the payment — the frontend never gets to decide
whether something is "paid". Sandbox mode creates and verifies orders without a
gateway; with Razorpay keys set, it uses real orders with HMAC-SHA256 signature
checks.

## 🧪 Tests

No extra install needed — the suite spins up a throwaway MongoDB:

```bash
npm run test:api     # 67 automated API checks (auth, bookings, payments, admin…)
npm run test:white   # 27 white-box tests with code coverage
npm run test:prod    # boots the production build + smoke-tests it
```

## 🙌 Wanna contribute?

Love it. Fork the repo, make a branch (`feature/your-idea`), commit your changes,
and open a pull request. Keep it simple.

## 📄 License

MIT — do whatever you like with it.

## 📞 Support or questions

Just open an [issue](https://github.com/rajaryan1303/Tutor-connect/issues) or
drop me an email at **rajaryan1303y@gmail.com**.

---

⭐ Star the repo if it saves you some time!
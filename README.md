# 🎓 TutorConnect - Professional Tutoring Platform

A comprehensive, full-stack tutoring platform with modern UI, dark mode, and complete user management system.

![TutorConnect Platform](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![React](https://img.shields.io/badge/React-18.2.0-blue)
![Node.js](https://img.shields.io/badge/Node.js-Express-green)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-green)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.3.6-blue)
![Currency](https://img.shields.io/badge/Currency-INR%20(₹)-orange)

## ✨ Features

### 👨‍🎓 Student Panel
- **Smart Teacher Search** - Filter by subject, location, ratings, and teaching mode
- **Instant Booking** - Book sessions with automatic payment processing
- **Review System** - Rate and review teachers after completed sessions
- **Dashboard Analytics** - Track booking history, payments, and progress
- **Responsive Design** - Works seamlessly on desktop and mobile

### 👨‍🏫 Teacher Panel
- **Profile Management** - Set subjects, rates, availability, and teaching preferences
- **Booking Management** - Accept/reject requests and manage schedule
- **Earnings Tracker** - Monitor income, completed sessions, and statistics
- **Student Reviews** - View feedback and maintain reputation
- **Performance Analytics** - Track ratings, session count, and earnings

### 🛠️ Admin Panel
- **User Management** - Approve teachers, manage all users
- **Financial Control** - Handle payments, payouts, and platform fees
- **Analytics Dashboard** - Comprehensive platform statistics
- **Review Moderation** - Monitor and manage user feedback
- **Tabbed Interface** - Organized management sections

### 🎨 Modern UI Features
- **Dark/Light Mode** - Toggle between themes with persistent preference
- **Responsive Design** - Mobile-first approach with TailwindCSS
- **Interactive Elements** - Smooth animations and hover effects
- **Professional Layout** - Clean, modern design with proper spacing
- **Icon Integration** - Lucide React icons throughout the interface

## 🚀 Technology Stack

- **Frontend**: React 18, React Router, TailwindCSS, Lucide Icons
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens) + bcrypt password hashing
- **Styling**: TailwindCSS with custom dark mode
- **State Management**: React Context API
- **Payment**: Razorpay integration with a built-in sandbox fallback

## 📦 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/rajaryan1303/Tutor-connect.git
cd Tutor-connect
```

2. **Install dependencies**
```bash
npm install
```

3. **Start the backend server**
```bash
npm run server
```

4. **Seed the database (first run)**
```bash
npm run seed
```

5. **Start the frontend (in a new terminal)**
```bash
npm run dev
```

6. **Open your browser**
Navigate to `http://localhost:3000`

> **No MongoDB installed?** Run `npm run dev:full` to boot an ephemeral,
> pre-seeded MongoDB and the API server together.

## 🔐 Default Credentials

### Admin Access
- **Email**: `admin@tutorconnect.com`
- **Password**: `admin123`

### Sample Teacher (Pre-approved)
- **Email**: `sarah@example.com`
- **Password**: `admin123`

### Sample Student
- **Email**: `raj@123com`
- **Password**: `admin123`

> Demo data is India-focused: Indian tutor/student names, +91 phone numbers and
> hourly rates in Rupees (₹) — set/keyed in `backend/seedData.js`.

## 📁 Project Structure

```
tutorconnect/
├── src/
│   ├── components/         # Reusable UI components
│   ├── pages/             # Main page components
│   │   ├── Home.jsx       # Landing page
│   │   ├── Login.jsx      # Authentication
│   │   ├── StudentDashboard.jsx
│   │   ├── TeacherDashboard.jsx
│   │   └── AdminDashboard.jsx
│   ├── context/           # React Context providers
│   │   ├── AuthContext.jsx
│   │   └── ThemeContext.jsx
│   └── App.jsx            # Main app component
├── backend/
│   ├── config/            # DB connection
│   ├── controllers/       # Request handlers
│   ├── middleware/        # Auth + error handling
│   ├── models/            # Mongoose models
│   ├── routes/            # API endpoints
│   ├── services/          # Payment service
│   ├── validators/        # Request validation
│   ├── utils/             # Token + serialization helpers
│   ├── seed.js            # Demo data seed script
│   └── server.js          # Server entry point
├── dist/                  # Production build
├── render.yaml            # Render (free) one-click deploy blueprint
├── Procfile               # node backend/server.js
└── package.json         # Dependencies and scripts
```

## 🌐 Deployment Options

### Option 1: Render + MongoDB Atlas (Recommended — 100% Free)

The repo ships with a `render.yaml` blueprint that pre-configures the free plan,
build, start command, and health check — so deploying is one click.

1. **Push this repo to your GitHub account.**
2. **MongoDB Atlas (mongodb.com)** — create a free **M0** cluster:
   - Database Access → add a user + password.
   - Network Access → **Allow Access from Anywhere** (`0.0.0.0/0`).
   - Database → Connect → Drivers → copy the connection string, insert your
     password, and add the database name:
     `mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/tutor_connect?retryWrites=true&w=majority`
3. **Render (render.com)** — **New → Blueprint** → select this repo.
   `render.yaml` auto-fills the free plan, `npm install` build (runs the Vite
   build via `postinstall`), `node backend/server.js` start, and `/api/health`.
4. Set the `MONGODB_URI` env var to your Atlas string (above). `JWT_SECRET`
   auto-generates; `NODE_ENV` is already `production`.
5. **Deploy**, then seed the live DB once from your machine:
   ```bash
   $env:MONGODB_URI="mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/tutor_connect?retryWrites=true&w=majority"
   npm run seed
   ```
6. Open `https://<your-app>.onrender.com` — verify with
   `https://<your-app>.onrender.com/api/health` → `{"success":true,...}`.

> Free-tier notes: Render spins down after 15 min idle (first load ~1 min cold
> start); Atlas M0 is 512 MB storage, free forever.

### Option 2: Netlify (Frontend only)

1. **Build the project**
```bash
npm run build
```

2. **Deploy to Netlify**
- Drag and drop the `dist` folder to Netlify
- Or connect your GitHub repository for automatic deployments

### Option 3: Vercel

1. **Install Vercel CLI**
```bash
npm i -g vercel
```

2. **Deploy**
```bash
vercel --prod
```

### Option 4: Railway (Full-Stack)

1. **Connect GitHub repository**
2. **Set environment variables**
3. **Deploy automatically**

### Option 4: Heroku

1. **Create Heroku app**
```bash
heroku create tutorconnect-app
```

2. **Deploy**
```bash
git push heroku main
```

## 🔧 Environment Variables

Create a `.env` file in the root directory:

```env
PORT=5000
JWT_SECRET=your_super_secret_jwt_key_change_in_production
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/tutor_connect
CORS_ORIGINS=http://localhost:3000
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
```

`RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET` are optional. When set, payments use real
Razorpay orders with server-side signature verification; when empty, the built-in
sandbox payment flow is used so the app works offline.

## 💳 Payment Integration

Payments are server-verified — a frontend "paid" flag is never trusted.

### Sandbox (default)
`POST /payments/pay` creates a payment record on the server, and
`POST /payments/create-order` + `POST /payments/verify` model the order/verification
flow without a gateway.

### Razorpay
Set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`, then `POST /payments/create-order`
returns a real Razorpay order and `POST /payments/verify` validates the Razorpay
signature (HMAC-SHA256) before marking the booking paid.

## 🧪 Running Tests

The backend ships with an API test suite that covers all flows (67 checks), a
white-box suite (27 tests with code coverage), and a production smoke test — all
run against an ephemeral MongoDB, no install needed:

```bash
npm run test:api     # 67 automated API checks (register, bookings, payments, admin…)
npm run test:white   # 27 white-box unit + HTTP branch tests with coverage
npm run test:prod    # boots the production server + serves the built frontend
```

## 📊 Sample Data

The platform comes with pre-populated sample data:
- **3 Teachers** (2 approved, 1 pending)
- **2 Students** with booking history
- **4 Bookings** in different states
- **3 Reviews** with ratings
- **Payment records** for demonstration

## 🎯 Key Features Showcase

### Student Experience
1. **Browse Teachers** - View profiles with ratings and experience
2. **Book Sessions** - Instant booking with payment
3. **Leave Reviews** - Rate teachers after sessions
4. **Track Progress** - Monitor learning journey

### Teacher Experience
1. **Manage Profile** - Set rates, subjects, availability
2. **Handle Requests** - Accept/reject bookings
3. **Track Earnings** - Monitor income and statistics
4. **View Feedback** - See student reviews

### Admin Control
1. **User Approval** - Verify and approve teachers
2. **Financial Management** - Control payouts and fees
3. **Platform Analytics** - Monitor growth and usage
4. **Content Moderation** - Manage reviews and disputes

## 🔮 Future Enhancements

- [ ] Real-time chat system
- [ ] Video call integration (Zoom/Google Meet)
- [ ] Email notifications
- [ ] Mobile app (React Native)
- [ ] Advanced analytics
- [ ] Multi-language support
- [ ] Calendar integration
- [ ] Automated scheduling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **TailwindCSS** for the amazing utility-first CSS framework
- **Lucide** for the beautiful icon set
- **React** team for the excellent frontend library
- **Express.js** for the robust backend framework

## 📞 Support

If you have any questions or need help with deployment, please:
- Open an issue on [GitHub](https://github.com/rajaryan1303/Tutor-connect/issues)
- Contact: rajaryan1303y@gmail.com
- Documentation: [Wiki](https://github.com/rajaryan1303/Tutor-connect/wiki)

---

⭐ **Star this repository if you find it helpful!**

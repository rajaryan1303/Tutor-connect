# 🎓 TutorConnect - Professional Tutoring Platform

A comprehensive, full-stack tutoring platform with modern UI, dark mode, and complete user management system.

![TutorConnect Platform](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![React](https://img.shields.io/badge/React-18.2.0-blue)
![Node.js](https://img.shields.io/badge/Node.js-Express-green)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.3.6-blue)

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
- **Authentication**: JWT (JSON Web Tokens)
- **Styling**: TailwindCSS with custom dark mode
- **State Management**: React Context API
- **Payment**: Mock payment system (Stripe/Razorpay ready)
- **Database**: In-memory (easily replaceable with MongoDB/PostgreSQL)

## 📦 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/tutorconnect.git
cd tutorconnect
```

2. **Install dependencies**
```bash
npm install
```

3. **Start the backend server**
```bash
npm run server
```

4. **Start the frontend (in a new terminal)**
```bash
npm run dev
```

5. **Open your browser**
Navigate to `http://localhost:3000`

## 🔐 Default Credentials

### Admin Access
- **Email**: `admin@tutorconnect.com`
- **Password**: `admin123`

### Sample Teacher (Pre-approved)
- **Email**: `sarah@example.com`
- **Password**: `admin123`

### Sample Student
- **Email**: `alex@example.com`
- **Password**: `admin123`

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
├── server/
│   ├── routes/            # API endpoints
│   ├── middleware/        # Express middleware
│   ├── data/             # Mock database
│   └── index.js          # Server entry point
├── public/               # Static assets
└── package.json         # Dependencies and scripts
```

## 🌐 Deployment Options

### Option 1: Netlify (Recommended for Frontend)

1. **Build the project**
```bash
npm run build
```

2. **Deploy to Netlify**
- Drag and drop the `dist` folder to Netlify
- Or connect your GitHub repository for automatic deployments

### Option 2: Vercel

1. **Install Vercel CLI**
```bash
npm i -g vercel
```

2. **Deploy**
```bash
vercel --prod
```

### Option 3: Railway (Full-Stack)

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
NODE_ENV=production
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

## 💳 Payment Integration

### Stripe Integration (Recommended)

1. **Install Stripe**
```bash
npm install stripe @stripe/stripe-js
```

2. **Update payment routes**
```javascript
// server/routes/payments.js
import Stripe from 'stripe'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
```

3. **Frontend integration**
```javascript
// Add to your booking component
import { loadStripe } from '@stripe/stripe-js'
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
- Open an issue on GitHub
- Contact: your-email@example.com
- Documentation: [Wiki](https://github.com/yourusername/tutorconnect/wiki)

---

⭐ **Star this repository if you find it helpful!**

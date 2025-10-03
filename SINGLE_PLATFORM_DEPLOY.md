# 🚀 Single Platform Deployment Guide

Deploy both frontend and backend to the same platform for simplicity!

## 🎯 Best Options for Full-Stack Deployment

### Option 1: Railway (Recommended - Easiest)

**Why Railway?**
- ✅ Automatic detection of Node.js apps
- ✅ Free tier with good limits
- ✅ Automatic HTTPS
- ✅ Easy environment variables
- ✅ GitHub integration

#### Step-by-Step Railway Deployment:

1. **Update package.json scripts:**
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "server": "node server/index.js",
    "start": "node server/index.js",
    "postinstall": "npm run build"
  }
}
```

2. **Update server/index.js for production:**
```javascript
// Add this at the top after other imports
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Add this after your API routes but before app.listen()
if (process.env.NODE_ENV === 'production') {
  // Serve static files from the dist directory
  app.use(express.static(path.join(__dirname, '../dist')))
  
  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'))
  })
}
```

3. **Deploy to Railway:**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Railway will automatically deploy!

4. **Set Environment Variables:**
   - In Railway dashboard, go to Variables tab
   - Add: `JWT_SECRET=your_secret_key_here`
   - Add: `NODE_ENV=production`

### Option 2: Render (Great Free Tier)

1. **Create render.yaml:**
```yaml
services:
  - type: web
    name: tutorconnect
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: JWT_SECRET
        generateValue: true
```

2. **Deploy:**
   - Go to [render.com](https://render.com)
   - Connect GitHub repository
   - Render will auto-deploy

### Option 3: Vercel (Serverless)

1. **Already configured with vercel.json**
2. **Deploy:**
```bash
npm i -g vercel
vercel --prod
```

### Option 4: Heroku (Classic Choice)

1. **Already configured with Procfile**
2. **Deploy:**
```bash
# Install Heroku CLI first
heroku create tutorconnect-yourname
git push heroku main
```

## 🔧 Required Code Changes for Single Platform

### Update server/index.js:

```javascript
import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'

// Import your routes
import authRoutes from './routes/auth.js'
import studentRoutes from './routes/students.js'
import teacherRoutes from './routes/teachers.js'
import bookingRoutes from './routes/bookings.js'
import paymentRoutes from './routes/payments.js'
import adminRoutes from './routes/admin.js'
import reviewRoutes from './routes/reviews.js'

const app = express()
const PORT = process.env.PORT || 5000

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Middleware
app.use(express.json())
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? true  // Allow all origins in production for single platform
    : 'http://localhost:3000',
  credentials: true
}))

// API Routes
app.use('/auth', authRoutes)
app.use('/students', studentRoutes)
app.use('/teachers', teacherRoutes)
app.use('/bookings', bookingRoutes)
app.use('/payments', paymentRoutes)
app.use('/admin', adminRoutes)
app.use('/reviews', reviewRoutes)

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')))
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'))
  })
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`Environment: ${process.env.NODE_ENV}`)
})
```

### Update AuthContext.jsx:

```javascript
// In src/context/AuthContext.jsx
const API_BASE = process.env.NODE_ENV === 'production' 
  ? '' // Same domain in production
  : 'http://localhost:5000'
```

## 🎯 Easiest Deployment Steps (Railway):

1. **Make the code changes above**
2. **Commit to GitHub:**
```bash
git add .
git commit -m "Configure for single platform deployment"
git push origin main
```

3. **Deploy to Railway:**
   - Go to railway.app
   - Sign up with GitHub
   - New Project → Deploy from GitHub
   - Select your repo
   - Done! 🎉

## 🌐 Alternative: One-Click Deploy Buttons

Add these to your README.md:

```markdown
## 🚀 Quick Deploy

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template/your-template-id)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/tutorconnect-platform)
```

## 🔍 Testing Your Deployment

After deployment, test these URLs:
- `https://yourapp.railway.app` - Should show your React app
- `https://yourapp.railway.app/auth/login` - Should show API response
- Login with: `admin@tutorconnect.com` / `admin123`

## 💡 Why Single Platform is Better:

- ✅ **Simpler setup** - One deployment instead of two
- ✅ **No CORS issues** - Frontend and backend on same domain
- ✅ **Easier management** - One URL to remember
- ✅ **Cost effective** - Usually cheaper than separate hosting
- ✅ **Better performance** - No cross-domain requests

## 🆘 Troubleshooting:

**Build fails?**
```bash
# Test locally first
npm run build
npm start
# Visit http://localhost:5000
```

**API not working?**
- Check environment variables are set
- Verify API routes are accessible at `/auth/login`

**React routing not working?**
- Make sure the `app.get('*')` catch-all route is added

Choose Railway for the easiest experience! 🚀

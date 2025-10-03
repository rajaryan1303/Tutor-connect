# 🚀 Deployment Guide for TutorConnect

This guide will walk you through deploying your TutorConnect platform to various hosting services.

## 📋 Pre-Deployment Checklist

- [ ] All code is committed to Git
- [ ] Environment variables are configured
- [ ] Build process works locally (`npm run build`)
- [ ] Both frontend and backend are tested

## 🌐 Deployment Options

### Option 1: Netlify + Railway (Recommended)

**Frontend on Netlify, Backend on Railway**

#### Step 1: Deploy Backend to Railway

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Deploy Backend**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login to Railway
   railway login
   
   # Create new project
   railway new
   
   # Deploy
   railway up
   ```

3. **Set Environment Variables**
   ```bash
   railway variables set JWT_SECRET=your_jwt_secret_here
   railway variables set NODE_ENV=production
   ```

4. **Get Backend URL**
   - Copy the generated Railway URL (e.g., `https://yourapp.railway.app`)

#### Step 2: Deploy Frontend to Netlify

1. **Update API Base URL**
   ```javascript
   // In src/context/AuthContext.jsx, update the API base URL
   const API_BASE = 'https://yourapp.railway.app'
   ```

2. **Build and Deploy**
   ```bash
   npm run build
   ```

3. **Deploy to Netlify**
   - Go to [netlify.com](https://netlify.com)
   - Drag and drop the `dist` folder
   - Or connect your GitHub repository

### Option 2: Vercel (Full-Stack)

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel --prod
   ```

3. **Set Environment Variables**
   - Go to Vercel dashboard
   - Add environment variables in project settings

### Option 3: Heroku (Full-Stack)

1. **Install Heroku CLI**
   - Download from [heroku.com](https://heroku.com)

2. **Create Heroku App**
   ```bash
   heroku create tutorconnect-yourname
   ```

3. **Set Environment Variables**
   ```bash
   heroku config:set JWT_SECRET=your_jwt_secret_here
   heroku config:set NODE_ENV=production
   ```

4. **Deploy**
   ```bash
   git push heroku main
   ```

### Option 4: DigitalOcean App Platform

1. **Create DigitalOcean Account**
2. **Connect GitHub Repository**
3. **Configure Build Settings**
   - Build Command: `npm run build`
   - Run Command: `npm start`
4. **Set Environment Variables**
5. **Deploy**

## 🔧 Environment Variables Setup

Create these environment variables on your hosting platform:

```env
# Required
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters
NODE_ENV=production
PORT=5000

# Optional (for real payment integration)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...

# Optional (for email notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## 📦 Build Configuration

### For Static Hosting (Netlify/Vercel Frontend Only)

Update `package.json`:
```json
{
  "scripts": {
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

### For Full-Stack Hosting (Railway/Heroku)

Update `package.json`:
```json
{
  "scripts": {
    "start": "node server/index.js",
    "build": "vite build",
    "postinstall": "npm run build"
  }
}
```

## 🔗 GitHub Repository Setup

### Step 1: Initialize Git Repository

```bash
# Navigate to your project directory
cd c:/Users/raj/Desktop/apps/website

# Initialize Git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: TutorConnect platform"
```

### Step 2: Create GitHub Repository

1. **Go to GitHub**
   - Visit [github.com](https://github.com)
   - Click "New repository"

2. **Repository Settings**
   - Name: `tutorconnect-platform`
   - Description: "Professional tutoring platform with React and Node.js"
   - Make it Public (or Private if preferred)
   - Don't initialize with README (you already have one)

3. **Connect Local Repository**
   ```bash
   # Add remote origin (replace with your GitHub username)
   git remote add origin https://github.com/yourusername/tutorconnect-platform.git
   
   # Push to GitHub
   git branch -M main
   git push -u origin main
   ```

### Step 3: Enable GitHub Pages (Optional)

1. Go to repository Settings
2. Scroll to "Pages" section
3. Select source: "Deploy from a branch"
4. Choose branch: `main`
5. Folder: `/ (root)`

## 🌍 Custom Domain Setup

### For Netlify

1. **Buy Domain** (Namecheap, GoDaddy, etc.)
2. **Add Domain in Netlify**
   - Go to Site Settings > Domain Management
   - Add custom domain
3. **Update DNS Records**
   - Add CNAME record pointing to your Netlify subdomain

### For Vercel

1. **Add Domain in Vercel Dashboard**
2. **Update DNS Records**
   - Add A record: `76.76.19.61`
   - Add CNAME record for www: `cname.vercel-dns.com`

## 🔒 Security Considerations

### Production Environment Variables

```env
# Generate strong JWT secret
JWT_SECRET=$(openssl rand -base64 32)

# Use production database
DATABASE_URL=postgresql://user:pass@host:port/dbname

# Enable HTTPS only
HTTPS_ONLY=true
```

### CORS Configuration

Update `server/index.js`:
```javascript
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com', 'https://www.yourdomain.com']
    : 'http://localhost:3000',
  credentials: true
}))
```

## 📊 Monitoring & Analytics

### Add Google Analytics

1. **Get GA4 Tracking ID**
2. **Add to `index.html`**
   ```html
   <!-- Google tag (gtag.js) -->
   <script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
   <script>
     window.dataLayer = window.dataLayer || [];
     function gtag(){dataLayer.push(arguments);}
     gtag('js', new Date());
     gtag('config', 'GA_MEASUREMENT_ID');
   </script>
   ```

### Error Monitoring

Consider adding:
- **Sentry** for error tracking
- **LogRocket** for session replay
- **Hotjar** for user behavior analytics

## 🚀 Performance Optimization

### Build Optimization

```javascript
// vite.config.js
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom']
        }
      }
    }
  }
})
```

### CDN Setup

Consider using:
- **Cloudflare** for global CDN
- **AWS CloudFront** for advanced caching
- **Netlify CDN** (automatic with Netlify)

## 🔄 Continuous Deployment

### GitHub Actions (Automatic Deployment)

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
    - name: Install dependencies
      run: npm install
    - name: Build
      run: npm run build
    - name: Deploy to Netlify
      uses: netlify/actions/cli@master
      with:
        args: deploy --prod --dir=dist
      env:
        NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
        NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
```

## 📞 Support

If you encounter issues during deployment:

1. **Check the logs** on your hosting platform
2. **Verify environment variables** are set correctly
3. **Test locally** with production build (`npm run build && npm run preview`)
4. **Open an issue** on GitHub with error details

## ✅ Post-Deployment Checklist

- [ ] All pages load correctly
- [ ] Authentication works
- [ ] Database connections are stable
- [ ] Payment system is functional (if integrated)
- [ ] Email notifications work (if configured)
- [ ] SSL certificate is active
- [ ] Domain is properly configured
- [ ] Analytics are tracking
- [ ] Error monitoring is active

---

🎉 **Congratulations! Your TutorConnect platform is now live!**

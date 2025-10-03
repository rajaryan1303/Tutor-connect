# 📚 GitHub Setup Guide - Step by Step

Follow these exact steps to upload your TutorConnect project to GitHub and deploy it.

## 🎯 Step 1: Prepare Your Project

Open PowerShell/Command Prompt and navigate to your project:

```powershell
cd "C:\Users\raj\Desktop\apps\website"
```

## 🔧 Step 2: Initialize Git Repository

```powershell
# Initialize Git repository
git init

# Add all files to staging
git add .

# Make your first commit
git commit -m "Initial commit: TutorConnect - Professional Tutoring Platform"
```

## 🌐 Step 3: Create GitHub Repository

1. **Go to GitHub.com**
   - Visit [github.com](https://github.com)
   - Click the **"+"** button in the top right
   - Select **"New repository"**

2. **Repository Settings**
   - **Repository name**: `tutorconnect-platform`
   - **Description**: `Professional tutoring platform with React, Node.js, and modern UI`
   - **Visibility**: Public (recommended for portfolio)
   - **DON'T** check "Add a README file" (you already have one)
   - **DON'T** add .gitignore or license (already created)
   - Click **"Create repository"**

## 🔗 Step 4: Connect Local Repository to GitHub

**Replace `yourusername` with your actual GitHub username:**

```powershell
# Add remote repository (REPLACE yourusername with your GitHub username)
git remote add origin https://github.com/yourusername/tutorconnect-platform.git

# Set main branch
git branch -M main

# Push to GitHub
git push -u origin main
```

## ✅ Step 5: Verify Upload

1. Refresh your GitHub repository page
2. You should see all your files uploaded
3. The README.md should display with all the project information

## 🚀 Step 6: Deploy Your Project

### Option A: Deploy to Netlify (Easiest - Frontend Only)

1. **Build your project locally:**
   ```powershell
   npm run build
   ```

2. **Go to Netlify:**
   - Visit [netlify.com](https://netlify.com)
   - Sign up with GitHub account
   - Click "Add new site" → "Import an existing project"
   - Choose GitHub and select your repository
   - Build settings:
     - Build command: `npm run build`
     - Publish directory: `dist`
   - Click "Deploy site"

### Option B: Deploy to Railway (Full-Stack - Recommended)

1. **Go to Railway:**
   - Visit [railway.app](https://railway.app)
   - Sign up with GitHub account

2. **Create New Project:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your `tutorconnect-platform` repository

3. **Configure Environment Variables:**
   - Go to your project settings
   - Add these variables:
     ```
     JWT_SECRET=tutorconnect_super_secret_key_2024_production
     NODE_ENV=production
     PORT=5000
     ```

4. **Deploy:**
   - Railway will automatically build and deploy
   - You'll get a URL like `https://yourapp.railway.app`

### Option C: Deploy to Vercel (Full-Stack)

1. **Install Vercel CLI:**
   ```powershell
   npm install -g vercel
   ```

2. **Deploy:**
   ```powershell
   vercel --prod
   ```

3. **Follow prompts:**
   - Link to existing project? No
   - Project name: tutorconnect-platform
   - Directory: ./
   - Override settings? No

## 🔧 Step 7: Update Package.json for Production

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "server": "node server/index.js",
    "start": "node server/index.js"
  }
}
```

## 🌍 Step 8: Test Your Deployed Application

1. **Open your deployed URL**
2. **Test these features:**
   - ✅ Home page loads
   - ✅ Login with: `admin@tutorconnect.com` / `admin123`
   - ✅ Dark mode toggle works
   - ✅ Admin dashboard shows data
   - ✅ Register new student/teacher
   - ✅ Booking system works

## 📱 Step 9: Make Your Repository Stand Out

### Add Topics to Your Repository

1. Go to your GitHub repository
2. Click the ⚙️ gear icon next to "About"
3. Add these topics:
   ```
   react nodejs tutoring-platform education-technology 
   tailwindcss express-js full-stack-application 
   booking-system payment-integration dark-mode
   ```

### Create a Great Repository Description

```
🎓 Professional tutoring platform with React & Node.js featuring user management, booking system, payments, reviews, and modern dark mode UI. Perfect for connecting students with teachers.
```

## 🔄 Step 10: Future Updates

When you make changes to your code:

```powershell
# Add changes
git add .

# Commit with descriptive message
git commit -m "Add new feature: real-time notifications"

# Push to GitHub
git push origin main
```

Your deployment platform will automatically redeploy with the new changes!

## 🎯 Quick Commands Summary

```powershell
# Initial setup (run once)
cd "C:\Users\raj\Desktop\apps\website"
git init
git add .
git commit -m "Initial commit: TutorConnect Platform"
git remote add origin https://github.com/YOURUSERNAME/tutorconnect-platform.git
git branch -M main
git push -u origin main

# Future updates (run when you make changes)
git add .
git commit -m "Description of your changes"
git push origin main
```

## 🏆 Portfolio Tips

### Add to Your Portfolio

1. **GitHub Profile README**
   - Add this project to your pinned repositories
   - Include a screenshot in your profile README

2. **LinkedIn Post**
   ```
   🚀 Just built and deployed TutorConnect - a full-stack tutoring platform!

   ✨ Features:
   • React 18 with modern UI/UX
   • Node.js backend with JWT authentication
   • Dark/Light mode toggle
   • Payment integration ready
   • Admin dashboard with analytics
   • Responsive design

   🔗 Live Demo: [your-deployed-url]
   💻 Code: https://github.com/yourusername/tutorconnect-platform

   #React #NodeJS #FullStack #WebDevelopment
   ```

3. **Resume Project Description**
   ```
   TutorConnect - Full-Stack Tutoring Platform
   • Built responsive web application using React 18, Node.js, and TailwindCSS
   • Implemented JWT authentication, role-based access control, and payment system
   • Created admin dashboard with user management and analytics
   • Deployed on Railway/Netlify with CI/CD pipeline
   • Technologies: React, Node.js, Express, TailwindCSS, JWT
   ```

## 🆘 Troubleshooting

### Common Issues:

1. **Git not recognized**
   ```powershell
   # Install Git from git-scm.com first
   ```

2. **Permission denied (GitHub)**
   ```powershell
   # Use personal access token instead of password
   # Go to GitHub Settings > Developer settings > Personal access tokens
   ```

3. **Build fails on deployment**
   ```powershell
   # Test build locally first
   npm run build
   ```

4. **Environment variables not working**
   - Make sure they're set in your deployment platform
   - Check spelling and format

## 🎉 Congratulations!

Your TutorConnect platform is now:
- ✅ Uploaded to GitHub
- ✅ Deployed and live
- ✅ Ready for your portfolio
- ✅ Accessible to potential employers

**Next Steps:**
1. Share the live URL with friends and family
2. Add it to your portfolio website
3. Include it in job applications
4. Consider adding more features like real-time chat or video calls

---

**Need help?** Create an issue on your GitHub repository or reach out for support!

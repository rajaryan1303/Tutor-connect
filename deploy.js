#!/usr/bin/env node

// Simple deployment helper script
import { execSync } from 'child_process'
import fs from 'fs'

console.log('🚀 TutorConnect Deployment Helper\n')

// Check if this is first time setup
const hasGitRepo = fs.existsSync('.git')

if (!hasGitRepo) {
  console.log('📦 Setting up Git repository...')
  execSync('git init', { stdio: 'inherit' })
  execSync('git add .', { stdio: 'inherit' })
  execSync('git commit -m "Initial commit: TutorConnect Platform"', { stdio: 'inherit' })
  
  console.log('\n✅ Git repository initialized!')
  console.log('\n📋 Next steps:')
  console.log('1. Create a new repository on GitHub')
  console.log('2. Run: git remote add origin https://github.com/yourusername/tutorconnect-platform.git')
  console.log('3. Run: git push -u origin main')
  console.log('\n🚀 Then deploy to Railway:')
  console.log('1. Go to railway.app')
  console.log('2. Sign up with GitHub')
  console.log('3. New Project → Deploy from GitHub repo')
  console.log('4. Select your repository')
  console.log('5. Add environment variable: JWT_SECRET=your_secret_key')
} else {
  console.log('📤 Pushing changes to GitHub...')
  execSync('git add .', { stdio: 'inherit' })
  execSync('git commit -m "Update: Ready for single platform deployment"', { stdio: 'inherit' })
  execSync('git push origin main', { stdio: 'inherit' })
  
  console.log('\n✅ Changes pushed to GitHub!')
  console.log('🔄 Your deployment platform should automatically redeploy')
}

console.log('\n🎉 Deployment helper completed!')

import 'dotenv/config'
import mongoose from 'mongoose'
import { connectDB } from './config/db.js'
import { seedData } from './seedData.js'

async function run() {
  await connectDB()
  console.log('Connected, seeding TutorConnect database...')
  await seedData()
  console.log('Seed complete.')
  console.log('  Admin:   admin@tutorconnect.com / admin123')
  console.log('  Teacher: sarah@example.com / admin123')
  console.log('  Student: raj@123com / admin123')
  await mongoose.disconnect()
}

run().catch(err => {
  console.error('Seed failed:', err)
  process.exit(1)
})
import { spawn } from 'child_process'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { MongoClient } from 'mongodb'
import 'dotenv/config'
import { connectDB } from '../config/db.js'
import { seedData } from '../seedData.js'

// Phase 14 verification: boots the production server (serves dist + API on one port)
// against an ephemeral MongoDB, then exercises health / index / login.
const mongod = await MongoMemoryServer.create()
process.env.MONGODB_URI = mongod.getUri('tutor_connect')
process.env.NODE_ENV = 'production'

await connectDB()
await seedData()

const child = spawn(process.execPath, ['backend/server.js'], { stdio: 'inherit', env: process.env })

let ok = true
try {
  let resolved = false
  for (let i = 0; i < 20 && !resolved; i++) {
    await new Promise(r => setTimeout(r, 1000))
    try {
      const health = await (await fetch('http://localhost:5000/api/health')).json()
      console.log('HEALTH:', JSON.stringify(health))
      ok = ok && health.success === true

      const page = await fetch('http://localhost:5000/')
      const html = await page.text()
      console.log('INDEX status:', page.status, '| title ok:', html.includes('TutorConnect - Professional Tutoring Platform'))
      ok = ok && page.status === 200

      const login = await (await fetch('http://localhost:5000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@tutorconnect.com', password: 'admin123' }),
      })).json()
      console.log('LOGIN token:', Boolean(login.token), '| role:', login.user?.role)
      ok = ok && Boolean(login.token)

      resolved = true
    } catch (e) {
      if (i === 19) { console.error('FAILED after retries', e.message); ok = false }
    }
  }
} finally {
  child.kill()
  await new MongoClient(process.env.MONGODB_URI).close()
  await mongod.stop()
}
console.log(ok ? 'PRODUCTION SMOKE TEST PASSED' : 'PRODUCTION SMOKE TEST FAILED')
process.exit(ok ? 0 : 1)
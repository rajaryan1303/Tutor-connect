import { spawn } from 'child_process'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { connectDB } from '../config/db.js'
import { seedData } from '../seedData.js'

// Development convenience: boots an ephemeral MongoDB (no install required),
// seeds sample data, then starts the real API server on MONGODB_URI.
// Set MONGODB_URI in .env to skip this and use your own MongoDB instead.
async function main() {
  let mongod = null
  if (!process.env.MONGODB_URI) {
    console.log('Starting ephemeral MongoDB (mongodb-memory-server)...')
    mongod = await MongoMemoryServer.create()
    process.env.MONGODB_URI = mongod.getUri('tutor_connect')
    await connectDB()
    await seedData()
    console.log(`MongoDB ready at ${process.env.MONGODB_URI} (seeded)`)
  }

  const child = spawn(process.execPath, ['backend/server.js'], {
    stdio: 'inherit',
    env: process.env,
  })

  const shutdown = async () => {
    child.kill()
    if (mongod) await mongod.stop()
    process.exit(0)
  }
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

main().catch(err => {
  console.error('Failed to start dev server:', err)
  process.exit(1)
})
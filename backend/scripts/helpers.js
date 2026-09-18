import { MongoMemoryServer } from 'mongodb-memory-server'
import 'dotenv/config'
import { connectDB } from '../config/db.js'
import { seedData } from '../seedData.js'

let mongod

// Merge helper: use TEST_MONGODB_URI if provided, else ephemeral in-memory MongoDB.
export async function startTestServer() {
  if (!process.env.TEST_MONGODB_URI) {
    mongod = await MongoMemoryServer.create()
    process.env.MONGODB_URI = mongod.getUri('tutor_connect_test')
  } else {
    process.env.MONGODB_URI = process.env.TEST_MONGODB_URI
  }
  await connectDB()
  await seedData()

  const { default: app } = await import('../server.js')
  const server = await new Promise(resolve => {
    const s = app.listen(0, () => resolve(s))
  })
  const port = server.address().port
  return { base: `http://127.0.0.1:${port}`, server }
}

export async function stopTestServer() {
  if (mongod) await mongod.stop()
}

export async function startMongoMemory() {
  mongod = await MongoMemoryServer.create()
  process.env.MONGODB_URI = mongod.getUri('tutor_connect_test')
  return mongod
}
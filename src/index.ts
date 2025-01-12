import MongoStore from "connect-mongo"
import dotenv from 'dotenv'
import express, { Express } from "express"
import session from "express-session"
import helmet from 'helmet'
import { MongoMemoryServer } from "mongodb-memory-server"
import mongoose from "mongoose"
import passport from "passport"
import "./auth/passport"
import authRoutes from './routes/auth'

const app: Express = express()

// JSON middleware
app.use(express.json())

// Add security headers
app.use(helmet())

// Load environment variables
dotenv.config()

async function startServer(mongoUri?: string) {
  if (!mongoUri) {
    // Start in-memory Mongo server
    const mongoServer = await MongoMemoryServer.create()
    mongoUri = mongoServer.getUri()
  }

  await mongoose.connect(mongoUri)

  // Session configuration
  app.use(session({
    secret: process.env.SESSION_SECRET || 'dev-secret-key',
    resave: false,            // Don't save session if unmodified
    saveUninitialized: false, // Don't create session until something is stored
    cookie: {
      sameSite: 'strict',     // Mitigate CSRF attacks
      httpOnly: true,         // Mitigate XSS attacks
      secure: process.env.NODE_ENV === 'production', // Use HTTPS in production
      maxAge: 24 * 60 * 60 * 1000  // 24 hours
    },
    name: 'sessionId',        // Change from default 'connect.sid'
    rolling: true,            // Reset expiry on activity
    store: MongoStore.create({ mongoUrl: mongoUri })
  }))

  // Initialize Passport
  app.use(passport.initialize())
  app.use(passport.session())

  // Mount routes
  app.use('/auth', authRoutes)

  // Start server
  const PORT = 3000
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
}

// Start the server when the file is executed directly
if (require.main === module) {
  startServer().catch(console.error)
}

export { app, startServer }

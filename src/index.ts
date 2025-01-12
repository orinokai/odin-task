import MongoStore from "connect-mongo"
import express, { Express } from "express"
import session from "express-session"
import helmet from 'helmet'
import { MongoMemoryServer } from "mongodb-memory-server"
import mongoose from "mongoose"
import passport from "passport"
import "./auth/passport"
import authRoutes from './routes/auth'

const app: Express = express()

// Parse JSON requests
app.use(express.json())

// Add security headers
app.use(helmet())

async function startServer(mongoUri?: string) {
  // Init in-memory Mongo server unless mongoUri is provided, e.g. for testing
  if (!mongoUri) {
    const mongoServer = await MongoMemoryServer.create()
    mongoUri = mongoServer.getUri()
  }
  await mongoose.connect(mongoUri)

  // Session configuration
  app.use(session({
    secret: process.env.SESSION_SECRET || 'dev-secret-key',
    name: process.env.SESSION_ID || 'sessionId', // Change from default 'connect.sid'
    resave: false,            // Don't save session if unmodified
    saveUninitialized: false, // Don't create session until something is stored
    rolling: true,            // Reset expiry on activity
    cookie: {
      sameSite: 'strict',     // Mitigate CSRF attacks
      httpOnly: true,         // Mitigate XSS attacks
      secure: process.env.NODE_ENV === 'production', // Use HTTPS in production
      maxAge: 24 * 60 * 60 * 1000  // 24 hours
    },
    store: MongoStore.create({ mongoUrl: mongoUri })
  }))

  // Initialize Passport
  app.use(passport.initialize())
  app.use(passport.session())

  // Mount routes
  app.use('/auth', authRoutes)

  // Start server
  const PORT = process.env.PORT || 3000
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
}

// Start server when the file is executed directly
if (require.main === module) {
  startServer().catch(console.error)
}

export { app, startServer }

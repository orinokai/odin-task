import MongoStore from "connect-mongo"
import express, { Express, Request, Response } from "express"
import rateLimit from "express-rate-limit"
import session from "express-session"
import { MongoMemoryServer } from "mongodb-memory-server"
import mongoose from "mongoose"
import passport from "passport"
import "./auth/passport"
import User from "./models/user"

const app: Express = express()

// Rate limiter
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: { error: 'Too many login attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
})

async function startServer(mongoUri?: string) {
  if (!mongoUri) {
    // Start in-memory Mongo server
    const mongoServer = await MongoMemoryServer.create()
    mongoUri = mongoServer.getUri()
  }

  await mongoose.connect(mongoUri)

  // Session configuration
  app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { sameSite: 'strict', httpOnly: true },
    store: MongoStore.create({ mongoUrl: mongoUri })
  }))

  // Initialize Passport
  app.use(passport.initialize())
  app.use(passport.session())

  // Basic middleware
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))

  // Routes
  app.post('/register', async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body
      const user = new User({ username, password })
      await user.save()
      res.status(201).json({ message: 'User registered successfully' })
    } catch (error) {
      res.status(400).json({ error: error })
    }
  })

  app.post('/login', loginLimiter, passport.authenticate('local'), (req: Request, res: Response) => {
    res.json({ message: 'Logged in successfully' })
  })

  app.get('/logout', (req: Request, res: Response) => {
    req.logout(() => {
      res.json({ message: 'Logged out successfully' })
    })
  })

  app.get('/profile', (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      res.status(401).json({ message: 'Not authenticated' })
    }
    res.json({ user: req.user })
  })

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

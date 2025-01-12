import { Request, Response, Router } from 'express'
import rateLimit from 'express-rate-limit'
import mongoose from 'mongoose'
import passport from 'passport'
import User from '../models/user'

const router = Router()

// Rate limiter
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: { error: 'Too many login attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
})

// Routes
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body
    const user = new User({ username, password })
    await user.save()
    res.status(201).json({ message: 'User registered successfully' })
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      res.status(400).json({ error: 'Invalid input' })
    } else {
      console.error(error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
})

router.post('/login', loginLimiter, passport.authenticate('local'), (req: Request, res: Response) => {
  res.json({ message: 'Logged in successfully' })
})

router.get('/logout', (req: Request, res: Response) => {
  req.logout(() => {
    res.json({ message: 'Logged out successfully' })
  })
})

router.get('/profile', (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ message: 'Not authenticated' })
  }
  res.json({ user: req.user })
})

export default router 

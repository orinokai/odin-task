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
      // Extract validation error messages
      const errors = Object.values(error.errors).map(err => err.message)
      res.status(400).json({ 
        error: 'Validation failed', 
        details: errors 
      })
    } else if ((error as any).code === 11000) {
      // Handle duplicate key (username) error
      res.status(400).json({ 
        error: 'Username already exists' 
      })
    } else {
      console.error(error)
      res.status(500).json({ 
        error: 'Internal server error' 
      })
    }
  }
})

router.post('/login', loginLimiter, (req: Request, res: Response, next) => {
  passport.authenticate('local', (err: any, user: any, _: any) => {
    if (err) {
      return res.status(500).json({ error: 'Internal server error' })
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    req.login(user, (err: any) => {
      if (err) {
        return res.status(500).json({ error: 'Could not log in' })
      }
      res.json({ message: 'Logged in successfully' })
    })
  })(req, res, next)
})

router.post('/logout', (req: Request, res: Response) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Could not log out' })
    }
    res.json({ message: 'Logged out successfully' })
  })
})

router.get('/profile', (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: 'Not authenticated' })
    return
  }
  res.json({ user: req.user })
})

export default router 

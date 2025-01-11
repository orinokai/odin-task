import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import request from 'supertest'
import User from '../src/models/user'

import { app, startServer } from '../src/index'

describe('Authentication Tests', () => {
  let mongoServer: MongoMemoryServer

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create()
    const mongoUri = mongoServer.getUri()
    await startServer(mongoUri)
  })

  afterAll(async () => {
    await mongoose.disconnect()
    await mongoServer.stop()
  })

  beforeEach(async () => {
    await User.deleteMany({})
  })

  describe('User Registration', () => {
    it('should successfully register a new user', async () => {
      const response = await request(app)
        .post('/register')
        .send({
          username: 'testuser',
          password: 'testpass123'
        })

      expect(response.status).toBe(201)
      expect(response.body.message).toBe('User registered successfully')

      // Verify user was created in database
      const user = await User.findOne({ username: 'testuser' })
      expect(user).toBeTruthy()
      expect(user?.username).toBe('testuser')
    })

    it('should prevent duplicate username registration', async () => {
      // First registration
      await request(app)
        .post('/register')
        .send({
          username: 'testuser',
          password: 'testpass123'
        })

      // Attempt duplicate registration
      const response = await request(app)
        .post('/register')
        .send({
          username: 'testuser',
          password: 'differentpass'
        })

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })
  })

  describe('Login Authentication', () => {
    beforeEach(async () => {
      // Create a test user before each login test
      await request(app)
        .post('/register')
        .send({
          username: 'logintest',
          password: 'testpass123'
        })
    })

    it('should successfully login with correct credentials', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          username: 'logintest',
          password: 'testpass123'
        })

      expect(response.status).toBe(200)
      expect(response.body.message).toBe('Logged in successfully')
    })

    it('should fail login with incorrect password', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          username: 'logintest',
          password: 'wrongpassword'
        })

      expect(response.status).toBe(401)
    })

    it('should fail login with non-existent username', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          username: 'nonexistentuser',
          password: 'testpass123'
        })

      expect(response.status).toBe(401)
    })
  })

  describe('Password Security', () => {
    it('should hash password during user registration', async () => {
      const plainPassword = 'testpass123'
      
      await request(app)
        .post('/register')
        .send({
          username: 'hashtest',
          password: plainPassword
        })

      const user = await User.findOne({ username: 'hashtest' })
      expect(user?.password).not.toBe(plainPassword)
      expect(user?.password).toMatch(/^\$2[aby]\$\d+\$/)  // bcrypt hash pattern
    })

    it('should correctly compare passwords', async () => {
      // Create a user
      const user = new User({
        username: 'comparetest',
        password: 'testpass123'
      })
      await user.save()

      // Test correct password
      const correctResult = await user.comparePassword('testpass123')
      expect(correctResult).toBe(true)

      // Test incorrect password
      const incorrectResult = await user.comparePassword('wrongpass')
      expect(incorrectResult).toBe(false)
    })
  })
}) 

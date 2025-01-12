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
        .post('/auth/register')
        .send({
          username: 'testuser',
          password: 'testPass123!'
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
        .post('/auth/register')
        .send({
          username: 'testuser',
          password: 'testPass123!'
        })

      // Attempt duplicate registration
      const response = await request(app)
        .post('/auth/register')
        .send({
          username: 'testuser',
          password: 'differentTestPass123!'
        })

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })
  })

  describe('Login Authentication', () => {
    beforeEach(async () => {
      // Create a test user before each login test
      await request(app)
        .post('/auth/register')
        .send({
          username: 'logintest',
          password: 'testPass123!'
        })
    })

    it('should successfully login with correct credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          username: 'logintest',
          password: 'testPass123!'
        })

      expect(response.status).toBe(200)
      expect(response.body.message).toBe('Logged in successfully')
    })

    it('should fail login with incorrect password', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          username: 'logintest',
          password: 'wrongpassword'
        })

      expect(response.status).toBe(401)
    })

    it('should fail login with non-existent username', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          username: 'nonexistentuser',
          password: 'testPass123!'
        })

      expect(response.status).toBe(401)
    })
  })

  describe('Password Security', () => {
    it('should hash password during user registration', async () => {
      const plainPassword = 'testPass123!'
      
      await request(app)
        .post('/auth/register')
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
        password: 'testPass123!'
      })
      await user.save()

      // Test correct password
      const correctResult = await user.comparePassword('testPass123!')
      expect(correctResult).toBe(true)

      // Test incorrect password
      const incorrectResult = await user.comparePassword('wrongpass')
      expect(incorrectResult).toBe(false)
    })
  })

  describe('Profile Access', () => {
    it('should deny access when not authenticated', async () => {
      const response = await request(app)
        .get('/auth/profile')
      
      expect(response.status).toBe(401)
      expect(response.body).toEqual({ error: 'Not authenticated' })
    })

    it('should allow access when authenticated', async () => {
      // Register and login a user first
      await request(app)
        .post('/auth/register')
        .send({
          username: 'profiletest',
          password: 'testPass123!'
        })

      const agent = request.agent(app)  // Use agent to maintain session
      await agent
        .post('/auth/login')
        .send({
          username: 'profiletest',
          password: 'testPass123!'
        })

      // Try to access profile
      const response = await agent.get('/auth/profile')
      
      expect(response.status).toBe(200)
      expect(response.body.user).toBeDefined()
      expect(response.body.user.username).toBe('profiletest')
    })
  })
}) 

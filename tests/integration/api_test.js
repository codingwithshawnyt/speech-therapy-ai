// api_test.js

import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

import app from '../app'; // Assuming your Express app is exported from app.js
import User from '../models/User';
import Session from '../models/Session';
import Progress from '../models/Progress';

// Mock database connection (optional)
// If you're using a test database, you might not need to mock it
jest.mock('../config/database', () => ({
  mongoose: {
    connect: jest.fn(),
    connection: {
      close: jest.fn(),
    },
  },
  redisClient: {
    // Mock Redis client methods as needed
    getAsync: jest.fn(),
    setAsync: jest.fn(),
  },
}));

// JWT Secret Key (should be the same as in your auth.js)
const JWT_SECRET = process.env.JWT_SECRET;

// Helper function to generate JWT token
const generateToken = (user) => {
  return jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });
};

describe('API Tests', () => {
  let testUser;
  let token;

  beforeAll(async () => {
    // Connect to the database (if not mocked)
    // await mongoose.connect(process.env.MONGO_URI_TEST, {
    //   useNewUrlParser: true,
    //   useUnifiedTopology: true,
    // });

    // Create a test user
    testUser = new User({
      firstName: 'Test',
      lastName: 'User',
      email: 'testuser@example.com',
      password: 'testpassword',
    });
    await testUser.save();

    // Generate a JWT token for the test user
    token = generateToken(testUser);
  });

  afterAll(async () => {
    // Delete the test user
    await User.findByIdAndRemove(testUser._id);

    // Close the database connection (if not mocked)
    // await mongoose.connection.close();
  });

  describe('Authentication', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/signup')
        .send({
          firstName: 'New',
          lastName: 'User',
          email: 'newuser@example.com',
          password: 'newpassword',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toBeDefined();
    });

    it('should log in an existing user', async () => {
      const res = await request(app)
        .post('/api/login')
        .send({
          email: 'testuser@example.com',
          password: 'testpassword',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toBeDefined();
    });

    it('should return 401 for invalid credentials', async () => {
      const res = await request(app)
        .post('/api/login')
        .send({
          email: 'testuser@example.com',
          password: 'wrongpassword',
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toBe('Invalid credentials');
    });
  });

  describe('User Management', () => {
    it('should get the current user profile', async () => {
      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.firstName).toBe('Test');
      expect(res.body.lastName).toBe('User');
      expect(res.body.email).toBe('testuser@example.com');
    });

    it('should update the current user profile', async () => {
      const res = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ firstName: 'Updated' });

      expect(res.statusCode).toBe(200);
      expect(res.body.firstName).toBe('Updated');
    });

    it('should delete the current user account', async () => {
      // Create a new user for deletion
      const deleteUser = new User({
        firstName: 'Delete',
        lastName: 'User',
        email: 'deleteuser@example.com',
        password: 'deletepassword',
      });
      await deleteUser.save();
      const deleteToken = generateToken(deleteUser);

      const res = await request(app)
        .delete('/api/users/me')
        .set('Authorization', `Bearer ${deleteToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('User account deleted');

      // Verify that the user was deleted
      const deletedUser = await User.findById(deleteUser._id);
      expect(deletedUser).toBeNull();
    });
  });

  describe('Speech Therapy API', () => {
    let sessionId;

    it('should start a new therapy session', async () => {
      const res = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(201);
      expect(res.body.userId).toBe(testUser._id.toString());
      sessionId = res.body._id; // Store the session ID for later use
    });

    it('should end a therapy session and submit analysis data', async () => {
      const res = await request(app)
        .put(`/api/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          analysisData: [
            {
              timestamp: '2024-01-01T10:05:00.000Z',
              fluencyScore: 0.95,
              speakingRate: 150,
              pauseDuration: 0.8,
              articulationRate: 5,
            },
          ],
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.endTime).toBeDefined();
    });

    it('should get user progress data', async () => {
      // Add some progress data for the test user
      const progressData = new Progress({
        userId: testUser._id,
        date: new Date(),
        fluencyScore: 0.92,
      });
      await progressData.save();

      const res = await request(app)
        .get('/api/progress')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].fluencyScore).toBe(0.92);
    });
  });

  // Add more test suites for other API routes as needed
  // ...
});
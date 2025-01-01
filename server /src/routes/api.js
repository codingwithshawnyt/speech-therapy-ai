// api.js - This file would typically be located in the 'server/src/routes' directory

import express from 'express';
import passport from 'passport';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { AuthenticationError, UserInputError } from 'apollo-server-express';
import { PubSub } from 'graphql-subscriptions';

import User from '../models/User';
import Session from '../models/Session';
import Progress from '../models/Progress';
import { speechAnalysisQueue } from '../services/speechAnalysis';
import { generateSummaryFeedback } from '../services/aiModels';
import { sendEmail } from '../utils/email';

const router = express.Router();
const pubsub = new PubSub(); // For GraphQL subscriptions

// JWT Secret Key (should be stored securely in environment variables)
const JWT_SECRET = process.env.JWT_SECRET;

// Helper function to generate JWT token
const generateToken = (user) => {
  return jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1h' }); // Token expires in 1 hour
};

// Middleware to authenticate JWT token
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];

    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        return res.sendStatus(403); // Forbidden
      }

      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401); // Unauthorized
  }
};

/**
 * User Authentication and Authorization
 */

// Signup route
router.post(
  '/signup',
  body('email').isEmail().withMessage('Invalid email format'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, firstName, lastName } = req.body;

    try {
      // Check if user already exists
      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ message: 'Email already exists' });
      }

      // Create new user
      user = new User({ email, password, firstName, lastName });
      await user.save();

      // Generate JWT token
      const token = generateToken(user);

      // Send welcome email (optional)
      sendEmail(
        email,
        'Welcome to Our Platform!',
        `Welcome, ${firstName}! Thank you for joining our platform.`
      );

      res.status(201).json({ token, user });
    } catch (error) {
      console.error('Signup error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Login route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = generateToken(user);

    res.json({ token, user });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Google authentication route
router.post('/auth/google', passport.authenticate('google-token', { session: false }), (req, res) => {
  // Generate JWT token
  const token = generateToken(req.user);
  res.json({ token, user: req.user });
});

/**
 * Speech Therapy API
 */

// Start a new therapy session
router.post('/sessions', authenticateJWT, async (req, res) => {
  try {
    const session = new Session({ userId: req.user.id });
    await session.save();
    res.status(201).json(session);
  } catch (error) {
    console.error('Error starting session:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// End a therapy session and submit analysis data
router.put('/sessions/:sessionId', authenticateJWT, async (req, res) => {
  const { sessionId } = req.params;
  const { analysisData } = req.body;

  try {
    const session = await Session.findByIdAndUpdate(
      sessionId,
      {
        endTime: new Date(),
        analysisData,
      },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Add analysis data to the processing queue
    speechAnalysisQueue.add({ sessionId, analysisData });

    res.json(session);
  } catch (error) {
    console.error('Error ending session:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's progress data
router.get('/progress', authenticateJWT, async (req, res) => {
  try {
    const progress = await Progress.find({ userId: req.user.id });
    res.json(progress);
  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GraphQL API
 */

const typeDefs = `
  type User {
    id: ID!
    email: String!
    firstName: String!
    lastName: String!
  }

  type Session {
    id: ID!
    userId: ID!
    startTime: String!
    endTime: String
    analysisData: [AnalysisData!]
  }

  type AnalysisData {
    timestamp: String!
    fluencyScore: Float!
    speakingRate: Float!
    pauseDuration: Float!
    articulationRate: Float!
  }

  type Progress {
    id: ID!
    userId: ID!
    date: String!
    fluencyScore: Float!
  }

  type Query {
    me: User
    sessions(userId: ID!): [Session!]!
    progress(userId: ID!): [Progress!]!
  }

  type Mutation {
    signup(email: String!, password: String!, firstName: String!, lastName: String!): User!
    login(email: String!, password: String!): User!
    startSession(userId: ID!): Session!
    endSession(sessionId: ID!, analysisData: [AnalysisDataInput!]!): Session!
  }

  type Subscription {
    progressUpdated(userId: ID!): Progress!
  }

  input AnalysisDataInput {
    timestamp: String!
    fluencyScore: Float!
    speakingRate: Float!
    pauseDuration: Float!
    articulationRate: Float!
  }
`;

const resolvers = {
  Query: {
    me: async (_, __, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in!');
      }
      return await User.findById(user.id);
    },
    sessions: async (_, { userId }) => {
      return await Session.find({ userId });
    },
    progress: async (_, { userId }) => {
      return await Progress.find({ userId });
    },
  },
  Mutation: {
    signup: async (_, { email, password, firstName, lastName }) => {
      try {
        const user = await User.create({ email, password, firstName, lastName });
        return user;
      } catch (error) {
        if (error.code === 11000 && error.keyPattern.email === 1) {
          throw new UserInputError('Email already exists.');
        }
        throw new Error('Failed to create user.');
      }
    },
    login: async (_, { email, password }) => {
      const user = await User.findOne({ email });
      if (!user) {
        throw new UserInputError('Invalid credentials.');
      }
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        throw new UserInputError('Invalid credentials.');
      }
      return user;
    },
    startSession: async (_, { userId }) => {
      const session = new Session({ userId });
      await session.save();
      return session;
    },
    endSession: async (_, { sessionId, analysisData }) => {
      try {
        const session = await Session.findByIdAndUpdate(
          sessionId,
          { endTime: new Date(), analysisData },
          { new: true }
        );
        if (!session) {
          throw new UserInputError('Session not found.');
        }

        // Generate summary feedback and save progress
        const summaryFeedback = await generateSummaryFeedback(analysisData);
        const progress = new Progress({
          userId: session.userId,
          date: new Date(),
          fluencyScore: summaryFeedback.fluencyScore,
        });
        await progress.save();

        // Publish progress update for GraphQL subscriptions
        pubsub.publish('PROGRESS_UPDATED', { progressUpdated: progress });

        return session;
      } catch (error) {
        console.error('Error ending session:', error);
        throw new Error('Failed to end session.');
      }
    },
  },
  Subscription: {
    progressUpdated: {
      subscribe: (_, { userId }) => pubsub.asyncIterator(`PROGRESS_UPDATED`),
    },
  },
};

export { router, typeDefs, resolvers };
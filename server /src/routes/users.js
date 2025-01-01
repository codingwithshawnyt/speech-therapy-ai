// users.js - This file would typically be located in the 'server/src/routes' directory

import express from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import gravatar from 'gravatar';
import { AuthenticationError, UserInputError } from 'apollo-server-express';

import User from '../models/User';
import { authenticateJWT } from '../utils/auth';

const router = express.Router();

/**
 * User Management API (REST)
 */

// Get current user profile (protected route)
router.get('/me', authenticateJWT, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile (protected route)
router.put(
  '/me',
  authenticateJWT,
  [
    body('firstName').optional().isString().withMessage('First name must be a string'),
    body('lastName').optional().isString().withMessage('Last name must be a string'),
    // Add more validation rules as needed
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, email, password } = req.body;

    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (firstName) user.firstName = firstName;
      if (lastName) user.lastName = lastName;
      if (email) user.email = email;
      if (password) {
        // Hash the password before saving
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
      }

      await user.save();
      res.json(user);
    } catch (error) {
      console.error('Error updating user profile:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Delete user account (protected route)
router.delete('/me', authenticateJWT, async (req, res) => {
  try {
    await User.findByIdAndRemove(req.user.id);
    res.json({ message: 'User account deleted' });
  } catch (error) {
    console.error('Error deleting user account:', error);
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
    profilePicture: String
  }

  type Query {
    user(id: ID!): User
  }

  type Mutation {
    updateUser(
      id: ID!
      firstName: String
      lastName: String
      email: String
      password: String
    ): User!
    deleteUser(id: ID!): Boolean!
  }
`;

const resolvers = {
  Query: {
    user: async (_, { id }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in!');
      }
      // Optionally add authorization check to only allow users to fetch their own profile
      // if (user.id !== id) {
      //   throw new ForbiddenError('You are not allowed to access this user.');
      // }
      return await User.findById(id);
    },
  },
  Mutation: {
    updateUser: async (_, { id, firstName, lastName, email, password }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in!');
      }
      if (user.id !== id) {
        throw new ForbiddenError('You are not allowed to update this user.');
      }

      const userToUpdate = await User.findById(id);
      if (!userToUpdate) {
        throw new UserInputError('User not found.');
      }

      if (firstName) userToUpdate.firstName = firstName;
      if (lastName) userToUpdate.lastName = lastName;
      if (email) userToUpdate.email = email;
      if (password) {
        const salt = await bcrypt.genSalt(10);
        userToUpdate.password = await bcrypt.hash(password, salt);
      }

      try {
        await userToUpdate.save();
        return userToUpdate;
      } catch (error) {
        if (error.code === 11000 && error.keyPattern.email === 1) {
          throw new UserInputError('Email already exists.');
        }
        throw new Error('Failed to update user.');
      }
    },
    deleteUser: async (_, { id }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in!');
      }
      if (user.id !== id) {
        throw new ForbiddenError('You are not allowed to delete this user.');
      }
      try {
        await User.findByIdAndRemove(id);
        return true;
      } catch (error) {
        throw new Error('Failed to delete user.');
      }
    },
  },
};

export { router, typeDefs, resolvers };
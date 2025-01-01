// auth.js - This file would typically be located in the 'server/src/routes' directory

import passport from 'passport';
import { Strategy as GoogleTokenStrategy } from 'passport-google-token';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';

import User from '../models/User';

// Google OAuth 2.0 Client ID and Secret (should be stored securely in environment variables)
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

// JWT Secret Key (should be stored securely in environment variables)
const JWT_SECRET = process.env.JWT_SECRET;

// Initialize Google OAuth2 client
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Configure Google Token Strategy for Passport.js
passport.use(
  new GoogleTokenStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Verify the Google ID token
        const ticket = await googleClient.verifyIdToken({
          idToken: accessToken,
          audience: GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();

        // Extract user information from the payload
        const { email, given_name, family_name, picture } = payload;

        // Check if the user already exists
        let user = await User.findOne({ email });

        if (!user) {
          // Create a new user if they don't exist
          user = new User({
            email,
            firstName: given_name,
            lastName: family_name,
            profilePicture: picture,
            googleId: profile.id,
          });
          await user.save();
        } else {
          // Update user information if they already exist (optional)
          user.firstName = given_name;
          user.lastName = family_name;
          user.profilePicture = picture;
          await user.save();
        }

        // Generate JWT token
        const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1h' });

        // Return the user and token
        done(null, user, { token });
      } catch (error) {
        console.error('Google authentication error:', error);
        done(error);
      }
    }
  )
);

// Helper function to generate JWT token
const generateToken = (user) => {
  return jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1h' });
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

// Export authentication middleware and helper functions
export { passport, authenticateJWT, generateToken };
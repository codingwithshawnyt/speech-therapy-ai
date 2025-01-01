// server.js - This file is the main entry point for the server application

import express from 'express';
import http from 'http';
import { ApolloServer } from 'apollo-server-express';
import { execute, subscribe } from 'graphql';
import { SubscriptionServer } from 'subscriptions-transport-ws';
import { makeExecutableSchema } from '@graphql-tools/schema';
import passport from 'passport';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { createServer } from 'https';
import fs from 'fs';

import { router as apiRouter, typeDefs as apiTypeDefs, resolvers as apiResolvers } from './routes/api';
import { router as authRouter } from './routes/auth';
import { router as usersRouter, typeDefs as usersTypeDefs, resolvers as usersResolvers } from './routes/users';
import { mongoose, redisClient } from './config/database';
import { authenticateJWT } from './utils/auth';
import { initializeWorker } from './services/worker';

// Initialize Express app
const app = express();

// Set up HTTPS server (optional)
// const httpsServer = createServer({
//   key: fs.readFileSync('path/to/key.pem'),
//   cert: fs.readFileSync('path/to/cert.pem'),
// }, app);

// Middleware
app.use(cors()); // Enable CORS
app.use(helmet()); // Set security headers
app.use(morgan('dev')); // Log requests to console
app.use(express.json()); // Parse JSON request bodies
app.use(passport.initialize()); // Initialize Passport.js

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter); // Apply rate limiter to API routes

// Routes
app.use('/api', apiRouter);
app.use('/auth', authRouter);
app.use('/users', usersRouter);

// GraphQL setup
const typeDefs = `
  ${apiTypeDefs}
  ${usersTypeDefs}
`;

const resolvers = {
  ...apiResolvers,
  ...usersResolvers,
};

const schema = makeExecutableSchema({ typeDefs, resolvers });

// Create Apollo Server
const apolloServer = new ApolloServer({
  schema,
  context: ({ req }) => {
    const user = req.user || null; // Get user from request object (if authenticated)
    return { user, redisClient };
  },
  plugins: [
    {
      async serverWillStart() {
        return {
          async drainServer() {
            subscriptionServer.close();
          },
        };
      },
    },
  ],
});

// Apply middleware to Apollo Server
await apolloServer.start();
apolloServer.applyMiddleware({ app, path: '/graphql' });

// Create HTTP server
const httpServer = http.createServer(app);
// const httpServer = httpsServer; // Use HTTPS server if configured

// Create WebSocket server for GraphQL subscriptions
const subscriptionServer = SubscriptionServer.create(
  {
    schema,
    execute,
    subscribe,
    onConnect: (connectionParams, webSocket, context) => {
      // Authenticate the WebSocket connection (optional)
      const token = connectionParams.authToken;
      if (token) {
        try {
          const user = jwt.verify(token, JWT_SECRET);
          return { user, redisClient };
        } catch (error) {
          console.error('WebSocket authentication error:', error);
          throw new Error('Invalid authentication token');
        }
      }
      throw new Error('Missing authentication token');
    },
  },
  {
    server: httpServer,
    path: apolloServer.graphqlPath,
  }
);

// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
  console.log(`GraphQL endpoint: http://localhost:${PORT}${apolloServer.graphqlPath}`);
  console.log(`GraphQL subscriptions endpoint: ws://localhost:${PORT}${apolloServer.graphqlPath}`);

  // Initialize worker process for background tasks
  initializeWorker();
});
import { Express, Request, Response } from 'express';
import passport from 'passport';
import { db } from '@db';
import { users, insertUserSchema } from '@shared/schema';
import { hashPassword } from '../services/auth';
import { z } from 'zod';

export function registerAuthRoutes(app: Express) {
  const apiPrefix = '/api';

  // Register (signup) route
  app.post(`${apiPrefix}/auth/register`, async (req: Request, res: Response) => {
    try {
      // Validate request body using Zod schema
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.username, validatedData.username)
      });
      
      if (existingUser) {
        return res.status(400).json({ message: 'Username already exists' });
      }

      // Hash password
      const hashedPassword = await hashPassword(validatedData.password);

      // Create user
      const [newUser] = await db.insert(users).values({
        username: validatedData.username,
        password: hashedPassword
      }).returning({
        id: users.id,
        username: users.username
      });

      // Log in the new user automatically
      req.login(newUser, (err) => {
        if (err) {
          return res.status(500).json({ message: 'Error logging in after registration' });
        }
        return res.status(201).json({ 
          message: 'User registered successfully',
          user: {
            id: newUser.id,
            username: newUser.username
          }
        });
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error('Error registering user:', error);
      return res.status(500).json({ message: 'Error registering user' });
    }
  });

  // Login route
  app.post(`${apiPrefix}/auth/login`, (req: Request, res: Response, next) => {
    passport.authenticate('local', (err, user, info) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ message: info.message || 'Authentication failed' });
      }
      req.login(user, (err) => {
        if (err) {
          return next(err);
        }
        return res.json({ 
          message: 'Login successful',
          user: {
            id: user.id,
            username: user.username
          }
        });
      });
    })(req, res, next);
  });

  // Logout route
  app.post(`${apiPrefix}/auth/logout`, (req: Request, res: Response) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: 'Error logging out' });
      }
      res.json({ message: 'Logged out successfully' });
    });
  });

  // Get current user route
  app.get(`${apiPrefix}/auth/me`, (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    res.json({
      user: {
        id: (req.user as any).id,
        username: (req.user as any).username
      }
    });
  });
}
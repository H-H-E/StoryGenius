import type { Express } from "express";
import { createServer, type Server } from "http";
import passport from "passport";
import { setupPassport } from "./services/auth";
import { configureSession } from "./services/sessions";
import { registerAuthRoutes } from "./routes/auth";
import { registerBookRoutes } from "./routes/books";
import { registerUserRoutes } from "./routes/users";
import { registerImageRoutes } from "./routes/images";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up session handling
  app.use(configureSession());
  
  // Initialize Passport and restore authentication state from session
  app.use(passport.initialize());
  app.use(passport.session());
  
  // Configure Passport authentication strategies
  setupPassport();
  
  // Register API routes
  registerAuthRoutes(app);
  registerBookRoutes(app);
  registerUserRoutes(app);
  registerImageRoutes(app);

  // Create and return HTTP server
  const httpServer = createServer(app);
  return httpServer;
}

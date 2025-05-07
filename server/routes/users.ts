import { Express, Request, Response } from 'express';
import { storage } from '../storage';
import { isAuthenticated, getCurrentUserId } from '../services/auth';

export function registerUserRoutes(app: Express) {
  const apiPrefix = '/api';

  // Get user progress
  app.get(`${apiPrefix}/user/progress`, async (req: Request, res: Response) => {
    try {
      const userId = getCurrentUserId(req);
      const progress = await storage.getUserProgress(userId);
      res.json(progress);
    } catch (error: any) {
      console.error("Error fetching user progress:", error);
      res.status(500).json({ message: "Failed to fetch user progress", error: error.message || String(error) });
    }
  });

  // Get reading levels
  app.get(`${apiPrefix}/reading-levels`, async (req: Request, res: Response) => {
    try {
      const readingLevels = await storage.getReadingLevels();
      res.json(readingLevels);
    } catch (error) {
      console.error("Error fetching reading levels:", error);
      res.status(500).json({ message: "Failed to fetch reading levels" });
    }
  });

  // Get themes
  app.get(`${apiPrefix}/themes`, async (req: Request, res: Response) => {
    try {
      const themes = await storage.getThemes();
      res.json(themes);
    } catch (error) {
      console.error("Error fetching themes:", error);
      res.status(500).json({ message: "Failed to fetch themes" });
    }
  });
}
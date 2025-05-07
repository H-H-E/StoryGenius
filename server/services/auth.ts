import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { db } from "@db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

// Setup passport with local strategy
export function setupPassport() {
  // Configure passport to use local strategy
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        // Find user by username
        const user = await db.query.users.findFirst({
          where: eq(users.username, username),
        });

        // User not found
        if (!user) {
          return done(null, false, { message: "Invalid username or password" });
        }

        // Check password
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
          return done(null, false, { message: "Invalid username or password" });
        }

        // User found and password valid
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    })
  );

  // Serialize user for session
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, id),
      });
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  return passport;
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

// Middleware to check if user is authenticated
export function isAuthenticated(req: any, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

// Helper to get current user ID safely
export function getCurrentUserId(req: any): number {
  // For development without auth, return user ID 1
  if (process.env.NODE_ENV === "development" && !req.user) {
    return 1;
  }
  return req.user?.id || 0;
}
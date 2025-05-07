import session from 'express-session';
import pgSession from 'connect-pg-simple';
import { pool } from '@db';

// Configure session middleware
export function configureSession() {
  // Create connect-pg-simple session store
  const PostgresStore = pgSession(session);

  // Create session store instance
  const sessionStore = new PostgresStore({
    pool: pool,
    tableName: 'session', // Table name for sessions
    createTableIfMissing: true // Automatically create the session table if it doesn't exist
  });

  // Set up regular cleanup of expired sessions
  setupSessionCleanup(sessionStore);

  return session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || 'storygenius-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
    }
  });
}

// Set up regular cleanup of expired sessions
function setupSessionCleanup(store: any) {
  // Clean up expired sessions every day
  setInterval(() => {
    store.clear((err: any) => {
      if (err) {
        console.error('Error cleaning up expired sessions:', err);
      }
    });
  }, 86400000); // 24 hours
}
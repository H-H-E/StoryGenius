import { pgTable, text, serial, integer, timestamp, json, foreignKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Books table
export const books = pgTable("books", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  readingLevel: text("reading_level").notNull(),
  theme: text("theme").notNull(),
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const booksRelations = relations(books, ({ one, many }) => ({
  user: one(users, {
    fields: [books.userId],
    references: [users.id],
  }),
  pages: many(bookPages),
  readingEvents: many(readingEvents),
}));

export const insertBookSchema = createInsertSchema(books).omit({
  id: true,
  createdAt: true,
});

export type InsertBook = z.infer<typeof insertBookSchema>;
export type Book = typeof books.$inferSelect;

// Book pages table
export const bookPages = pgTable("book_pages", {
  id: serial("id").primaryKey(),
  bookId: integer("book_id").references(() => books.id).notNull(),
  pageNumber: integer("page_number").notNull(),
  text: text("text").notNull(),
  imagePrompt: text("image_prompt").notNull(),
  imageUrl: text("image_url"),
  fryWords: json("fry_words").$type<string[]>().default([]),
  phonemes: json("phonemes").$type<string[]>().default([]),
});

export const bookPagesRelations = relations(bookPages, ({ one }) => ({
  book: one(books, {
    fields: [bookPages.bookId],
    references: [books.id],
  }),
}));

export const insertBookPageSchema = createInsertSchema(bookPages).omit({
  id: true,
});

export type InsertBookPage = z.infer<typeof insertBookPageSchema>;
export type BookPage = typeof bookPages.$inferSelect;

// Reading events table
export const readingEvents = pgTable("reading_events", {
  id: serial("id").primaryKey(),
  bookId: integer("book_id").references(() => books.id).notNull(),
  userId: integer("user_id").references(() => users.id),
  pageNumber: integer("page_number").notNull(),
  expected: text("expected").notNull(),
  actual: text("actual").notNull(),
  analysis: json("analysis").$type<{
    sentence: string;
    analysis: {
      word: string;
      phonemeBreakdown: {
        phoneme: string;
        hit: boolean;
      }[];
      correct: boolean;
    }[];
    scores: {
      accuracyPct: number;
      fryHitPct: number;
      phonemeHitPct: number;
    };
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const readingEventsRelations = relations(readingEvents, ({ one }) => ({
  book: one(books, {
    fields: [readingEvents.bookId],
    references: [books.id],
  }),
  user: one(users, {
    fields: [readingEvents.userId],
    references: [users.id],
  }),
}));

export const insertReadingEventSchema = createInsertSchema(readingEvents).omit({
  id: true,
  analysis: true,
  createdAt: true,
});

export type InsertReadingEvent = z.infer<typeof insertReadingEventSchema>;
export type ReadingEvent = typeof readingEvents.$inferSelect;

// Fry progress table
export const fryProgress = pgTable("fry_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  fryList: text("fry_list").notNull(), // e.g., "Fry-1", "Fry-2"
  word: text("word").notNull(),
  mastered: integer("mastered").default(0).notNull(), // Count of successful readings
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const fryProgressRelations = relations(fryProgress, ({ one }) => ({
  user: one(users, {
    fields: [fryProgress.userId],
    references: [users.id],
  }),
}));

export const insertFryProgressSchema = createInsertSchema(fryProgress).omit({
  id: true,
  updatedAt: true,
});

export type InsertFryProgress = z.infer<typeof insertFryProgressSchema>;
export type FryProgress = typeof fryProgress.$inferSelect;

// Phoneme progress table
export const phonemeProgress = pgTable("phoneme_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  phoneme: text("phoneme").notNull(), // e.g., "/th/", "/sh/"
  examples: json("examples").$type<string[]>().default([]),
  status: text("status").default("not-started").notNull(), // "mastered", "learning", "needs-practice", "not-started"
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const phonemeProgressRelations = relations(phonemeProgress, ({ one }) => ({
  user: one(users, {
    fields: [phonemeProgress.userId],
    references: [users.id],
  }),
}));

export const insertPhonemeProgressSchema = createInsertSchema(phonemeProgress).omit({
  id: true,
  updatedAt: true,
});

export type InsertPhonemeProgress = z.infer<typeof insertPhonemeProgressSchema>;
export type PhonemeProgress = typeof phonemeProgress.$inferSelect;

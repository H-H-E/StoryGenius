import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { callGemini } from "./services/gemini";
import { generateImage } from "./services/replicate";

export async function registerRoutes(app: Express): Promise<Server> {
  const apiPrefix = "/api";

  // Get reading levels
  app.get(`${apiPrefix}/reading-levels`, async (req, res) => {
    try {
      const readingLevels = await storage.getReadingLevels();
      res.json(readingLevels);
    } catch (error) {
      console.error("Error fetching reading levels:", error);
      res.status(500).json({ message: "Failed to fetch reading levels" });
    }
  });

  // Get themes
  app.get(`${apiPrefix}/themes`, async (req, res) => {
    try {
      const themes = await storage.getThemes();
      res.json(themes);
    } catch (error) {
      console.error("Error fetching themes:", error);
      res.status(500).json({ message: "Failed to fetch themes" });
    }
  });

  // Get all books
  app.get(`${apiPrefix}/books`, async (req, res) => {
    try {
      const books = await storage.getBooks();
      res.json(books);
    } catch (error) {
      console.error("Error fetching books:", error);
      res.status(500).json({ message: "Failed to fetch books" });
    }
  });

  // Get a single book by ID
  app.get(`${apiPrefix}/books/:id`, async (req, res) => {
    try {
      const bookId = parseInt(req.params.id);
      if (isNaN(bookId)) {
        return res.status(400).json({ message: "Invalid book ID" });
      }

      const book = await storage.getBookById(bookId);
      if (!book) {
        return res.status(404).json({ message: "Book not found" });
      }

      res.json(book);
    } catch (error) {
      console.error(`Error fetching book ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to fetch book" });
    }
  });

  // Create a new book
  app.post(`${apiPrefix}/books/new`, async (req, res) => {
    try {
      const { readingLevel, theme, numPages } = req.body;

      if (!readingLevel || !theme || !numPages) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Call Gemini API to generate book content
      const bookContent = await callGemini({
        reading_level: readingLevel,
        theme: theme,
        num_pages: numPages
      });

      // Create book in database
      const book = await storage.createBook({
        title: bookContent.title || `${theme} Story`,
        readingLevel: bookContent.readingLevel || readingLevel,
        theme: theme,
        userId: 1 // Default user for now
      });

      // Generate images for each page using Replicate API
      const pages = await Promise.all(
        bookContent.pages.map(async (page: any) => {
          // Generate image
          const imageResponse = await generateImage({
            prompt: page.imagePrompt
          });

          // Process page data to extract text, fryWords, and phonemes
          const text = page.words?.map((word: any) => word.text).join(' ') || '';
          
          // Get unique phonemes from all words
          const phonemes = Array.from(
            new Set(
              page.words?.flatMap((word: any) => word.phonemes) || []
            )
          );
          
          // Identify Fry words (simplified approach - could be enhanced)
          // We'll consider words with 4 or fewer letters as potential Fry words
          const fryWords = page.words
            ?.filter((word: any) => {
              const cleanWord = word.text.replace(/[.,!?;:"']/g, '');
              return cleanWord.length <= 4;
            })
            .map((word: any) => word.text.replace(/[.,!?;:"']/g, '')) || [];

          // Save page with image URL and calculated fields
          return storage.createBookPage({
            bookId: book.id,
            pageNumber: page.pageNumber,
            words: page.words,
            text: text,
            imagePrompt: page.imagePrompt,
            imageUrl: imageResponse.imageUrl,
            fryWords: fryWords,
            phonemes: phonemes
          });
        })
      );

      // Return the full book with pages
      res.status(201).json({
        ...book,
        pages
      });
    } catch (error: any) {
      console.error("Error creating book:", error);
      res.status(500).json({ message: "Failed to create book", error: error.message || String(error) });
    }
  });

  // Create a reading event and analyze pronunciation
  app.post(`${apiPrefix}/reading-event`, async (req, res) => {
    try {
      const { bookId, pageNumber, expected, actual } = req.body;

      if (!bookId || !pageNumber || !expected || !actual) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Analyze reading with Gemini
      const analysis = await callGemini({
        expected,
        actual
      }, "assessment");

      // Store the reading event
      const readingEvent = await storage.createReadingEvent({
        bookId,
        pageNumber,
        expected,
        actual,
        userId: 1, // Default user for now
        analysis
      });

      // Update user progress based on analysis
      await storage.updateUserProgress(1, analysis);

      res.json(analysis);
    } catch (error: any) {
      console.error("Error analyzing reading:", error);
      res.status(500).json({ message: "Failed to analyze reading", error: error.message || String(error) });
    }
  });

  // Generate an image using Replicate API
  app.post(`${apiPrefix}/generate-image`, async (req, res) => {
    try {
      const { prompt, width = 768, height = 768 } = req.body;

      if (!prompt) {
        return res.status(400).json({ message: "Missing image prompt" });
      }

      const imageResponse = await generateImage({
        prompt,
        width,
        height
      });

      res.json({ imageUrl: imageResponse.imageUrl });
    } catch (error: any) {
      console.error("Error generating image:", error);
      res.status(500).json({ message: "Failed to generate image", error: error.message || String(error) });
    }
  });

  // Get user progress
  app.get(`${apiPrefix}/user/progress`, async (req, res) => {
    try {
      const userId = 1; // Default user for now
      const progress = await storage.getUserProgress(userId);
      res.json(progress);
    } catch (error: any) {
      console.error("Error fetching user progress:", error);
      res.status(500).json({ message: "Failed to fetch user progress", error: error.message || String(error) });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

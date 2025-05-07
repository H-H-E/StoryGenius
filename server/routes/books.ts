import { Express, Request, Response } from 'express';
import { storage } from '../storage';
import { callGemini } from '../services/gemini';
import { generateImage } from '../services/replicate';
import { isAuthenticated, getCurrentUserId } from '../services/auth';

export function registerBookRoutes(app: Express) {
  const apiPrefix = '/api';

  // Get all books for the current user
  app.get(`${apiPrefix}/books`, async (req: Request, res: Response) => {
    try {
      const userId = getCurrentUserId(req);
      const books = await storage.getBooks(userId);
      res.json(books);
    } catch (error) {
      console.error("Error fetching books:", error);
      res.status(500).json({ message: "Failed to fetch books" });
    }
  });

  // Get a single book by ID
  app.get(`${apiPrefix}/books/:id`, async (req: Request, res: Response) => {
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
  app.post(`${apiPrefix}/books/new`, async (req: Request, res: Response) => {
    try {
      const { 
        readingLevel, 
        includeFryWords,
        theme, 
        numPages, 
        customTitle,
        mainCharacters,
        plotElements,
        artStyle
      } = req.body;

      if (!readingLevel || !theme || !numPages) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const userId = getCurrentUserId(req);

      // Call Gemini API to generate book content
      const bookContent = await callGemini({
        reading_level: readingLevel,
        include_fry_words: includeFryWords,
        theme: theme,
        num_pages: numPages,
        custom_title: customTitle,
        main_characters: mainCharacters,
        plot_elements: plotElements,
        art_style: artStyle
      });

      // Create book in database
      const book = await storage.createBook({
        title: bookContent.title || `${theme} Story`,
        readingLevel: bookContent.readingLevel || readingLevel,
        theme: theme,
        userId: userId
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
  app.post(`${apiPrefix}/reading-event`, async (req: Request, res: Response) => {
    try {
      const { bookId, pageNumber, expected, actual } = req.body;

      if (!bookId || !pageNumber || !expected || !actual) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const userId = getCurrentUserId(req);

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
        userId,
        analysis
      });

      // Update user progress based on analysis
      await storage.updateUserProgress(userId, analysis);

      res.json(analysis);
    } catch (error: any) {
      console.error("Error analyzing reading:", error);
      res.status(500).json({ message: "Failed to analyze reading", error: error.message || String(error) });
    }
  });
}
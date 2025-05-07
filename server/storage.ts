import { db } from "@db";
import { 
  books, 
  bookPages, 
  readingEvents, 
  fryProgress,
  phonemeProgress
} from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";

export const storage = {
  // Reading Levels
  async getReadingLevels() {
    // Fixed reading levels
    return [
      { id: "Fry-1", label: "Fry-1", description: "Beginner" },
      { id: "Fry-2", label: "Fry-2", description: "Elementary" },
      { id: "Fry-3", label: "Fry-3", description: "Intermediate" },
      { id: "Fry-4", label: "Fry-4", description: "Advanced" }
    ];
  },

  // Themes
  async getThemes() {
    // Fixed themes
    return [
      { 
        id: "space-pirates", 
        name: "Space Pirates", 
        imageUrl: "https://images.unsplash.com/photo-1581822261290-991b38693d1b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400" 
      },
      { 
        id: "magical-forest", 
        name: "Magical Forest", 
        imageUrl: "https://images.unsplash.com/photo-1516214104703-d870798883c5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400" 
      },
      { 
        id: "underwater-adventure", 
        name: "Underwater Adventure", 
        imageUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400" 
      }
    ];
  },

  // Books
  async getBooks() {
    const allBooks = await db.query.books.findMany({
      orderBy: [desc(books.createdAt)],
      with: {
        pages: true
      }
    });

    // Get completion count for each book
    const booksWithCompletionCount = await Promise.all(
      allBooks.map(async (book) => {
        const events = await db.query.readingEvents.findMany({
          where: eq(readingEvents.bookId, book.id)
        });

        // Count unique completion events (one per page)
        const uniquePageEvents = new Set();
        events.forEach(event => uniquePageEvents.add(event.pageNumber));
        const completionCount = Math.floor(uniquePageEvents.size / book.pages.length);

        return {
          ...book,
          completionCount
        };
      })
    );

    return booksWithCompletionCount;
  },

  async getBookById(id: number) {
    return db.query.books.findFirst({
      where: eq(books.id, id),
      with: {
        pages: true
      }
    });
  },

  async createBook(bookData: any) {
    const [newBook] = await db.insert(books).values({
      title: bookData.title,
      readingLevel: bookData.readingLevel,
      theme: bookData.theme,
      userId: bookData.userId
    }).returning();

    return newBook;
  },

  // Book Pages
  async createBookPage(pageData: any) {
    const [newPage] = await db.insert(bookPages).values({
      bookId: pageData.bookId,
      pageNumber: pageData.pageNumber,
      text: pageData.text,
      imagePrompt: pageData.imagePrompt,
      imageUrl: pageData.imageUrl,
      fryWords: pageData.fryWords,
      phonemes: pageData.phonemes,
      words: pageData.words || []
    }).returning();

    return newPage;
  },

  // Reading Events
  async createReadingEvent(eventData: any) {
    const [newEvent] = await db.insert(readingEvents).values({
      bookId: eventData.bookId,
      pageNumber: eventData.pageNumber,
      expected: eventData.expected,
      actual: eventData.actual,
      userId: eventData.userId,
      analysis: eventData.analysis
    }).returning();

    return newEvent;
  },

  // User Progress
  async updateUserProgress(userId: number, analysis: any) {
    // Update Fry Words progress
    for (const word of analysis.analysis) {
      // Check if this is a Fry word
      const isFryWord = word.phonemeBreakdown.length > 0;
      if (!isFryWord) continue;

      // Determine Fry list (simplified logic - in production would use a reference table)
      const fryList = "Fry-1"; // Default to Fry-1 for this example

      // Check if word entry exists
      const existingWord = await db.query.fryProgress.findFirst({
        where: and(
          eq(fryProgress.userId, userId),
          eq(fryProgress.word, word.word)
        )
      });

      if (existingWord) {
        // Update mastery count if word was read correctly
        if (word.correct) {
          await db.update(fryProgress)
            .set({ 
              mastered: existingWord.mastered + 1,
              updatedAt: new Date()
            })
            .where(and(
              eq(fryProgress.userId, userId),
              eq(fryProgress.word, word.word)
            ));
        }
      } else {
        // Create new entry
        await db.insert(fryProgress).values({
          userId,
          fryList,
          word: word.word,
          mastered: word.correct ? 1 : 0
        });
      }

      // Update phoneme progress
      for (const phoneme of word.phonemeBreakdown) {
        // Check if phoneme entry exists
        const existingPhoneme = await db.query.phonemeProgress.findFirst({
          where: and(
            eq(phonemeProgress.userId, userId),
            eq(phonemeProgress.phoneme, phoneme.phoneme)
          )
        });

        let status = "needs-practice";
        if (phoneme.hit) {
          status = existingPhoneme?.status === "learning" ? "mastered" : "learning";
        }

        if (existingPhoneme) {
          // Update status and add word to examples if not already present
          const examples = existingPhoneme.examples || [];
          if (!examples.includes(word.word)) {
            examples.push(word.word);
          }

          await db.update(phonemeProgress)
            .set({ 
              status,
              examples,
              updatedAt: new Date()
            })
            .where(and(
              eq(phonemeProgress.userId, userId),
              eq(phonemeProgress.phoneme, phoneme.phoneme)
            ));
        } else {
          // Create new entry
          await db.insert(phonemeProgress).values({
            userId,
            phoneme: phoneme.phoneme,
            examples: [word.word],
            status
          });
        }
      }
    }
  },

  async getUserProgress(userId: number) {
    // Get Fry progress
    const allFryProgress = await db.query.fryProgress.findMany({
      where: eq(fryProgress.userId, userId)
    });

    // Group by Fry list
    const fryLists = ["Fry-1", "Fry-2", "Fry-3"];
    const fryProgressByList = fryLists.map(list => {
      const wordsInList = allFryProgress.filter(p => p.fryList === list);
      const masteredWords = wordsInList.filter(p => p.mastered >= 3); // Consider a word mastered after 3 successful readings
      const wordsToLearn = wordsInList
        .filter(p => p.mastered < 3)
        .map(p => p.word);

      return {
        level: list,
        masteredCount: masteredWords.length,
        totalCount: list === "Fry-1" ? 50 : 50, // Each list has ~50 words
        wordsToLearn
      };
    });

    // Get phoneme progress
    const allPhonemeProgress = await db.query.phonemeProgress.findMany({
      where: eq(phonemeProgress.userId, userId)
    });

    // Get most recent reading event for notes
    const recentEvents = await db.query.readingEvents.findMany({
      where: eq(readingEvents.userId, userId),
      orderBy: [desc(readingEvents.createdAt)],
      limit: 1,
      with: {
        book: true
      }
    });

    let recentSession = undefined;
    if (recentEvents.length > 0) {
      const event = recentEvents[0];
      const analysis = event.analysis;
      
      if (analysis && analysis.scores) {
        recentSession = {
          bookTitle: event.book.title,
          date: new Date(event.createdAt).toLocaleDateString(),
          accuracyPct: analysis.scores.accuracyPct,
          notes: "Great improvement with short vowel sounds!",
          suggestion: "Practice words with 'ou' sounds like 'found' and 'around'."
        };
      }
    }

    // Calculate overall stats
    const totalBooks = await db.query.books.findMany();
    const completedBookEvents = await db.query.readingEvents.findMany({
      where: eq(readingEvents.userId, userId)
    });

    // Count unique book completions (simplified)
    const uniqueCompletedBooks = new Set();
    completedBookEvents.forEach(event => uniqueCompletedBooks.add(event.bookId));

    // Total Fry words mastered across all lists
    const totalFryMastered = fryProgressByList.reduce((sum, list) => sum + list.masteredCount, 0);
    const totalFryWords = fryProgressByList.reduce((sum, list) => sum + list.totalCount, 0);

    // Average reading accuracy from recent events (last 10)
    const recentReadingEvents = await db.query.readingEvents.findMany({
      where: eq(readingEvents.userId, userId),
      orderBy: [desc(readingEvents.createdAt)],
      limit: 10
    });

    let avgAccuracy = 0;
    if (recentReadingEvents.length > 0) {
      // TypeScript: Filter out events with no analysis or scores
      const validEvents = recentReadingEvents.filter(
        (event): event is typeof event & { analysis: NonNullable<typeof event.analysis> } => 
          event.analysis !== null && 
          event.analysis !== undefined && 
          !!event.analysis.scores
      );
      
      if (validEvents.length > 0) {
        avgAccuracy = validEvents.reduce((sum, event) => {
          return sum + event.analysis.scores.accuracyPct;
        }, 0) / validEvents.length;
      }
    }

    return {
      booksRead: uniqueCompletedBooks.size,
      fryWordsMastered: totalFryMastered,
      fryWordsTotal: totalFryWords,
      readingAccuracyPct: Math.round(avgAccuracy),
      fryProgress: fryProgressByList,
      phonemeProgress: allPhonemeProgress,
      recentSession
    };
  }
};

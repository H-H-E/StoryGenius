import { db } from "./index";
import { 
  users, 
  books, 
  bookPages,
  readingEvents,
  fryProgress,
  phonemeProgress
} from "@shared/schema";
import { eq } from "drizzle-orm";

async function seed() {
  try {
    console.log("Starting database seed...");

    // Check if the default user exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.username, "demo_user")
    });

    // Create a default user if it doesn't exist
    if (!existingUser) {
      console.log("Creating default user...");
      await db.insert(users).values({
        username: "demo_user",
        password: "hashed_password" // In a real app, this would be properly hashed
      });
    }

    // Seed reading levels and themes in memory (not stored in DB)
    const readingLevels = [
      { id: "Fry-1", label: "Fry-1", description: "Beginner" },
      { id: "Fry-2", label: "Fry-2", description: "Elementary" },
      { id: "Fry-3", label: "Fry-3", description: "Intermediate" },
      { id: "Fry-4", label: "Fry-4", description: "Advanced" }
    ];

    const themes = [
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

    // Create sample books if there are none
    const existingBooks = await db.query.books.findMany();
    
    if (existingBooks.length === 0) {
      console.log("Creating sample books...");
      
      // Create Space Pirates Adventure book
      const [spaceBook] = await db.insert(books).values({
        title: "Space Pirates Adventure",
        readingLevel: "Fry-1",
        theme: "space-pirates",
        userId: 1, // Assuming the first user has ID 1
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
      }).returning();
      
      // Add pages to the Space Pirates book
      await db.insert(bookPages).values([
        {
          bookId: spaceBook.id,
          pageNumber: 1,
          text: "Captain Cosmo looked at the stars. His ship was big and fast. He loved to fly in space.",
          imagePrompt: "A cartoon space captain with a helmet looking at stars from the window of a spaceship, child-friendly, vibrant colors",
          imageUrl: "https://images.unsplash.com/photo-1581822261290-991b38693d1b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          fryWords: ["at", "the", "and", "he", "to"],
          phonemes: ["/k/", "/l/", "/s/", "/t/"]
        },
        {
          bookId: spaceBook.id,
          pageNumber: 2,
          text: "Captain Cosmo zoomed past the moon. He saw a big ship. \"A space pirate ship!\" he said.",
          imagePrompt: "A cartoon spaceship zooming past the moon with a larger pirate spaceship in the background, child-friendly, vibrant colors",
          imageUrl: "https://images.unsplash.com/photo-1581822261290-991b38693d1b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          fryWords: ["past", "the", "he", "a", "big", "said"],
          phonemes: ["/z/", "/m/", "/sh/", "/p/"]
        },
        {
          bookId: spaceBook.id,
          pageNumber: 3,
          text: "The pirates had a map. They wanted to find space treasure. Captain Cosmo followed them.",
          imagePrompt: "Space pirates looking at a glowing holographic map showing a treasure location, child-friendly, vibrant colors",
          imageUrl: "https://images.unsplash.com/photo-1581822261290-991b38693d1b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          fryWords: ["the", "a", "to", "find", "them"],
          phonemes: ["/m/", "/p/", "/f/", "/d/"]
        },
        {
          bookId: spaceBook.id,
          pageNumber: 4,
          text: "The pirates landed on a small planet. It was green and rocky. Captain Cosmo hid his ship.",
          imagePrompt: "A pirate spaceship landing on a small green planet with rocky terrain, child-friendly, vibrant colors",
          imageUrl: "https://images.unsplash.com/photo-1581822261290-991b38693d1b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          fryWords: ["the", "on", "a", "and", "his"],
          phonemes: ["/l/", "/d/", "/p/", "/t/", "/h/"]
        },
        {
          bookId: spaceBook.id,
          pageNumber: 5,
          text: "\"I will find the treasure first,\" said Captain Cosmo. He walked across the rocks.",
          imagePrompt: "Captain Cosmo walking across rocky alien terrain, determined expression, child-friendly, vibrant colors",
          imageUrl: "https://images.unsplash.com/photo-1581822261290-991b38693d1b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          fryWords: ["I", "will", "the", "first", "said", "he"],
          phonemes: ["/f/", "/d/", "/w/", "/k/", "/r/"]
        },
        {
          bookId: spaceBook.id,
          pageNumber: 6,
          text: "The pirates dug a big hole. \"We found it!\" they shouted. It was a chest of space gems.",
          imagePrompt: "Space pirates digging and finding a treasure chest filled with colorful glowing gems, excited expressions, child-friendly",
          imageUrl: "https://images.unsplash.com/photo-1581822261290-991b38693d1b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          fryWords: ["the", "a", "it", "of", "we"],
          phonemes: ["/d/", "/g/", "/sh/", "/ch/", "/j/"]
        },
        {
          bookId: spaceBook.id,
          pageNumber: 7,
          text: "Captain Cosmo jumped out. \"Stop! Those gems belong to everyone in the galaxy!\"",
          imagePrompt: "Captain Cosmo jumping out from behind rocks confronting space pirates who have a treasure chest, child-friendly, vibrant colors",
          imageUrl: "https://images.unsplash.com/photo-1581822261290-991b38693d1b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          fryWords: ["out", "to", "in", "the"],
          phonemes: ["/j/", "/p/", "/st/", "/l/"]
        },
        {
          bookId: spaceBook.id,
          pageNumber: 8,
          text: "The pirates were sorry. They shared the gems with everyone. Captain Cosmo made new friends.",
          imagePrompt: "Space pirates and Captain Cosmo sharing colorful gems with various aliens and space creatures, friendly scene, child-friendly, vibrant colors",
          imageUrl: "https://images.unsplash.com/photo-1581822261290-991b38693d1b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          fryWords: ["the", "with", "made", "new"],
          phonemes: ["/sh/", "/d/", "/m/", "/f/", "/z/"]
        }
      ]);

      // Create Enchanted Forest book
      const [forestBook] = await db.insert(books).values({
        title: "Enchanted Forest Tales",
        readingLevel: "Fry-2",
        theme: "magical-forest",
        userId: 1,
        createdAt: new Date() // Today
      }).returning();
      
      // Add pages to the Enchanted Forest book
      await db.insert(bookPages).values([
        {
          bookId: forestBook.id,
          pageNumber: 1,
          text: "Lily walked into the magical forest. The trees were tall and the leaves sparkled with light.",
          imagePrompt: "A little girl walking into a magical forest with tall trees and sparkly leaves, sunlight filtering through, child-friendly, vibrant colors",
          imageUrl: "https://images.unsplash.com/photo-1516214104703-d870798883c5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          fryWords: ["into", "the", "were", "and", "with"],
          phonemes: ["/w/", "/t/", "/l/", "/f/", "/sp/"]
        },
        {
          bookId: forestBook.id,
          pageNumber: 2,
          text: "\"Hello?\" called Lily. \"Is anyone here?\" A small fox appeared from behind a tree.",
          imagePrompt: "A little girl in a forest calling out, with a cute small fox peeking from behind a tree, child-friendly, vibrant colors",
          imageUrl: "https://images.unsplash.com/photo-1516214104703-d870798883c5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          fryWords: ["from", "a", "is", "here"],
          phonemes: ["/h/", "/l/", "/f/", "/p/", "/d/"]
        },
        {
          bookId: forestBook.id,
          pageNumber: 3,
          text: "\"I am Finn,\" said the fox. \"I can show you the magic of this forest. Follow me!\"",
          imagePrompt: "A talking fox with a friendly expression speaking to a surprised little girl in a magical forest, child-friendly, vibrant colors",
          imageUrl: "https://images.unsplash.com/photo-1516214104703-d870798883c5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          fryWords: ["I", "am", "said", "the", "can", "you", "of", "this", "me"],
          phonemes: ["/f/", "/sh/", "/m/", "/j/"]
        },
        {
          bookId: forestBook.id,
          pageNumber: 4,
          text: "Finn led Lily to a clearing. Flowers of every color bloomed there. They danced in the breeze.",
          imagePrompt: "A fox leading a little girl to a magical clearing filled with colorful dancing flowers in a forest, child-friendly, vibrant colors",
          imageUrl: "https://images.unsplash.com/photo-1516214104703-d870798883c5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          fryWords: ["to", "a", "of", "in", "the"],
          phonemes: ["/l/", "/d/", "/f/", "/b/", "/k/"]
        },
        {
          bookId: forestBook.id,
          pageNumber: 5,
          text: "\"These flowers grant wishes,\" Finn explained. \"But you must only wish for good things.\"",
          imagePrompt: "A fox and little girl sitting among magical glowing flowers in a forest clearing, the fox explaining something, child-friendly, vibrant colors",
          imageUrl: "https://images.unsplash.com/photo-1516214104703-d870798883c5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          fryWords: ["for", "but", "you", "must", "only"],
          phonemes: ["/th/", "/fl/", "/sh/", "/g/", "/d/"]
        },
        {
          bookId: forestBook.id,
          pageNumber: 6,
          text: "Lily thought hard. \"I wish for everyone to be happy,\" she said. The flowers glowed brightly.",
          imagePrompt: "A little girl making a wish with magical flowers glowing brightly around her in a forest, thoughtful expression, child-friendly, vibrant colors",
          imageUrl: "https://images.unsplash.com/photo-1516214104703-d870798883c5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          fryWords: ["for", "to", "be", "she", "said"],
          phonemes: ["/th/", "/h/", "/sh/", "/gl/", "/br/"]
        }
      ]);
      
      // Add a few reading events
      await db.insert(readingEvents).values([
        {
          bookId: spaceBook.id,
          userId: 1,
          pageNumber: 1,
          expected: "Captain Cosmo looked at the stars. His ship was big and fast. He loved to fly in space.",
          actual: "Captain Cosmo looked at the stars. His ship was big and fast. He loved to fly in space.",
          analysis: {
            sentence: "Captain Cosmo looked at the stars. His ship was big and fast. He loved to fly in space.",
            analysis: [
              {
                word: "Captain",
                phonemeBreakdown: [
                  { phoneme: "/k/", hit: true },
                  { phoneme: "/æ/", hit: true },
                  { phoneme: "/p/", hit: true },
                  { phoneme: "/t/", hit: true },
                  { phoneme: "/ə/", hit: true },
                  { phoneme: "/n/", hit: true }
                ],
                correct: true
              },
              {
                word: "Cosmo",
                phonemeBreakdown: [
                  { phoneme: "/k/", hit: true },
                  { phoneme: "/ɑ/", hit: true },
                  { phoneme: "/z/", hit: true },
                  { phoneme: "/m/", hit: true },
                  { phoneme: "/oʊ/", hit: true }
                ],
                correct: true
              }
            ],
            scores: {
              accuracyPct: 100,
              fryHitPct: 100,
              phonemeHitPct: 100
            }
          },
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
        },
        {
          bookId: spaceBook.id,
          userId: 1,
          pageNumber: 2,
          expected: "Captain Cosmo zoomed past the moon. He saw a big ship. \"A space pirate ship!\" he said.",
          actual: "Captain Cosmo zoomed pass the moon. He saw a big ship. A space pirate ship he said.",
          analysis: {
            sentence: "Captain Cosmo zoomed past the moon. He saw a big ship. \"A space pirate ship!\" he said.",
            analysis: [
              {
                word: "past",
                phonemeBreakdown: [
                  { phoneme: "/p/", hit: true },
                  { phoneme: "/æ/", hit: true },
                  { phoneme: "/s/", hit: false },
                  { phoneme: "/t/", hit: false }
                ],
                correct: false
              },
              {
                word: "pirate",
                phonemeBreakdown: [
                  { phoneme: "/p/", hit: true },
                  { phoneme: "/aɪ/", hit: true },
                  { phoneme: "/r/", hit: true },
                  { phoneme: "/ə/", hit: true },
                  { phoneme: "/t/", hit: true }
                ],
                correct: true
              }
            ],
            scores: {
              accuracyPct: 85,
              fryHitPct: 90,
              phonemeHitPct: 88
            }
          },
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
        }
      ]);

      // Add some Fry word progress
      await db.insert(fryProgress).values([
        { userId: 1, fryList: "Fry-1", word: "the", mastered: 5 },
        { userId: 1, fryList: "Fry-1", word: "of", mastered: 4 },
        { userId: 1, fryList: "Fry-1", word: "and", mastered: 5 },
        { userId: 1, fryList: "Fry-1", word: "a", mastered: 5 },
        { userId: 1, fryList: "Fry-1", word: "to", mastered: 4 },
        { userId: 1, fryList: "Fry-1", word: "in", mastered: 3 },
        { userId: 1, fryList: "Fry-1", word: "is", mastered: 4 },
        { userId: 1, fryList: "Fry-1", word: "you", mastered: 3 },
        { userId: 1, fryList: "Fry-1", word: "that", mastered: 2 },
        { userId: 1, fryList: "Fry-1", word: "it", mastered: 3 },
        { userId: 1, fryList: "Fry-2", word: "past", mastered: 1 },
        { userId: 1, fryList: "Fry-2", word: "big", mastered: 3 },
        { userId: 1, fryList: "Fry-2", word: "said", mastered: 3 },
        { userId: 1, fryList: "Fry-2", word: "through", mastered: 0 },
        { userId: 1, fryList: "Fry-2", word: "because", mastered: 1 },
        { userId: 1, fryList: "Fry-3", word: "together", mastered: 0 },
        { userId: 1, fryList: "Fry-3", word: "special", mastered: 0 }
      ]);

      // Add some phoneme progress
      await db.insert(phonemeProgress).values([
        { userId: 1, phoneme: "/th/ as in \"the\"", examples: ["the", "this", "that"], status: "mastered" },
        { userId: 1, phoneme: "/sh/ as in \"ship\"", examples: ["ship", "fish", "shelf"], status: "mastered" },
        { userId: 1, phoneme: "/ch/ as in \"chair\"", examples: ["chair", "cheese"], status: "learning" },
        { userId: 1, phoneme: "/ou/ as in \"out\"", examples: ["out", "house"], status: "needs-practice" },
        { userId: 1, phoneme: "/oi/ as in \"coin\"", examples: [], status: "not-started" }
      ]);
    }

    console.log("Database seed completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

seed();

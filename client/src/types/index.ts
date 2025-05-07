// Book and page related types
export interface WordWithPhonemes {
  text: string;
  phonemes: string[];
}

export interface BookPage {
  pageNumber: number;
  words: WordWithPhonemes[];
  imagePrompt: string;
  imageUrl?: string;
  
  // Calculated fields
  text?: string;
  fryWords?: string[];
  phonemes?: string[];
}

export interface Book {
  id: number;
  title: string;
  readingLevel: string;
  theme: string;
  createdAt: string;
  pages: BookPage[];
  completionCount?: number;
}

// Story generation request types
export interface StoryGenerationRequest {
  readingLevel: string;
  theme: string;
  numPages: number;
}

// Reading assessment types
export interface ReadingEvent {
  bookId: number;
  pageNumber: number;
  expected: string;
  actual: string;
}

export interface PhonemeBreakdown {
  phoneme: string;
  hit: boolean;
}

export interface WordAnalysis {
  word: string;
  phonemeBreakdown: PhonemeBreakdown[];
  correct: boolean;
}

export interface AssessmentScores {
  accuracyPct: number;
  fryHitPct: number;
  phonemeHitPct: number;
}

export interface ReadingAssessment {
  sentence: string;
  analysis: WordAnalysis[];
  scores: AssessmentScores;
}

// Progress tracking types
export interface FryProgress {
  level: string;
  masteredCount: number;
  totalCount: number;
  wordsToLearn: string[];
}

export interface PhonemeProgress {
  phoneme: string;
  examples: string[];
  status: 'mastered' | 'learning' | 'needs-practice' | 'not-started';
}

export interface ReadingSessionSummary {
  bookTitle: string;
  date: string;
  accuracyPct: number;
  notes: string;
  suggestion: string;
}

export interface UserProgress {
  booksRead: number;
  fryWordsMastered: number;
  fryWordsTotal: number;
  readingAccuracyPct: number;
  fryProgress: FryProgress[];
  phonemeProgress: PhonemeProgress[];
  recentSession?: ReadingSessionSummary;
}

// Theme and reading level types
export interface Theme {
  id: string;
  name: string;
  imageUrl: string;
}

export interface ReadingLevel {
  id: string;
  label: string;
  description: string;
}

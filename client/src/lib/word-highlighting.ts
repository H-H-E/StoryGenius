/**
 * Normalizes text by removing punctuation and lowercasing
 * Includes safety checks for null/undefined
 */
export function normalizeText(text: string | null | undefined): string {
  try {
    if (!text) return '';
    // More comprehensive punctuation and special character removal
    return text.toLowerCase()
      .replace(/[.,!?;:"'()\[\]{}*&^%$#@~`|\\\/+\-_=<>]/g, '')
      .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
      .trim();
  } catch (error) {
    console.error('Error normalizing text:', error);
    return '';
  }
}

/**
 * Calculate similarity between two strings using Levenshtein distance
 * Returns a value between 0 (no similarity) and 1 (identical strings)
 */
function stringSimilarity(str1: string, str2: string): number {
  try {
    if (!str1 && !str2) return 1; // Both empty = identical
    if (!str1 || !str2) return 0; // One empty = no similarity
    
    // Calculate Levenshtein distance
    const track = Array(str2.length + 1).fill(null).map(() => 
      Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i += 1) {
      track[0][i] = i;
    }
    
    for (let j = 0; j <= str2.length; j += 1) {
      track[j][0] = j;
    }
    
    for (let j = 1; j <= str2.length; j += 1) {
      for (let i = 1; i <= str1.length; i += 1) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        track[j][i] = Math.min(
          track[j][i - 1] + 1, // deletion
          track[j - 1][i] + 1, // insertion
          track[j - 1][i - 1] + indicator, // substitution
        );
      }
    }
    
    // Calculate similarity score (normalized distance)
    const maxLength = Math.max(str1.length, str2.length);
    if (maxLength === 0) return 1; // Both empty strings
    
    const distance = track[str2.length][str1.length];
    return 1 - distance / maxLength;
  } catch (error) {
    console.error('Error calculating string similarity:', error);
    return 0;
  }
}

/**
 * Finds the best match for a word in an array of words
 * Returns the index of the matched word
 * Enhanced with safety checks and fuzzy matching
 */
export function findBestMatch(words: string[] | null | undefined, word: string | null | undefined): number {
  try {
    if (!words || !Array.isArray(words) || words.length === 0 || !word) return -1;
    
    const normalizedWord = normalizeText(word);
    if (!normalizedWord) return -1;
    
    // Enhanced validation of array items before processing
    const validWords = words.filter(w => typeof w === 'string' && w.trim().length > 0);
    if (validWords.length === 0) return -1;
    
    // Track exact, fuzzy, and partial matches
    let exactMatchIndex = -1;
    let bestPartialMatchIndex = -1;
    let bestFuzzyMatchIndex = -1;
    let bestSimilarityScore = 0.7; // Minimum threshold for fuzzy matching
    
    // Check each word for different types of matches
    for (let i = 0; i < validWords.length; i++) {
      const normalizedTarget = normalizeText(validWords[i]);
      
      // 1. Check for exact match (highest priority)
      if (normalizedTarget === normalizedWord) {
        exactMatchIndex = i;
        break; // We found an exact match, stop searching
      }
      
      // 2. Check for partial match (word contains target or vice versa)
      const isSubstring = normalizedTarget.includes(normalizedWord) || normalizedWord.includes(normalizedTarget);
      if (isSubstring && bestPartialMatchIndex === -1) {
        bestPartialMatchIndex = i;
      }
      
      // 3. Check for fuzzy match using similarity score
      const similarityScore = stringSimilarity(normalizedTarget, normalizedWord);
      if (similarityScore > bestSimilarityScore) {
        bestSimilarityScore = similarityScore;
        bestFuzzyMatchIndex = i;
      }
    }
    
    // Return the best match based on priority: exact > partial > fuzzy
    if (exactMatchIndex !== -1) {
      console.log(`Exact match found for "${normalizedWord}" at index ${exactMatchIndex}`);
      return exactMatchIndex;
    }
    
    if (bestPartialMatchIndex !== -1) {
      console.log(`Partial match found for "${normalizedWord}" at index ${bestPartialMatchIndex}`);
      return bestPartialMatchIndex;
    }
    
    if (bestFuzzyMatchIndex !== -1) {
      console.log(`Fuzzy match found for "${normalizedWord}" at index ${bestFuzzyMatchIndex} (similarity: ${bestSimilarityScore.toFixed(2)})`);
      return bestFuzzyMatchIndex;
    }
    
    // No match found
    console.log(`No match found for "${normalizedWord}"`);
    return -1;
  } catch (error) {
    console.error('Error finding best match:', error);
    return -1;
  }
}

/**
 * Highlights a word in a text by finding the best match
 * Returns the index of the highlighted word
 * Includes error handling for inputs
 */
export function highlightWord(words: string[] | null | undefined, recognizedWord: string | null | undefined): number {
  try {
    if (!words || !Array.isArray(words) || !recognizedWord) return -1;
    
    return findBestMatch(words, recognizedWord);
  } catch (error) {
    console.error('Error highlighting word:', error);
    return -1;
  }
}

/**
 * Compares expected text with actual spoken text
 * Returns array of words with matched status and similarity scores
 * Enhanced with fuzzy matching for more accurate assessment
 */
export function compareTexts(expected: string, actual: string): Array<{word: string, matched: boolean, similarityScore?: number}> {
  try {
    if (!expected || !actual) {
      return [];
    }
    
    // Split and filter to get valid words
    const expectedWords = expected.split(/\s+/).filter(w => w.length > 0);
    const actualWords = actual.split(/\s+/).filter(w => w.length > 0);
    
    if (expectedWords.length === 0) {
      return [];
    }
    
    // Threshold for fuzzy matching (words with similarity above this are considered matched)
    const SIMILARITY_THRESHOLD = 0.8;
    
    // Process each expected word
    return expectedWords.map(word => {
      try {
        const normalizedExpected = normalizeText(word);
        
        // Check for exact matches first (most efficient)
        const exactMatch = actualWords.some(actualWord => 
          normalizeText(actualWord) === normalizedExpected
        );
        
        if (exactMatch) {
          return { word, matched: true, similarityScore: 1.0 };
        }
        
        // If no exact match, try fuzzy matching
        let bestSimilarity = 0;
        let fuzzyMatched = false;
        
        // Find best similarity score among actual words
        for (const actualWord of actualWords) {
          const normalizedActual = normalizeText(actualWord);
          const similarity = stringSimilarity(normalizedExpected, normalizedActual);
          
          if (similarity > bestSimilarity) {
            bestSimilarity = similarity;
          }
          
          // If we found a match above threshold, we can stop searching
          if (similarity >= SIMILARITY_THRESHOLD) {
            fuzzyMatched = true;
            break;
          }
        }
        
        // Return match result with similarity score included
        return { 
          word, 
          matched: exactMatch || fuzzyMatched, 
          similarityScore: bestSimilarity 
        };
      } catch (wordError) {
        // If matching a specific word fails, mark it as unmatched but don't crash
        console.error('Error comparing word:', wordError);
        return { word, matched: false, similarityScore: 0 };
      }
    });
  } catch (error) {
    console.error('Error comparing texts:', error);
    return [];
  }
}

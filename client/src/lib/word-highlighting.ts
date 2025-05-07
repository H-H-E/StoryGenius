/**
 * Normalizes text by removing punctuation and lowercasing
 * Includes safety checks for null/undefined
 */
export function normalizeText(text: string | null | undefined): string {
  try {
    if (!text) return '';
    return text.toLowerCase().replace(/[.,!?;:"']/g, '').trim();
  } catch (error) {
    console.error('Error normalizing text:', error);
    return '';
  }
}

/**
 * Finds the best match for a word in an array of words
 * Returns the index of the matched word
 * Enhanced with safety checks
 */
export function findBestMatch(words: string[] | null | undefined, word: string | null | undefined): number {
  try {
    if (!words || !Array.isArray(words) || words.length === 0 || !word) return -1;
    
    const normalizedWord = normalizeText(word);
    if (!normalizedWord) return -1;
    
    // Enhanced validation of array items before processing
    const validWords = words.filter(w => typeof w === 'string' && w.trim().length > 0);
    if (validWords.length === 0) return -1;
    
    // Exact match
    const exactMatchIndex = validWords.findIndex(w => normalizeText(w) === normalizedWord);
    if (exactMatchIndex !== -1) return exactMatchIndex;
    
    // Partial match (word is part of target)
    const partialMatchIndex = validWords.findIndex(w => {
      const normalizedTarget = normalizeText(w);
      return normalizedTarget.includes(normalizedWord) || normalizedWord.includes(normalizedTarget);
    });
    
    if (partialMatchIndex !== -1) return partialMatchIndex;
    
    // No match found
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
 * Returns array of words with matched status
 * With enhanced error handling
 */
export function compareTexts(expected: string, actual: string): Array<{word: string, matched: boolean}> {
  try {
    if (!expected || !actual) {
      return [];
    }
    
    const expectedWords = expected.split(/\s+/).filter(w => w.length > 0);
    const actualWords = actual.split(/\s+/).filter(w => w.length > 0);
    
    if (expectedWords.length === 0) {
      return [];
    }
    
    return expectedWords.map(word => {
      try {
        const matched = actualWords.some(actualWord => 
          normalizeText(actualWord) === normalizeText(word)
        );
        return { word, matched };
      } catch (wordError) {
        // If matching a specific word fails, mark it as unmatched but don't crash
        console.error('Error comparing word:', wordError);
        return { word, matched: false };
      }
    });
  } catch (error) {
    console.error('Error comparing texts:', error);
    return [];
  }
}

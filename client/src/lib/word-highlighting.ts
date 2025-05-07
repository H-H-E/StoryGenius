/**
 * Normalizes text by removing punctuation and lowercasing
 */
export function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[.,!?;:"']/g, '');
}

/**
 * Finds the best match for a word in an array of words
 * Returns the index of the matched word
 */
export function findBestMatch(words: string[], word: string): number {
  const normalizedWord = normalizeText(word);
  
  // Exact match
  const exactMatchIndex = words.findIndex(w => normalizeText(w) === normalizedWord);
  if (exactMatchIndex !== -1) return exactMatchIndex;
  
  // Partial match (word is part of target)
  const partialMatchIndex = words.findIndex(w => normalizeText(w).includes(normalizedWord) || normalizedWord.includes(normalizeText(w)));
  if (partialMatchIndex !== -1) return partialMatchIndex;
  
  // No match found
  return -1;
}

/**
 * Highlights a word in a text by finding the best match
 * Returns the index of the highlighted word
 */
export function highlightWord(words: string[], recognizedWord: string): number {
  return findBestMatch(words, recognizedWord);
}

/**
 * Compares expected text with actual spoken text
 * Returns array of words with matched status
 */
export function compareTexts(expected: string, actual: string): Array<{word: string, matched: boolean}> {
  const expectedWords = expected.split(/\s+/).filter(w => w.length > 0);
  const actualWords = actual.split(/\s+/).filter(w => w.length > 0);
  
  return expectedWords.map(word => {
    const matched = actualWords.some(actualWord => 
      normalizeText(actualWord) === normalizeText(word)
    );
    return { word, matched };
  });
}

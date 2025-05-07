import { BookPage as BookPageType } from "@/types";
import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { highlightWord } from "@/lib/word-highlighting";
import { Mic, BookOpen } from "lucide-react";

interface BookPageProps {
  page: BookPageType;
  isReading: boolean;
  onStartReading?: () => void;
  onWordHighlight?: (word: string) => void; // Add a callback prop for word highlighting
}

export interface BookPageHandle {
  highlightWord: (word: string) => void;
}

// Use forwardRef to expose component methods to parent components
const BookPage = forwardRef<BookPageHandle, BookPageProps>(({ 
  page, 
  isReading, 
  onStartReading, 
  onWordHighlight 
}, ref) => {
  const [words, setWords] = useState<string[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(-1);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      // Extract words from either the words array or fallback to text - with additional safety checks
      if (page?.words && Array.isArray(page.words) && page.words.length > 0) {
        // Use the text property from each word object with safety validation
        const textWords = page.words
          .filter(word => word && typeof word === 'object')
          .map(word => word?.text || "")
          .filter(text => typeof text === 'string' && text.trim().length > 0);
        
        setWords(textWords);
      } else if (page?.text && typeof page.text === 'string') {
        // Fallback to splitting the text field if words array is not available
        const textWords = page.text.split(/\s+/)
          .filter(word => typeof word === 'string' && word.trim().length > 0);
        
        setWords(textWords);
      } else {
        // If no valid source of words, set empty array
        setWords([]);
      }
      
      // Reset highlight when page changes
      setCurrentWordIndex(-1);
    } catch (error) {
      console.error("Error processing page words:", error);
      setWords([]);
      setCurrentWordIndex(-1);
    }
  }, [page?.words, page?.text]);

  useEffect(() => {
    if (!isReading) {
      setCurrentWordIndex(-1);
    }
  }, [isReading]);

  // Scroll to the highlighted word if it changes
  useEffect(() => {
    if (currentWordIndex >= 0 && textRef.current) {
      const wordElements = textRef.current.querySelectorAll('.word');
      if (wordElements[currentWordIndex]) {
        wordElements[currentWordIndex].scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }
  }, [currentWordIndex]);

  // Function to be called from parent component with recognized word
  const highlightRecognizedWord = (word: string | null | undefined) => {
    try {
      if (!word || !words || words.length === 0) return;
      
      const index = highlightWord(words, word);
      if (index >= 0) {
        setCurrentWordIndex(index);
        
        // Log successful highlighting
        console.log(`Highlighting word: ${word} at index ${index}`);
        
        // Call the callback if provided
        if (onWordHighlight && typeof onWordHighlight === 'function') {
          onWordHighlight(word);
        }
      } else {
        console.log(`Could not find match for word: ${word}`);
      }
    } catch (error) {
      console.error("Error highlighting recognized word:", error);
    }
  };
  
  // Add a way for external components to access this function
  useEffect(() => {
    // Expose the highlight function to the window for component communication (legacy approach)
    (window as any).highlightBookPageWord = highlightRecognizedWord;
    console.log("BookPage: Exposing highlightBookPageWord function to window", !!highlightRecognizedWord);
  }, [highlightRecognizedWord, words, onWordHighlight]);
  
  // Expose methods via ref using useImperativeHandle (modern React pattern)
  useImperativeHandle(ref, () => ({
    highlightWord: (word: string) => {
      console.log("BookPage: Highlighting word via ref:", word);
      highlightRecognizedWord(word);
    }
  }), [highlightRecognizedWord, words]);

  return (
    <div className="w-full p-4 md:p-6 lg:p-8 mx-auto max-w-4xl">
      {/* Book title and page number in a subtle header */}
      <div className="text-center mb-6">
        <h2 className="text-lg md:text-xl text-neutral-500 font-light">
          Page {page?.pageNumber || '1'} of {page?.pageNumber ? '?' : '1'}
        </h2>
      </div>
      
      {/* Illustration with neoskeuomorphic styling */}
      <div className="relative mb-10">
        <div 
          className="aspect-w-16 aspect-h-9 rounded-xl overflow-hidden shadow-[0_10px_40px_-15px_rgba(0,0,0,0.2)] border border-neutral-100"
          style={{
            boxShadow: '0 10px 40px -15px rgba(0,0,0,0.2), inset 0 1px 3px rgba(255,255,255,0.7)'
          }}
        >
          {(() => {
            try {
              // Check if imageUrl is a valid string
              if (page?.imageUrl && typeof page.imageUrl === 'string' && page.imageUrl.trim()) {
                return (
                  <img 
                    src={page.imageUrl}
                    alt={`Illustration for page ${page?.pageNumber || ''}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Handle image loading errors
                      console.error("Error loading image:", e);
                      // Replace with a placeholder
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22300%22%20height%3D%22200%22%3E%3Crect%20fill%3D%22%23f5f5f5%22%20width%3D%22300%22%20height%3D%22200%22%2F%3E%3Ctext%20fill%3D%22%23999%22%20font-family%3D%22sans-serif%22%20font-size%3D%2216%22%20x%3D%2250%25%22%20y%3D%2250%25%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%3EImage%20not%20available%3C%2Ftext%3E%3C%2Fsvg%3E';
                    }}
                  />
                );
              } else {
                return (
                  <div className="w-full h-full flex items-center justify-center bg-neutral-100">
                    <p className="text-neutral-400">Image loading...</p>
                  </div>
                );
              }
            } catch (error) {
              console.error("Error rendering image:", error);
              return (
                <div className="w-full h-full flex items-center justify-center bg-neutral-100">
                  <p className="text-neutral-400">Error loading image</p>
                </div>
              );
            }
          })()}
        </div>
        
        {/* Reading mode indicator */}
        {isReading && (
          <div className="absolute top-3 right-3 bg-red-500 text-white p-2 rounded-full animate-pulse">
            <Mic className="h-4 w-4" />
          </div>
        )}
      </div>
      
      {/* Story text with enhanced word highlighting - neoskeuomorphic style */}
      <div 
        ref={textRef}
        className="font-display text-2xl md:text-4xl leading-relaxed text-neutral-800 mb-8 p-6 md:p-8 bg-white rounded-xl relative shadow-[0_5px_30px_-15px_rgba(0,0,0,0.1)] border border-neutral-100"
        style={{
          boxShadow: '0 5px 30px -15px rgba(0,0,0,0.1), inset 0 1px 2px rgba(255,255,255,0.9)'
        }}
      >
        {words.map((word, index) => (
          <span 
            key={index}
            className={`word mx-1 py-1 px-0.5 rounded-md transition-all duration-200 inline-block ${
              index === currentWordIndex 
                ? "bg-primary-100 text-primary-800 font-medium scale-110 shadow-sm" 
                : ""
            }`}
          >
            {word}
          </span>
        ))}
        
        {/* Read-along activation hover area */}
        {!isReading && onStartReading && (
          <div 
            onClick={onStartReading}
            className="absolute inset-0 bg-gradient-to-b from-transparent to-primary-50/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
          >
            <div className="bg-white/90 px-5 py-3 rounded-full shadow-md flex items-center space-x-2 text-primary-600 transform hover:scale-105 transition-transform">
              <Mic className="h-5 w-5" />
              <span className="font-medium text-base">Click to start reading</span>
            </div>
          </div>
        )}
        
        {/* Invisible overlay to make the entire text area clickable for reading */}
        {!isReading && onStartReading && (
          <div 
            onClick={onStartReading}
            className="absolute inset-0 cursor-pointer"
            aria-label="Start reading"
          />
        )}
      </div>
      
      {/* Focus words section with neoskeuomorphic styling */}
      <div className="flex space-x-4">
        <div className="bg-white border border-neutral-100 rounded-xl p-5 mb-4 w-1/2 shadow-sm">
          <div className="flex items-center text-sm font-medium text-neutral-700 mb-3">
            <BookOpen className="h-4 w-4 text-primary-500 mr-2" />
            <span>Learning Focus Words</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {(() => {
              try {
                // Safe access to fry words with validation
                const fryWords = page?.fryWords || [];
                
                if (!Array.isArray(fryWords) || fryWords.length === 0) {
                  return <span className="text-sm text-neutral-500 italic">No focus words on this page</span>;
                }
                
                // Filter out invalid entries and map only valid words
                return fryWords
                  .filter(word => word && typeof word === 'string' && word.trim().length > 0)
                  .map((word) => (
                    <span 
                      key={word} 
                      className="px-3 py-1.5 bg-neutral-50 text-neutral-700 rounded-lg text-sm font-medium border border-neutral-200 shadow-sm"
                    >
                      {word}
                    </span>
                  ));
              } catch (error) {
                console.error("Error rendering fry words:", error);
                return <span className="text-sm text-neutral-500 italic">Error displaying focus words</span>;
              }
            })()}
          </div>
        </div>
        
        {/* Phonemes section */}
        <div className="bg-white border border-neutral-100 rounded-xl p-5 mb-4 w-1/2 shadow-sm">
          <div className="flex items-center text-sm font-medium text-neutral-700 mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-500 mr-2">
              <path d="M9 21c0 1 1 1 1 1h4s1 0 1-1-1-4-1-4h-4s-1 3-1 4Z"></path>
              <path d="M12 17c2.2 0 4-1.8 4-4V6c0-2.2-1.8-4-4-4S8 3.8 8 6v7c0 2.2 1.8 4 4 4Z"></path>
            </svg>
            <span>Phoneme Practice</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {(() => {
              try {
                // Safe extraction of unique phonemes with multiple checks
                const words = page?.words || [];
                if (!words.length) return <span className="text-sm text-neutral-500 italic">No phoneme data available</span>;
                
                const phonemes: string[] = [];
                
                // More careful extraction of phonemes with validation
                for (const word of words) {
                  if (word && word.phonemes && Array.isArray(word.phonemes)) {
                    for (const phoneme of word.phonemes) {
                      if (phoneme && typeof phoneme === 'string' && phoneme.trim() && !phonemes.includes(phoneme)) {
                        phonemes.push(phoneme);
                      }
                    }
                  }
                }
                
                if (!phonemes.length) {
                  return <span className="text-sm text-neutral-500 italic">No phoneme data available</span>;
                }
                
                return phonemes.map((phoneme) => (
                  <span 
                    key={phoneme} 
                    className="px-3 py-1.5 bg-neutral-50 text-neutral-700 rounded-lg text-sm font-medium border border-neutral-200 shadow-sm"
                  >
                    {phoneme}
                  </span>
                ));
              } catch (error) {
                console.error("Error displaying phonemes:", error);
                return <span className="text-sm text-neutral-500 italic">Error displaying phonemes</span>;
              }
            })()}
          </div>
        </div>
      </div>
    </div>
  );
});

export default BookPage;

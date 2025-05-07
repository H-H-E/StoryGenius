import { BookPage as BookPageType } from "@/types";
import { useState, useEffect, useRef } from "react";
import { highlightWord } from "@/lib/word-highlighting";
import { Mic } from "lucide-react";

interface BookPageProps {
  page: BookPageType;
  isReading: boolean;
}

export default function BookPage({ page, isReading }: BookPageProps) {
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
      }
    } catch (error) {
      console.error("Error highlighting recognized word:", error);
    }
  };

  return (
    <div className="w-full md:w-1/2 p-6 md:p-8">
      {/* Illustration with frame - with improved error handling */}
      <div className="relative mb-8">
        <div className="aspect-w-4 aspect-h-3 rounded-2xl shadow-lg overflow-hidden border-4 border-primary-100">
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
      
      {/* Story text with enhanced word highlighting */}
      <div 
        ref={textRef}
        className="font-display text-2xl md:text-3xl leading-relaxed text-neutral-800 mb-6 p-4 bg-white rounded-xl"
      >
        {words.map((word, index) => (
          <span 
            key={index}
            className={`word mx-0.5 py-1 px-0.5 rounded-md transition-all duration-200 inline-block ${
              index === currentWordIndex 
                ? "bg-primary-100 text-primary-800 font-medium scale-110 shadow-sm" 
                : ""
            }`}
          >
            {word}
          </span>
        ))}
      </div>
      
      {/* Focus words section - with improved error handling */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 mb-4">
        <div className="text-sm font-medium text-blue-700 mb-2">Learning Focus Words:</div>
        <div className="flex flex-wrap gap-2">
          {(() => {
            try {
              // Safe access to fry words with validation
              const fryWords = page?.fryWords || [];
              
              if (!Array.isArray(fryWords) || fryWords.length === 0) {
                return <span className="text-sm text-blue-500 italic">No focus words on this page</span>;
              }
              
              // Filter out invalid entries and map only valid words
              return fryWords
                .filter(word => word && typeof word === 'string' && word.trim().length > 0)
                .map((word) => (
                  <span 
                    key={word} 
                    className="px-3 py-1.5 bg-white text-blue-700 rounded-full text-sm font-medium border border-blue-200 shadow-sm"
                  >
                    {word}
                  </span>
                ));
            } catch (error) {
              console.error("Error rendering fry words:", error);
              return <span className="text-sm text-blue-500 italic">Error displaying focus words</span>;
            }
          })()}
        </div>
      </div>
    </div>
  );
}

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
    // Extract words from either the words array or fallback to text
    if (page.words && page.words.length > 0) {
      // Use the text property from each word object
      const textWords = page.words.map(word => word.text);
      setWords(textWords);
    } else if (page.text) {
      // Fallback to splitting the text field if words array is not available
      const textWords = page.text.split(/\s+/)
        .filter(word => word.length > 0);
      setWords(textWords);
    }
    setCurrentWordIndex(-1); // Reset highlight when page changes
  }, [page.words, page.text]);

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
  const highlightRecognizedWord = (word: string) => {
    const index = highlightWord(words, word);
    if (index >= 0) {
      setCurrentWordIndex(index);
    }
  };

  return (
    <div className="w-full md:w-1/2 p-6 md:p-8">
      {/* Illustration with frame */}
      <div className="relative mb-8">
        <div className="aspect-w-4 aspect-h-3 rounded-2xl shadow-lg overflow-hidden border-4 border-primary-100">
          {page.imageUrl ? (
            <img 
              src={page.imageUrl}
              alt={`Illustration for page ${page.pageNumber}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-neutral-100">
              <p className="text-neutral-400">Image loading...</p>
            </div>
          )}
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
      
      {/* Focus words section */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 mb-4">
        <div className="text-sm font-medium text-blue-700 mb-2">Learning Focus Words:</div>
        <div className="flex flex-wrap gap-2">
          {(page.fryWords || []).map((word) => (
            <span 
              key={word} 
              className="px-3 py-1.5 bg-white text-blue-700 rounded-full text-sm font-medium border border-blue-200 shadow-sm"
            >
              {word}
            </span>
          ))}
          {(page.fryWords || []).length === 0 && (
            <span className="text-sm text-blue-500 italic">No focus words on this page</span>
          )}
        </div>
      </div>
    </div>
  );
}

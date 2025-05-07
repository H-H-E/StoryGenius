import { BookPage as BookPageType } from "@/types";
import { useState, useEffect } from "react";
import { highlightWord } from "@/lib/word-highlighting";

interface BookPageProps {
  page: BookPageType;
  isReading: boolean;
}

export default function BookPage({ page, isReading }: BookPageProps) {
  const [words, setWords] = useState<string[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(-1);

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

  // Function to be called from parent component with recognized word
  const highlightRecognizedWord = (word: string) => {
    const index = highlightWord(words, word);
    if (index >= 0) {
      setCurrentWordIndex(index);
    }
  };

  return (
    <div className="w-full md:w-1/2 p-6">
      {/* Page image */}
      <img 
        src={page.imageUrl}
        alt={`Illustration for page ${page.pageNumber}`}
        className="w-full h-64 md:h-96 object-cover rounded-xl shadow-md"
      />
      
      {/* Below the image we render the text for smaller screens */}
      <div className="md:hidden mt-6">
        <div className="font-body text-xl leading-relaxed text-neutral-800 mb-8">
          {words.map((word, index) => (
            <span 
              key={index}
              className={index === currentWordIndex ? "word-highlight" : ""}
            >
              {word}{' '}
            </span>
          ))}
        </div>
        
        <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 mb-4">
          <div className="text-sm text-neutral-500 mb-1">Focus Words:</div>
          <div className="flex flex-wrap gap-2">
            {(page.fryWords || []).map((word) => (
              <span 
                key={word} 
                className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium"
              >
                {word}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

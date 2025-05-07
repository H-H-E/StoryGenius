import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import BookPage from "@/components/BookPage";
import ReadAlong from "@/components/ReadAlong";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Book } from "@/types";
import { ChevronLeft, ChevronRight, BookOpen } from "lucide-react";

export default function BookReader() {
  const [, params] = useRoute("/book/:id");
  const bookId = params?.id ? parseInt(params.id) : 0;
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isReading, setIsReading] = useState(false);

  const { data: book, isLoading } = useQuery<Book>({
    queryKey: [`/api/books/${bookId}`],
    enabled: !!bookId,
  });

  const goToPreviousPage = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1);
      setIsReading(false);
    }
  };

  const goToNextPage = () => {
    if (book && currentPageIndex < book.pages.length - 1) {
      setCurrentPageIndex(currentPageIndex + 1);
      setIsReading(false);
    }
  };
  
  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPreviousPage();
      } else if (e.key === 'ArrowRight') {
        goToNextPage();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentPageIndex]);

  // State for word highlighting communication between components
  const [highlightWord, setHighlightWord] = useState('');
  
  // Start reading handler for the BookPage component
  const handleStartReading = () => {
    setIsReading(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-4 border-b border-neutral-100">
                <Skeleton className="h-6 w-48" />
              </div>
              <div className="p-8 flex flex-col items-center">
                <Skeleton className="h-80 w-full max-w-lg rounded-xl" />
                <Skeleton className="h-8 w-full max-w-md mt-8" />
                <Skeleton className="h-8 w-5/6 max-w-md mt-2" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-md text-center max-w-md">
          <h2 className="font-display font-bold text-2xl text-red-600 mb-4">Book not found</h2>
          <p className="mb-6">The storybook you're looking for could not be found.</p>
          <Link href="/">
            <Button>Back to Library</Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentPage = book.pages[currentPageIndex];

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Top navigation bar - simplified */}
      <div className="bg-white shadow-sm border-b border-neutral-100 py-3">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-neutral-700 hover:text-primary-600 flex items-center">
              <ChevronLeft className="h-5 w-5 mr-1" />
              <span>Library</span>
            </Link>
            
            <div className="flex items-center">
              <BookOpen className="h-5 w-5 text-primary-500 mr-2" />
              <h1 className="font-display font-medium text-lg text-neutral-800">{book.title}</h1>
              <div className="ml-3 px-2 py-0.5 bg-neutral-100 rounded text-xs font-medium text-neutral-600">
                Level: {book.readingLevel}
              </div>
            </div>
            
            <div className="text-sm text-neutral-500">
              Page {currentPage.pageNumber} of {book.pages.length}
            </div>
          </div>
        </div>
      </div>
      
      {/* Main content area */}
      <main className="container mx-auto px-4 py-6 relative">
        {/* Navigation arrows */}
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20">
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 rounded-full shadow-lg bg-white disabled:opacity-30"
            onClick={goToPreviousPage}
            disabled={currentPageIndex === 0}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
        </div>
        
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20">
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 rounded-full shadow-lg bg-white disabled:opacity-30"
            onClick={goToNextPage}
            disabled={currentPageIndex === book.pages.length - 1}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>
        
        {/* Book content with neoskeuomorphic design */}
        <BookPage 
          page={currentPage} 
          isReading={isReading}
          onStartReading={handleStartReading}
          onWordHighlight={(word) => setHighlightWord(word)}
        />
        
        {/* Read-along panel that slides up from bottom */}
        <ReadAlong
          bookId={bookId}
          page={currentPage}
          isReading={isReading}
          setIsReading={setIsReading}
          onWordDetected={(word) => {
            // When a word is detected in ReadAlong, tell BookPage to highlight it
            setHighlightWord(word);
            console.log(`Word detected in ReadAlong: ${word}`);
          }}
        />
      </main>
      
      {/* Page navigation dots */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-100 py-2 flex justify-center z-10"
           style={{ transform: isReading ? 'translateY(100%)' : 'translateY(0)', transition: 'transform 0.3s ease' }}>
        <div className="flex space-x-1 px-3 py-1 bg-neutral-50 rounded-full shadow-inner">
          {book.pages.map((_, index) => (
            <button
              key={index}
              className={`h-2.5 w-2.5 rounded-full transition-all ${
                index === currentPageIndex 
                  ? 'bg-primary-600 scale-125' 
                  : 'bg-neutral-300 hover:bg-neutral-400'
              }`}
              onClick={() => {
                setCurrentPageIndex(index);
                setIsReading(false);
              }}
              aria-label={`Go to page ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

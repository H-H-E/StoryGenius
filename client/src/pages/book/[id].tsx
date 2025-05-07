import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import BookPage from "@/components/BookPage";
import ReadAlong from "@/components/ReadAlong";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Book } from "@/types";
import { ChevronLeft, ChevronRight } from "lucide-react";

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-blue-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-blue-400 to-purple-400 p-4">
                <Skeleton className="h-10 w-48 bg-white/30" />
                <Skeleton className="h-5 w-32 mt-2 bg-white/30" />
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
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-md text-center max-w-md">
          <h2 className="font-display font-bold text-2xl text-red-600 mb-4">Book not found</h2>
          <p className="mb-6">The storybook you're looking for could not be found.</p>
          <Link href="/">
            <Button>Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentPage = book.pages[currentPageIndex];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 pb-12">
      {/* Top navigation bar */}
      <div className="bg-white shadow-sm border-b border-neutral-200 py-2 mb-8">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-neutral-800 hover:text-primary-600 flex items-center">
              <ChevronLeft className="h-5 w-5 mr-1" />
              <span>Back to Library</span>
            </Link>
            <h1 className="font-display font-bold text-lg">{book.title}</h1>
            <div className="text-sm text-neutral-500">Level: {book.readingLevel}</div>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Book content */}
          <div className="bg-white rounded-3xl shadow-lg overflow-hidden border-4 border-primary-200 relative">
            {/* Page navigation controls - for small screens */}
            <div className="flex items-center justify-between md:hidden p-4 bg-gradient-to-r from-primary-100 to-primary-50">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousPage}
                disabled={currentPageIndex === 0}
                className="flex items-center"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                <span>Previous</span>
              </Button>
              
              <span className="text-sm font-medium">
                Page {currentPage.pageNumber} of {book.pages.length}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextPage}
                disabled={currentPageIndex === book.pages.length - 1}
                className="flex items-center"
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            
            {/* Main content area */}
            <div className="relative">
              {/* Previous page button - desktop */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white shadow-lg rounded-full h-12 w-12 z-10 hidden md:flex items-center justify-center"
                onClick={goToPreviousPage}
                disabled={currentPageIndex === 0}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              
              {/* Book content layout */}
              <div className="flex flex-col md:flex-row">
                <BookPage 
                  page={currentPage} 
                  isReading={isReading}
                />
                
                <ReadAlong
                  bookId={bookId}
                  page={currentPage}
                  isReading={isReading}
                  setIsReading={setIsReading}
                />
              </div>
              
              {/* Next page button - desktop */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white shadow-lg rounded-full h-12 w-12 z-10 hidden md:flex items-center justify-center"
                onClick={goToNextPage}
                disabled={currentPageIndex === book.pages.length - 1}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </div>
            
            {/* Page dots */}
            <div className="px-4 py-3 bg-neutral-50 border-t border-neutral-200 flex justify-center">
              <div className="flex space-x-1">
                {book.pages.map((_, index) => (
                  <button
                    key={index}
                    className={`h-2.5 w-2.5 rounded-full ${
                      index === currentPageIndex ? 'bg-primary-600' : 'bg-neutral-300 hover:bg-neutral-400'
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
        </div>
      </div>
    </div>
  );
}

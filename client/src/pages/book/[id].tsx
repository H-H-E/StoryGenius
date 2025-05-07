import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
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

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            <div className="bg-primary-600 p-4">
              <Skeleton className="h-8 w-48 bg-primary-500" />
              <Skeleton className="h-4 w-32 mt-2 bg-primary-500" />
            </div>
            <div className="p-6">
              <Skeleton className="h-64 w-full rounded-xl" />
              <Skeleton className="h-6 w-full mt-6" />
              <Skeleton className="h-6 w-5/6 mt-2" />
              <Skeleton className="h-6 w-4/6 mt-2" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-display font-bold text-2xl text-red-600">Book not found</h2>
          <p className="mt-2">The requested book could not be found.</p>
        </div>
      </div>
    );
  }

  const currentPage = book.pages[currentPageIndex];

  return (
    <div className="py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            {/* Book Header */}
            <div className="bg-primary-600 p-4 flex items-center justify-between">
              <div>
                <h2 className="font-display font-bold text-xl text-white">{book.title}</h2>
                <div className="text-primary-100 text-sm">Reading Level: {book.readingLevel}</div>
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-primary-500"
                  onClick={goToPreviousPage}
                  disabled={currentPageIndex === 0}
                >
                  <ChevronLeft />
                </Button>
                <span className="text-white">
                  Page {currentPage.pageNumber} of {book.pages.length}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-primary-500"
                  onClick={goToNextPage}
                  disabled={currentPageIndex === book.pages.length - 1}
                >
                  <ChevronRight />
                </Button>
              </div>
            </div>
            
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
          </div>
        </div>
      </div>
    </div>
  );
}

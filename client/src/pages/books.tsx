import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { cn } from "@/lib/utils";

// Define interfaces for our data types
interface BookPage {
  id: number;
  bookId: number;
  pageNumber: number;
  text: string;
  imagePrompt: string;
  imageUrl: string | null;
  fryWords: string[];
  phonemes: string[];
  words: any[];
  createdAt: string;
}

interface Book {
  id: number;
  title: string;
  readingLevel: string;
  theme: string;
  userId: number;
  createdAt: string;
  completionCount?: number;
  pages: BookPage[];
}

interface ReadingLevel {
  id: string;
  label: string;
  description: string;
}

interface Theme {
  id: string;
  name: string;
  imageUrl: string;
}

export default function Books() {
  const [currentPage, setCurrentPage] = useState(1);
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [themeFilter, setThemeFilter] = useState<string>("all");
  
  const booksPerPage = 6;

  // Get all books
  const { data: books, isLoading, error } = useQuery<Book[]>({
    queryKey: ['/api/books'],
  });

  // Get reading levels for filtering
  const { data: readingLevels } = useQuery<ReadingLevel[]>({
    queryKey: ['/api/reading-levels'],
  });

  // Get themes for filtering
  const { data: themes } = useQuery<Theme[]>({
    queryKey: ['/api/themes'],
  });

  // Apply filters and pagination
  const filteredBooks = books?.filter(book => {
    const matchesLevel = levelFilter === "all" || book.readingLevel === levelFilter;
    const matchesTheme = themeFilter === "all" || book.theme === themeFilter;
    return matchesLevel && matchesTheme;
  }) || [];

  const totalPages = Math.ceil(filteredBooks.length / booksPerPage);
  const paginatedBooks = filteredBooks.slice(
    (currentPage - 1) * booksPerPage,
    currentPage * booksPerPage
  );

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col items-start gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between w-full gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Books</h1>
            <p className="text-muted-foreground mt-1">Browse your storybook collection and continue reading</p>
          </div>
          <div className="flex flex-col md:flex-row gap-2">
            <Select 
              value={levelFilter} 
              onValueChange={setLevelFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Reading Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">All Levels</SelectItem>
                  {readingLevels && readingLevels.map((level) => (
                    <SelectItem key={level.id} value={level.id}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            <Select 
              value={themeFilter} 
              onValueChange={setThemeFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">All Themes</SelectItem>
                  {themes && themes.map((theme) => (
                    <SelectItem key={theme.id} value={theme.id}>
                      {theme.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            <Button asChild>
              <Link href="/dashboard">
                Create New Book
              </Link>
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full mt-6">
            {Array(6).fill(0).map((_, index) => (
              <Card key={index} className="overflow-hidden">
                <CardHeader className="pb-0">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-40 w-full mt-4" />
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Skeleton className="h-10 w-20" />
                  <Skeleton className="h-10 w-20" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : error ? (
          <div className="w-full p-6 text-center">
            <p className="text-xl text-red-500">Failed to load books. Please try again later.</p>
          </div>
        ) : paginatedBooks.length === 0 ? (
          <div className="w-full p-6 text-center">
            <p className="text-xl">No books found. Create your first storybook!</p>
            <Button className="mt-4" asChild>
              <Link href="/dashboard">
                Create New Book
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full mt-6">
            {paginatedBooks.map(book => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination className="mx-auto mt-6">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  className={cn(currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer")}
                />
              </PaginationItem>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <PaginationItem key={page}>
                  <PaginationLink
                    onClick={() => handlePageChange(page)}
                    isActive={page === currentPage}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  className={cn(currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer")}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </div>
  );
}

function BookCard({ book }: { book: Book }) {
  // Find the first page that has an image URL
  const coverImage = book.pages && book.pages.find(page => page.imageUrl)?.imageUrl;
  
  // Get reading progress
  const pagesRead = book.completionCount || 0;
  const totalPages = book.pages ? book.pages.length : 1;
  const progressPercent = Math.min(100, Math.round((pagesRead / totalPages) * 100));
  
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="line-clamp-1">{book.title}</CardTitle>
        <CardDescription>
          <div className="flex gap-2 mt-1">
            <Badge variant="outline">{book.readingLevel}</Badge>
            <Badge variant="outline">{book.theme}</Badge>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {coverImage ? (
          <div className="relative h-40 w-full overflow-hidden rounded-md">
            <img 
              src={coverImage} 
              alt={`Cover for ${book.title}`} 
              className="object-cover w-full h-full"
            />
            {pagesRead > 0 && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white px-2 py-1 text-xs">
                Progress: {progressPercent}%
              </div>
            )}
          </div>
        ) : (
          <div className="h-40 w-full rounded-md bg-muted flex items-center justify-center">
            <p className="text-muted-foreground">No cover image</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" asChild>
          <Link href={`/book/${book.id}`}>
            {pagesRead > 0 ? "Continue" : "Start Reading"}
          </Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link href={`/book/${book.id}`}>
            View Details
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
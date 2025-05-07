import { Link } from "wouter";
import { Book } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

interface RecentBooksProps {
  books: Book[];
}

export default function RecentBooks({ books }: RecentBooksProps) {
  if (!books || books.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-6">
        <h3 className="font-display font-semibold text-xl mb-4 text-neutral-800">Your Recent Books</h3>
        <p className="text-neutral-500 text-center py-6">
          You haven't created any books yet. Generate your first story above!
        </p>
      </div>
    );
  }

  // Sort books by creation date (newest first)
  const sortedBooks = [...books].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, 3);  // Show only the 3 most recent books

  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      <h3 className="font-display font-semibold text-xl mb-4 text-neutral-800">Your Recent Books</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sortedBooks.map((book) => (
          <Link key={book.id} href={`/book/${book.id}`}>
            <div className="border border-neutral-200 rounded-lg overflow-hidden group cursor-pointer hover:shadow-md transition-all">
              {/* Book cover image */}
              <div className="relative h-40 bg-neutral-100">
                {book.pages[0]?.imageUrl ? (
                  <img 
                    src={book.pages[0].imageUrl} 
                    alt={`${book.title} book cover`} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <Skeleton className="w-full h-full" />
                )}
              </div>
              <div className="p-3">
                <h4 className="font-display font-semibold text-lg text-neutral-800 line-clamp-1">{book.title}</h4>
                <div className="flex items-center text-sm text-neutral-500 mt-1">
                  <span className="mr-3">{book.readingLevel}</span>
                  <span>{book.pages.length} pages</span>
                </div>
                <div className="flex items-center mt-2">
                  {book.completionCount ? (
                    <span className="text-xs font-medium bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                      Completed {book.completionCount} {book.completionCount === 1 ? 'time' : 'times'}
                    </span>
                  ) : (
                    <span className="text-xs font-medium bg-neutral-100 text-neutral-800 px-2 py-0.5 rounded-full">
                      New
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

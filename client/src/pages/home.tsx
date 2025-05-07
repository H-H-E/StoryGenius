import { useState } from "react";
import StoryGeneratorForm from "@/components/StoryGeneratorForm";
import RecentBooks from "@/components/RecentBooks";
import { useQuery } from "@tanstack/react-query";
import { Book, ReadingLevel, Theme } from "@/types";

export default function Home() {
  const { data: books = [] } = useQuery<Book[]>({
    queryKey: ["/api/books"],
  });

  const { data: readingLevels = [] } = useQuery<ReadingLevel[]>({
    queryKey: ["/api/reading-levels"],
  });

  const { data: themes = [] } = useQuery<Theme[]>({
    queryKey: ["/api/themes"],
  });

  return (
    <div className="py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display font-bold text-3xl mb-8 text-neutral-900">Create a New Story</h2>
          
          <StoryGeneratorForm 
            readingLevels={readingLevels}
            themes={themes}
          />
          
          <RecentBooks books={books} />
        </div>
      </div>
    </div>
  );
}

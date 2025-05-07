import { Link } from "wouter";
import { BookOpen } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-neutral-200 py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center">
          <Link href="/">
            <div className="flex items-center space-x-2 mb-4 md:mb-0 cursor-pointer">
              <BookOpen className="text-primary-600 h-5 w-5" />
              <span className="font-display font-bold text-xl text-primary-600">ReadAlong</span>
            </div>
          </Link>
          
          <div className="text-sm text-neutral-500">
            &copy; {new Date().getFullYear()} ReadAlong. All rights reserved. Helping children learn to read through personalized stories.
          </div>
        </div>
      </div>
    </footer>
  );
}

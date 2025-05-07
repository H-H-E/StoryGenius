import { Link } from "wouter";
import { useState } from "react";
import { useLocation } from "wouter";
import { Menu, X, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useMobile } from "@/hooks/use-mobile";

export default function Header() {
  const [location] = useLocation();
  const isMobile = useMobile();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSheetClose = () => setIsMenuOpen(false);
  
  const navItems = [
    { name: "Home", path: "/" },
    { name: "My Books", path: "/books" },
    { name: "Progress", path: "/dashboard" }
  ];

  return (
    <header className="bg-white shadow-sm border-b border-neutral-200">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <BookOpen className="text-primary-600 h-6 w-6" />
          <Link href="/">
            <h1 className="font-display font-bold text-2xl text-primary-600 cursor-pointer">
              ReadAlong
            </h1>
          </Link>
        </div>
        
        <nav className="hidden md:flex items-center space-x-6">
          {navItems.map((item) => (
            <Link 
              key={item.path} 
              href={item.path}
              className={`font-display font-medium ${
                location === item.path 
                  ? "text-primary-600" 
                  : "text-neutral-700 hover:text-primary-600 transition-colors"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>
        
        <div className="flex items-center space-x-4">
          {isMobile ? (
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[220px] pt-12">
                <div className="flex flex-col gap-4">
                  {navItems.map((item) => (
                    <Link 
                      key={item.path} 
                      href={item.path}
                      className={`font-display font-medium text-lg ${
                        location === item.path 
                          ? "text-primary-600" 
                          : "text-neutral-700 hover:text-primary-600 transition-colors"
                      }`}
                      onClick={handleSheetClose}
                    >
                      {item.name}
                    </Link>
                  ))}
                  <Button 
                    className="mt-4"
                    onClick={() => {
                      handleSheetClose();
                      window.location.href = '/';
                    }}
                  >
                    Create Story
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          ) : (
            <Button asChild>
              <Link href="/">Create Story</Link>
            </Button>
          )}
          
          <div className="h-8 w-8 rounded-full bg-accent-500 text-white flex items-center justify-center">
            <span className="font-display font-medium text-sm">JS</span>
          </div>
        </div>
      </div>
    </header>
  );
}

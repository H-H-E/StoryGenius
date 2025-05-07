import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { StoryGenerationRequest, Theme, ReadingLevel } from "@/types";
import { Wand2, Minus, Plus, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface StoryGeneratorFormProps {
  readingLevels: ReadingLevel[];
  themes: Theme[];
}

export default function StoryGeneratorForm({ readingLevels, themes }: StoryGeneratorFormProps) {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [selectedFryList, setSelectedFryList] = useState<string>(readingLevels.length > 0 ? readingLevels[0].id : "");
  const [customTheme, setCustomTheme] = useState("");
  const [numPages, setNumPages] = useState(8);
  const [customTitle, setCustomTitle] = useState("");
  const [mainCharacters, setMainCharacters] = useState("");
  const [plotElements, setPlotElements] = useState("");
  const [artStyle, setArtStyle] = useState("children's book illustration");
  
  // Art style options
  const artStyleOptions = [
    { value: "children's book illustration", label: "Children's Book (Default)" },
    { value: "watercolor painting", label: "Watercolor Painting" },
    { value: "cartoon", label: "Cartoon" },
    { value: "3D animation", label: "3D Animation" },
    { value: "realistic", label: "Realistic" },
    { value: "pixel art", label: "Pixel Art" }
  ];
  
  const createStoryMutation = useMutation({
    mutationFn: async (data: StoryGenerationRequest) => {
      const response = await apiRequest('POST', '/api/books/new', data);
      return response.json();
    },
    onSuccess: async (data) => {
      toast({
        title: "Story created successfully!",
        description: "Your new storybook is ready to read."
      });
      await queryClient.invalidateQueries({ queryKey: ['/api/books'] });
      setLocation(`/book/${data.id}`);
    },
    onError: (error) => {
      toast({
        title: "Failed to create story",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFryList || !customTheme.trim()) {
      toast({
        title: "Missing information",
        description: "Please select a word list and enter a story theme.",
        variant: "destructive"
      });
      return;
    }
    
    createStoryMutation.mutate({
      readingLevel: selectedFryList,
      theme: customTheme.trim(),
      numPages: numPages,
      customTitle: customTitle.trim() || undefined,
      mainCharacters: mainCharacters.trim() || undefined,
      plotElements: plotElements.trim() || undefined,
      artStyle: artStyle
    });
  };
  
  const decrementPages = () => {
    if (numPages > 4) {
      setNumPages(numPages - 1);
    }
  };
  
  const incrementPages = () => {
    if (numPages < 12) {
      setNumPages(numPages + 1);
    }
  };
  
  return (
    <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Fry Word List Selection */}
          <div>
            <div className="flex items-center mb-3">
              <label className="block font-display font-semibold text-lg text-neutral-800">Fry Word List</label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 ml-2">
                      <Info className="h-4 w-4 text-neutral-500" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm">
                    <p className="text-sm">Fry words are common words that children should recognize to become fluent readers. 
                    Selecting a Fry word list will include those words in the generated story.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {readingLevels.map((level) => (
                <button
                  key={level.id}
                  type="button"
                  className={`flex flex-col items-center justify-center p-4 border-2 rounded-xl transition-colors ${
                    selectedFryList === level.id
                      ? "border-primary-600 bg-primary-50 hover:bg-primary-100"
                      : "border-neutral-200 hover:bg-neutral-50"
                  }`}
                  onClick={() => setSelectedFryList(level.id)}
                >
                  <span className={`font-display font-bold text-2xl ${
                    selectedFryList === level.id ? "text-primary-600" : "text-neutral-700"
                  }`}>
                    {level.label}
                  </span>
                  <span className="text-sm text-neutral-600 mt-1">{level.description}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Theme Input */}
          <div>
            <label className="block font-display font-semibold text-lg mb-3 text-neutral-800">Story Theme</label>
            <Input 
              value={customTheme}
              onChange={(e) => setCustomTheme(e.target.value)}
              placeholder="Enter a story theme, like 'Space Pirates' or 'Underwater Adventure'"
              className="w-full"
            />
            <p className="text-xs text-neutral-500 mt-1">Be creative! Your theme sets the context for the entire story.</p>
          </div>
          
          {/* Book Length */}
          <div>
            <label className="block font-display font-semibold text-lg mb-3 text-neutral-800">Book Length</label>
            <div className="flex items-center space-x-3">
              <span className="text-neutral-600">Pages:</span>
              <div className="flex items-center space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={decrementPages}
                  disabled={numPages <= 4}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="font-display font-medium text-xl w-8 text-center">{numPages}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={incrementPages}
                  disabled={numPages >= 12}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
          
          {/* Custom Title */}
          <div>
            <label className="block font-display font-semibold text-lg mb-3 text-neutral-800">Custom Title <span className="text-sm font-normal text-neutral-500">(Optional)</span></label>
            <Input 
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="Enter a custom title for your story"
              className="w-full"
            />
          </div>
          
          {/* Main Characters */}
          <div>
            <label className="block font-display font-semibold text-lg mb-3 text-neutral-800">Main Characters <span className="text-sm font-normal text-neutral-500">(Optional)</span></label>
            <Input 
              value={mainCharacters}
              onChange={(e) => setMainCharacters(e.target.value)}
              placeholder="Example: a brave lion, a wise owl"
              className="w-full"
            />
            <p className="text-xs text-neutral-500 mt-1">Add characters you'd like to appear in the story</p>
          </div>
          
          {/* Plot Elements */}
          <div>
            <label className="block font-display font-semibold text-lg mb-3 text-neutral-800">Plot Elements <span className="text-sm font-normal text-neutral-500">(Optional)</span></label>
            <Textarea 
              value={plotElements}
              onChange={(e) => setPlotElements(e.target.value)}
              placeholder="Example: finding a treasure, learning about friendship"
              className="w-full min-h-[80px]"
            />
            <p className="text-xs text-neutral-500 mt-1">Add key elements or lessons for your story</p>
          </div>
          
          {/* Art Style */}
          <div>
            <label className="block font-display font-semibold text-lg mb-3 text-neutral-800">Illustration Style</label>
            <Select value={artStyle} onValueChange={setArtStyle}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select an illustration style" />
              </SelectTrigger>
              <SelectContent>
                {artStyleOptions.map((style) => (
                  <SelectItem key={style.value} value={style.value}>
                    {style.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Submit Button */}
          <div className="pt-2">
            <Button
              type="submit"
              className="w-full py-7 text-lg"
              disabled={createStoryMutation.isPending}
            >
              {createStoryMutation.isPending ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Generating...</span>
                </div>
              ) : (
                <div className="flex items-center">
                  <Wand2 className="mr-2" />
                  <span>Generate Story</span>
                </div>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

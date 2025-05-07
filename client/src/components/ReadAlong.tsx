import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { BookPage, ReadingEvent, ReadingAssessment } from "@/types";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Mic, Square } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";

interface ReadAlongProps {
  bookId: number;
  page: BookPage;
  isReading: boolean;
  setIsReading: (isReading: boolean) => void;
}

export default function ReadAlong({ bookId, page, isReading, setIsReading }: ReadAlongProps) {
  const { toast } = useToast();
  const [currentText, setCurrentText] = useState("");
  const audioVisRef = useRef<HTMLDivElement>(null);
  const words = page.text.split(/\s+/).filter(word => word.length > 0);
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(-1);
  
  const { 
    startListening,
    stopListening,
    transcript,
    isListening,
    isSpeechRecognitionSupported 
  } = useSpeechRecognition();

  // Create audio visualization
  useEffect(() => {
    if (!audioVisRef.current || !isReading) return;
    
    const container = audioVisRef.current;
    // Clear existing bars
    container.innerHTML = '';
    
    // Create new bars
    const barCount = 7;
    for (let i = 0; i < barCount; i++) {
      const bar = document.createElement('div');
      bar.className = 'audio-bar';
      bar.style.height = '5px'; // Start small
      container.appendChild(bar);
    }
    
    // Animate bars
    let animationFrame: number;
    const animateBars = () => {
      if (!isReading) return;
      
      const bars = container.querySelectorAll('.audio-bar');
      bars.forEach(bar => {
        const height = Math.floor(Math.random() * 30) + 5;
        (bar as HTMLElement).style.height = `${height}px`;
      });
      
      animationFrame = requestAnimationFrame(animateBars);
    };
    
    animationFrame = requestAnimationFrame(animateBars);
    
    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [isReading]);

  // Update word highlight based on transcript
  useEffect(() => {
    if (transcript) {
      setCurrentText(transcript);
      const words = page.text.toLowerCase().split(/\s+/);
      const transcriptWords = transcript.toLowerCase().split(/\s+/);
      
      // Find the last recognized word
      if (transcriptWords.length > 0) {
        const lastWord = transcriptWords[transcriptWords.length - 1];
        // Find this word in the original text
        const index = words.findIndex(w => 
          w.replace(/[.,!?;:"']/g, '').toLowerCase() === lastWord.replace(/[.,!?;:"']/g, '')
        );
        
        if (index !== -1) {
          setCurrentWordIndex(index);
        }
      }
    }
  }, [transcript, page.text]);

  const assessReadingMutation = useMutation({
    mutationFn: async (data: ReadingEvent) => {
      const response = await apiRequest('POST', '/api/reading-event', data);
      return response.json() as Promise<ReadingAssessment>;
    },
    onSuccess: (data) => {
      toast({
        title: "Reading Assessment",
        description: `Accuracy: ${data.scores.accuracyPct}%, Fry Words: ${data.scores.fryHitPct}%, Phonemes: ${data.scores.phonemeHitPct}%`
      });
    },
    onError: (error) => {
      toast({
        title: "Assessment Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const toggleReading = async () => {
    if (isReading) {
      setIsReading(false);
      setCurrentWordIndex(-1);
      
      if (isSpeechRecognitionSupported) {
        stopListening();
        
        // Submit the reading for assessment
        if (currentText) {
          await assessReadingMutation.mutateAsync({
            bookId,
            pageNumber: page.pageNumber,
            expected: page.text,
            actual: currentText
          });
        }
      }
    } else {
      setCurrentText("");
      setIsReading(true);
      
      if (isSpeechRecognitionSupported) {
        startListening();
      } else {
        toast({
          title: "Speech Recognition Not Supported",
          description: "Your browser doesn't support speech recognition. Try Chrome or Edge.",
          variant: "destructive"
        });
      }
    }
  };

  return (
    <div className="w-full md:w-1/2 p-6 flex flex-col">
      <div className="flex-grow">
        <div className="font-body text-xl leading-relaxed text-neutral-800 mb-8 hidden md:block">
          {words.map((word, index) => (
            <span 
              key={index}
              className={index === currentWordIndex ? "word-highlight" : ""}
            >
              {word}{' '}
            </span>
          ))}
        </div>
        
        <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 mb-4 hidden md:block">
          <div className="text-sm text-neutral-500 mb-1">Focus Words:</div>
          <div className="flex flex-wrap gap-2">
            {page.fryWords.map((word) => (
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
      
      <div className="border-t border-neutral-200 pt-4 mt-auto">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <Button
              variant={isReading ? "destructive" : "default"}
              onClick={toggleReading}
              className="flex items-center"
              disabled={assessReadingMutation.isPending}
            >
              {isReading ? (
                <>
                  <Square className="mr-2 h-4 w-4" />
                  <span>Stop Reading</span>
                </>
              ) : (
                <>
                  <Mic className="mr-2 h-4 w-4" />
                  <span>Start Reading</span>
                </>
              )}
            </Button>
            
            <div 
              ref={audioVisRef} 
              className="audio-wave"
              style={{ display: isReading ? 'flex' : 'none' }}
            ></div>
          </div>
          
          <div className="text-xs text-neutral-500 italic">
            {isSpeechRecognitionSupported ? (
              <>Click "Start Reading" and read the story aloud. The app will highlight words as you read them.</>
            ) : (
              <>Speech recognition is not supported in your browser. Please use Chrome or Edge for the best experience.</>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

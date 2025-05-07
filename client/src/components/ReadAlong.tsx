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
  
  // Extract words either from the words array or fall back to text
  const words = page.words?.length ? 
    page.words.map(word => word.text) : 
    (page.text?.split(/\s+/).filter(word => word.length > 0) || []);
  
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
      
      // Extract words from either the words array or fallback to text
      const pageWords = page.words?.length ? 
        page.words.map(word => word.text.toLowerCase()) : 
        (page.text?.toLowerCase().split(/\s+/) || []);
      
      const transcriptWords = transcript.toLowerCase().split(/\s+/);
      
      // Find the last recognized word
      if (transcriptWords.length > 0) {
        const lastWord = transcriptWords[transcriptWords.length - 1];
        // Find this word in the original text
        const index = pageWords.findIndex(w => 
          w.replace(/[.,!?;:"']/g, '').toLowerCase() === lastWord.replace(/[.,!?;:"']/g, '')
        );
        
        if (index !== -1) {
          setCurrentWordIndex(index);
        }
      }
    }
  }, [transcript, page.words, page.text]);

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
            expected: page.text || words.join(' '),
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
    <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col bg-gradient-to-b from-blue-50 to-purple-50 border-l border-neutral-200">
      <div className="flex-grow flex flex-col">
        {/* Reading control panel */}
        <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
          <h3 className="font-display font-bold text-lg text-neutral-800 mb-4">Read Along Practice</h3>
          
          <div className="flex items-center justify-between gap-4 mb-3">
            <Button
              variant={isReading ? "destructive" : "default"}
              onClick={toggleReading}
              className={`flex-1 flex items-center justify-center py-6 ${isReading ? 'animate-pulse' : ''}`}
              disabled={assessReadingMutation.isPending}
              size="lg"
            >
              {isReading ? (
                <>
                  <Square className="mr-2 h-5 w-5" />
                  <span className="font-medium">Stop Reading</span>
                </>
              ) : (
                <>
                  <Mic className="mr-2 h-5 w-5" />
                  <span className="font-medium">Start Reading</span>
                </>
              )}
            </Button>
            
            {isReading && (
              <div 
                ref={audioVisRef} 
                className="audio-wave bg-primary-50 px-3 py-2 rounded-lg h-12 w-20"
              ></div>
            )}
          </div>
          
          {isReading && currentText && (
            <div className="bg-neutral-50 rounded-lg p-3 mb-3 text-sm text-neutral-600">
              <p className="font-medium text-neutral-800 mb-1">I heard you say:</p>
              <p className="italic">{currentText}</p>
            </div>
          )}
          
          <div className="text-sm text-neutral-600">
            {isSpeechRecognitionSupported ? (
              <>
                <p className="mb-1">Click "Start Reading" and read the text aloud at your own pace.</p>
                <p className="text-xs text-neutral-500">The app will highlight words as you read them and analyze your pronunciation.</p>
              </>
            ) : (
              <div className="bg-red-50 text-red-700 p-3 rounded-lg">
                <p className="font-medium">Speech recognition not supported!</p>
                <p className="text-xs mt-1">Please use Chrome or Edge browser for the best experience.</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Reading progress tracker - shown when reading completes */}
        {assessReadingMutation.data && !isReading && (
          <div className="bg-green-50 border border-green-100 rounded-xl p-5 mb-6">
            <h3 className="font-display font-bold text-green-800 flex items-center mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Reading Assessment
            </h3>
            
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="bg-white p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {assessReadingMutation.data.scores.accuracyPct}%
                </div>
                <div className="text-xs text-neutral-600">Accuracy</div>
              </div>
              <div className="bg-white p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {assessReadingMutation.data.scores.fryHitPct}%
                </div>
                <div className="text-xs text-neutral-600">Fry Words</div>
              </div>
              <div className="bg-white p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">
                  {assessReadingMutation.data.scores.phonemeHitPct}%
                </div>
                <div className="text-xs text-neutral-600">Phonemes</div>
              </div>
            </div>
            
            <p className="text-sm text-green-600">Great job! Keep practicing to improve your reading skills.</p>
          </div>
        )}
        
        {/* Focus phonemes section */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 mt-auto">
          <h3 className="font-medium text-indigo-800 mb-2">Phoneme Focus:</h3>
          <div className="flex flex-wrap gap-2">
            {Array.from(new Set((page.words || []).flatMap(word => word.phonemes || []))).map((phoneme) => (
              <span 
                key={phoneme} 
                className="px-3 py-1.5 bg-white text-indigo-700 rounded-full text-sm font-medium border border-indigo-200 shadow-sm"
              >
                {phoneme}
              </span>
            ))}
            {!page.words?.some(word => word.phonemes?.length) && (
              <span className="text-sm text-indigo-500 italic">No phoneme data available</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { BookPage, ReadingEvent, ReadingAssessment } from "@/types";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Mic, Square, Volume2, VolumeX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition-fixed";
import { highlightWord } from "@/lib/word-highlighting";
import MicrophonePermission from "@/components/MicrophonePermission";

// Add microphoneStream to Window interface for TypeScript
declare global {
  interface Window {
    microphoneStream?: MediaStream;
  }
}

interface ReadAlongProps {
  bookId: number;
  page: BookPage;
  isReading: boolean;
  setIsReading: (isReading: boolean) => void;
  onWordDetected?: (word: string) => void; // Callback when a word is detected
}

export default function ReadAlong({ bookId, page, isReading, setIsReading, onWordDetected }: ReadAlongProps) {
  const { toast } = useToast();
  const [currentText, setCurrentText] = useState("");
  const audioVisRef = useRef<HTMLDivElement>(null);
  const [confidenceLevel, setConfidenceLevel] = useState(0);
  const [silenceTimer, setSilenceTimer] = useState<NodeJS.Timeout | null>(null);
  const [inactivityTimer, setInactivityTimer] = useState<NodeJS.Timeout | null>(null);
  const [autoStopEnabled, setAutoStopEnabled] = useState(true);
  
  // Extract words either from the words array or fall back to text, with safety checks
  const words = page?.words?.length ? 
    page.words.map(word => word?.text || "").filter(word => word.length > 0) : 
    (page?.text ? page.text.split(/\s+/).filter(word => word.length > 0) : []);
  
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(-1);
  
  const { 
    startListening,
    stopListening,
    transcript,
    interimTranscript,
    lastWordDetected,
    confidence,
    isListening,
    isSpeechRecognitionSupported,
    permissionStatus,
    requestPermission,
    error: recognitionError,
    resetTranscript 
  } = useSpeechRecognition();
  
  // Show any speech recognition errors as toasts
  useEffect(() => {
    if (recognitionError) {
      toast({
        title: "Speech Recognition Error",
        description: recognitionError,
        variant: "destructive"
      });
    }
  }, [recognitionError, toast]);

  // Animation for audio visualization
  useEffect(() => {
    if (!audioVisRef.current || !isReading) return;
    
    const container = audioVisRef.current;
    // Clear existing bars
    container.innerHTML = '';
    
    // Create new bars
    const barCount = 5; // Reduced number of bars for cleaner look
    for (let i = 0; i < barCount; i++) {
      const bar = document.createElement('div');
      bar.className = 'audio-bar';
      bar.style.height = '4px'; // Start small
      bar.style.background = 'currentColor';
      bar.style.borderRadius = '2px';
      bar.style.margin = '0 2px';
      bar.style.width = '3px';
      bar.style.transition = 'height 0.1s ease';
      container.appendChild(bar);
    }
    
    // Animate bars - scale animation with confidence if we have it
    let animationFrame: number;
    const animateBars = () => {
      if (!isReading) return;
      
      const bars = container.querySelectorAll('.audio-bar');
      bars.forEach(bar => {
        // Use confidence to affect height variability - more confidence = taller bars
        const confidenceBoost = confidenceLevel * 15; // Scale up the effect
        const height = Math.floor(Math.random() * (15 + confidenceBoost)) + 4;
        (bar as HTMLElement).style.height = `${height}px`;
      });
      
      animationFrame = requestAnimationFrame(animateBars);
    };
    
    animationFrame = requestAnimationFrame(animateBars);
    
    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [isReading, confidenceLevel]);

  // Smart auto-stop detection based on silence/inactivity
  useEffect(() => {
    if (isReading && autoStopEnabled) {
      // Reset timers when new speech is detected
      if (interimTranscript) {
        if (silenceTimer) {
          clearTimeout(silenceTimer);
          setSilenceTimer(null);
        }
        
        // Set new silence detection timer - will trigger if no new speech for 3 seconds
        const timer = setTimeout(() => {
          // Only auto-stop if we have detected enough speech (more than a few words)
          const words = (transcript || "").split(/\s+/).filter(w => w.trim().length > 0);
          if (words.length > 3) {
            console.log("Silence detected - stopping reading session");
            setIsReading(false);
          }
        }, 3000);
        
        setSilenceTimer(timer);
      }
      
      // General inactivity timer (15 seconds with no meaningful detection)
      if (!inactivityTimer) {
        const timer = setTimeout(() => {
          console.log("Inactivity timeout - stopping reading session");
          setIsReading(false);
        }, 15000);
        
        setInactivityTimer(timer);
      }
    }
    
    // Clean up timers
    return () => {
      if (silenceTimer) {
        clearTimeout(silenceTimer);
      }
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }
    };
  }, [isReading, interimTranscript, transcript, autoStopEnabled]);

  // Update word highlight based on both transcript and interim transcript
  useEffect(() => {
    // Track final transcript for submission
    if (transcript && transcript.trim()) {
      setCurrentText(transcript);
    }
    
    // Store confidence level for visualization
    if (confidence > 0) {
      setConfidenceLevel(confidence);
    }
    
    try {
      // First try to use the window function for highlighting (exposed by BookPage component)
      const highlightBookPageWord = (window as any).highlightBookPageWord;
      
      // Debug the global function availability
      console.log("ReadAlong: highlightBookPageWord function available:", 
        typeof highlightBookPageWord === 'function', highlightBookPageWord);
      
      // First priority - use lastWordDetected for real-time highlighting
      if (lastWordDetected && lastWordDetected.trim()) {
        console.log("Using lastWordDetected for highlighting:", lastWordDetected);
        
        // Try the callback prop for direct component communication
        if (onWordDetected && typeof onWordDetected === 'function') {
          onWordDetected(lastWordDetected);
        }
        // Fallback to the window global approach (legacy)
        else if (typeof highlightBookPageWord === 'function') {
          highlightBookPageWord(lastWordDetected);
        }
      } 
      // If no lastWordDetected but we have interim transcript, use that
      else if (interimTranscript && interimTranscript.trim()) {
        const interimWords = interimTranscript.toLowerCase().split(/\s+/).filter(w => w.length > 0);
        if (interimWords.length > 0) {
          const lastInterimWord = interimWords[interimWords.length - 1];
          if (lastInterimWord && lastInterimWord.length > 0) {
            console.log("Using interimTranscript for highlighting:", lastInterimWord);
            
            // Try the callback prop for direct component communication
            if (onWordDetected && typeof onWordDetected === 'function') {
              onWordDetected(lastInterimWord);
            }
            // Fallback to the window global approach (legacy)
            else if (typeof highlightBookPageWord === 'function') {
              highlightBookPageWord(lastInterimWord);
            }
          }
        }
      }
      // Fallback - use final transcript if no interim data available
      else if (transcript && transcript.trim()) {
        const transcriptWords = transcript.toLowerCase().split(/\s+/).filter(w => w.length > 0);
        if (transcriptWords.length > 0) {
          const lastWord = transcriptWords[transcriptWords.length - 1];
          if (lastWord && lastWord.length > 0) {
            console.log("Using transcript for highlighting:", lastWord);
            
            // Try the callback prop for direct component communication
            if (onWordDetected && typeof onWordDetected === 'function') {
              onWordDetected(lastWord);
            }
            // Fallback to the window global approach (legacy)
            else if (typeof highlightBookPageWord === 'function') {
              highlightBookPageWord(lastWord);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error processing speech for highlighting:", error);
    }
  }, [transcript, interimTranscript, lastWordDetected, confidence]);

  const assessReadingMutation = useMutation({
    mutationFn: async (data: ReadingEvent) => {
      const response = await apiRequest('POST', '/api/reading-event', data);
      return response.json() as Promise<ReadingAssessment>;
    },
    onSuccess: (data) => {
      toast({
        title: "Reading Assessment",
        description: `Accuracy: ${data.scores.accuracyPct}%, Phonemes: ${data.scores.phonemeHitPct}%`
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
    try {
      if (isReading) {
        stopReadingSession();
      } else {
        startReadingSession();
      }
    } catch (error) {
      console.error("Error toggling reading state:", error);
      // Reset to a safe state
      setIsReading(false);
      stopListening();
    }
  };
  
  // Function to explicitly request microphone permissions
  const requestMicrophonePermission = async (): Promise<boolean> => {
    try {
      // First try to get user media to trigger the permission prompt
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // If we got here, permission was granted
      console.log("Microphone permission granted");
      
      // Keep the stream active while we're recording
      // Store the stream on window for later cleanup
      (window as any).microphoneStream = stream;
      
      return true;
    } catch (error) {
      console.error("Microphone permission denied:", error);
      toast({
        title: "Microphone Access Denied",
        description: "Please allow microphone access to use the reading feature.",
        variant: "destructive"
      });
      return false;
    }
  };
  
  // Whether we need to show the permission UI
  const [showPermissionRequest, setShowPermissionRequest] = useState(false);
  
  // When microphone permission is granted
  const handlePermissionGranted = () => {
    console.log("Microphone permission granted via permission component");
    
    // Continue with starting reading session now that we have permission
    startListeningWithPermission();
  };
  
  // Debug: log any permission status changes
  useEffect(() => {
    console.log("Permission status changed to:", permissionStatus);
  }, [permissionStatus]);
  
  // When microphone permission is denied
  const handlePermissionDenied = () => {
    console.log("Microphone permission denied via permission component");
    toast({
      title: "Microphone Access Required",
      description: "Please allow microphone access in your browser settings to use the reading feature.",
      variant: "destructive"
    });
  };
  
  // Actual speech recognition start after permission
  const startListeningWithPermission = () => {
    // Set reading mode and start listening
    setIsReading(true);
    
    // Add debug to check support
    console.log("Speech recognition supported:", isSpeechRecognitionSupported);
    
    if (isSpeechRecognitionSupported) {
      console.log("Starting speech recognition...");
      
      // Use setTimeout to ensure state is updated first
      setTimeout(() => {
        startListening();
      }, 100);
    } else {
      toast({
        title: "Speech Recognition Not Supported",
        description: "Your browser doesn't support speech recognition. Try Chrome or Edge.",
        variant: "destructive"
      });
    }
  };
  
  // First step of reading session - clear state and check permissions
  const startReadingSession = async () => {
    // Clear any existing text and state
    setCurrentText("");
    resetTranscript();
    setCurrentWordIndex(-1);
    
    if (permissionStatus === 'granted') {
      // Already have permission, so start listening directly
      startListeningWithPermission();
    } 
    else if (permissionStatus === 'denied') {
      // Show the denied state, user will need to click "Try Again"
      // The UI component for denied state will be shown automatically
      toast({
        title: "Microphone Access Required",
        description: "Please allow microphone access to use the reading feature.",
        variant: "destructive"
      });
    }
    else {
      // Show the permission UI for 'prompt' or other states
      setShowPermissionRequest(true);
      // Also explicitly request permission through our hook
      await requestPermission();
    }
  };
  
  const stopReadingSession = async () => {
    // Clean up any timers
    if (silenceTimer) {
      clearTimeout(silenceTimer);
      setSilenceTimer(null);
    }
    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
      setInactivityTimer(null);
    }
    
    // Stop reading mode and speech recognition
    setIsReading(false);
    setCurrentWordIndex(-1);
    
    // Clean up microphone stream if it exists
    try {
      const micStream = (window as any).microphoneStream;
      if (micStream && typeof micStream.getTracks === 'function') {
        micStream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
        console.log("Microphone stream stopped");
        (window as any).microphoneStream = null;
      }
    } catch (error) {
      console.error("Error stopping microphone stream:", error);
    }
    
    if (isSpeechRecognitionSupported) {
      stopListening();
      
      // Submit the reading for assessment if we have data
      if (currentText && currentText.trim()) {
        try {
          // Ensure we have valid page data
          const pageNumber = page?.pageNumber || 1;
          const expectedText = page?.text || words.join(' ') || ""; 
          
          if (expectedText.trim()) {
            await assessReadingMutation.mutateAsync({
              bookId,
              pageNumber,
              expected: expectedText,
              actual: currentText
            });
          }
        } catch (assessError) {
          console.error("Error submitting reading assessment:", assessError);
          toast({
            title: "Assessment Error",
            description: "There was a problem analyzing your reading.",
            variant: "destructive"
          });
        }
      }
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 shadow-lg p-4 z-50 transition-all duration-300"
      style={{ transform: isReading ? 'translateY(0)' : 'translateY(85%)', maxHeight: '250px' }}>
      <div className="max-w-4xl mx-auto">
        {/* Show microphone permission prompt when needed */}
        {/* Show the microphone permission component when explicitly requested */}
        {showPermissionRequest && (
          <div className="mb-4">
            <MicrophonePermission
              onPermissionGranted={() => {
                setShowPermissionRequest(false);
                handlePermissionGranted();
              }}
              onPermissionDenied={() => {
                setShowPermissionRequest(false);
                handlePermissionDenied();
              }}
            />
          </div>
        )}
        
        {/* Show message when permission is denied */}
        {permissionStatus === 'denied' && !showPermissionRequest && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">
            <h3 className="font-medium">Microphone Access Denied</h3>
            <p className="text-sm mb-2">Please allow microphone access in your browser settings to use the reading feature.</p>
            <Button 
              size="sm" 
              variant="destructive"
              onClick={() => {
                // Try requesting permission again
                requestPermission();
              }}
            >
              Try Again
            </Button>
          </div>
        )}
        
        {/* Pull tab and controls */}
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center">
            <div 
              className="w-10 h-1 bg-neutral-300 rounded-full mx-auto mb-3 cursor-pointer"
              onClick={() => isReading ? stopReadingSession() : setIsReading(!isReading)}
            ></div>
            <h3 className="font-medium text-lg text-neutral-700 ml-2">{isReading ? "Reading Mode Active" : "Read Along"}</h3>
          </div>
          
          <div className="flex space-x-2">
            {/* Auto-stop toggle */}
            <button 
              className={`p-2 rounded-full ${autoStopEnabled ? 'text-primary-600 bg-primary-50' : 'text-neutral-400'}`}
              title={autoStopEnabled ? "Auto-stop enabled" : "Auto-stop disabled"}
              onClick={() => setAutoStopEnabled(!autoStopEnabled)}
            >
              {autoStopEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
            
            {/* Main reading control button */}
            <Button
              variant={isReading ? "destructive" : "default"}
              onClick={toggleReading}
              className={`h-10 ${isReading ? '' : ''}`}
              disabled={assessReadingMutation.isPending || showPermissionRequest}
              size="sm"
            >
              {isReading ? (
                <>
                  <Square className="mr-2 h-4 w-4" />
                  <span>Stop</span>
                </>
              ) : (
                <>
                  <Mic className="mr-2 h-4 w-4" />
                  <span>Start Reading</span>
                </>
              )}
            </Button>
          </div>
        </div>
        
        {/* Reading interface */}
        <div className="flex space-x-4">
          {/* Audio visualization */}
          {isReading && (
            <div className="audio-wave-container bg-white border border-neutral-100 rounded-lg p-3 h-12 min-w-[60px] flex items-center justify-center">
              <div 
                ref={audioVisRef} 
                className="audio-wave flex items-end text-primary-500 h-full"
              ></div>
            </div>
          )}
          
          {/* Speech recognition output */}
          <div className="flex-1">
            {isReading ? (
              <div className="bg-neutral-50 rounded-lg p-3 text-sm text-neutral-600 h-full flex flex-col">
                {lastWordDetected && (
                  <div className="mb-1 inline-block bg-primary-100 text-primary-800 text-xs font-medium px-2 py-1 rounded-full">
                    Last word: {lastWordDetected}
                  </div>
                )}
                {interimTranscript && (
                  <p className="italic text-primary-700 text-sm">{interimTranscript}</p>
                )}
                {!interimTranscript && !lastWordDetected && (
                  <p className="text-neutral-400 text-sm italic">Listening for your voice...</p>
                )}
              </div>
            ) : (
              <>
                {assessReadingMutation.data && (
                  <div className="flex items-center space-x-3">
                    <div className="bg-white border border-neutral-100 shadow-sm p-2 rounded-lg text-center flex-1">
                      <div className="text-lg font-bold text-primary-600">
                        {assessReadingMutation.data.scores.accuracyPct}%
                      </div>
                      <div className="text-xs text-neutral-500">Accuracy</div>
                    </div>
                    <div className="bg-white border border-neutral-100 shadow-sm p-2 rounded-lg text-center flex-1">
                      <div className="text-lg font-bold text-green-600">
                        {assessReadingMutation.data.scores.phonemeHitPct}%
                      </div>
                      <div className="text-xs text-neutral-500">Phonemes</div>
                    </div>
                    <p className="text-sm text-green-600 flex-1">Great job! Pull up to continue reading.</p>
                  </div>
                )}
                {!assessReadingMutation.data && (
                  <div>
                    <p className="text-sm text-neutral-600 mb-2">
                      Pull up this panel and click "Start Reading" to practice reading aloud.
                    </p>
                    <div className="text-xs text-neutral-500 underline cursor-pointer hover:text-primary-600" 
                         onClick={() => setShowPermissionRequest(true)}>
                      Having microphone issues? Click here to verify access
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        
        {/* Browser support warning if needed */}
        {!isSpeechRecognitionSupported && (
          <div className="mt-2 bg-red-50 text-red-700 p-2 rounded-lg text-xs">
            <p className="font-medium">Speech recognition not supported in this browser!</p>
            <p>Please use Chrome or Edge browser for the best experience.</p>
          </div>
        )}
      </div>
    </div>
  );
}

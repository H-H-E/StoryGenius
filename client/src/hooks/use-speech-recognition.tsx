import { useState, useEffect, useCallback, useRef } from 'react';

interface SpeechRecognitionHook {
  transcript: string;
  isListening: boolean;
  isSpeechRecognitionSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  // Error property will not be exposed to prevent crash in consuming components
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export function useSpeechRecognition(): SpeechRecognitionHook {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Check both native and webkit implementations, with more careful detection
  const isSpeechRecognitionSupported = useCallback(() => {
    try {
      return typeof window !== 'undefined' && 
        (typeof window.SpeechRecognition !== 'undefined' || 
         typeof window.webkitSpeechRecognition !== 'undefined');
    } catch (e) {
      console.error("Error checking speech recognition support:", e);
      return false;
    }
  }, []);
  
  // Safe cleanup function to prevent memory leaks
  const cleanupRecognition = useCallback(() => {
    try {
      if (recognitionRef.current) {
        // Remove all event listeners to prevent memory leaks
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    } catch (e) {
      console.error("Error cleaning up speech recognition:", e);
    }
  }, []);
  
  const startListening = useCallback(() => {
    if (!isSpeechRecognitionSupported()) {
      setError("Speech recognition not supported in this browser");
      return;
    }
    
    // Reset state
    setError(null);
    resetTranscript();
    
    // Cleanup any existing instance first
    cleanupRecognition();
    
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      // Configure recognition
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      
      // Handle recognition results with better error checking
      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        try {
          if (!event || !event.results) return;
          
          let finalTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i] && event.results[i][0] && event.results[i][0].transcript) {
              const transcriptSegment = event.results[i][0].transcript;
              if (event.results[i].isFinal) {
                finalTranscript += transcriptSegment;
              }
            }
          }
          
          if (finalTranscript) {
            setTranscript(prev => {
              const updatedTranscript = prev ? `${prev} ${finalTranscript}` : finalTranscript;
              return updatedTranscript.trim();
            });
          }
        } catch (resultError) {
          console.error('Error processing speech results:', resultError);
        }
      };
      
      // Handle errors
      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setError(event.error || "Speech recognition error");
        
        // Auto-stop on certain errors
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          stopListening();
        }
      };
      
      // Auto-restart recognition if it ends but should still be listening
      recognitionRef.current.onend = () => {
        try {
          if (isListening && recognitionRef.current) {
            recognitionRef.current.start();
          }
        } catch (endError) {
          console.error('Error restarting speech recognition:', endError);
          setIsListening(false);
        }
      };
      
      // Start recognition
      recognitionRef.current.start();
      setIsListening(true);
    } catch (error) {
      console.error('Speech recognition initialization error:', error);
      setError("Failed to start speech recognition");
      setIsListening(false);
    }
  }, [isSpeechRecognitionSupported, isListening, cleanupRecognition]);
  
  const stopListening = useCallback(() => {
    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    } catch (error) {
      console.error('Error stopping speech recognition:', error);
    } finally {
      setIsListening(false);
    }
  }, []);
  
  const resetTranscript = useCallback(() => {
    setTranscript('');
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupRecognition();
    };
  }, [cleanupRecognition]);
  
  return {
    transcript,
    isListening,
    isSpeechRecognitionSupported: isSpeechRecognitionSupported(),
    startListening,
    stopListening,
    resetTranscript
  };
}

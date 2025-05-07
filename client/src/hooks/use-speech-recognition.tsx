import { useState, useEffect, useCallback, useRef } from 'react';

interface SpeechRecognitionHook {
  transcript: string;
  interimTranscript: string;
  lastWordDetected: string;
  confidence: number;
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
  const [interimTranscript, setInterimTranscript] = useState('');
  const [lastWordDetected, setLastWordDetected] = useState('');
  const [confidence, setConfidence] = useState(0);
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
  
  // Extract the last word from a transcript
  const extractLastWord = useCallback((text: string): string => {
    if (!text) return '';
    
    // Clean the text and split by whitespace
    const cleanedText = text.trim();
    const words = cleanedText.split(/\s+/);
    
    // Return the last word or empty string if no words
    return words.length > 0 ? words[words.length - 1] : '';
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
          let currentInterimTranscript = '';
          let currentConfidence = 0;
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i] && event.results[i][0]) {
              const transcriptSegment = event.results[i][0].transcript || '';
              // Track confidence of the latest result
              const resultConfidence = event.results[i][0].confidence || 0;
              
              if (i === event.results.length - 1) {
                currentConfidence = resultConfidence;
              }
              
              if (event.results[i].isFinal) {
                finalTranscript += ' ' + transcriptSegment;
              } else {
                currentInterimTranscript += ' ' + transcriptSegment;
              }
            }
          }
          
          // Update confidence
          setConfidence(currentConfidence);
          
          // Only update last word if we have interim results
          if (currentInterimTranscript) {
            const lastWord = extractLastWord(currentInterimTranscript);
            if (lastWord) {
              setLastWordDetected(lastWord);
            }
            setInterimTranscript(currentInterimTranscript.trim());
          }
          
          // Update final transcript if we have final results
          if (finalTranscript) {
            setTranscript(prev => {
              const updatedTranscript = prev ? `${prev} ${finalTranscript}` : finalTranscript;
              return updatedTranscript.trim();
            });
            // Clear interim transcript when we get a final result
            setInterimTranscript('');
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
  }, [isSpeechRecognitionSupported, isListening, cleanupRecognition, extractLastWord]);
  
  const stopListening = useCallback(() => {
    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    } catch (error) {
      console.error('Error stopping speech recognition:', error);
    } finally {
      setIsListening(false);
      // Clear any interim results when we stop
      setInterimTranscript('');
    }
  }, []);
  
  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setLastWordDetected('');
    setConfidence(0);
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupRecognition();
    };
  }, [cleanupRecognition]);
  
  return {
    transcript,
    interimTranscript,
    lastWordDetected,
    confidence,
    isListening,
    isSpeechRecognitionSupported: isSpeechRecognitionSupported(),
    startListening,
    stopListening,
    resetTranscript
  };
}

import { useState, useEffect, useCallback, useRef } from 'react';

interface SpeechRecognitionHook {
  transcript: string;
  interimTranscript: string;
  lastWordDetected: string;
  confidence: number;
  isListening: boolean;
  isSpeechRecognitionSupported: boolean;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

// Expanded window interface with more accurate typing for better browser compatibility
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
    mozSpeechRecognition: any;
    msSpeechRecognition: any;
    oSpeechRecognition: any;
  }
}

/**
 * Enhanced speech recognition hook with robust browser support detection,
 * error handling, and word tracking capabilities
 */
export function useSpeechRecognition(): SpeechRecognitionHook {
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [lastWordDetected, setLastWordDetected] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Keep the recognition instance in a ref to persist across renders
  const recognitionRef = useRef<any>(null);
  
  // Restart count to prevent infinite restart loops
  const restartCountRef = useRef(0);
  const maxRestartAttempts = 3;
  
  /**
   * Detect speech recognition support across different browsers
   * Tries multiple vendor prefixes for maximum compatibility
   */
  const getSpeechRecognition = useCallback(() => {
    try {
      if (typeof window === 'undefined') return null;
      
      // Try all possible browser implementations
      return window.SpeechRecognition || 
             window.webkitSpeechRecognition ||
             window.mozSpeechRecognition ||
             window.msSpeechRecognition ||
             window.oSpeechRecognition;
    } catch (e) {
      console.error("Error accessing speech recognition API:", e);
      return null;
    }
  }, []);
  
  /**
   * Check if speech recognition is supported in the current browser
   */
  const isSpeechRecognitionSupported = useCallback(() => {
    return getSpeechRecognition() !== null;
  }, [getSpeechRecognition]);
  
  /**
   * Safely clean up the speech recognition instance
   * Removes all event listeners and stops recognition
   */
  const cleanupRecognition = useCallback(() => {
    try {
      if (recognitionRef.current) {
        console.log("Cleaning up speech recognition instance");
        
        // Remove all event listeners to prevent memory leaks
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onstart = null;
        recognitionRef.current.onnomatch = null;
        recognitionRef.current.onaudiostart = null;
        recognitionRef.current.onaudioend = null;
        recognitionRef.current.onsoundstart = null;
        recognitionRef.current.onsoundend = null;
        recognitionRef.current.onspeechstart = null;
        recognitionRef.current.onspeechend = null;
        
        // Safely stop recognition
        try {
          recognitionRef.current.stop();
        } catch (stopError) {
          // Ignore stop errors, they happen if recognition hasn't fully started
        }
        
        recognitionRef.current.abort && recognitionRef.current.abort();
        recognitionRef.current = null;
        
        // Reset restart counter
        restartCountRef.current = 0;
      }
    } catch (e) {
      console.error("Error cleaning up speech recognition:", e);
    }
  }, []);
  
  /**
   * Extract the last word from a transcript
   * Used for real-time word detection
   */
  const extractLastWord = useCallback((text: string): string => {
    if (!text) return '';
    
    // Clean the text and split by whitespace
    const cleanedText = text.trim();
    const words = cleanedText.split(/\s+/);
    
    // Return the last word or empty string if no words
    return words.length > 0 ? words[words.length - 1].toLowerCase() : '';
  }, []);
  
  /**
   * Start the speech recognition process
   * Configures and initializes the recognition instance
   */
  const startListening = useCallback(() => {
    // First check if speech recognition is supported
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) {
      console.error("Speech recognition not supported in this browser");
      setError("Speech recognition not supported in this browser");
      return;
    }
    
    // Reset state
    setError(null);
    resetTranscript();
    
    // Cleanup any existing instance first
    cleanupRecognition();
    
    try {
      console.log("Initializing speech recognition");
      
      // Create new instance
      recognitionRef.current = new SpeechRecognition();
      
      // Configure recognition
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.maxAlternatives = 1;
      recognitionRef.current.lang = 'en-US';
      
      // Add detailed logging for debugging
      recognitionRef.current.onstart = () => {
        console.log("Speech recognition started");
        setIsListening(true);
      };
      
      recognitionRef.current.onaudiostart = () => {
        console.log("Audio capturing started");
      };
      
      recognitionRef.current.onsoundstart = () => {
        console.log("Sound detected");
      };
      
      recognitionRef.current.onspeechstart = () => {
        console.log("Speech detected");
      };
      
      recognitionRef.current.onspeechend = () => {
        console.log("Speech ended");
      };
      
      recognitionRef.current.onsoundend = () => {
        console.log("Sound ended");
      };
      
      recognitionRef.current.onaudioend = () => {
        console.log("Audio capturing ended");
      };
      
      recognitionRef.current.onnomatch = () => {
        console.log("No speech was recognized");
      };
      
      // Handle recognition results
      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        try {
          if (!event || !event.results) {
            console.warn("Invalid recognition event");
            return;
          }
          
          let finalTranscript = '';
          let currentInterimTranscript = '';
          let currentConfidence = 0;
          
          // Process all results
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i] && event.results[i][0]) {
              // Extract transcript and confidence
              const transcriptSegment = event.results[i][0].transcript || '';
              const resultConfidence = event.results[i][0].confidence || 0;
              
              // Track confidence of the latest result
              if (i === event.results.length - 1) {
                currentConfidence = resultConfidence;
                console.log(`Recognition confidence: ${(currentConfidence * 100).toFixed(1)}%`);
              }
              
              // Process final or interim results
              if (event.results[i].isFinal) {
                console.log(`Final result: "${transcriptSegment}"`);
                finalTranscript += ' ' + transcriptSegment;
              } else {
                console.log(`Interim result: "${transcriptSegment}"`);
                currentInterimTranscript += ' ' + transcriptSegment;
              }
            }
          }
          
          // Update confidence level
          if (currentConfidence > 0) {
            setConfidence(currentConfidence);
          }
          
          // Process interim results
          if (currentInterimTranscript) {
            // Clean up the interim transcript
            const cleanedInterim = currentInterimTranscript.trim();
            
            // Extract and set the last word for better real-time feedback
            const lastWord = extractLastWord(cleanedInterim);
            if (lastWord) {
              setLastWordDetected(lastWord);
              console.log(`Last word detected: "${lastWord}"`);
            }
            
            // Update the interim transcript state
            setInterimTranscript(cleanedInterim);
          }
          
          // Process final results
          if (finalTranscript) {
            // Update transcript, ensuring words are properly spaced
            setTranscript(prevTranscript => {
              const updatedTranscript = prevTranscript 
                ? `${prevTranscript} ${finalTranscript.trim()}` 
                : finalTranscript.trim();
              return updatedTranscript;
            });
            
            // Clear interim transcript when final result received
            setInterimTranscript('');
          }
        } catch (resultError) {
          console.error('Error processing speech results:', resultError);
        }
      };
      
      // Handle recognition errors
      recognitionRef.current.onerror = (event: any) => {
        const errorMessage = event.error || "Unknown speech recognition error";
        console.error(`Speech recognition error: ${errorMessage}`, event);
        
        // Set user-facing error
        setError(errorMessage);
        
        // Handle specific error types
        switch (event.error) {
          case 'not-allowed':
          case 'service-not-allowed':
            console.error("Microphone access denied");
            stopListening();
            break;
            
          case 'aborted':
            console.log("Speech recognition aborted");
            break;
            
          case 'network':
            console.error("Network error occurred during speech recognition");
            break;
            
          case 'no-speech':
            console.log("No speech detected");
            break;
            
          default:
            console.error("Unhandled speech recognition error:", event.error);
            break;
        }
      };
      
      // Handle recognition end event
      recognitionRef.current.onend = () => {
        console.log("Speech recognition ended");
        
        // If we're still supposed to be listening, restart recognition
        if (isListening && recognitionRef.current) {
          try {
            // Only attempt to restart if we haven't exceeded max attempts
            if (restartCountRef.current < maxRestartAttempts) {
              console.log(`Restarting speech recognition (attempt ${restartCountRef.current + 1}/${maxRestartAttempts})`);
              restartCountRef.current += 1;
              recognitionRef.current.start();
            } else {
              console.error("Maximum restart attempts reached, stopping recognition");
              setIsListening(false);
              setError("Speech recognition stopped unexpectedly. Please try again.");
            }
          } catch (endError) {
            console.error('Error restarting speech recognition:', endError);
            setIsListening(false);
            setError("Failed to restart speech recognition");
          }
        } else {
          // If we're not supposed to be listening, update state
          setIsListening(false);
        }
      };
      
      // Start recognition with better error handling
      try {
        console.log("Starting speech recognition...");
        recognitionRef.current.start();
        setIsListening(true);
      } catch (startError: any) {
        // Handle specific start errors
        if (startError.name === 'NotAllowedError') {
          console.error("Microphone permission denied");
          setError("Microphone access denied. Please grant permission to use the microphone.");
        } else {
          console.error('Speech recognition start error:', startError);
          setError("Failed to start speech recognition");
        }
        setIsListening(false);
      }
    } catch (initError) {
      console.error('Speech recognition initialization error:', initError);
      setError("Failed to initialize speech recognition");
      setIsListening(false);
    }
  }, [getSpeechRecognition, cleanupRecognition, extractLastWord, isListening]);
  
  /**
   * Stop the speech recognition process
   */
  const stopListening = useCallback(() => {
    console.log("Stopping speech recognition");
    
    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    } catch (error) {
      console.error('Error stopping speech recognition:', error);
    } finally {
      // Always update state regardless of errors
      setIsListening(false);
      setInterimTranscript('');
      
      // Reset restart counter
      restartCountRef.current = 0;
    }
  }, []);
  
  /**
   * Reset all transcript-related state
   */
  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setLastWordDetected('');
    setConfidence(0);
    setError(null);
  }, []);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      cleanupRecognition();
    };
  }, [cleanupRecognition]);
  
  // Return the hook interface
  return {
    transcript,
    interimTranscript,
    lastWordDetected,
    confidence,
    isListening,
    isSpeechRecognitionSupported: isSpeechRecognitionSupported(),
    error,
    startListening,
    stopListening,
    resetTranscript
  };
}

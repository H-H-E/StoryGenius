import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Mic, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface MicrophonePermissionProps {
  onPermissionGranted: () => void;
  onPermissionDenied?: () => void;
}

/**
 * A component that handles requesting microphone permissions explicitly
 * This is crucial for speech recognition to work in most browsers
 */
const MicrophonePermission = ({ onPermissionGranted, onPermissionDenied }: MicrophonePermissionProps) => {
  const [permissionState, setPermissionState] = useState<'prompt'|'granted'|'denied'|'unsupported'>('prompt');
  const [isRequesting, setIsRequesting] = useState(false);
  
  // Check if navigator.mediaDevices is supported
  useEffect(() => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error("MediaDevices API not supported in this browser");
      setPermissionState('unsupported');
    } else {
      // Modern browsers support permission status checks
      if (navigator.permissions && navigator.permissions.query) {
        navigator.permissions.query({ name: 'microphone' as PermissionName })
          .then(permissionStatus => {
            console.log("Microphone permission status:", permissionStatus.state);
            setPermissionState(permissionStatus.state as 'prompt'|'granted'|'denied');
            
            // Listen for changes in permission status
            permissionStatus.onchange = () => {
              console.log("Permission status changed:", permissionStatus.state);
              setPermissionState(permissionStatus.state as 'prompt'|'granted'|'denied');
              
              if (permissionStatus.state === 'granted') {
                onPermissionGranted();
              } else if (permissionStatus.state === 'denied' && onPermissionDenied) {
                onPermissionDenied();
              }
            };
          })
          .catch(error => {
            console.error("Error checking permission status:", error);
            // Fallback to prompt state if we can't check
            setPermissionState('prompt');
          });
      }
    }
  }, [onPermissionGranted, onPermissionDenied]);
  
  // Effect to notify parent when permission is already granted
  useEffect(() => {
    if (permissionState === 'granted') {
      onPermissionGranted();
    } else if (permissionState === 'denied' && onPermissionDenied) {
      onPermissionDenied();
    }
  }, [permissionState, onPermissionGranted, onPermissionDenied]);
  
  const requestMicrophoneAccess = async () => {
    try {
      setIsRequesting(true);
      
      // This will trigger the browser's permission prompt
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Store the stream in window for later use
      (window as any).microphoneStream = stream;
      
      console.log("Microphone access granted");
      setPermissionState('granted');
      onPermissionGranted();
      
      toast({
        title: "Microphone Access Granted",
        description: "You can now use speech recognition.",
      });
    } catch (error) {
      console.error("Error requesting microphone access:", error);
      setPermissionState('denied');
      
      if (onPermissionDenied) {
        onPermissionDenied();
      }
      
      toast({
        title: "Microphone Access Denied",
        description: "Speech recognition requires microphone access. Please allow access in your browser settings.",
        variant: "destructive"
      });
    } finally {
      setIsRequesting(false);
    }
  };
  
  if (permissionState === 'unsupported') {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center">
        <AlertCircle className="mr-2 h-5 w-5" />
        <div>
          <p className="font-medium">Microphone access is not supported in this browser</p>
          <p className="text-sm">Please try using Chrome, Edge, or another modern browser.</p>
        </div>
      </div>
    );
  }
  
  if (permissionState === 'granted') {
    return null; // No UI needed when permission is already granted
  }
  
  return (
    <div className="p-4 bg-blue-50 text-blue-700 rounded-lg mb-4">
      <div className="flex flex-col items-center">
        <h3 className="font-medium text-lg mb-2">Microphone Permission Required</h3>
        <p className="text-center mb-4">
          To use the read-along feature with speech recognition, you need to grant microphone access.
        </p>
        <Button 
          onClick={requestMicrophoneAccess}
          disabled={isRequesting}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Mic className="mr-2 h-4 w-4" />
          {isRequesting ? "Requesting Access..." : "Allow Microphone Access"}
        </Button>
        {permissionState === 'denied' && (
          <p className="mt-3 text-red-600 text-sm">
            Microphone access was denied. Please update your browser settings and try again.
          </p>
        )}
      </div>
    </div>
  );
};

export default MicrophonePermission;
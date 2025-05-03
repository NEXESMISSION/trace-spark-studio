
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Radio, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { webRTCService } from '@/services/webRTCService';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface LiveButtonProps {
  stream: MediaStream | null;
}

const LiveButton: React.FC<LiveButtonProps> = ({ stream }) => {
  const [isLive, setIsLive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorState, setErrorState] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Check if already broadcasting on mount
  useEffect(() => {
    const isBroadcasting = webRTCService.isBroadcasting();
    setIsLive(isBroadcasting);
    
    // Check for any existing errors
    const error = webRTCService.getConnectionError();
    if (error) {
      setErrorState(error.message);
    }
  }, []);

  const toggleLive = async () => {
    try {
      setIsLoading(true);
      setErrorState(null);
      webRTCService.clearConnectionError();
      
      if (isLive) {
        // Stop broadcasting
        await webRTCService.stop();
        setIsLive(false);
        toast({
          title: "Live sharing stopped",
          description: "Your camera is no longer being shared",
        });
      } else {
        if (!stream) {
          throw new Error("Camera stream is not available");
        }
        
        // Initialize WebRTC and start broadcasting
        try {
          await webRTCService.initialize(true);
          await webRTCService.setLocalStream(stream);
          await webRTCService.startBroadcasting();
          
          setIsLive(true);
          toast({
            title: "Live sharing started",
            description: "Others can now view your camera feed in the LiveSync page",
            duration: 5000,
          });
        } catch (initError) {
          console.error("Error initializing WebRTC:", initError);
          // Get the error from the service if available
          const serviceError = webRTCService.getConnectionError();
          const errorMessage = serviceError ? serviceError.message : 
            (initError instanceof Error ? initError.message : "Failed to initialize connection");
          
          setErrorState(errorMessage);
          throw new Error(errorMessage);
        }
      }
    } catch (error) {
      console.error("Error toggling live mode:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to toggle live mode";
      setErrorState(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip open={!!errorState}>
        <TooltipTrigger asChild>
          <Button 
            onClick={toggleLive}
            disabled={isLoading || !stream}
            className={isLive ? "bg-red-500 hover:bg-red-600 text-white" : ""}
            variant={isLive ? "default" : "outline"}
            size="sm"
          >
            {isLoading ? (
              <span className="flex items-center">
                <span className="animate-spin h-3 w-3 mr-2 border-2 border-t-transparent rounded-full"></span>
                {isLive ? "Stopping..." : "Starting..."}
              </span>
            ) : errorState ? (
              <span className="flex items-center">
                <AlertCircle size={14} className="mr-1.5 text-red-500" /> 
                <span className="hidden sm:inline">Error</span>
              </span>
            ) : isLive ? (
              <span className="flex items-center">
                <Radio size={14} className="mr-1.5 animate-pulse" /> 
                <span className="hidden sm:inline">Live</span>
              </span>
            ) : (
              <span className="flex items-center">
                <Radio size={14} className="mr-1.5" /> 
                <span className="hidden sm:inline">Go Live</span>
              </span>
            )}
          </Button>
        </TooltipTrigger>
        {errorState && (
          <TooltipContent side="bottom" className="max-w-[200px]">
            <p>{errorState}</p>
            <p className="text-xs mt-1">Click to try again</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
};

export default LiveButton;

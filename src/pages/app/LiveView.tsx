
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Radio, Maximize, Minimize, Laptop, Smartphone, User } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { webRTCService } from '@/services/webRTCService';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

interface Broadcaster {
  broadcaster_id: string;
  device_id?: string;
  user_id?: string | null;
  is_same_account?: boolean;
}

const LiveSync = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasBroadcasts, setHasBroadcasts] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [broadcasters, setBroadcasters] = useState<Broadcaster[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Get current user ID
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        setCurrentUserId(data.user?.id || null);
      } catch (error) {
        console.error("Error getting current user:", error);
      }
    };
    
    getCurrentUser();
  }, []);
  
  // Check for active broadcasts
  useEffect(() => {
    const checkBroadcasts = async () => {
      try {
        // Check if there are any active broadcasters
        const hasActive = await webRTCService.checkForActiveBroadcasters();
        setHasBroadcasts(hasActive);
        
        // Get the list of active broadcasters
        const activeBroadcasters = webRTCService.getActiveBroadcasters();
        
        // Mark broadcasters from the same account
        const processedBroadcasters = activeBroadcasters.map(broadcaster => ({
          ...broadcaster,
          is_same_account: currentUserId ? broadcaster.user_id === currentUserId : false
        }));
        
        setBroadcasters(processedBroadcasters);
      } catch (error) {
        console.error("Error checking broadcasts:", error);
      }
    };
    
    checkBroadcasts();
    
    // Set up a real-time subscription to broadcasting status changes
    const channel = supabase.channel('public:broadcasting_status')
      .on(
        'postgres_changes', 
        { 
          event: '*',
          schema: 'public',
          table: 'broadcasting_status' 
        },
        () => {
          checkBroadcasts();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);  // Re-run when currentUserId changes
  
  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen()
          .then(() => {
            setIsFullscreen(true);
          })
          .catch(err => {
            console.error('Error attempting to enable fullscreen:', err);
          });
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
          .then(() => {
            setIsFullscreen(false);
          })
          .catch(err => {
            console.error('Error attempting to exit fullscreen:', err);
          });
      }
    }
  };
  
  // Detect fullscreen change from browser controls
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);
  
  // Handle connection to broadcast
  const handleConnect = async (broadcasterId?: string) => {
    try {
      setIsLoading(true);
      
      // Initialize WebRTC as a viewer
      const remoteStream = await webRTCService.initialize(false);
      
      // Connect to the specified broadcaster or let the service choose the best one
      const broadcaster = await webRTCService.startViewing(broadcasterId);
      
      // Set the remote stream to the video element
      if (videoRef.current) {
        videoRef.current.srcObject = remoteStream;
        videoRef.current.play().catch(err => {
          console.error("Error playing video:", err);
          toast({
            title: "Playback Error",
            description: "Failed to play the remote stream",
            variant: "destructive",
          });
        });
      }
      
      setIsConnected(true);
      toast({
        title: "Connected",
        description: broadcaster.user_id === currentUserId 
          ? "Connected to your device's broadcast" 
          : "Connected to the live broadcast",
      });
    } catch (error) {
      console.error("Error connecting to broadcast:", error);
      toast({
        title: "Connection Error",
        description: error instanceof Error ? error.message : "Failed to connect to the broadcast",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle disconnection
  const handleDisconnect = async () => {
    try {
      await webRTCService.stop();
      
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      
      setIsConnected(false);
      toast({
        title: "Disconnected",
        description: "You've disconnected from the broadcast",
      });
    } catch (error) {
      console.error("Error disconnecting:", error);
    }
  };
  
  // Clean up on component unmount
  useEffect(() => {
    return () => {
      handleDisconnect();
    };
  }, []);

  return (
    <div className="container px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">LiveSync</h1>
      
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Radio className="text-traceMate" size={20} />
                  <span>LiveSync</span>
                </CardTitle>
                <CardDescription>
                  View live broadcasts from other devices
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div
              ref={containerRef}
              className={`relative rounded-md overflow-hidden ${
                isConnected ? "bg-black" : "bg-muted"
              } ${
                isFullscreen ? "fixed inset-0 z-50 rounded-none" : "aspect-video"
              }`}
            >
              {isConnected ? (
                <>
                  <video ref={videoRef} className="w-full h-full object-contain" muted={false} playsInline />
                  <div className="absolute top-4 right-4">
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={toggleFullscreen}
                      className="bg-background/50 backdrop-blur-sm"
                    >
                      {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-6">
                  <Radio size={48} className="text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    {hasBroadcasts ? "Live broadcast available" : "No active broadcasts"}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 text-center">
                    {hasBroadcasts 
                      ? broadcasters.some(b => b.is_same_account)
                        ? "One of your devices is broadcasting a tracing session"
                        : "Someone is currently broadcasting their tracing session" 
                      : "When someone shares their tracing session, it will appear here"
                    }
                  </p>
                  
                  {broadcasters.length > 0 && (
                    <div className="space-y-4 w-full max-w-md">
                      {broadcasters.some(b => b.is_same_account) && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Your Devices</h4>
                          {broadcasters
                            .filter(b => b.is_same_account)
                            .map(broadcaster => (
                              <div key={broadcaster.broadcaster_id} className="flex items-center justify-between p-2 bg-muted rounded-md">
                                <div className="flex items-center gap-2">
                                  <Smartphone size={16} />
                                  <span className="text-sm">Your Device</span>
                                  <Badge variant="outline" className="ml-2">Same Account</Badge>
                                </div>
                                <Button 
                                  size="sm"
                                  onClick={() => handleConnect(broadcaster.broadcaster_id)} 
                                  disabled={isLoading}
                                >
                                  {isLoading ? "Connecting..." : "Connect"}
                                </Button>
                              </div>
                            ))
                          }
                        </div>
                      )}
                      
                      {broadcasters.some(b => !b.is_same_account) && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Other Broadcasts</h4>
                          {broadcasters
                            .filter(b => !b.is_same_account)
                            .map(broadcaster => (
                              <div key={broadcaster.broadcaster_id} className="flex items-center justify-between p-2 bg-muted rounded-md">
                                <div className="flex items-center gap-2">
                                  <User size={16} />
                                  <span className="text-sm">Other User</span>
                                </div>
                                <Button 
                                  size="sm"
                                  onClick={() => handleConnect(broadcaster.broadcaster_id)} 
                                  disabled={isLoading}
                                >
                                  {isLoading ? "Connecting..." : "Connect"}
                                </Button>
                              </div>
                            ))
                          }
                        </div>
                      )}
                      
                      {/* Quick connect button */}
                      {broadcasters.length > 0 && (
                        <Button 
                          onClick={() => handleConnect()} 
                          disabled={isLoading}
                          className="w-full mt-4"
                        >
                          {isLoading ? "Connecting..." : "Quick Connect"}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {isConnected && !isFullscreen && (
              <div className="flex justify-center mt-4">
                <Button 
                  variant="outline" 
                  onClick={handleDisconnect}
                  className="min-w-32"
                >
                  Disconnect
                </Button>
              </div>
            )}
            
            <div className="mt-8 bg-muted rounded-md p-4">
              <div className="flex items-start gap-3">
                <Radio className="text-traceMate mt-1" size={20} />
                <div>
                  <h4 className="font-medium">Live Tracing</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Watch live broadcasts from other devices to help with your tracing.
                    Start a broadcast by clicking the "Go Live" button in the tracing page.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LiveSync;

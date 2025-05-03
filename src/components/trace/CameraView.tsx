
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, CameraOff, Settings, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { CameraPreferences, loadCameraPreferences, saveCameraPreferences } from '@/services/sessionService';

interface CameraViewProps {
  isEnabled: boolean;
  onCameraReady: (stream: MediaStream) => void;
  onCameraError: (error: Error) => void;
  isFrontCamera: boolean;
}

const CameraView: React.FC<CameraViewProps> = ({ 
  isEnabled,
  onCameraReady,
  onCameraError,
  isFrontCamera
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();

  // Load saved camera preferences from session storage
  useEffect(() => {
    try {
      const savedPrefs = loadCameraPreferences();
      if (savedPrefs) {
        if (savedPrefs.deviceId) setSelectedDeviceId(savedPrefs.deviceId);
        setBrightness(savedPrefs.brightness);
        setContrast(savedPrefs.contrast);
      }
    } catch (error) {
      console.error('Error loading camera preferences:', error);
    }
  }, []);

  // Save camera preferences when they change
  useEffect(() => {
    if (cameraActive) {
      saveCameraPreferences({
        deviceId: selectedDeviceId,
        isFrontCamera,
        brightness,
        contrast,
        enabled: isEnabled
      });
    }
  }, [selectedDeviceId, isFrontCamera, brightness, contrast, isEnabled, cameraActive]);

  // Get available camera devices
  const getDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setAvailableDevices(videoDevices);
      
      // Only set a default device if we don't already have one selected
      if (videoDevices.length > 0 && !selectedDeviceId) {
        // Try to find the previously saved device
        const savedPrefs = loadCameraPreferences();
        if (savedPrefs.deviceId) {
          // Check if the saved device is still available
          const deviceExists = videoDevices.some(device => device.deviceId === savedPrefs.deviceId);
          if (deviceExists) {
            setSelectedDeviceId(savedPrefs.deviceId);
          } else {
            setSelectedDeviceId(videoDevices[0].deviceId);
          }
        } else {
          setSelectedDeviceId(videoDevices[0].deviceId);
        }
      }
    } catch (error) {
      console.error('Error enumerating devices:', error);
      setErrorMessage('Could not enumerate camera devices');
    }
  }, [selectedDeviceId]);

  // Initialize camera devices with permissions
  useEffect(() => {
    const initializeDevices = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      
      try {
        // Request permissions first to get labeled devices
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        
        // Stop the stream immediately, we just needed permissions
        stream.getTracks().forEach(track => track.stop());
        
        // Now get the devices with labels
        await getDevices();
        setHasPermission(true);
      } catch (err) {
        console.error('Error requesting initial camera permission:', err);
        setHasPermission(false);
        setErrorMessage('Camera permission denied');
        
        // Try to get devices anyway, they just won't have labels
        getDevices();
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeDevices();
  }, [getDevices]);

  useEffect(() => {
    if (isEnabled) {
      startCamera();
    } else {
      stopCamera();
    }
  }, [isEnabled, isFrontCamera, selectedDeviceId]);

  const startCamera = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      // Stop any existing streams first
      if (streamRef.current) {
        stopCamera();
      }
      
      let constraints: MediaStreamConstraints = {
        video: {
          facingMode: isFrontCamera ? 'user' : 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };
      
      // Use deviceId if selected and available
      if (selectedDeviceId) {
        constraints = {
          video: {
            deviceId: { exact: selectedDeviceId },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        };
      }
      
      console.log('Starting camera with constraints:', constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play()
              .then(() => {
                setHasPermission(true);
                setCameraActive(true);
                onCameraReady(stream);
                
                // Save camera preferences
                saveCameraPreferences({
                  deviceId: selectedDeviceId,
                  isFrontCamera,
                  brightness,
                  contrast,
                  enabled: true
                });
                
                setIsLoading(false);
              })
              .catch(err => {
                console.error('Error playing video:', err);
                setErrorMessage('Failed to start video playback');
                onCameraError(new Error('Failed to start video playback'));
                setIsLoading(false);
              });
          }
        };
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setHasPermission(false);
      setCameraActive(false);
      setIsLoading(false);
      
      // Type check for the error object
      if (error instanceof Error) {
        onCameraError(error);
        setErrorMessage(error.message);
        
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          toast({
            title: "Camera access denied",
            description: "Please allow camera access to use tracing features.",
            variant: "destructive",
          });
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          toast({
            title: "Camera not found",
            description: "No camera device was found on your system.",
            variant: "destructive",
          });
        } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
          toast({
            title: "Camera in use",
            description: "Your camera is being used by another application.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Camera error",
            description: error.message || "An unknown error occurred",
            variant: "destructive",
          });
        }
      }
    }
  };

  const stopCamera = () => {
    // Clear error state when stopping camera
    setErrorMessage(null);
    
    // Stop the stream from streamRef first (this is more reliable)
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      tracks.forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    
    // Also handle the video element's srcObject
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      
      tracks.forEach(track => {
        track.stop();
      });
      
      videoRef.current.srcObject = null;
    }
    
    setCameraActive(false);
    
    // Update camera preferences to remember camera is disabled
    saveCameraPreferences({
      deviceId: selectedDeviceId,
      isFrontCamera,
      brightness,
      contrast,
      enabled: false
    });
  };

  const handleCameraToggle = () => {
    if (cameraActive) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  const handleDeviceChange = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    if (cameraActive) {
      stopCamera();
      // Camera will restart automatically due to effect
    }
  };

  const refreshDevices = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          stream.getTracks().forEach(track => track.stop());
          
          navigator.mediaDevices.enumerateDevices()
            .then(devices => {
              const videoDevices = devices.filter(device => device.kind === 'videoinput');
              setAvailableDevices(videoDevices);
              
              if (videoDevices.length > 0 && !selectedDeviceId) {
                setSelectedDeviceId(videoDevices[0].deviceId);
              }
              
              toast({
                title: "Camera list refreshed",
                description: `Found ${videoDevices.length} camera device(s)`,
              });
            })
            .catch(err => {
              console.error('Error enumerating devices after refresh:', err);
            });
        });
    } catch (error) {
      console.error('Error refreshing devices:', error);
    }
  };

  return (
    <div className="relative w-full h-full bg-black">
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
          <p className="text-white">Initializing camera...</p>
        </div>
      )}
      
      {/* Permission denied error */}
      {hasPermission === false && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white bg-black/80 z-50">
          <CameraOff size={48} className="mb-4 text-red-500" />
          <h3 className="text-xl font-semibold mb-2">Camera Access Required</h3>
          <p className="mb-4">{errorMessage || 'Please allow camera access to use the tracing features.'}</p>
          <Button onClick={startCamera} disabled={isLoading}>
            {isLoading ? (
              <span className="flex items-center">
                <span className="animate-spin h-4 w-4 mr-2 border-2 border-t-transparent rounded-full"></span>
                Trying...
              </span>
            ) : (
              <>
                <Camera size={18} className="mr-2" /> Try Again
              </>
            )}
          </Button>
        </div>
      )}
      
      {/* Video element */}
      <video 
        ref={videoRef}
        autoPlay 
        playsInline
        muted
        className="w-full h-full object-cover"
        style={{ 
          display: cameraActive ? 'block' : 'none',
          transform: isFrontCamera ? 'scaleX(-1)' : 'none',
          filter: `brightness(${brightness}%) contrast(${contrast}%)`
        }}
      />
      
      {/* Camera inactive state */}
      {!cameraActive && hasPermission !== false && !isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/90">
          <Camera size={48} className="mb-4 text-muted-foreground" />
          <p className="mb-4 text-muted-foreground">
            {errorMessage || 'Camera is currently inactive'}
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={handleCameraToggle} disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center">
                  <span className="animate-spin h-4 w-4 mr-2 border-2 border-t-transparent rounded-full"></span>
                  Starting...
                </span>
              ) : (
                <>
                  <Camera size={18} className="mr-2" /> Start Camera
                </>
              )}
            </Button>
            
            <Button variant="outline" onClick={refreshDevices} disabled={isLoading}>
              <RefreshCw size={18} className="mr-2" /> Refresh Devices
            </Button>
          </div>
        </div>
      )}
      
      {/* Camera settings button */}
      {cameraActive && (
        <div className="absolute bottom-4 left-4 z-10 md:top-4 md:right-4 md:bottom-auto md:left-auto">
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                className="rounded-full bg-background/50 backdrop-blur-sm h-8 w-8 shadow-md hover:bg-background/70"
              >
                <Settings size={16} />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Camera Settings</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="camera-select">Camera Device</Label>
                  <div className="flex gap-2">
                    <Select value={selectedDeviceId} onValueChange={handleDeviceChange}>
                      <SelectTrigger id="camera-select" className="flex-1">
                        <SelectValue placeholder="Select camera" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableDevices.length > 0 ? (
                          availableDevices.map((device) => (
                            <SelectItem key={device.deviceId} value={device.deviceId}>
                              {device.label || `Camera ${availableDevices.indexOf(device) + 1}`}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-cameras" disabled>
                            No cameras found
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={refreshDevices} 
                      className="shrink-0"
                      disabled={isLoading}
                    >
                      <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between mb-1">
                    <Label htmlFor="brightness">Brightness</Label>
                    <span className="text-xs">{brightness}%</span>
                  </div>
                  <Slider
                    id="brightness"
                    value={[brightness]}
                    min={50}
                    max={150}
                    step={5}
                    onValueChange={(value) => setBrightness(value[0])}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between mb-1">
                    <Label htmlFor="contrast">Contrast</Label>
                    <span className="text-xs">{contrast}%</span>
                  </div>
                  <Slider
                    id="contrast"
                    value={[contrast]}
                    min={50}
                    max={150}
                    step={5}
                    onValueChange={(value) => setContrast(value[0])}
                  />
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
};

export default CameraView;

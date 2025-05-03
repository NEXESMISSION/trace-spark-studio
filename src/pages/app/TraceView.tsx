import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera as CameraIcon, RotateCcw, CameraOff, Maximize, Minimize, Upload, Settings, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import CameraView from '@/components/trace/CameraView';
import OverlayControls from '@/components/trace/OverlayControls';
import LiveButton from '@/components/trace/LiveButton';
import { useToast } from '@/components/ui/use-toast';
import { AuthContext } from '@/App';
import { initSession, loadCameraPreferences, saveCameraPreferences, SESSION_KEYS } from '@/services/sessionService';
// Custom hook for media queries
const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Modern browsers
    mediaQuery.addEventListener('change', handleChange);

    // Check on mount
    setMatches(mediaQuery.matches);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [query]);

  return matches;
};

interface Position {
  x: number;
  y: number;
}

interface ImageData {
  name: string;
  url: string;
}

const TraceView = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useContext(AuthContext);
  const [image, setImage] = useState<ImageData | null>(null);
  const { toast } = useToast();
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Camera and overlay states
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [isFrontCamera, setIsFrontCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  // Overlay position and controls
  const [dragPosition, setDragPosition] = useState<Position>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState<Position>({ x: 0, y: 0 });
  const overlayRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Overlay settings
  const [opacity, setOpacity] = useState(0.7);
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [tiltX, setTiltX] = useState(0);
  const [tiltY, setTiltY] = useState(0);
  const [positionX, setPositionX] = useState(0);
  const [positionY, setPositionY] = useState(0);
  const [zoom, setZoom] = useState(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  
  // All features are premium for free
  const isPremium = true;
  
  // Handle image upload - directly using the file without database storage
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    setIsUploading(true);
    setIsImageLoading(true);
    
    try {
      // Create a local URL for the file
      const fileUrl = URL.createObjectURL(file);
      const fileName = file.name.substring(0, file.name.lastIndexOf('.')) || 'Image';
      
      toast({
        title: "Image ready",
        description: "Your image is ready for tracing.",
      });
      
      // Set the image directly without storing in database
      const newImage = {
        name: fileName,
        url: fileUrl
      };
      
      // Save to session storage for persistence between page refreshes
      sessionStorage.setItem(SESSION_KEYS.TRACE_IMAGE, JSON.stringify(newImage));
      
      // Update state
      setImage(newImage);
      
      console.log("Image ready for tracing:", fileName);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to process the image",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setIsImageLoading(false);
    }
  };

  // Handle camera ready event
  const handleCameraReady = (mediaStream: MediaStream) => {
    setStream(mediaStream);
    console.log("Camera ready");
  };

  // Handle camera errors
  const handleCameraError = (error: Error) => {
    console.error('Camera error:', error);
    toast({
      title: "Camera error",
      description: "Could not access camera. Please check permissions.",
      variant: "destructive",
    });
  };

  // Reset overlay controls to default
  const resetControls = () => {
    setOpacity(0.7);
    setScale(1.0);
    setRotation(0);
    setTiltX(0);
    setTiltY(0);
    setPositionX(0);
    setPositionY(0);
    setZoom(1.0);
    setDragPosition({ x: 0, y: 0 });
  };

  // Toggle camera on/off
  const toggleCamera = () => {
    const newState = !cameraEnabled;
    setCameraEnabled(newState);
    
    // Update camera preferences in session
    const currentPrefs = loadCameraPreferences();
    saveCameraPreferences({
      ...currentPrefs,
      enabled: newState
    });
  };

  // Toggle between front and rear camera
  const toggleCameraFacing = () => {
    const newState = !isFrontCamera;
    setIsFrontCamera(newState);
    
    // Update camera preferences in session
    const currentPrefs = loadCameraPreferences();
    saveCameraPreferences({
      ...currentPrefs,
      isFrontCamera: newState
    });
  };

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        toast({
          title: "Fullscreen error",
          description: `Error attempting to enable fullscreen: ${err.message}`,
          variant: "destructive",
        });
      });
    } else {
      document.exitFullscreen();
    }
  };
  
  // Define handleFullscreenChange function
  const handleFullscreenChange = () => {
    setIsFullscreen(!!document.fullscreenElement);
  };

  // Initialize session and load saved state when component mounts
  useEffect(() => {
    // Initialize session tracking
    initSession();
    
    // Load camera preferences
    const savedPrefs = loadCameraPreferences();
    if (savedPrefs) {
      setCameraEnabled(savedPrefs.enabled);
      setIsFrontCamera(savedPrefs.isFrontCamera);
    }
    
    // Check if there's an image in session storage
    const savedImage = sessionStorage.getItem(SESSION_KEYS.TRACE_IMAGE);
    if (savedImage) {
      try {
        const parsedImage = JSON.parse(savedImage);
        setImage(parsedImage);
        setIsImageLoading(true);
        // Initially hide controls when an image is loaded for a cleaner UI
        setShowControls(false);
      } catch (error) {
        console.error('Error parsing saved image:', error);
      }
    }
    
    // Add fullscreen change event listener
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Handle overlay dragging with mouse
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartPos({
      x: e.clientX - dragPosition.x,
      y: e.clientY - dragPosition.y
    });
  };

  // Handle overlay dragging with touch
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartPos({
      x: e.touches[0].clientX - dragPosition.x,
      y: e.touches[0].clientY - dragPosition.y
    });
  };

  // Handle mouse move during drag
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setDragPosition({
      x: e.clientX - startPos.x,
      y: e.clientY - startPos.y
    });
  };

  // Handle touch move during drag
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    setDragPosition({
      x: e.touches[0].clientX - startPos.x,
      y: e.touches[0].clientY - startPos.y
    });
  };

  // End dragging
  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Toggle controls visibility
  const toggleControls = () => {
    setShowControls(!showControls);
  };

  // Handle image load
  const handleImageLoad = () => {
    setIsImageLoaded(true);
    setIsImageLoading(false);
  };

  // Handle image error
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.error('Image load error:', e);
    setIsImageLoaded(false);
    setIsImageLoading(false);
    toast({
      title: "Image error",
      description: "Failed to load the image. Please try uploading again.",
      variant: "destructive",
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-hidden">
        {/* Main tracing area */}
        <div 
          ref={containerRef} 
          className="relative h-full w-full overflow-hidden bg-background"
          onMouseMove={handleMouseMove}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleDragEnd}
        >
          {/* Loading indicator */}
          {isImageLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-50">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          )}
          
          {/* Camera view */}
          <div className="absolute inset-0 z-0">
            {cameraEnabled && (
              <CameraView 
                isEnabled={cameraEnabled}
                onCameraReady={handleCameraReady} 
                onCameraError={handleCameraError}
                isFrontCamera={isFrontCamera}
              />
            )}
          </div>
          
          {/* Image overlay */}
          {image && (
            <div 
              ref={overlayRef}
              className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
              style={{
                transform: `translate(${dragPosition.x}px, ${dragPosition.y}px)`,
              }}
            >
              <div 
                className="pointer-events-auto"
                style={{
                  opacity: opacity,
                  transform: `scale(${scale}) rotate(${rotation}deg) perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translate(${positionX}px, ${positionY}px) scale(${zoom})`,
                  transformOrigin: 'center',
                  cursor: isDragging ? 'grabbing' : 'grab',
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  touchAction: 'none',
                }}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
              >
                <img 
                  src={image.url} 
                  alt={image.name}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                  className="max-w-full max-h-[80vh] object-contain"
                  style={{
                    pointerEvents: 'none',
                  }}
                />
              </div>
            </div>
          )}
          
          {/* No image uploaded message */}
          {!image && !isImageLoading && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <Card className="p-6 max-w-md mx-4 text-center">
                <h3 className="text-xl font-semibold mb-4">No Image Selected</h3>
                <p className="mb-6 text-muted-foreground">
                  Upload an image to start tracing
                </p>
                <div className="flex justify-center">
                  <input
                    id="trace-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <label htmlFor="trace-upload">
                    <Button 
                      variant="default" 
                      className="cursor-pointer"
                      disabled={isUploading}
                    >
                      <Upload size={18} className="mr-2" />
                      {isUploading ? 'Uploading...' : 'Upload Image'}
                    </Button>
                  </label>
                </div>
              </Card>
            </div>
          )}

          {/* Top action bar */}
          {image && isImageLoaded && (
            <div className="absolute top-0 left-0 right-0 z-30 flex justify-between items-center p-2 sm:p-4 bg-background/30 backdrop-blur-sm">
              {/* Left side controls */}
              <div className="flex items-center gap-2">
                <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                  <SheetTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon"
                      className="bg-background/50 backdrop-blur-sm hover:bg-background/80 h-8 w-8 sm:h-9 sm:w-9"
                    >
                      <Settings size={isMobile ? 16 : 18} />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side={isMobile ? "bottom" : "left"} className="w-full sm:max-w-md">
                    <div className="flex flex-col h-full">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Tracing Controls</h3>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => setIsSheetOpen(false)}
                          className="h-8 w-8"
                        >
                          <X size={18} />
                        </Button>
                      </div>
                      
                      <div className="space-y-6 flex-1 overflow-y-auto pb-4">
                        {/* Camera controls section */}
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium">Camera</h4>
                          <Separator />
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <div className="flex items-center space-x-2">
                              <Switch 
                                id="camera-toggle" 
                                checked={cameraEnabled} 
                                onCheckedChange={toggleCamera} 
                              />
                              <Label htmlFor="camera-toggle">Enable Camera</Label>
                            </div>
                            
                            {cameraEnabled && (
                              <div className="flex gap-2 mt-2 sm:mt-0 sm:ml-auto">
                                <Button variant="outline" size="sm" onClick={toggleCameraFacing}>
                                  Flip Camera
                                </Button>
                                <LiveButton stream={stream} />
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Image controls section */}
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium">Image Controls</h4>
                          <Separator />
                          <OverlayControls 
                            opacity={opacity}
                            setOpacity={setOpacity}
                            scale={scale}
                            setScale={setScale}
                            rotation={rotation}
                            setRotation={setRotation}
                            tiltX={tiltX}
                            setTiltX={setTiltX}
                            tiltY={tiltY}
                            setTiltY={setTiltY}
                            positionX={positionX}
                            setPositionX={setPositionX}
                            positionY={positionY}
                            setPositionY={setPositionY}
                            zoom={zoom}
                            setZoom={setZoom}
                            resetControls={resetControls}
                            isPremium={isPremium}
                            isFullscreen={isFullscreen}
                            toggleFullscreen={toggleFullscreen}
                          />
                        </div>
                      </div>
                      
                      <div className="pt-2 border-t">
                        <Button 
                          variant="outline" 
                          className="w-full" 
                          onClick={() => {
                            resetControls();
                            setIsSheetOpen(false);
                          }}
                        >
                          <RotateCcw size={16} className="mr-2" /> Reset All
                        </Button>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
                
                <div className="hidden sm:flex items-center space-x-2">
                  <Switch 
                    id="camera-toggle-top" 
                    checked={cameraEnabled} 
                    onCheckedChange={toggleCamera} 
                    className="scale-75 sm:scale-100"
                  />
                  <Label htmlFor="camera-toggle-top" className="text-xs sm:text-sm text-white">Camera</Label>
                </div>
              </div>
              
              {/* Right side controls */}
              <div className="flex items-center gap-2">
                {cameraEnabled && !isMobile && <LiveButton stream={stream} />}
                
                <Button 
                  variant="outline" 
                  size={isMobile ? "sm" : "default"}
                  onClick={toggleFullscreen}
                  className="bg-background/50 backdrop-blur-sm hover:bg-background/80 text-xs sm:text-sm"
                >
                  {isFullscreen ? (
                    <><Minimize size={isMobile ? 16 : 18} className="mr-1 sm:mr-2" /> Exit</>
                  ) : (
                    <><Maximize size={isMobile ? 16 : 18} className="mr-1 sm:mr-2" /> Fullscreen</>
                  )}
                </Button>
              </div>
            </div>
          )}
          
          {/* Quick opacity control for mobile */}
          {image && isImageLoaded && isMobile && !isSheetOpen && (
            <div className="absolute bottom-16 left-4 right-4 z-20">
              <Card className="p-2 bg-background/70 backdrop-blur-sm">
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-medium">Opacity</label>
                    <span className="text-xs">{Math.round(opacity * 100)}%</span>
                  </div>
                  <div className="px-1">
                    <Slider 
                      value={[opacity * 100]} 
                      min={10} 
                      max={100} 
                      step={5}
                      onValueChange={(value) => setOpacity(value[0] / 100)}
                    />
                  </div>
                </div>
              </Card>
            </div>
          )}
          
          {/* Camera disabled overlay */}
          {!cameraEnabled && image && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-20">
              <Card className="p-6 max-w-md mx-4 text-center">
                <CameraOff size={48} className="mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">Camera is disabled</h3>
                <p className="mb-4 text-muted-foreground">
                  Enable the camera to use tracing features
                </p>
                <Button onClick={toggleCamera}>
                  <CameraIcon size={18} className="mr-2" /> Enable Camera
                </Button>
              </Card>
            </div>
          )}
          
          {/* Bottom action button */}
          {image && isImageLoaded && !isSheetOpen && (
            <div className="absolute bottom-4 right-4 z-30">
              <Button 
                variant="default" 
                size="sm"
                onClick={() => setIsSheetOpen(true)}
                className="shadow-lg"
              >
                <Settings size={16} className="mr-2" /> Controls
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TraceView;

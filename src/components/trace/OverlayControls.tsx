
import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { RotateCcw, ArrowDown, Maximize, Minimize, ChevronDown, ChevronUp } from 'lucide-react';

interface OverlayControlsProps {
  opacity: number;
  setOpacity: (value: number) => void;
  scale: number;
  setScale: (value: number) => void;
  rotation: number;
  setRotation: (value: number) => void;
  tiltX: number;
  setTiltX: (value: number) => void;
  tiltY: number;
  setTiltY: (value: number) => void;
  positionX: number;
  setPositionX: (value: number) => void;
  positionY: number;
  setPositionY: (value: number) => void;
  zoom: number;
  setZoom: (value: number) => void;
  resetControls: () => void;
  isPremium: boolean;
  isFullscreen: boolean;
  toggleFullscreen: () => void;
}

const OverlayControls: React.FC<OverlayControlsProps> = ({
  opacity,
  setOpacity,
  scale,
  setScale,
  rotation,
  setRotation,
  tiltX,
  setTiltX,
  tiltY,
  setTiltY,
  positionX,
  setPositionX,
  positionY,
  setPositionY,
  zoom,
  setZoom,
  resetControls,
  isPremium,
  isFullscreen,
  toggleFullscreen
}) => {
  const [showBasicControls, setShowBasicControls] = React.useState(true);
  const [showPositionControls, setShowPositionControls] = React.useState(false);
  const [showAdvancedControls, setShowAdvancedControls] = React.useState(false);
  
  return (
    <div className="w-full space-y-4">
      {/* Basic controls section */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h4 className="text-sm font-medium">Basic Controls</h4>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowBasicControls(!showBasicControls)}
            className="h-6 w-6 p-0"
          >
            {showBasicControls ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </Button>
        </div>
        
        {showBasicControls && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between mb-1">
                <label className="text-sm font-medium">Opacity</label>
                <span className="text-xs">{Math.round(opacity * 100)}%</span>
              </div>
              <Slider 
                value={[opacity * 100]} 
                min={10} 
                max={100} 
                step={5}
                onValueChange={(value) => setOpacity(value[0] / 100)}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between mb-1">
                <label className="text-sm font-medium">Scale</label>
                <span className="text-xs">{scale.toFixed(1)}x</span>
              </div>
              <Slider 
                value={[scale * 100]} 
                min={20} 
                max={300} 
                step={10}
                onValueChange={(value) => setScale(value[0] / 100)}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between mb-1">
                <label className="text-sm font-medium">Rotation</label>
                <span className="text-xs">{rotation}°</span>
              </div>
              <Slider 
                value={[rotation + 180]} 
                min={0} 
                max={360} 
                step={5}
                onValueChange={(value) => setRotation(value[0] - 180)}
              />
            </div>
          </div>
        )}
      </div>
      
      {/* Position controls section */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h4 className="text-sm font-medium">Position Controls</h4>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowPositionControls(!showPositionControls)}
            className="h-6 w-6 p-0"
          >
            {showPositionControls ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </Button>
        </div>
        
        {showPositionControls && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between mb-1">
                <label className="text-sm font-medium">Horizontal Position</label>
                <span className="text-xs">{positionX}px</span>
              </div>
              <Slider 
                value={[positionX + 500]} 
                min={0} 
                max={1000} 
                step={10}
                onValueChange={(value) => setPositionX(value[0] - 500)}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between mb-1">
                <label className="text-sm font-medium">Vertical Position</label>
                <span className="text-xs">{positionY}px</span>
              </div>
              <Slider 
                value={[positionY + 500]} 
                min={0} 
                max={1000} 
                step={10}
                onValueChange={(value) => setPositionY(value[0] - 500)}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between mb-1">
                <label className="text-sm font-medium">Zoom</label>
                <span className="text-xs">{zoom.toFixed(1)}x</span>
              </div>
              <Slider 
                value={[zoom * 100]} 
                min={50} 
                max={200} 
                step={10}
                onValueChange={(value) => setZoom(value[0] / 100)}
              />
            </div>
          </div>
        )}
      </div>
      
      {/* Advanced controls section */}
      {isPremium && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-medium">3D Controls</h4>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowAdvancedControls(!showAdvancedControls)}
              className="h-6 w-6 p-0"
            >
              {showAdvancedControls ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </Button>
          </div>
          
          {showAdvancedControls && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between mb-1">
                  <label className="text-sm font-medium">Tilt X (Horizontal)</label>
                  <span className="text-xs">{tiltX}°</span>
                </div>
                <Slider 
                  value={[tiltX + 45]} 
                  min={0} 
                  max={90} 
                  step={5}
                  onValueChange={(value) => setTiltX(value[0] - 45)}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between mb-1">
                  <label className="text-sm font-medium">Tilt Y (Vertical)</label>
                  <span className="text-xs">{tiltY}°</span>
                </div>
                <Slider 
                  value={[tiltY + 45]} 
                  min={0} 
                  max={90} 
                  step={5}
                  onValueChange={(value) => setTiltY(value[0] - 45)}
                />
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Reset button */}
      <div className="pt-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={resetControls}
          className="w-full"
        >
          <RotateCcw size={16} className="mr-2" /> Reset Image
        </Button>
      </div>
    </div>
  );
};

export default OverlayControls;

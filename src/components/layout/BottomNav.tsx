
import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Camera, Plus, Radio, User, Home } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  // Handle image upload for direct tracing without database storage
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    setIsUploading(true);
    
    try {
      toast({
        title: "Processing...",
        description: "Preparing your image for tracing.",
      });
      
      // Create a local URL for the file without storing in database
      const fileUrl = URL.createObjectURL(file);
      const fileName = file.name.substring(0, file.name.lastIndexOf('.')) || 'Image';
      
      // Store image data in session storage for the trace view to use
      sessionStorage.setItem('traceImage', JSON.stringify({
        name: fileName,
        url: fileUrl
      }));
      
      // Navigate to trace view
      navigate('/app/trace');
      
      toast({
        title: "Image ready",
        description: "Your image is ready for tracing.",
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to process the image",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Skip rendering on non-app routes
  if (!location.pathname.startsWith('/app')) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t bg-background z-40">
      <div className="flex justify-around items-center h-16">
        <NavLink
          to="/app/home"
          className={({ isActive }) => `flex-1 flex flex-col items-center justify-center h-full ${
            isActive || location.pathname === '/app' ? 'text-traceMate' : 'text-muted-foreground'
          }`}
        >
          <Home size={24} />
          <span className="text-xs mt-1">Home</span>
        </NavLink>
        
        {/* Upload button removed as requested */}

        {/* Tracing tab removed as users will go there automatically after selecting an image */}

        <NavLink
          to="/app/livesync"
          className={({ isActive }) => `flex-1 flex flex-col items-center justify-center h-full ${
            isActive ? 'text-traceMate' : 'text-muted-foreground'
          }`}
        >
          <Radio size={24} />
          <span className="text-xs mt-1">LiveSync</span>
        </NavLink>

        <NavLink
          to="/app/profile"
          className={({ isActive }) => `flex-1 flex flex-col items-center justify-center h-full ${
            isActive ? 'text-traceMate' : 'text-muted-foreground'
          }`}
        >
          <User size={24} />
          <span className="text-xs mt-1">Profile</span>
        </NavLink>
      </div>
    </div>
  );
};

export default BottomNav;

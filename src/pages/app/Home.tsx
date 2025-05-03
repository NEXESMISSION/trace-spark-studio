import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

const Home = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  // Handle image upload for direct tracing
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    setIsUploading(true);
    
    try {
      // Create a local URL for the file
      const fileUrl = URL.createObjectURL(file);
      const fileName = file.name.substring(0, file.name.lastIndexOf('.')) || 'Image';
      
      // Store image data in session storage for the trace view to use
      sessionStorage.setItem('traceImage', JSON.stringify({
        name: fileName,
        url: fileUrl
      }));
      
      toast({
        title: "Image ready",
        description: "Your image is ready for tracing.",
      });
      
      // Navigate to trace view
      navigate('/app/trace');
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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
      <Card className="w-full max-w-md p-8 text-center">
        <h1 className="text-2xl font-bold mb-6">Welcome to TraceMate</h1>
        
        <p className="mb-8 text-muted-foreground">
          Upload an image to start tracing. Your image will be available for tracing without being stored in our database.
        </p>
        
        <form onSubmit={(e) => e.preventDefault()}>
          <input
            id="home-upload"
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            onClick={(e) => e.stopPropagation()}
          />
          <label htmlFor="home-upload" className="block">
            <Button 
              type="button"
              className="w-full cursor-pointer"
              size="lg"
              disabled={isUploading}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('home-upload')?.click();
              }}
            >
              <Upload size={20} className="mr-2" />
              {isUploading ? 'Uploading...' : 'Upload Image'}
            </Button>
          </label>
        </form>
      </Card>
    </div>
  );
};

export default Home;

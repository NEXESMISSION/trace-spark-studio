
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Image, Radio, ArrowRight, Plus, Upload } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

const Dashboard = () => {
  const [isUploading, setIsUploading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Get recent images from Supabase
  const { data: recentImages = [], isLoading } = useQuery({
    queryKey: ['recentImages'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('User not logged in');
        return [];
      }
      
      const { data, error } = await supabase
        .from('images')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);
        
      if (error) {
        console.error('Error fetching recent images:', error);
        return [];
      }
      
      console.log('Recent images loaded:', data);
      return data || [];
    }
  });

  // Handle direct image upload for tracing
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    
    setIsUploading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("You must be logged in to upload images");
      }
      
      toast({
        title: "Uploading...",
        description: "Please wait while your image is being uploaded.",
      });
      
      // First upload the file to Storage
      const { error: uploadError, data } = await supabase
        .storage
        .from('images')
        .upload(`public/${fileName}`, file);
        
      if (uploadError) throw new Error(uploadError.message);
      
      // Get the public URL
      const { data: { publicUrl } } = supabase
        .storage
        .from('images')
        .getPublicUrl(`public/${fileName}`);
      
      console.log("Image uploaded with URL:", publicUrl);
        
      // Save the reference to the database
      const { data: imageData, error: dbError } = await supabase
        .from('images')
        .insert({
          name: file.name.substring(0, file.name.lastIndexOf('.')),
          url: publicUrl,
          user_id: user.id
        })
        .select()
        .single();
        
      if (dbError) throw new Error(dbError.message);
      
      console.log("Image saved to database:", imageData);
      
      // Redirect to trace view with the new image
      if (imageData) {
        navigate(`/app/trace/${imageData.id}`);
        toast({
          title: "Image uploaded",
          description: "Your image has been uploaded and is ready to trace.",
        });
        return; // Exit early as we're navigating away
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container px-4 py-8 pb-20">
      <h1 className="text-3xl font-bold mb-6">Welcome to TraceMate</h1>
      
      {/* Hero Section */}
      <section className="mb-8">
        <Card className="bg-gradient-to-br from-background to-muted border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center md:items-start md:text-left md:flex-row md:justify-between">
              <div className="md:w-2/3">
                <h2 className="text-xl font-bold mb-2">Start Tracing</h2>
                <p className="text-muted-foreground mb-4">
                  Upload a reference image and start improving your drawing skills through digital tracing.
                </p>
                <div className="flex justify-center md:justify-start">
                  <label htmlFor="dashboard-upload" className="cursor-pointer">
                    <Button className="bg-traceMate hover:bg-traceMate-dark" disabled={isUploading}>
                      {isUploading ? (
                        "Uploading..."
                      ) : (
                        <>
                          <Plus size={18} className="mr-2" />
                          Upload & Trace
                        </>
                      )}
                    </Button>
                    <input 
                      type="file"
                      id="dashboard-upload"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
              <div className="hidden md:flex items-center justify-center mt-6 md:mt-0">
                <Camera className="text-traceMate h-20 w-20" />
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
      
      {/* Recent Images */}
      <section className="mb-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Recent Images</h2>
          <Link 
            to="/app/library" 
            className="text-traceMate hover:underline flex items-center text-sm"
          >
            View all <ArrowRight size={16} className="ml-1" />
          </Link>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {isLoading ? (
            <div className="col-span-full flex justify-center py-8">
              <p className="text-muted-foreground">Loading recent images...</p>
            </div>
          ) : recentImages.length > 0 ? (
            recentImages.map(image => (
              <Link 
                to={`/app/trace/${image.id}`} 
                key={image.id}
                className="group"
              >
                <div className="aspect-square rounded-md overflow-hidden relative border border-border hover:border-traceMate transition-all">
                  <img 
                    src={image.url} 
                    alt={image.name} 
                    className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                    crossOrigin="anonymous"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://i.postimg.cc/BnJDNYcK/Chat-GPT-Image-May-2-2025-12-51-32-PM.png';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end">
                    <div className="p-3">
                      <div className="font-medium text-sm">{image.name}</div>
                      <div className="text-xs text-muted-foreground">Tap to trace</div>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          ) : null}
          
          <form onSubmit={(e) => e.preventDefault()}>
            <input 
              type="file"
              id="library-upload"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <label htmlFor="library-upload" className="cursor-pointer block">
              <div className="aspect-square rounded-md border border-dashed border-border flex items-center justify-center hover:border-traceMate transition-all bg-muted/50 hover:bg-muted">
                <div className="text-center p-4">
                  <Plus className="text-muted-foreground mx-auto mb-2" size={24} />
                  <div className="text-muted-foreground text-sm">Add image</div>
                </div>
              </div>
            </label>
          </form>
        </div>
      </section>
      
      {/* Features */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-muted/30 hover:bg-muted/50 transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Image className="text-traceMate" size={20} />
                <span>Image Library</span>
              </CardTitle>
              <CardDescription>Upload and manage your reference images</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button variant="ghost" size="sm" onClick={() => navigate('/app/library')} className="gap-1">
                <span>Open Library</span>
                <ArrowRight size={16} className="ml-1" />
              </Button>
            </CardFooter>
          </Card>
          
          <Card className="bg-muted/30 hover:bg-muted/50 transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Radio className="text-traceMate" size={20} />
                <span>LiveSync</span>
              </CardTitle>
              <CardDescription>Broadcast your tracing to another device</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button variant="ghost" size="sm" onClick={() => navigate('/app/livesync')} className="gap-1">
                <span>Start LiveSync</span>
                <ArrowRight size={16} className="ml-1" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;


import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Card } from '@/components/ui/card';
import { Image, Search, Upload, MoreVertical, Grid, List, Trash2, Camera, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

type ViewMode = 'grid' | 'list';

interface ImageItem {
  id: string;
  name: string;
  url: string;
  created_at: string;
}

const Library = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  const { data: images = [], isLoading, error, refetch } = useQuery({
    queryKey: ['images'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('images')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching images:', error);
        throw new Error(error.message);
      }
      
      console.log("Fetched images:", data);
      return data || [];
    },
    retry: 2,
    staleTime: 10000,
  });
  
  // Refresh images on component mount
  useEffect(() => {
    refetch();
  }, [refetch]);
  
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('images')
        .delete()
        .eq('id', id);
        
      if (error) throw new Error(error.message);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['images'] });
      toast({
        title: "Image deleted",
        description: "The image has been successfully removed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete image: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    
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
        
      // Save the reference to the database with user_id
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
      
      // Redirect the user directly to trace view with the new image
      if (imageData) {
        toast({
          title: "Image uploaded",
          description: "Your image has been uploaded and is ready to trace.",
        });
        
        // Refresh images list
        queryClient.invalidateQueries({ queryKey: ['images'] });
        
        // Navigate to trace view with the new image
        navigate(`/app/trace/${imageData.id}`);
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
  
  const handleDeleteImage = (id: string) => {
    deleteMutation.mutate(id);
  };
  
  const filteredImages = images.filter(image => 
    image.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleRefreshImages = () => {
    refetch();
  };
  
  return (
    <div className="container px-4 py-8 pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold">Image Library</h1>
        
        <div className="flex items-center w-full md:w-auto gap-2">
          <div className="relative flex-grow md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              placeholder="Search images..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
            >
              <Grid size={18} />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('list')}
              aria-label="List view"
            >
              <List size={18} />
            </Button>
            <Button variant="outline" size="icon" onClick={handleRefreshImages}>
              <RefreshCw size={18} />
            </Button>
          </div>
          
          <form onSubmit={(e) => e.preventDefault()}>
            <input 
              type="file"
              id="image-upload"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <label htmlFor="image-upload">
              <Button disabled={isUploading} className="cursor-pointer" asChild>
                <span>
                  {isUploading ? (
                    "Uploading..."
                  ) : (
                    <>
                      <Upload size={18} className="mr-2" /> Upload
                    </>
                  )}
                </span>
              </Button>
            </label>
          </form>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <p>Loading images...</p>
        </div>
      ) : error ? (
        <div className="bg-destructive/20 text-destructive rounded-md p-4 mb-6">
          <p>Failed to load images. Please try again later.</p>
        </div>
      ) : (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredImages.map(image => (
              <Card key={image.id} className="overflow-hidden group border border-border hover:border-traceMate transition-all">
                <div className="aspect-square relative">
                  <img 
                    src={image.url} 
                    alt={image.name} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Add fallback image handling
                      (e.target as HTMLImageElement).src = 'https://i.postimg.cc/BnJDNYcK/Chat-GPT-Image-May-2-2025-12-51-32-PM.png';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-3 flex justify-between items-end">
                      <div>
                        <div className="font-medium text-foreground">{image.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(image.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 bg-background/50 backdrop-blur-sm hover:bg-background/80"
                          onClick={() => navigate(`/app/trace/${image.id}`)}
                        >
                          <Camera size={16} />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 bg-background/50 backdrop-blur-sm hover:bg-background/80"
                            >
                              <MoreVertical size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/app/trace/${image.id}`)}>
                              <Camera size={16} className="mr-2" />
                              <span>Trace</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteImage(image.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 size={16} className="mr-2" />
                              <span>Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
            
            <form onSubmit={(e) => e.preventDefault()}>
              <input 
                type="file"
                id="image-upload-card"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <label htmlFor="image-upload-card" className="cursor-pointer block">
                <Card className="aspect-square border border-dashed border-border flex items-center justify-center hover:border-traceMate transition-all bg-muted/50 hover:bg-muted">
                  <div className="text-center p-4">
                    <Upload className="text-muted-foreground mx-auto mb-2" size={24} />
                    <div className="text-muted-foreground">Upload image</div>
                  </div>
                </Card>
              </label>
            </form>
          </div>
        ) : (
          <div className="border rounded-md divide-y">
            {filteredImages.length > 0 ? (
              filteredImages.map(image => (
                <div key={image.id} className="flex items-center p-3 hover:bg-muted/50">
                  <div className="h-12 w-12 mr-4">
                    <img 
                      src={image.url} 
                      alt={image.name} 
                      className="h-full w-full object-cover rounded"
                      onError={(e) => {
                        // Add fallback image handling
                        (e.target as HTMLImageElement).src = 'https://i.postimg.cc/BnJDNYcK/Chat-GPT-Image-May-2-2025-12-51-32-PM.png';
                      }}
                    />
                  </div>
                  <div className="flex-grow">
                    <div className="font-medium">{image.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(image.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => navigate(`/app/trace/${image.id}`)}
                    >
                      <Camera size={18} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDeleteImage(image.id)}
                    >
                      <Trash2 size={18} />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-muted-foreground">
                No images found matching your search.
              </div>
            )}
          </div>
        )
      )}
      
      {filteredImages.length === 0 && searchQuery === '' && !isLoading && (
        <div className="mt-12 text-center">
          <Image className="mx-auto mb-4 text-muted-foreground" size={48} />
          <h3 className="text-xl font-medium mb-2">Your library is empty</h3>
          <p className="text-muted-foreground mb-6">
            Upload your first reference image to start tracing
          </p>
          <form onSubmit={(e) => e.preventDefault()}>
            <input 
              type="file"
              id="image-upload-empty"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <label htmlFor="image-upload-empty" className="block">
              <Button className="cursor-pointer w-full">
                <Upload size={18} className="mr-2" /> Upload Image
              </Button>
            </label>
          </form>
        </div>
      )}
    </div>
  );
};

export default Library;

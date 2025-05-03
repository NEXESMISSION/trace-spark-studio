
-- Create a storage bucket for images
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true);

-- Create policies to allow authenticated users to upload images
CREATE POLICY "Allow authenticated users to upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'images');

-- Allow authenticated users to select their own images
CREATE POLICY "Allow authenticated users to select images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'images');

-- Allow authenticated users to update their own images
CREATE POLICY "Allow authenticated users to update their own images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'images' AND auth.uid() = owner);

-- Allow authenticated users to delete their own images
CREATE POLICY "Allow authenticated users to delete their own images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'images' AND auth.uid() = owner);

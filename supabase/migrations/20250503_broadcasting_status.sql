
-- Create broadcasting_status table to track active broadcasters
CREATE TABLE IF NOT EXISTS public.broadcasting_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcaster_id TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.broadcasting_status ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read broadcasting status
CREATE POLICY "Anyone can view broadcasting status"
  ON public.broadcasting_status
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert their own broadcasting status
CREATE POLICY "Users can insert their own broadcasting status"
  ON public.broadcasting_status
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow users to update their own broadcasting status
CREATE POLICY "Users can update their own broadcasting status"
  ON public.broadcasting_status
  FOR UPDATE
  TO authenticated
  USING (true);

-- Enable realtime for the broadcasting_status table
ALTER TABLE public.broadcasting_status REPLICA IDENTITY FULL;

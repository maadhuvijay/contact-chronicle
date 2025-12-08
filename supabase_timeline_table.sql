-- Create timeline_rows table for storing user timeline data
-- Run this script in the Supabase SQL Editor

-- Create the table
CREATE TABLE IF NOT EXISTS timeline_rows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  month_year TEXT,
  professional_event TEXT,
  personal_event TEXT,
  geographic_event TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create an index on created_at for faster ordering
CREATE INDEX IF NOT EXISTS idx_timeline_rows_created_at ON timeline_rows(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE timeline_rows ENABLE ROW LEVEL SECURITY;

-- OPTION 1: For single-user or public access (current setup)
-- Allow all operations without authentication
CREATE POLICY "Allow public access to timeline rows"
  ON timeline_rows
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- OPTION 2: For multi-user setup with authentication (uncomment if needed)
-- First, add a user_id column:
-- ALTER TABLE timeline_rows ADD COLUMN user_id UUID REFERENCES auth.users(id);
-- CREATE INDEX IF NOT EXISTS idx_timeline_rows_user_id ON timeline_rows(user_id);

-- Then replace the above policy with these user-specific policies:
-- DROP POLICY IF EXISTS "Allow public access to timeline rows" ON timeline_rows;
-- CREATE POLICY "Users can view their own timeline rows"
--   ON timeline_rows
--   FOR SELECT
--   USING (auth.uid() = user_id);
-- 
-- CREATE POLICY "Users can insert their own timeline rows"
--   ON timeline_rows
--   FOR INSERT
--   WITH CHECK (auth.uid() = user_id);
-- 
-- CREATE POLICY "Users can update their own timeline rows"
--   ON timeline_rows
--   FOR UPDATE
--   USING (auth.uid() = user_id)
--   WITH CHECK (auth.uid() = user_id);
-- 
-- CREATE POLICY "Users can delete their own timeline rows"
--   ON timeline_rows
--   FOR DELETE
--   USING (auth.uid() = user_id);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update updated_at on row updates
CREATE TRIGGER update_timeline_rows_updated_at
  BEFORE UPDATE ON timeline_rows
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Optional: Add comments to the table and columns for documentation
COMMENT ON TABLE timeline_rows IS 'Stores user timeline data with professional, personal, and geographic events';
COMMENT ON COLUMN timeline_rows.month_year IS 'Month and year in format MM/YYYY (e.g., 09/2025)';
COMMENT ON COLUMN timeline_rows.professional_event IS 'Key professional milestone or event';
COMMENT ON COLUMN timeline_rows.personal_event IS 'Key personal milestone or event';
COMMENT ON COLUMN timeline_rows.geographic_event IS 'Key geographic location change or event';


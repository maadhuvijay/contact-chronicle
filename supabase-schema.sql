-- Create timeline_rows table for storing timeline events
-- Run this SQL in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS timeline_rows (
  id BIGSERIAL PRIMARY KEY,
  month_year TEXT,
  professional_event TEXT,
  personal_event TEXT,
  geographic_event TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create an index on created_at for faster queries
CREATE INDEX IF NOT EXISTS idx_timeline_rows_created_at ON timeline_rows(created_at);

-- Enable Row Level Security (RLS) - optional for single user
-- ALTER TABLE timeline_rows ENABLE ROW LEVEL SECURITY;

-- If you want to allow all operations (for single user setup):
-- CREATE POLICY "Allow all operations" ON timeline_rows FOR ALL USING (true) WITH CHECK (true);


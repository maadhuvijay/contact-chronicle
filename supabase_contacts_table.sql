-- Create contacts table for storing contact data from CSV imports
-- Run this script in the Supabase SQL Editor

-- Create the table
CREATE TABLE IF NOT EXISTS contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  linkedin TEXT,
  date_added TEXT,
  date_edited TEXT,
  source TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_last_name ON contacts(last_name);
CREATE INDEX IF NOT EXISTS idx_contacts_source ON contacts(source);
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- OPTION 1: For single-user or public access (current setup)
-- Allow all operations without authentication
CREATE POLICY "Allow public access to contacts"
  ON contacts
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- OPTION 2: For multi-user setup with authentication (uncomment if needed)
-- First, add a user_id column:
-- ALTER TABLE contacts ADD COLUMN user_id UUID REFERENCES auth.users(id);
-- CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);

-- Then replace the above policy with these user-specific policies:
-- DROP POLICY IF EXISTS "Allow public access to contacts" ON contacts;
-- CREATE POLICY "Users can view their own contacts"
--   ON contacts
--   FOR SELECT
--   USING (auth.uid() = user_id);
-- 
-- CREATE POLICY "Users can insert their own contacts"
--   ON contacts
--   FOR INSERT
--   WITH CHECK (auth.uid() = user_id);
-- 
-- CREATE POLICY "Users can update their own contacts"
--   ON contacts
--   FOR UPDATE
--   USING (auth.uid() = user_id)
--   WITH CHECK (auth.uid() = user_id);
-- 
-- CREATE POLICY "Users can delete their own contacts"
--   ON contacts
--   FOR DELETE
--   USING (auth.uid() = user_id);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update updated_at on row updates
CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_contacts_updated_at();

-- Optional: Add comments to the table and columns for documentation
COMMENT ON TABLE contacts IS 'Stores contact information imported from CSV files';
COMMENT ON COLUMN contacts.first_name IS 'First name of the contact';
COMMENT ON COLUMN contacts.last_name IS 'Last name of the contact';
COMMENT ON COLUMN contacts.email IS 'Email address of the contact';
COMMENT ON COLUMN contacts.phone IS 'Phone number of the contact';
COMMENT ON COLUMN contacts.linkedin IS 'LinkedIn profile URL or identifier';
COMMENT ON COLUMN contacts.date_added IS 'Date when the contact was originally added (from source system)';
COMMENT ON COLUMN contacts.date_edited IS 'Date when the contact was last edited (from source system)';
COMMENT ON COLUMN contacts.source IS 'Source of the contact (e.g., LinkedIn, Google, etc.)';



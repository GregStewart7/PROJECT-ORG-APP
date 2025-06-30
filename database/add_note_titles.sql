-- Migration: Add title column to notes table
-- This migration adds support for note titles

-- Add title column to notes table
ALTER TABLE public.notes 
ADD COLUMN title text check (char_length(title) <= 100) default 'Note';

-- Update existing notes to have default title
UPDATE public.notes 
SET title = 'Note' 
WHERE title IS NULL;

-- Make title not null after setting defaults
ALTER TABLE public.notes 
ALTER COLUMN title SET NOT NULL;

COMMENT ON COLUMN public.notes.title IS 'Note title with max length of 100 characters'; 
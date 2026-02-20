-- Add time_preference column to tasks table
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS time_preference TEXT NOT NULL DEFAULT 'anytime' 
CHECK (time_preference IN ('morning','evening','anytime'));

-- Add username column to profiles table
-- Username is optional initially (migration-friendly), but required for new signups
ALTER TABLE profiles
ADD COLUMN username text;

-- Unique index — only non-null values enforce uniqueness
CREATE UNIQUE INDEX idx_profiles_username ON profiles (username)
WHERE username IS NOT NULL;

-- Constraint: if username is provided, it must be 3–30 chars
ALTER TABLE profiles
ADD CONSTRAINT profiles_username_length
CHECK (
  username IS NULL
  OR (
    char_length(username) >= 3
    AND char_length(username) <= 30
  )
);

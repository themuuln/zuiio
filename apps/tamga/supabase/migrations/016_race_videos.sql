-- Race videos marketplace table
-- Stores user-uploaded race video recordings with pricing tiers

CREATE TABLE IF NOT EXISTS race_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uploader_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  video_url TEXT NOT NULL,
  race_name TEXT,
  race_date TIMESTAMPTZ,
  location_aimag TEXT,
  category TEXT,
  thumbnail_url TEXT,
  free_preview_url TEXT,
  price_3day INT NOT NULL DEFAULT 500,
  price_1year INT NOT NULL DEFAULT 2500,
  price_lifetime INT NOT NULL DEFAULT 6000,
  view_count INT NOT NULL DEFAULT 0,
  published BOOLEAN NOT NULL DEFAULT false,
  tagged_horse_ids UUID[] DEFAULT '{}',
  duration_seconds INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_race_videos_category ON race_videos(category);
CREATE INDEX IF NOT EXISTS idx_race_videos_uploader ON race_videos(uploader_id);
CREATE INDEX IF NOT EXISTS idx_race_videos_published ON race_videos(published) WHERE published = true;
CREATE INDEX IF NOT EXISTS idx_race_videos_created ON race_videos(created_at DESC);

-- RLS policies
ALTER TABLE race_videos ENABLE ROW LEVEL SECURITY;

-- Anyone can view published videos
CREATE POLICY "Public can view published race videos"
  ON race_videos FOR SELECT
  USING (published = true);

-- Uploaders can view their own unpublished videos
CREATE POLICY "Uploaders can view own race videos"
  ON race_videos FOR SELECT
  USING (auth.uid() = uploader_id);

-- Authenticated users can insert videos
CREATE POLICY "Authenticated users can upload race videos"
  ON race_videos FOR INSERT
  WITH CHECK (auth.uid() = uploader_id);

-- Uploaders can update their own videos
CREATE POLICY "Uploaders can update own race videos"
  ON race_videos FOR UPDATE
  USING (auth.uid() = uploader_id)
  WITH CHECK (auth.uid() = uploader_id);

-- Uploaders can delete their own videos
CREATE POLICY "Uploaders can delete own race videos"
  ON race_videos FOR DELETE
  USING (auth.uid() = uploader_id);

-- RPC: increment view count (security definer to bypass RLS)
CREATE OR REPLACE FUNCTION increment_race_video_view_count(video_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE race_videos
  SET view_count = view_count + 1,
      updated_at = now()
  WHERE id = video_id;
END;
$$;

-- Video access passes (purchases)
CREATE TABLE IF NOT EXISTS video_access_passes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES race_videos(id) ON DELETE CASCADE,
  pass_type TEXT NOT NULL CHECK (pass_type IN ('3day', '1year', 'lifetime')),
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  UNIQUE(user_id, video_id, pass_type)
);

ALTER TABLE video_access_passes ENABLE ROW LEVEL SECURITY;

-- Users can view their own access passes
CREATE POLICY "Users can view own access passes"
  ON video_access_passes FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own access passes
CREATE POLICY "Users can create own access passes"
  ON video_access_passes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

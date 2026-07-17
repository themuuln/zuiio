CREATE TABLE IF NOT EXISTS documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  horse_id UUID REFERENCES horses(id),
  title TEXT NOT NULL,
  description TEXT,
  document_type TEXT NOT NULL, -- 'guide', 'certificate', 'medical', 'photo', 'video'
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL, -- 'image', 'video', 'pdf'
  file_size INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dev: documents select" ON public.documents
  FOR SELECT USING (
    owner_id = '11111111-1111-1111-1111-111111111111'
    OR owner_id = auth.uid()
  );

CREATE POLICY "Dev: documents insert" ON public.documents
  FOR INSERT WITH CHECK (
    owner_id = '11111111-1111-1111-1111-111111111111'
    OR owner_id = auth.uid()
  );

CREATE POLICY "Dev: documents delete" ON public.documents
  FOR DELETE USING (
    owner_id = '11111111-1111-1111-1111-111111111111'
    OR owner_id = auth.uid()
  );

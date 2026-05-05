-- Create system-assets bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('system-assets', 'system-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for public access (read)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND policyname = 'Public Access System Assets'
    ) THEN
        CREATE POLICY "Public Access System Assets" ON storage.objects
        FOR SELECT USING (bucket_id = 'system-assets');
    END IF;
END $$;

-- Developer policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND policyname = 'Developer Upload System Assets'
    ) THEN
        CREATE POLICY "Developer Upload System Assets" ON storage.objects
        FOR INSERT WITH CHECK (bucket_id = 'system-assets' AND auth.role() = 'authenticated');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND policyname = 'Developer Update System Assets'
    ) THEN
        CREATE POLICY "Developer Update System Assets" ON storage.objects
        FOR UPDATE USING (bucket_id = 'system-assets' AND auth.role() = 'authenticated');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND policyname = 'Developer Delete System Assets'
    ) THEN
        CREATE POLICY "Developer Delete System Assets" ON storage.objects
        FOR DELETE USING (bucket_id = 'system-assets' AND auth.role() = 'authenticated');
    END IF;
END $$;
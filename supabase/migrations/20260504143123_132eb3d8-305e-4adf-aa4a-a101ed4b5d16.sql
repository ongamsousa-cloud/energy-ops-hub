CREATE POLICY "Authenticated users can select audio" 
ON storage.objects 
FOR SELECT 
TO authenticated 
USING (bucket_id = 'audio-messages');
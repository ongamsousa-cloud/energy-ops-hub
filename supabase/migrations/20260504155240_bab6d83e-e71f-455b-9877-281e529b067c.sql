-- Create storage bucket for message attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('message-attachments', 'message-attachments', true, 2147483648, NULL)
ON CONFLICT (id) DO UPDATE SET 
  file_size_limit = 2147483648,
  allowed_mime_types = NULL;

-- Storage policies for message-attachments
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'message-attachments');

CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'message-attachments');

CREATE POLICY "Users can delete their own attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'message-attachments' AND (auth.uid()::text = (storage.foldername(name))[1]));

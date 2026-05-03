-- Standardize primary bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('os-media', 'os-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('service-orders-media', 'service-orders-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Bucket policies
DROP POLICY IF EXISTS "Allow technician upload to service-orders-media" ON storage.objects;
CREATE POLICY "Allow technician upload to service-orders-media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id IN ('service-orders-media', 'os-media', 'os-evidences', 'evidencias'));

DROP POLICY IF EXISTS "Allow public read from service-orders-media" ON storage.objects;
CREATE POLICY "Allow public read from service-orders-media"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id IN ('service-orders-media', 'os-media', 'os-evidences', 'evidencias'));

-- Update or Add DELETE/UPDATE for owners
CREATE POLICY "Allow users to delete their own objects"
ON storage.objects FOR DELETE
TO authenticated
USING (auth.uid() = owner);

-- Fix table RLS to be more inclusive for authenticated technicians
DROP POLICY IF EXISTS "Technicians can insert media to their orders" ON public.service_order_media;
CREATE POLICY "Technicians can insert media to their orders"
ON public.service_order_media
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.ordens_servico os
    WHERE os.id = service_order_media.service_order_id
    AND (os.profissional_id = auth.uid() OR os.created_by = auth.uid())
  )
);

-- Ensure all columns allow insert
ALTER TABLE public.service_order_media ENABLE ROW LEVEL SECURITY;

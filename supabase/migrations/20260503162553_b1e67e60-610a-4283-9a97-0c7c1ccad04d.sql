-- Ensure bucket exists and is public
INSERT INTO storage.buckets (id, name, public) 
VALUES ('service-orders-media', 'service-orders-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow authenticated users to upload to service-orders-media
CREATE POLICY "Allow technician upload to service-orders-media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'service-orders-media');

-- Allow everyone to read from service-orders-media
CREATE POLICY "Allow public read from service-orders-media"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'service-orders-media');

-- Fix table RLS
ALTER TABLE public.service_order_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Technicians can insert media to their orders" ON public.service_order_media;

CREATE POLICY "Technicians can insert media to their orders"
ON public.service_order_media
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.ordens_servico os
    WHERE os.id = service_order_media.service_order_id
    AND os.profissional_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Integrated media access" ON public.service_order_media;

CREATE POLICY "Integrated media access"
ON public.service_order_media
FOR SELECT
TO authenticated
USING (true);

-- Adjusting table service_order_media columns to match requirements
ALTER TABLE public.service_order_media RENAME COLUMN file_path TO media_url;
ALTER TABLE public.service_order_media RENAME COLUMN file_type TO media_type;
ALTER TABLE public.service_order_media RENAME COLUMN latitude TO lat;
ALTER TABLE public.service_order_media RENAME COLUMN longitude TO lng;

-- Re-applying RLS policies if necessary or ensuring they work with new names
-- The previous migration already enabled RLS. 

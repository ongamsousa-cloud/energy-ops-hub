-- Ajustes na tabela service_order_media
ALTER TABLE public.service_order_media RENAME COLUMN technician_id TO user_id;
ALTER TABLE public.service_order_media RENAME COLUMN media_type TO file_type;
ALTER TABLE public.service_order_media RENAME COLUMN file_url TO file_path;
ALTER TABLE public.service_order_media RENAME COLUMN stage TO category;
ALTER TABLE public.service_order_media RENAME COLUMN gps_lat TO latitude;
ALTER TABLE public.service_order_media RENAME COLUMN gps_lng TO longitude;

-- Ajustes na tabela service_order_history
ALTER TABLE public.service_order_history RENAME COLUMN metadata TO details;
ALTER TABLE public.service_order_history RENAME COLUMN gps_lat TO latitude;
ALTER TABLE public.service_order_history RENAME COLUMN gps_lng TO longitude;

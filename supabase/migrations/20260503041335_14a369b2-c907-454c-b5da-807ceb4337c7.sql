-- Final synchronization for service_order_media
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_order_media' AND column_name = 'technician_id') THEN
        ALTER TABLE public.service_order_media RENAME COLUMN technician_id TO user_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_order_media' AND column_name = 'media_type') THEN
        ALTER TABLE public.service_order_media RENAME COLUMN media_type TO file_type;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_order_media' AND column_name = 'file_url') THEN
        ALTER TABLE public.service_order_media RENAME COLUMN file_url TO file_path;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_order_media' AND column_name = 'stage') THEN
        ALTER TABLE public.service_order_media RENAME COLUMN stage TO category;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_order_media' AND column_name = 'gps_lat') THEN
        ALTER TABLE public.service_order_media RENAME COLUMN gps_lat TO latitude;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_order_media' AND column_name = 'gps_lng') THEN
        ALTER TABLE public.service_order_media RENAME COLUMN gps_lng TO longitude;
    END IF;
END $$;

-- Final synchronization for service_order_history
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_order_history' AND column_name = 'metadata') THEN
        ALTER TABLE public.service_order_history RENAME COLUMN metadata TO details;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_order_history' AND column_name = 'gps_lat') THEN
        ALTER TABLE public.service_order_history RENAME COLUMN gps_lat TO latitude;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_order_history' AND column_name = 'gps_lng') THEN
        ALTER TABLE public.service_order_history RENAME COLUMN gps_lng TO longitude;
    END IF;
END $$;

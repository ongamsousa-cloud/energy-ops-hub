-- Add missing statuses to os_operational_status enum
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'material_reservado' AND enumtypid = 'os_operational_status'::regtype) THEN
        ALTER TYPE os_operational_status ADD VALUE 'material_reservado';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'aguardando_confirmacao_retirada' AND enumtypid = 'os_operational_status'::regtype) THEN
        ALTER TYPE os_operational_status ADD VALUE 'aguardando_confirmacao_retirada';
    END IF;
END $$;

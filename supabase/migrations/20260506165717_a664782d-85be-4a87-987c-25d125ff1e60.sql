-- Update os_operational_status enum with all requested statuses
DO $$ 
BEGIN
    -- Add new statuses if they don't exist
    -- Note: PostgreSQL doesn't support IF NOT EXISTS for ADD VALUE in 12, but we can check
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'aguardando_aprovacao_departamento' AND enumtypid = 'os_operational_status'::regtype) THEN
        ALTER TYPE os_operational_status ADD VALUE 'aguardando_aprovacao_departamento';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'aguardando_liberacao_estoque' AND enumtypid = 'os_operational_status'::regtype) THEN
        ALTER TYPE os_operational_status ADD VALUE 'aguardando_liberacao_estoque';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'material_liberado' AND enumtypid = 'os_operational_status'::regtype) THEN
        ALTER TYPE os_operational_status ADD VALUE 'material_liberado';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'pronta_para_execucao' AND enumtypid = 'os_operational_status'::regtype) THEN
        ALTER TYPE os_operational_status ADD VALUE 'pronta_para_execucao';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'aguardando_validacao_supervisor' AND enumtypid = 'os_operational_status'::regtype) THEN
        ALTER TYPE os_operational_status ADD VALUE 'aguardando_validacao_supervisor';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'corrigida' AND enumtypid = 'os_operational_status'::regtype) THEN
        ALTER TYPE os_operational_status ADD VALUE 'corrigida';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'aprovada_supervisor' AND enumtypid = 'os_operational_status'::regtype) THEN
        ALTER TYPE os_operational_status ADD VALUE 'aprovada_supervisor';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'aguardando_medicao' AND enumtypid = 'os_operational_status'::regtype) THEN
        ALTER TYPE os_operational_status ADD VALUE 'aguardando_medicao';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'medida' AND enumtypid = 'os_operational_status'::regtype) THEN
        ALTER TYPE os_operational_status ADD VALUE 'medida';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'aguardando_financeiro' AND enumtypid = 'os_operational_status'::regtype) THEN
        ALTER TYPE os_operational_status ADD VALUE 'aguardando_financeiro';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'faturavel' AND enumtypid = 'os_operational_status'::regtype) THEN
        ALTER TYPE os_operational_status ADD VALUE 'faturavel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'faturada' AND enumtypid = 'os_operational_status'::regtype) THEN
        ALTER TYPE os_operational_status ADD VALUE 'faturada';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'aguardando_auditoria' AND enumtypid = 'os_operational_status'::regtype) THEN
        ALTER TYPE os_operational_status ADD VALUE 'aguardando_auditoria';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'aprovada_auditoria' AND enumtypid = 'os_operational_status'::regtype) THEN
        ALTER TYPE os_operational_status ADD VALUE 'aprovada_auditoria';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'reprovada_auditoria' AND enumtypid = 'os_operational_status'::regtype) THEN
        ALTER TYPE os_operational_status ADD VALUE 'reprovada_auditoria';
    END IF;
END $$;

-- Create os_audit_logs if it doesn't exist
CREATE TABLE IF NOT EXISTS public.os_audit_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    os_id UUID REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on os_audit_logs
ALTER TABLE public.os_audit_logs ENABLE ROW LEVEL SECURITY;

-- Migration logic for existing data from service_orders to ordens_servico (if any and if columns match)
-- For now, let's just make sure all constraints are correct

-- Ensure ordens_servico has the status field as os_operational_status
-- If it's currently something else, we might need to convert it.

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_ordens_servico_numero ON public.ordens_servico(numero);
CREATE INDEX IF NOT EXISTS idx_ordens_servico_status ON public.ordens_servico(operational_status);

-- Create materials reservation table if not exists
CREATE TABLE IF NOT EXISTS public.material_reservations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    os_id UUID REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
    material_id UUID REFERENCES public.materials(id),
    quantity NUMERIC NOT NULL DEFAULT 0,
    status TEXT DEFAULT 'reserved', -- reserved, used, returned
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.material_reservations ENABLE ROW LEVEL SECURITY;

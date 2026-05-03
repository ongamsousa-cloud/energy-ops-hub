-- 1. Ensure core types and enums exist (standardizing statuses)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'operational_status') THEN
        CREATE TYPE operational_status AS ENUM (
            'Pendente', 'Atribuída', 'Em deslocamento', 'Chegou ao local', 'Em execução', 
            'Execução pausada', 'Não executada', 'Aguardando validação', 'Correção solicitada', 
            'Reaberta', 'Reprovada', 'Aprovada', 'Concluída', 'Cancelada', 'Crítica', 
            'Em auditoria', 'Aguardando exceção', 'Exceção aprovada', 'Exceção negada'
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'financial_status') THEN
        CREATE TYPE financial_status AS ENUM (
            'Sem impacto financeiro', 'Aguardando análise financeira', 'Em análise financeira', 
            'Aprovada financeiramente', 'Reprovada financeiramente', 'Com divergência', 
            'Aguardando correção operacional', 'Faturável', 'Não faturável', 
            'Aguardando faturamento', 'Faturada', 'Cancelada financeiramente', 'Em auditoria financeira'
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'audit_status') THEN
        CREATE TYPE audit_status AS ENUM (
            'Não auditada', 'Pendente de auditoria', 'Em auditoria', 'Aprovada na auditoria', 
            'Reprovada na auditoria', 'Com ressalva', 'Com inconsistência', 'Em investigação', 
            'Aguardando resposta', 'Corrigida após auditoria', 'Encerrada'
        );
    END IF;
END $$;

-- 2. Structure for Hierarchies and Assignments
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    department_id UUID REFERENCES public.departments(id),
    supervisor_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Unified Service Orders Table
CREATE TABLE IF NOT EXISTS public.service_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero TEXT UNIQUE NOT NULL,
    obra_id UUID REFERENCES public.obras(id),
    descricao TEXT,
    
    -- Hierarchy Vales
    manager_id UUID REFERENCES auth.users(id),
    supervisor_id UUID REFERENCES auth.users(id),
    technician_id UUID REFERENCES auth.users(id),
    team_id UUID REFERENCES public.teams(id),
    
    -- Statuses (Operational, Financial, Audit)
    status_operacional operational_status DEFAULT 'Pendente',
    status_financeiro financial_status DEFAULT 'Sem impacto financeiro',
    status_auditoria audit_status DEFAULT 'Não auditada',
    
    -- Location / GPS
    lat FLOAT,
    lng FLOAT,
    accuracy FLOAT,
    address TEXT,
    
    -- Dates
    scheduled_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    finished_at TIMESTAMP WITH TIME ZONE,
    
    -- Metrics
    total_umd DECIMAL DEFAULT 0,
    total_cost DECIMAL DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Media and Execution Evidence
CREATE TABLE IF NOT EXISTS public.service_order_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_order_id UUID REFERENCES public.service_orders(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    media_url TEXT NOT NULL,
    media_type TEXT, -- 'image', 'video'
    category TEXT, -- 'before', 'during', 'after', 'material', 'occurrence'
    lat FLOAT,
    lng FLOAT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. Full History / Audit Trail
CREATE TABLE IF NOT EXISTS public.service_order_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_order_id UUID REFERENCES public.service_orders(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    old_status_operacional operational_status,
    new_status_operacional operational_status,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. Enable RLS on all new tables
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_order_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_order_history ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for service_orders (Hierarchical)
-- Admins and Managers can see all
CREATE POLICY "Admins and Managers can see all orders" 
ON public.service_orders FOR ALL 
USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'gestor'))
);

-- Supervisors see orders for their team or assigned to them
CREATE POLICY "Supervisors can see their team orders"
ON public.service_orders FOR ALL
USING (
    supervisor_id = auth.uid() OR
    EXISTS (SELECT 1 FROM teams WHERE supervisor_id = auth.uid() AND id = service_orders.team_id) OR
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'gestor'))
);

-- Technicians see only orders assigned to them
CREATE POLICY "Technicians can see their own orders"
ON public.service_orders FOR SELECT
USING (
    technician_id = auth.uid() OR
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'gestor', 'supervisor'))
);

-- Technicians can update their own orders (to start, finish, etc)
CREATE POLICY "Technicians can update their assigned orders"
ON public.service_orders FOR UPDATE
USING (technician_id = auth.uid())
WITH CHECK (technician_id = auth.uid());

-- Financial and Auditors
CREATE POLICY "Financial and Auditors can see relevant orders"
ON public.service_orders FOR SELECT
USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('financeiro', 'auditor'))
);

-- 8. Functions and Triggers for History Tracking
CREATE OR REPLACE FUNCTION public.log_service_order_change()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.service_order_history (
        service_order_id,
        user_id,
        action,
        old_status_operacional,
        new_status_operacional,
        details
    ) VALUES (
        NEW.id,
        COALESCE(auth.uid(), NEW.technician_id),
        'UPDATE',
        OLD.status_operacional,
        NEW.status_operacional,
        jsonb_build_object('changed_at', now())
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if service_orders actually has the columns now before creating trigger
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_orders' AND column_name = 'status_operacional') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_log_service_order_change') THEN
            CREATE TRIGGER tr_log_service_order_change
            AFTER UPDATE ON public.service_orders
            FOR EACH ROW
            WHEN (OLD.status_operacional IS DISTINCT FROM NEW.status_operacional OR OLD.status_financeiro IS DISTINCT FROM NEW.status_financeiro)
            EXECUTE FUNCTION public.log_service_order_change();
        END IF;
    END IF;
END $$;

-- 9. Storage Buckets for Media
INSERT INTO storage.buckets (id, name, public) VALUES ('service-orders-media', 'service-orders-media', true) ON CONFLICT DO NOTHING;

-- RLS for Storage (simplified for speed, ensure buckets exist)
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'service-orders-media') THEN
        CREATE POLICY "Media is viewable by all authenticated users"
        ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'service-orders-media');

        CREATE POLICY "Users can upload media to orders they have access to"
        ON storage.objects FOR INSERT TO authenticated
        WITH CHECK (bucket_id = 'service-orders-media');
    END IF;
EXCEPTION WHEN others THEN
    -- Policy might already exist
END $$;

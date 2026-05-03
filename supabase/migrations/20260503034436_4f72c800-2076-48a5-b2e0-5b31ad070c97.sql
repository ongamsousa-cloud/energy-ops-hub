-- Perfil de Gestores
CREATE TABLE IF NOT EXISTS public.managers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    manager_type TEXT NOT NULL DEFAULT 'operacional', -- 'geral', 'operacional', 'regional', 'financeiro', 'comercial'
    department_id UUID REFERENCES public.departments(id),
    region_id TEXT,
    permission_level INTEGER DEFAULT 1,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id)
);

-- Exceções Gerenciais (Solicitações do Supervisor para o Gestor)
CREATE TABLE IF NOT EXISTS public.management_exceptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_order_id UUID NOT NULL REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
    requested_by UUID NOT NULL REFERENCES auth.users(id),
    reviewed_by UUID REFERENCES auth.users(id),
    exception_type TEXT NOT NULL, -- 'no_gps', 'missing_photo', 'overdue', 'checklist_incomplete'
    reason TEXT NOT NULL,
    impact_description TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'denied'
    decision_reason TEXT,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Mensagens de Gestão
CREATE TABLE IF NOT EXISTS public.management_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES auth.users(id),
    receiver_id UUID REFERENCES auth.users(id),
    department_id UUID REFERENCES public.departments(id),
    service_order_id UUID REFERENCES public.ordens_servico(id),
    message TEXT NOT NULL,
    visibility TEXT DEFAULT 'manager_supervisor', -- 'manager_only', 'manager_supervisor', 'all_staff'
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Métricas Operacionais Consolidadas
CREATE TABLE IF NOT EXISTS public.operational_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_type TEXT NOT NULL, -- 'productivity', 'avg_time', 'approval_rate'
    reference_type TEXT NOT NULL, -- 'technician', 'team', 'supervisor', 'region'
    reference_id UUID,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    value NUMERIC NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Adicionar criticidade na OS
ALTER TABLE public.ordens_servico ADD COLUMN IF NOT EXISTS criticality_level TEXT DEFAULT 'normal';

-- Ativar RLS
ALTER TABLE public.managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.management_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.management_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operational_metrics ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Managers viewable by staff" ON public.managers FOR SELECT TO authenticated USING (true);

CREATE POLICY "Gestor can manage their exceptions" 
ON public.management_exceptions 
FOR ALL 
TO authenticated 
USING (
    requested_by = auth.uid() OR 
    (SELECT cargo FROM public.profiles WHERE id = auth.uid()) IN ('Administrador', 'Gestor')
);

CREATE POLICY "Gestor can manage their messages" 
ON public.management_messages 
FOR ALL 
TO authenticated 
USING (
    sender_id = auth.uid() OR 
    receiver_id = auth.uid() OR 
    (SELECT cargo FROM public.profiles WHERE id = auth.uid()) IN ('Administrador', 'Gestor')
);

CREATE POLICY "Metrics viewable by staff" ON public.operational_metrics FOR SELECT TO authenticated USING (true);

-- Triggers
CREATE TRIGGER update_managers_at BEFORE UPDATE ON public.managers FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_management_exceptions_at BEFORE UPDATE ON public.management_exceptions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_management_messages_at BEFORE UPDATE ON public.management_messages FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_operational_metrics_at BEFORE UPDATE ON public.operational_metrics FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

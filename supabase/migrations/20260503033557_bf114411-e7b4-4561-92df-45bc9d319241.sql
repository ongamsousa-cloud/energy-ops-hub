-- Tabela de Supervisores
CREATE TABLE IF NOT EXISTS public.supervisors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    department_id TEXT,
    team_id TEXT,
    region_id TEXT,
    permission_level TEXT DEFAULT 'standard', -- 'standard', 'admin'
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id)
);

-- Adicionar colunas na ordens_servico para supervisão
ALTER TABLE public.ordens_servico 
ADD COLUMN IF NOT EXISTS assigned_supervisor_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS region_id TEXT,
ADD COLUMN IF NOT EXISTS due_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS validated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS validated_by UUID REFERENCES auth.users(id);

-- Tabela de Mensagens Internas da OS (Chat entre Supervisor e Técnico)
CREATE TABLE IF NOT EXISTS public.service_order_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_order_id UUID NOT NULL REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id),
    receiver_id UUID REFERENCES auth.users(id), -- Null se for para todos da OS
    message TEXT NOT NULL,
    attachment_url TEXT,
    visibility TEXT DEFAULT 'internal', -- 'technician_supervisor', 'internal', 'all'
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de Alertas Operacionais
CREATE TABLE IF NOT EXISTS public.operational_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_order_id UUID REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
    technician_id UUID REFERENCES auth.users(id),
    supervisor_id UUID REFERENCES auth.users(id),
    alert_type TEXT NOT NULL, -- 'delay', 'gps_mismatch', 'missing_evidence', 'reopened_often'
    severity TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'open', -- 'open', 'resolved', 'ignored'
    resolved_by UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de Notificações
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT, -- 'new_os', 'correction_requested', 'os_finalized', 'new_message'
    service_order_id UUID REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Ativar RLS
ALTER TABLE public.supervisors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_order_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operational_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Políticas de Segurança para Supervisor
-- Supervisores podem gerenciar OSs onde eles são os supervisores ou se forem do mesmo departamento/time
-- Por enquanto, seguindo a lógica de 'cargo' no profile

CREATE POLICY "Supervisors viewable by authenticated" ON public.supervisors FOR SELECT TO authenticated USING (true);

CREATE POLICY "Supervisor can manage their team messages" 
ON public.service_order_messages 
FOR ALL 
TO authenticated 
USING (
    sender_id = auth.uid() OR 
    receiver_id = auth.uid() OR 
    (SELECT cargo FROM public.profiles WHERE id = auth.uid()) IN ('Administrador', 'Gestor', 'Supervisor')
);

CREATE POLICY "Supervisor can manage team alerts" 
ON public.operational_alerts 
FOR ALL 
TO authenticated 
USING (
    supervisor_id = auth.uid() OR 
    (SELECT cargo FROM public.profiles WHERE id = auth.uid()) IN ('Administrador', 'Gestor', 'Supervisor')
);

CREATE POLICY "Users can manage their own notifications" 
ON public.notifications 
FOR ALL 
TO authenticated 
USING (user_id = auth.uid());

-- Triggers para timestamps
CREATE TRIGGER update_supervisors_at BEFORE UPDATE ON public.supervisors FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_service_order_messages_at BEFORE UPDATE ON public.service_order_messages FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_operational_alerts_at BEFORE UPDATE ON public.operational_alerts FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 1. Create a unified view for Service Orders
CREATE OR REPLACE VIEW public.v_all_service_orders AS
SELECT 
    id, 
    numero as reference_number, 
    status::text as status, 
    operational_status::text as operational_status,
    prioridade::text as priority,
    profissional_id as technician_id,
    equipe_id as team_id,
    created_at,
    'ordens_servico' as source_table
FROM public.ordens_servico
UNION ALL
SELECT 
    id, 
    NULL as reference_number, 
    status::text as status, 
    status::text as operational_status,
    priority::text as priority,
    technician_id,
    team_id,
    created_at,
    'service_orders' as source_table
FROM public.service_orders;

-- 2. Refined Audit Log trigger
CREATE OR REPLACE FUNCTION public.log_os_status_change_v3()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.status IS DISTINCT FROM NEW.status) OR (OLD.operational_status IS DISTINCT FROM NEW.operational_status) THEN
        INSERT INTO public.os_audit_logs (
            os_id,
            user_id,
            status_anterior,
            status_novo,
            comentario,
            created_at
        ) VALUES (
            NEW.id,
            auth.uid(),
            OLD.status::text,
            NEW.status::text,
            'Mudança técnica: ' || COALESCE(NEW.operational_status, NEW.status::text),
            now()
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_log_os_status_change ON public.ordens_servico;
CREATE TRIGGER tr_log_os_status_change
AFTER UPDATE ON public.ordens_servico
FOR EACH ROW
EXECUTE FUNCTION public.log_os_status_change_v3();

-- 3. Standardize column names
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'active_team_id') THEN
        ALTER TABLE public.profiles ADD COLUMN active_team_id UUID;
    END IF;
END $$;

-- 4. Secure RLS for OS
ALTER TABLE public.ordens_servico ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Technicians can view their own OS" ON public.ordens_servico;
CREATE POLICY "Technicians can view their own OS" ON public.ordens_servico
FOR SELECT USING (
    auth.uid() = profissional_id OR 
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'gestor', 'supervisor'))
);

-- 5. Unified Notifications Mapping
CREATE OR REPLACE VIEW public.v_unified_notifications AS
SELECT 
    id, 
    user_id, 
    title, 
    message, 
    type, 
    read_at, 
    created_at 
FROM public.notifications
UNION ALL
SELECT 
    id, 
    user_id, 
    titulo as title, 
    mensagem as message, 
    'info' as type, 
    CASE WHEN lida THEN now() ELSE NULL END as read_at, 
    created_at 
FROM public.notificacoes;

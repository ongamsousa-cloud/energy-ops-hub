-- Adicionar colunas necessárias na tabela ordens_servico se não existirem
ALTER TABLE public.ordens_servico 
ADD COLUMN IF NOT EXISTS prioridade TEXT DEFAULT 'media',
ADD COLUMN IF NOT EXISTS data_agendada DATE,
ADD COLUMN IF NOT EXISTS hora_agendada TIME,
ADD COLUMN IF NOT EXISTS inicio_atendimento TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS fim_atendimento TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS local_lat DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS local_lng DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS endereco_completo TEXT,
ADD COLUMN IF NOT EXISTS bairro TEXT,
ADD COLUMN IF NOT EXISTS cidade TEXT,
ADD COLUMN IF NOT EXISTS estado TEXT,
ADD COLUMN IF NOT EXISTS cep TEXT,
ADD COLUMN IF NOT EXISTS observacoes_admin TEXT,
ADD COLUMN IF NOT EXISTS motivo_reprovacao TEXT;

-- Tabela de Técnicos (complemento ao profile)
CREATE TABLE IF NOT EXISTS public.technicians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    function TEXT,
    team_id TEXT, 
    department_id TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id)
);

-- Tabela de Códigos de Execução (Planilha Técnica)
CREATE TABLE IF NOT EXISTS public.execution_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    service_type TEXT,
    default_instructions TEXT,
    required_fields JSONB DEFAULT '[]'::jsonb,
    checklist_template JSONB DEFAULT '[]'::jsonb,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de Registros de Execução de Serviço
CREATE TABLE IF NOT EXISTS public.service_execution_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_order_id UUID NOT NULL REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
    technician_id UUID NOT NULL REFERENCES auth.users(id),
    execution_code_id UUID REFERENCES public.execution_codes(id),
    status TEXT NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    total_duration INTERVAL,
    technical_notes TEXT,
    problems_found TEXT,
    solution_applied TEXT,
    reason_not_executed TEXT,
    materials_used JSONB DEFAULT '[]'::jsonb,
    checklist_answers JSONB DEFAULT '{}'::jsonb,
    gps_lat DOUBLE PRECISION,
    gps_lng DOUBLE PRECISION,
    submitted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de Mídia da Ordem de Serviço
CREATE TABLE IF NOT EXISTS public.service_order_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_order_id UUID NOT NULL REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
    technician_id UUID NOT NULL REFERENCES auth.users(id),
    execution_record_id UUID REFERENCES public.service_execution_records(id),
    media_type TEXT NOT NULL, 
    file_url TEXT NOT NULL,
    file_name TEXT,
    file_size INTEGER,
    description TEXT,
    stage TEXT, 
    gps_lat DOUBLE PRECISION,
    gps_lng DOUBLE PRECISION,
    captured_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de Histórico da Ordem de Serviço
CREATE TABLE IF NOT EXISTS public.service_order_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_order_id UUID NOT NULL REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    action TEXT NOT NULL,
    previous_status TEXT,
    new_status TEXT,
    description TEXT,
    gps_lat DOUBLE PRECISION,
    gps_lng DOUBLE PRECISION,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de Validações/Aprovações
CREATE TABLE IF NOT EXISTS public.service_order_validations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_order_id UUID NOT NULL REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES auth.users(id),
    status TEXT NOT NULL,
    review_notes TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Ativar RLS
ALTER TABLE public.technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.execution_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_execution_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_order_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_order_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_order_validations ENABLE ROW LEVEL SECURITY;

-- Políticas de Segurança
CREATE POLICY "Technicians viewable by all staff" ON public.technicians FOR SELECT TO authenticated USING (true);
CREATE POLICY "Execution codes viewable by all" ON public.execution_codes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Technicians can manage their own records" 
ON public.service_execution_records 
FOR ALL 
TO authenticated 
USING (technician_id = auth.uid() OR (SELECT cargo FROM public.profiles WHERE id = auth.uid()) IN ('Administrador', 'Gestor', 'Supervisor'));

CREATE POLICY "Technicians can manage their own media" 
ON public.service_order_media 
FOR ALL 
TO authenticated 
USING (technician_id = auth.uid() OR (SELECT cargo FROM public.profiles WHERE id = auth.uid()) IN ('Administrador', 'Gestor', 'Supervisor'));

CREATE POLICY "History viewable by authenticated" ON public.service_order_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "History insertable by authenticated" ON public.service_order_history FOR INSERT TO authenticated WITH CHECK (true);

-- Timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_technicians_at BEFORE UPDATE ON public.technicians FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_execution_codes_at BEFORE UPDATE ON public.execution_codes FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_service_execution_records_at BEFORE UPDATE ON public.service_execution_records FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('os-media', 'os-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "OS media access" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'os-media');
CREATE POLICY "OS media upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'os-media');

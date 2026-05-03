-- 1. Extensões e Funções Auxiliares
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Função para atualizar timestamp de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 2. Tabelas de Estrutura Organizacional
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
    supervisor_id UUID, -- Referência ao profile do supervisor
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Ajustes na tabela de Perfis (Profiles/Users)
-- Assumindo que a tabela profiles já existe, vamos garantir que ela tenha os campos necessários
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
        ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'technician';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'department_id') THEN
        ALTER TABLE public.profiles ADD COLUMN department_id UUID REFERENCES public.departments(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'team_id') THEN
        ALTER TABLE public.profiles ADD COLUMN team_id UUID REFERENCES public.teams(id);
    END IF;
END $$;

-- 4. Tabela Central de Ordens de Serviço (unificada)
-- Se 'ordens_servico' existir, vamos migrar ou renomear. Para este PRD, usaremos 'service_orders' como central.
CREATE TABLE IF NOT EXISTS public.service_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero SERIAL UNIQUE,
    titulo TEXT NOT NULL,
    descricao TEXT,
    cliente_id UUID,
    obra_id UUID REFERENCES public.obras(id),
    
    -- Hierarquia de Responsabilidade
    technician_id UUID REFERENCES public.profiles(id),
    supervisor_id UUID REFERENCES public.profiles(id),
    manager_id UUID REFERENCES public.profiles(id),
    team_id UUID REFERENCES public.teams(id),
    department_id UUID REFERENCES public.departments(id),
    
    -- Status Tríptico (Operacional, Financeiro, Auditoria)
    status TEXT NOT NULL DEFAULT 'Pendente', -- Operacional
    financial_status TEXT NOT NULL DEFAULT 'Sem impacto financeiro',
    audit_status TEXT NOT NULL DEFAULT 'Não auditada',
    
    -- Prioridade
    priority TEXT DEFAULT 'Media', -- Baixa, Media, Alta, Critica
    
    -- Dados de Localização
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    address TEXT,
    zip_code TEXT,
    
    -- Datas
    scheduled_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    finished_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. Tabelas de Apoio à Execução
CREATE TABLE IF NOT EXISTS public.service_order_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_order_id UUID REFERENCES public.service_orders(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id),
    file_path TEXT NOT NULL,
    file_type TEXT, -- image/video
    category TEXT, -- antes, durante, depois, material, ocorrencia
    description TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.service_order_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_order_id UUID REFERENCES public.service_orders(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id),
    action TEXT NOT NULL,
    previous_status TEXT,
    new_status TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. Segurança (RLS)
ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_order_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_order_history ENABLE ROW LEVEL SECURITY;

-- Políticas para service_orders
CREATE POLICY "Admins can do everything" ON public.service_orders 
    FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Technicians view their own orders" ON public.service_orders 
    FOR SELECT USING (technician_id = auth.uid());

CREATE POLICY "Technicians update their assigned orders" ON public.service_orders 
    FOR UPDATE USING (technician_id = auth.uid() AND status IN ('Pendente', 'Atribuída', 'Em deslocamento', 'Chegou ao local', 'Em execução', 'Correção solicitada'));

CREATE POLICY "Supervisors view their team orders" ON public.service_orders 
    FOR SELECT USING (supervisor_id = auth.uid() OR team_id IN (SELECT id FROM public.teams WHERE supervisor_id = auth.uid()));

CREATE POLICY "Managers view their department orders" ON public.service_orders 
    FOR SELECT USING (manager_id = auth.uid() OR department_id IN (SELECT department_id FROM public.profiles WHERE id = auth.uid()));

-- 7. Triggers para auditoria e timestamps
CREATE TRIGGER trigger_update_service_orders_updated_at
BEFORE UPDATE ON public.service_orders
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. Buckets de Storage
-- Certificar que o bucket de mídia existe via política se possível ou via dashboard manual.
-- Aqui assumimos o bucket 'os-evidences' será usado.

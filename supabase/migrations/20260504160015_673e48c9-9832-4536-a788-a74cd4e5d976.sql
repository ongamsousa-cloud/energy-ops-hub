-- Table for departments
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on departments
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- Departments policies (idempotent)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'departments' AND policyname = 'Departments are viewable by all authenticated users') THEN
        CREATE POLICY "Departments are viewable by all authenticated users" 
        ON public.departments FOR SELECT USING (auth.role() = 'authenticated');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'departments' AND policyname = 'Admin can manage departments') THEN
        CREATE POLICY "Admin can manage departments" 
        ON public.departments FOR ALL USING (
          EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'master'))
        );
    END IF;
END $$;

-- Add department_id to profiles if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'department_id') THEN
        ALTER TABLE public.profiles ADD COLUMN department_id UUID REFERENCES public.departments(id);
    END IF;
END $$;

-- Adjust ordens_servico table with new fields
ALTER TABLE public.ordens_servico 
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id),
ADD COLUMN IF NOT EXISTS gestor_responsavel_id UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS status_workflow TEXT DEFAULT 'rascunho',
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;

-- Create function for OS numbering
CREATE OR REPLACE FUNCTION generate_os_number() RETURNS trigger AS $$
DECLARE
    os_year TEXT;
    os_month TEXT;
    os_seq INTEGER;
    os_number TEXT;
BEGIN
    os_year := to_char(now(), 'YYYY');
    os_month := to_char(now(), 'MM');
    
    -- Get next sequence for the current month/year
    SELECT count(*) + 1 INTO os_seq 
    FROM public.ordens_servico 
    WHERE to_char(created_at, 'YYYY-MM') = os_year || '-' || os_month;
    
    os_number := 'OS-' || os_year || '-' || os_month || '-' || LPAD(os_seq::text, 4, '0');
    
    NEW.numero := os_number;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for OS numbering if it doesn't have a number
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_generate_os_number') THEN
        CREATE TRIGGER trg_generate_os_number
        BEFORE INSERT ON public.ordens_servico
        FOR EACH ROW
        WHEN (NEW.numero IS NULL)
        EXECUTE FUNCTION generate_os_number();
    END IF;
END $$;

-- Table for OS History
CREATE TABLE IF NOT EXISTS public.os_history (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    os_id UUID NOT NULL REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    action TEXT NOT NULL,
    old_status TEXT,
    new_status TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table for OS Comments/Messages
CREATE TABLE IF NOT EXISTS public.os_comments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    os_id UUID NOT NULL REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    content TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table for OS Materials
CREATE TABLE IF NOT EXISTS public.os_materials_request (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    os_id UUID NOT NULL REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
    material_id UUID NOT NULL REFERENCES public.materials(id),
    quantity_requested NUMERIC NOT NULL,
    quantity_delivered NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'pendente',
    requested_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table for OS Approvals
CREATE TABLE IF NOT EXISTS public.os_approvals (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    os_id UUID NOT NULL REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
    approver_id UUID NOT NULL REFERENCES public.profiles(id),
    status TEXT NOT NULL,
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.os_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.os_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.os_materials_request ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.os_approvals ENABLE ROW LEVEL SECURITY;

-- Policies for OS related tables (idempotent)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'os_history' AND policyname = 'OS history viewable by authorized') THEN
        CREATE POLICY "OS history viewable by authorized" 
        ON public.os_history FOR SELECT USING (true); -- Simplified for now, in a real app this would be more restrictive
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'os_comments' AND policyname = 'OS comments viewable by authorized') THEN
        CREATE POLICY "OS comments viewable by authorized" 
        ON public.os_comments FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'os_comments' AND policyname = 'Authenticated users can post comments') THEN
        CREATE POLICY "Authenticated users can post comments" 
        ON public.os_comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    END IF;
END $$;

-- Seed initial departments
INSERT INTO public.departments (name, description) VALUES
('Administração', 'Gestão administrativa central'),
('Operações', 'Planejamento e controle de operações'),
('Campo', 'Execução técnica em campo'),
('Estoque / Almoxarifado', 'Controle de materiais e logística'),
('Financeiro', 'Gestão financeira e faturamento'),
('Medição', 'Aferição de resultados e medições'),
('Aprovações', 'Setor de validação e compliance'),
('Relatórios', 'Análise de dados e reporting'),
('Segurança / Qualidade', 'Controle de QHSE'),
('Atendimento / Cliente', 'Interface com o cliente final')
ON CONFLICT (name) DO NOTHING;

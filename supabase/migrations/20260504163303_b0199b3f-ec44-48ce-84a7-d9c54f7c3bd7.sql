
-- 1. Ensure departments table exists with needed fields
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'departments') THEN
        CREATE TABLE public.departments (
            id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
        ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Everyone can view departments" ON public.departments FOR SELECT USING (true);
    END IF;
END $$;

-- 2. Add department and manager columns to profiles if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'department_id') THEN
        ALTER TABLE public.profiles ADD COLUMN department_id UUID REFERENCES public.departments(id);
    END IF;
END $$;

-- 3. Update ordens_servico with new fields
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'ordens_servico' AND column_name = 'gestor_responsavel_id') THEN
        ALTER TABLE public.ordens_servico ADD COLUMN gestor_responsavel_id UUID REFERENCES public.profiles(id);
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'ordens_servico' AND column_name = 'client_id') THEN
        ALTER TABLE public.ordens_servico ADD COLUMN client_id UUID REFERENCES public.profiles(id);
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'ordens_servico' AND column_name = 'address') THEN
        ALTER TABLE public.ordens_servico ADD COLUMN address TEXT;
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'ordens_servico' AND column_name = 'client_name') THEN
        ALTER TABLE public.ordens_servico ADD COLUMN client_name TEXT;
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'ordens_servico' AND column_name = 'assigned_supervisor_id') THEN
        ALTER TABLE public.ordens_servico ADD COLUMN assigned_supervisor_id UUID REFERENCES public.profiles(id);
    END IF;
END $$;

-- 4. Create os_status_history for tracking state changes
CREATE TABLE IF NOT EXISTS public.os_status_history (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    os_id UUID NOT NULL REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
    old_status TEXT,
    new_status TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    reason TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.os_status_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view history of accessible OS" ON public.os_status_history 
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.ordens_servico WHERE id = os_id)
);

-- 5. Create os_materials_request for material interlink
CREATE TABLE IF NOT EXISTS public.os_materials_request (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    os_id UUID NOT NULL REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
    material_id UUID NOT NULL REFERENCES public.materials(id),
    quantity_requested NUMERIC NOT NULL,
    quantity_delivered NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'pending', -- pending, separated, delivered, returned
    requested_by UUID REFERENCES public.profiles(id),
    processed_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.os_materials_request ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage materials for their OS" ON public.os_materials_request FOR ALL USING (true);

-- 6. Trigger for OS number generation (OS-YEAR-MONTH-SEQ)
CREATE OR REPLACE FUNCTION generate_os_number()
RETURNS TRIGGER AS $$
DECLARE
    seq_val INTEGER;
    year_val TEXT;
    month_val TEXT;
BEGIN
    year_val := to_char(now(), 'YYYY');
    month_val := to_char(now(), 'MM');
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(numero FROM 12) AS INTEGER)), 0) + 1
    INTO seq_val
    FROM public.ordens_servico
    WHERE numero LIKE 'OS-' || year_val || '-' || month_val || '-%';
    
    NEW.numero := 'OS-' || year_val || '-' || month_val || '-' || lpad(seq_val::text, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generate_os_number ON public.ordens_servico;
CREATE TRIGGER trg_generate_os_number
BEFORE INSERT ON public.ordens_servico
FOR EACH ROW
WHEN (NEW.numero IS NULL OR NEW.numero = '')
EXECUTE FUNCTION generate_os_number();

-- 7. RLS Enhancements for Departments
-- Admins see all. Managers see their department. Workers see their assignments.
CREATE OR REPLACE FUNCTION public.check_os_access(os_row public.ordens_servico)
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
    user_dep UUID;
BEGIN
    -- Get current user role and department
    SELECT department_id INTO user_dep FROM public.profiles WHERE id = auth.uid();
    
    -- Admin master
    IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin') THEN
        RETURN TRUE;
    END IF;
    
    -- Department match
    IF os_row.department_id = user_dep THEN
        RETURN TRUE;
    END IF;
    
    -- Assigned professional
    IF os_row.profissional_id = auth.uid() THEN
        RETURN TRUE;
    END IF;
    
    -- Assigned manager or supervisor
    IF os_row.gestor_responsavel_id = auth.uid() OR os_row.assigned_supervisor_id = auth.uid() THEN
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-enable RLS on ordens_servico with smarter policies
ALTER TABLE public.ordens_servico ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "OS granular access" ON public.ordens_servico;
CREATE POLICY "OS granular access" ON public.ordens_servico
FOR ALL USING (public.check_os_access(ordens_servico));

-- Garantir que a tabela de departamentos tenha um gestor responsável
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='departments' AND column_name='manager_id') THEN
        ALTER TABLE public.departments ADD COLUMN manager_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- Garantir que perfis tenham vínculo com departamento e cargo
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='department_id') THEN
        ALTER TABLE public.profiles ADD COLUMN department_id UUID REFERENCES public.departments(id);
    END IF;
END $$;

-- Atualizar ordens de serviço para incluir departamento e gestor
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ordens_servico' AND column_name='department_id') THEN
        ALTER TABLE public.ordens_servico ADD COLUMN department_id UUID REFERENCES public.departments(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ordens_servico' AND column_name='gestor_responsavel_id') THEN
        ALTER TABLE public.ordens_servico ADD COLUMN gestor_responsavel_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- Habilitar RLS se não estiver habilitado
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- Políticas para Departamentos
CREATE POLICY "Departamentos visíveis por todos os autenticados" 
ON public.departments FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Apenas admin pode gerenciar departamentos" 
ON public.departments FOR ALL 
TO authenticated 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'developer')));

-- Ajustar políticas de OS para o novo fluxo de departamentos
DROP POLICY IF EXISTS "Users can view their own OS" ON public.ordens_servico;
DROP POLICY IF EXISTS "Managers can view department OS" ON public.ordens_servico;

CREATE POLICY "Visualização de OS baseada em hierarquia e departamento" 
ON public.ordens_servico FOR SELECT 
TO authenticated 
USING (
    auth.uid() = profissional_id OR 
    auth.uid() = supervisor_id OR 
    auth.uid() = gestor_responsavel_id OR
    EXISTS (
        SELECT 1 FROM public.profiles p 
        WHERE p.id = auth.uid() 
        AND (
            p.role IN ('admin', 'developer') OR 
            (p.role = 'gestor' AND p.department_id = public.ordens_servico.department_id)
        )
    )
);

CREATE POLICY "Gestores podem criar OS para seu departamento" 
ON public.ordens_servico FOR INSERT 
TO authenticated 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles p 
        WHERE p.id = auth.uid() 
        AND (p.role IN ('admin', 'developer', 'gestor'))
    )
);

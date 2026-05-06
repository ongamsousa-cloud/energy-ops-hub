-- Adicionar departamento às equipes
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipes' AND column_name='department_id') THEN
        ALTER TABLE public.equipes ADD COLUMN department_id UUID REFERENCES public.departments(id);
    END IF;
END $$;

-- Habilitar RLS em equipes
ALTER TABLE public.equipes ENABLE ROW LEVEL SECURITY;

-- Políticas para Equipes
DROP POLICY IF EXISTS "Equipes visíveis por todos" ON public.equipes;
CREATE POLICY "Equipes visíveis por todos os autenticados" 
ON public.equipes FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Gestores podem gerenciar equipes do seu departamento" 
ON public.equipes FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p 
        WHERE p.id = auth.uid() 
        AND (
            p.role IN ('admin', 'developer') OR 
            (p.role = 'gestor' AND p.department_id = public.equipes.department_id)
        )
    )
);

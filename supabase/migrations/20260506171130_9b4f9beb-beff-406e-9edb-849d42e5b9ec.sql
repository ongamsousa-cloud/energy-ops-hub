-- Drop existing overly permissive policies if any (danger check for USING (true))
DO $$
DECLARE
    policy_row RECORD;
BEGIN
    FOR policy_row IN 
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public' 
          AND (tablename IN ('ordens_servico', 'os_materials', 'os_evidences', 'os_messages', 'os_location_logs', 'os_audit_logs', 'material_reservations', 'department_tasks', 'non_conformities'))
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_row.policyname, policy_row.tablename);
    END LOOP;
END $$;

-- Enable RLS (already enabled on many, but let's be sure)
ALTER TABLE public.ordens_servico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.os_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.os_evidences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.os_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.os_location_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.os_audit_logs ENABLE ROW LEVEL SECURITY;

-- 12. RLS POLICIES

-- ordens_servico
CREATE POLICY "Admin/Dev full access OS" ON public.ordens_servico FOR ALL TO authenticated 
USING (auth.jwt()->>'role' IN ('admin', 'developer'));

CREATE POLICY "Gestor view/edit OS in department" ON public.ordens_servico FOR ALL TO authenticated 
USING (auth.jwt()->>'role' = 'gestor' AND (department_id IN (SELECT department_id FROM public.profiles WHERE id = auth.uid()) OR gestor_responsavel_id = auth.uid()));

CREATE POLICY "Supervisor view/edit assigned OS" ON public.ordens_servico FOR SELECT TO authenticated 
USING (auth.jwt()->>'role' = 'supervisor' AND (assigned_supervisor_id = auth.uid() OR supervisor_id = auth.uid()));

CREATE POLICY "Field worker view/update assigned OS" ON public.ordens_servico FOR ALL TO authenticated 
USING (profissional_id = auth.uid());

-- os_materials
CREATE POLICY "Full access to materials for OS participants" ON public.os_materials FOR ALL TO authenticated 
USING (
    os_id IN (
        SELECT id FROM public.ordens_servico 
        WHERE profissional_id = auth.uid() 
           OR assigned_supervisor_id = auth.uid() 
           OR gestor_responsavel_id = auth.uid()
    ) OR auth.jwt()->>'role' IN ('admin', 'developer', 'estoque')
);

-- os_evidences
CREATE POLICY "Full access to evidences for OS participants" ON public.os_evidences FOR ALL TO authenticated 
USING (
    os_id IN (
        SELECT id FROM public.ordens_servico 
        WHERE profissional_id = auth.uid() 
           OR assigned_supervisor_id = auth.uid() 
           OR gestor_responsavel_id = auth.uid()
    ) OR auth.jwt()->>'role' IN ('admin', 'developer', 'auditor')
);

-- material_reservations
CREATE POLICY "Access to reservations for OS participants and stock" ON public.material_reservations FOR ALL TO authenticated 
USING (
    os_id IN (
        SELECT id FROM public.ordens_servico 
        WHERE profissional_id = auth.uid() 
           OR assigned_supervisor_id = auth.uid()
    ) OR auth.jwt()->>'role' IN ('admin', 'developer', 'estoque')
);

-- department_tasks
CREATE POLICY "Access to tasks for sender, receiver or admin" ON public.department_tasks FOR ALL TO authenticated 
USING (
    assigned_to = auth.uid() 
    OR created_by = auth.uid() 
    OR auth.jwt()->>'role' IN ('admin', 'developer')
);

-- non_conformities
CREATE POLICY "Access to non_conformities for OS participants and auditor" ON public.non_conformities FOR ALL TO authenticated 
USING (
    os_id IN (
        SELECT id FROM public.ordens_servico 
        WHERE profissional_id = auth.uid() 
           OR assigned_supervisor_id = auth.uid()
    ) OR auth.jwt()->>'role' IN ('admin', 'developer', 'auditor')
);

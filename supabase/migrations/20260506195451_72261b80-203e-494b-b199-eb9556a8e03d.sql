-- Corrigir políticas de departamentos
DROP POLICY IF EXISTS "Admin can manage departments" ON public.departments;
DROP POLICY IF EXISTS "Admin full access to departments" ON public.departments;
DROP POLICY IF EXISTS "Admins can do everything on departments" ON public.departments;
DROP POLICY IF EXISTS "Admins manage departments" ON public.departments;
DROP POLICY IF EXISTS "Apenas admin e gestor podem gerenciar departamentos" ON public.departments;

CREATE POLICY "Admin e gestores podem gerenciar departamentos" 
ON public.departments 
FOR ALL 
TO authenticated 
USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'gestor'::app_role]))
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'gestor'::app_role]));

-- Corrigir políticas de ordens_servico
DROP POLICY IF EXISTS "Admin/Dev full access OS" ON public.ordens_servico;
DROP POLICY IF EXISTS "Gestor view/edit OS in department" ON public.ordens_servico;
DROP POLICY IF EXISTS "Supervisor view/edit assigned OS" ON public.ordens_servico;

CREATE POLICY "Admin e gestores tem acesso total OS" 
ON public.ordens_servico 
FOR ALL 
TO authenticated 
USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'gestor'::app_role]))
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'gestor'::app_role]));

CREATE POLICY "Supervisores podem gerenciar suas OS" 
ON public.ordens_servico 
FOR ALL 
TO authenticated 
USING (
  public.has_any_role(auth.uid(), ARRAY['supervisor'::app_role]) AND 
  (assigned_supervisor_id = auth.uid() OR supervisor_id = auth.uid() OR assigned_manager_id = auth.uid())
);

CREATE POLICY "Profissionais de campo podem ver suas OS" 
ON public.ordens_servico 
FOR SELECT 
TO authenticated 
USING (profissional_id = auth.uid());

-- Garantir que todos possam ver departamentos (necessário para os selects nos formulários)
DROP POLICY IF EXISTS "Departamentos visíveis por todos os autenticados" ON public.departments;
DROP POLICY IF EXISTS "Departments are viewable by all authenticated users" ON public.departments;
DROP POLICY IF EXISTS "Public departments view" ON public.departments;

CREATE POLICY "Departamentos visíveis por todos autenticados" 
ON public.departments 
FOR SELECT 
TO authenticated 
USING (true);

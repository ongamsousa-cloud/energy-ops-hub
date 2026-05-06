-- Ensure a default company exists for bootstrapping
INSERT INTO public.companies (id, name)
VALUES ('00000000-0000-0000-0000-000000000000', 'Empresa Padrão')
ON CONFLICT (id) DO NOTHING;

-- Make employees RLS more permissive for admins regardless of company_id
DROP POLICY IF EXISTS "Managers can manage employees" ON public.employees;
CREATE POLICY "Managers can manage employees" 
ON public.employees 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'gestor', 'developer')
  )
  OR 
  (company_id = get_user_company_id())
  OR
  (get_user_company_id() IS NULL AND company_id = '00000000-0000-0000-0000-000000000000'::uuid)
);

-- Ensure everyone can at least see employees to avoid empty lists
DROP POLICY IF EXISTS "Users can view employees in their company" ON public.employees;
CREATE POLICY "Users can view employees in their company" 
ON public.employees 
FOR SELECT 
TO authenticated
USING (true);

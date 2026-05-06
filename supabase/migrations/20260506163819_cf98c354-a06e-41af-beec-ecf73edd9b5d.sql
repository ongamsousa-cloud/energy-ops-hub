-- Drop existing policy
DROP POLICY IF EXISTS "Managers can manage employees" ON public.employees;

-- Create more flexible policy
CREATE POLICY "Managers can manage employees" 
ON public.employees 
FOR ALL 
USING (
  (get_user_company_id() IS NULL AND (company_id IS NULL OR company_id = '00000000-0000-0000-0000-000000000000'::uuid))
  OR 
  (company_id = get_user_company_id())
  OR
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Ensure profiles can be updated by admins too
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (
  auth.uid() = id 
  OR 
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

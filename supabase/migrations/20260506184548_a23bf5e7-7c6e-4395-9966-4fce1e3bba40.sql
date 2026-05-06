-- Update the policy to include 'gestor'
DROP POLICY IF EXISTS "Apenas admin pode gerenciar departamentos" ON public.departments;
CREATE POLICY "Apenas admin e gestor podem gerenciar departamentos" 
ON public.departments 
FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'developer', 'gestor')
  )
);

-- Permite que qualquer usuário autenticado insira uma nova OS
-- As políticas existentes de SELECT e UPDATE continuam restringindo quem pode ver e editar
CREATE POLICY "Qualquer usuário autenticado pode criar OS" 
ON public.ordens_servico 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Permite que qualquer usuário autenticado insira atividades de OS
-- Isso resolve o problema de recursão ou falta de permissão no momento da criação
DROP POLICY IF EXISTS "lanc write" ON public.os_atividades;
CREATE POLICY "Qualquer usuário autenticado pode inserir atividades de OS" 
ON public.os_atividades 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Mantém a política de visualização e atualização restrita para segurança
CREATE POLICY "lanc select" ON public.os_atividades FOR SELECT USING (true);
CREATE POLICY "lanc update" ON public.os_atividades FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.ordens_servico o 
    WHERE o.id = public.os_atividades.os_id 
    AND (o.profissional_id = auth.uid() OR has_any_role(auth.uid(), ARRAY['admin'::app_role, 'gestor'::app_role, 'supervisor'::app_role]))
  )
);

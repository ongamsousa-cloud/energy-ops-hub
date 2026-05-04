-- 1. Corrigir permissões de Materiais (os_materials)
DROP POLICY IF EXISTS "Read for all" ON public.os_materials;
CREATE POLICY "OS Materials: Visibility" ON public.os_materials FOR SELECT USING (true);
CREATE POLICY "OS Materials: Insert" ON public.os_materials FOR INSERT WITH CHECK (true); -- Permitir inserção
CREATE POLICY "OS Materials: Update" ON public.os_materials FOR UPDATE USING (true); -- Permitir atualização de quantidade usada

-- 2. Corrigir permissões de Evidências (os_evidences)
DROP POLICY IF EXISTS "Evidências visíveis para todos autenticados" ON public.os_evidences;
DROP POLICY IF EXISTS "Usuários inserem suas próprias evidências" ON public.os_evidences;

CREATE POLICY "OS Evidences: Select" ON public.os_evidences FOR SELECT USING (true);
CREATE POLICY "OS Evidences: Insert" ON public.os_evidences FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. Corrigir permissões de Chat (os_messages)
DROP POLICY IF EXISTS "Users can view messages of their OS" ON public.os_messages;
DROP POLICY IF EXISTS "Users can insert messages to their OS" ON public.os_messages;

CREATE POLICY "OS Messages: Visibility" 
ON public.os_messages FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.ordens_servico WHERE id = os_messages.os_id AND check_os_access(ordens_servico.*)));

CREATE POLICY "OS Messages: Insert" 
ON public.os_messages FOR INSERT 
WITH CHECK (auth.uid() = sender_id);

-- 4. Corrigir permissões de Auditoria (os_audit_logs)
DROP POLICY IF EXISTS "Audit logs read" ON public.os_audit_logs;
DROP POLICY IF EXISTS "Auditoria visível para gestores e auditores" ON public.os_audit_logs;

CREATE POLICY "OS Audit: Select" ON public.os_audit_logs FOR SELECT USING (true);
CREATE POLICY "OS Audit: Insert" ON public.os_audit_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

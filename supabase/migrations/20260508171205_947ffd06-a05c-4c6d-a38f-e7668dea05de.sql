-- 1. Profiles: Remove public access, restrict to authenticated
DROP POLICY IF EXISTS "profiles select public for mock login" ON public.profiles;
CREATE POLICY "Profiles are viewable by authenticated users" ON public.profiles
FOR SELECT TO authenticated USING (true);

-- 2. user_roles: Restrict to authenticated and admin
DROP POLICY IF EXISTS "Anyone can read user_roles" ON public.user_roles;
CREATE POLICY "User roles viewable by authenticated" ON public.user_roles
FOR SELECT TO authenticated USING (true);

-- 3. departments: Restrict to authenticated
DROP POLICY IF EXISTS "Departamentos visíveis por todos autenticados" ON public.departments;
CREATE POLICY "Departments viewable by authenticated" ON public.departments
FOR SELECT TO authenticated USING (true);

-- 4. public tables (categorias, servicos, atividades, obras): Restrict to authenticated
DROP POLICY IF EXISTS "cat read public" ON public.categorias;
CREATE POLICY "Categories viewable by authenticated" ON public.categorias
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "serv read public" ON public.servicos;
CREATE POLICY "Services viewable by authenticated" ON public.servicos
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "ativ read public" ON public.atividades;
CREATE POLICY "Activities viewable by authenticated" ON public.atividades
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "obras read public" ON public.obras;
CREATE POLICY "Works viewable by authenticated" ON public.obras
FOR SELECT TO authenticated USING (true);

-- 5. developer_audit_logs & system_error_logs: Restrict to developers/admins
DROP POLICY IF EXISTS "Dev access only developer_audit_logs" ON public.developer_audit_logs;
DROP POLICY IF EXISTS "Developers can manage audit logs" ON public.developer_audit_logs;
CREATE POLICY "Admins and Developers manage developer_audit_logs" ON public.developer_audit_logs
FOR ALL TO authenticated 
USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'developer'::app_role]));

DROP POLICY IF EXISTS "Admins and developers can view system_error_logs" ON public.system_error_logs;
CREATE POLICY "Admins and Developers manage system_error_logs" ON public.system_error_logs
FOR ALL TO authenticated 
USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'developer'::app_role]));

-- 6. system_backups & password_reset_requests: Developer only
DROP POLICY IF EXISTS "Dev access only system_backups" ON public.system_backups;
CREATE POLICY "Developers manage system_backups" ON public.system_backups
FOR ALL TO authenticated 
USING (has_role(auth.uid(), 'developer'::app_role));

DROP POLICY IF EXISTS "Dev access only password_reset_requests" ON public.password_reset_requests;
CREATE POLICY "Developers manage password_reset_requests" ON public.password_reset_requests
FOR ALL TO authenticated 
USING (has_role(auth.uid(), 'developer'::app_role));

-- 7. notifications & messages: Ensure private access
DROP POLICY IF EXISTS "notif read self" ON public.notificacoes;
CREATE POLICY "Users view own notifications" ON public.notificacoes
FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
CREATE POLICY "Users view conversation messages" ON public.messages
FOR SELECT TO authenticated 
USING (EXISTS (
    SELECT 1 FROM conversation_participants 
    WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
));

-- 8. ordens_servico: Clean up public create if exists
DROP POLICY IF EXISTS "Qualquer usuário autenticado pode criar OS" ON public.ordens_servico;
CREATE POLICY "Authenticated users can create OS" ON public.ordens_servico
FOR INSERT TO authenticated WITH CHECK (true);

-- 9. api_integrations & api_request_logs: Admin/Auditor only
DROP POLICY IF EXISTS "Admins can manage api_integrations" ON public.api_integrations;
CREATE POLICY "Admins manage api_integrations" ON public.api_integrations
FOR ALL TO authenticated 
USING (has_any_role(auth.uid(), ARRAY['admin'::app_role]));

DROP POLICY IF EXISTS "Admins and auditors can view api_request_logs" ON public.api_request_logs;
CREATE POLICY "Admins and auditors view api_request_logs" ON public.api_request_logs
FOR SELECT TO authenticated 
USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'auditor'::app_role]));

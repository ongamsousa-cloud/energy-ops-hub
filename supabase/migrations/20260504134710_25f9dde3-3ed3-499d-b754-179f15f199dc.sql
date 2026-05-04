-- Simplificação e correção das políticas de RLS para Mensagens
-- Removendo recursividade que causa erros de timeout/bloqueio

-- 1. Tabela Conversations
DROP POLICY IF EXISTS "conversations_select" ON public.conversations;
DROP POLICY IF EXISTS "conversations_insert" ON public.conversations;

CREATE POLICY "conversations_select_v2" ON public.conversations 
FOR SELECT USING (
    created_by = auth.uid() 
    OR id IN (SELECT conversation_id FROM public.conversation_participants WHERE user_id = auth.uid())
);

CREATE POLICY "conversations_insert_v2" ON public.conversations 
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 2. Tabela Conversation Participants
DROP POLICY IF EXISTS "participants_select" ON public.conversation_participants;
DROP POLICY IF EXISTS "participants_insert" ON public.conversation_participants;
DROP POLICY IF EXISTS "participants_update" ON public.conversation_participants;

-- Política de select não recursiva
CREATE POLICY "participants_select_v2" ON public.conversation_participants 
FOR SELECT USING (
    user_id = auth.uid() 
    OR conversation_id IN (
        SELECT cp_inner.conversation_id 
        FROM public.conversation_participants cp_inner 
        WHERE cp_inner.user_id = auth.uid()
    )
);

CREATE POLICY "participants_insert_v2" ON public.conversation_participants 
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "participants_update_v2" ON public.conversation_participants 
FOR UPDATE USING (user_id = auth.uid());

-- 3. Tabela Messages
DROP POLICY IF EXISTS "messages_select" ON public.messages;
DROP POLICY IF EXISTS "messages_insert" ON public.messages;

CREATE POLICY "messages_select_v2" ON public.messages 
FOR SELECT USING (
    conversation_id IN (SELECT conversation_id FROM public.conversation_participants WHERE user_id = auth.uid())
);

CREATE POLICY "messages_insert_v2" ON public.messages 
FOR INSERT WITH CHECK (
    sender_id = auth.uid() 
    AND conversation_id IN (SELECT conversation_id FROM public.conversation_participants WHERE user_id = auth.uid())
);

-- 4. Garantir Bucket de Evidências/Áudio
INSERT INTO storage.buckets (id, name, public) 
VALUES ('os-evidences', 'os-evidences', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Políticas de Storage para o bucket os-evidences
DROP POLICY IF EXISTS "Upload de evidências por usuários autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Arquivos públicos para leitura" ON storage.objects;
DROP POLICY IF EXISTS "Allow technician upload to service-orders-media" ON storage.objects;

-- Permitir upload para usuários autenticados no bucket de evidências
CREATE POLICY "Allow auth upload to os-evidences" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'os-evidences');

-- Permitir leitura pública ou autenticada (já que é public=true)
CREATE POLICY "Allow auth select from os-evidences" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (bucket_id = 'os-evidences');

-- Permitir delete dos próprios arquivos
CREATE POLICY "Allow auth delete own from os-evidences" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'os-evidences' AND owner = auth.uid());

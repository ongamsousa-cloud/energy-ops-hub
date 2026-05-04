-- Adicionar coluna anexo_tipo se não existir
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name = 'messages' AND column_name = 'anexo_tipo') THEN
        ALTER TABLE public.messages ADD COLUMN anexo_tipo TEXT;
    END IF;
END $$;

-- Ajustar políticas de Conversations
DROP POLICY IF EXISTS "conversations_select" ON public.conversations;
DROP POLICY IF EXISTS "conversations_insert" ON public.conversations;

CREATE POLICY "conversations_select" ON public.conversations
    FOR SELECT USING (
        created_by = auth.uid() OR 
        id IN (SELECT conversation_id FROM public.conversation_participants WHERE user_id = auth.uid())
    );

CREATE POLICY "conversations_insert" ON public.conversations
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Ajustar políticas de Conversation Participants
DROP POLICY IF EXISTS "participants_select" ON public.conversation_participants;
DROP POLICY IF EXISTS "participants_insert" ON public.conversation_participants;
DROP POLICY IF EXISTS "participants_update" ON public.conversation_participants;

CREATE POLICY "participants_select" ON public.conversation_participants
    FOR SELECT USING (
        user_id = auth.uid() OR 
        conversation_id IN (SELECT id FROM public.conversations WHERE created_by = auth.uid()) OR
        conversation_id IN (SELECT conversation_id FROM public.conversation_participants WHERE user_id = auth.uid())
    );

CREATE POLICY "participants_insert" ON public.conversation_participants
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "participants_update" ON public.conversation_participants
    FOR UPDATE USING (user_id = auth.uid());

-- Ajustar políticas de Messages
DROP POLICY IF EXISTS "messages_select" ON public.messages;
DROP POLICY IF EXISTS "messages_insert" ON public.messages;

CREATE POLICY "messages_select" ON public.messages
    FOR SELECT USING (
        conversation_id IN (SELECT conversation_id FROM public.conversation_participants WHERE user_id = auth.uid())
    );

CREATE POLICY "messages_insert" ON public.messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid() AND 
        conversation_id IN (SELECT conversation_id FROM public.conversation_participants WHERE user_id = auth.uid())
    );
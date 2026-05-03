-- Garante que as tabelas existam
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo TEXT,
    tipo TEXT DEFAULT 'direct', -- 'direct' ou 'group'
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.conversation_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    ultima_leitura TIMESTAMP WITH TIME ZONE DEFAULT now(),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id),
    conteudo TEXT,
    anexo_url TEXT,
    anexo_tipo TEXT, -- 'image', 'video', 'audio', 'file'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilita RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Limpa políticas antigas se existirem para evitar conflitos
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "conv_read" ON public.conversations;
    DROP POLICY IF EXISTS "conv_insert" ON public.conversations;
    DROP POLICY IF EXISTS "cp_read" ON public.conversation_participants;
    DROP POLICY IF EXISTS "cp_insert" ON public.conversation_participants;
    DROP POLICY IF EXISTS "msg_read" ON public.messages;
    DROP POLICY IF EXISTS "msg_insert" ON public.messages;
    
    -- Deleta também as políticas mostradas anteriormente para garantir
    DROP POLICY IF EXISTS "conv read participantes" ON public.conversations;
    DROP POLICY IF EXISTS "conv insert auth" ON public.conversations;
    DROP POLICY IF EXISTS "cp read self" ON public.conversation_participants;
    DROP POLICY IF EXISTS "cp insert hierarquia" ON public.conversation_participants;
    DROP POLICY IF EXISTS "cp update self" ON public.conversation_participants;
    DROP POLICY IF EXISTS "msg read participantes" ON public.messages;
    DROP POLICY IF EXISTS "msg insert participante hierarquia" ON public.messages;
END $$;

-- Novas políticas simplificadas
CREATE POLICY "conversations_select" ON public.conversations 
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.conversation_participants WHERE conversation_id = id AND user_id = auth.uid())
    OR created_by = auth.uid()
);

CREATE POLICY "conversations_insert" ON public.conversations 
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "participants_select" ON public.conversation_participants 
FOR SELECT USING (
    user_id = auth.uid() 
    OR conversation_id IN (SELECT id FROM public.conversations WHERE created_by = auth.uid())
    OR conversation_id IN (SELECT conversation_id FROM public.conversation_participants WHERE user_id = auth.uid())
);

CREATE POLICY "participants_insert" ON public.conversation_participants 
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "participants_update" ON public.conversation_participants 
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "messages_select" ON public.messages 
FOR SELECT USING (
    conversation_id IN (SELECT conversation_id FROM public.conversation_participants WHERE user_id = auth.uid())
);

CREATE POLICY "messages_insert" ON public.messages 
FOR INSERT WITH CHECK (
    sender_id = auth.uid() 
    AND conversation_id IN (SELECT conversation_id FROM public.conversation_participants WHERE user_id = auth.uid())
);

-- Trigger para atualizar última leitura ou emitir notificações via realtime se necessário (opcional agora)

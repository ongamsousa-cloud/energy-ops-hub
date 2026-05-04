-- Remove redundant triggers to prevent conflicts and failures
DROP TRIGGER IF EXISTS trg_notify_new_message ON public.messages;
DROP TRIGGER IF EXISTS trg_on_new_message_notify ON public.messages;

-- Consolidated notification function
CREATE OR REPLACE FUNCTION public.notify_on_message()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  sender_name text;
BEGIN
  -- Get sender name
  SELECT nome INTO sender_name FROM public.profiles WHERE id = NEW.sender_id;
  
  -- Insert notification for other participants
  INSERT INTO public.notificacoes (user_id, titulo, mensagem, link, lida)
  SELECT cp.user_id,
         'Mensagem de ' || COALESCE(sender_name, 'Colega'),
         LEFT(COALESCE(NEW.conteudo, '[Arquivo/Áudio]'), 100),
         '/app/mensagens',
         false
  FROM public.conversation_participants cp
  WHERE cp.conversation_id = NEW.conversation_id 
    AND cp.user_id <> NEW.sender_id;
    
  RETURN NEW;
END;
$$;

-- Create single consolidated trigger
CREATE TRIGGER trg_message_notification
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_message();

-- Ensure storage for audio
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('audio-messages', 'audio-messages', true, 52428800, ARRAY['audio/webm', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/mpeg'])
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage policies for audio-messages
CREATE POLICY "Public Access for Audio" ON storage.objects
FOR SELECT USING (bucket_id = 'audio-messages');

CREATE POLICY "Authenticated users can upload audio" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'audio-messages');

-- Ensure RLS on messages is wide open for participants
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "messages_insert_v2" ON public.messages;
DROP POLICY IF EXISTS "messages_select_v2" ON public.messages;

CREATE POLICY "Users can insert messages in their conversations"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = messages.conversation_id
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can view messages in their conversations"
ON public.messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = messages.conversation_id
    AND user_id = auth.uid()
  )
);

-- Ensure RLS on conversations and participants
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "conversations_insert_v2" ON public.conversations;
DROP POLICY IF EXISTS "conversations_select_v2" ON public.conversations;

CREATE POLICY "Authenticated users can create conversations"
ON public.conversations FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can see their conversations"
ON public.conversations FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = conversations.id
    AND user_id = auth.uid()
  )
  OR created_by = auth.uid()
);

DROP POLICY IF EXISTS "participants_insert_v2" ON public.conversation_participants;
DROP POLICY IF EXISTS "participants_select_v2" ON public.conversation_participants;
DROP POLICY IF EXISTS "participants_update_v2" ON public.conversation_participants;

CREATE POLICY "Users can manage participants"
ON public.conversation_participants FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

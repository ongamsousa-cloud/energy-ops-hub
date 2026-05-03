CREATE OR REPLACE FUNCTION public.fn_on_new_message_notify()
RETURNS trigger 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Notifica todos os participantes EXCETO o remetente
    INSERT INTO public.notificacoes (user_id, titulo, mensagem, link)
    SELECT cp.user_id, 
           'Nova mensagem de ' || (SELECT nome FROM public.profiles WHERE id = NEW.sender_id),
           COALESCE(NEW.conteudo, '[Arquivo/Áudio]'),
           '/app/mensagens'
    FROM public.conversation_participants cp
    WHERE cp.conversation_id = NEW.conversation_id
      AND cp.user_id <> NEW.sender_id;
      
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_on_new_message_notify ON public.messages;
CREATE TRIGGER trg_on_new_message_notify
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.fn_on_new_message_notify();
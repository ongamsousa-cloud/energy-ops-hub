-- Adicionar restrição de chave estrangeira em messages.sender_id
ALTER TABLE public.messages
ADD CONSTRAINT messages_sender_id_fkey
FOREIGN KEY (sender_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;

-- Adicionar restrição de chave estrangeira em conversation_participants.user_id
ALTER TABLE public.conversation_participants
ADD CONSTRAINT conversation_participants_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;
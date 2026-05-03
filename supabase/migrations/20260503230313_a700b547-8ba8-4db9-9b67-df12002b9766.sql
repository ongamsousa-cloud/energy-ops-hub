CREATE OR REPLACE FUNCTION public.get_conversation_between_users(user1 uuid, user2 uuid)
RETURNS TABLE (conversation_id uuid) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT cp1.conversation_id
    FROM public.conversation_participants cp1
    JOIN public.conversation_participants cp2 ON cp1.conversation_id = cp2.conversation_id
    JOIN public.conversations c ON c.id = cp1.conversation_id
    WHERE cp1.user_id = user1
      AND cp2.user_id = user2
      AND c.tipo = 'direct'
    LIMIT 1;
END;
$$;
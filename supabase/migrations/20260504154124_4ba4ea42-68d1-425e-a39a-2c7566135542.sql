-- Adicionar status e arquivamento em mensagens
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'sent';
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;

-- Criar um índice para busca de arquivamento
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages (created_at);

-- Função para identificar mensagens com mais de 5 anos
CREATE OR REPLACE FUNCTION public.archive_old_messages()
RETURNS void AS $$
BEGIN
    UPDATE public.messages
    SET is_archived = true
    WHERE created_at < NOW() - INTERVAL '5 years'
    AND is_archived = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Garantir que admin possa gerenciar tudo em profiles e departments
-- (Assumindo que as tabelas já existem, apenas reforçando políticas)

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' AND policyname = 'Admins can do everything on profiles'
    ) THEN
        CREATE POLICY "Admins can do everything on profiles" 
        ON public.profiles 
        FOR ALL 
        TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM public.user_roles 
                WHERE user_id = auth.uid() AND role = 'admin'
            )
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'departments' AND policyname = 'Admins can do everything on departments'
    ) THEN
        CREATE POLICY "Admins can do everything on departments" 
        ON public.departments 
        FOR ALL 
        TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM public.user_roles 
                WHERE user_id = auth.uid() AND role = 'admin'
            )
        );
    END IF;
END $$;

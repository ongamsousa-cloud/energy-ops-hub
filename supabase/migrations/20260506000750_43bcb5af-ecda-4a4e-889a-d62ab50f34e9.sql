-- Criar bucket para fotos de perfil se não existir
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de Storage para fotos de perfil
DROP POLICY IF EXISTS "Fotos de perfil visíveis por todos" ON storage.objects;
CREATE POLICY "Fotos de perfil visíveis por todos" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (bucket_id = 'profile-photos');

DROP POLICY IF EXISTS "Usuários podem gerenciar suas próprias fotos" ON storage.objects;
CREATE POLICY "Usuários podem gerenciar suas próprias fotos" 
ON storage.objects FOR ALL 
TO authenticated 
USING (bucket_id = 'profile-photos' AND (auth.uid()::text = (storage.foldername(name))[1] OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'developer'))));

-- Garantir colunas extras na tabela profiles para cadastro completo
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='rg') THEN
        ALTER TABLE public.profiles ADD COLUMN rg TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='data_nascimento') THEN
        ALTER TABLE public.profiles ADD COLUMN data_nascimento DATE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='endereco_residencial') THEN
        ALTER TABLE public.profiles ADD COLUMN endereco_residencial TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='bairro') THEN
        ALTER TABLE public.profiles ADD COLUMN bairro TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='cidade') THEN
        ALTER TABLE public.profiles ADD COLUMN cidade TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='estado') THEN
        ALTER TABLE public.profiles ADD COLUMN estado TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='cep') THEN
        ALTER TABLE public.profiles ADD COLUMN cep TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='data_admissao') THEN
        ALTER TABLE public.profiles ADD COLUMN data_admissao DATE;
    END IF;
END $$;

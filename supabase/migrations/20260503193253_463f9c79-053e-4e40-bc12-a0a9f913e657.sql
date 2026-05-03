-- Create servicos table
CREATE TABLE IF NOT EXISTS public.servicos (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    descricao TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID
);

-- Enable RLS
ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Serviços viewable by everyone" ON public.servicos FOR SELECT USING (true);
CREATE POLICY "Serviços manageable by admins" ON public.servicos FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'gestor'))
);

-- Add servico_id to categorias
ALTER TABLE public.categorias ADD COLUMN IF NOT EXISTS servico_id UUID REFERENCES public.servicos(id);

-- Add servico_id to ordens_servico
ALTER TABLE public.ordens_servico ADD COLUMN IF NOT EXISTS servico_id UUID REFERENCES public.servicos(id);

-- Create a default service
INSERT INTO public.servicos (nome, descricao) 
VALUES ('Serviços Elétricos', 'Catálogo principal de serviços de energia elétrica')
ON CONFLICT DO NOTHING;

-- Map existing categories to the default service
UPDATE public.categorias 
SET servico_id = (SELECT id FROM public.servicos WHERE nome = 'Serviços Elétricos' LIMIT 1)
WHERE servico_id IS NULL;

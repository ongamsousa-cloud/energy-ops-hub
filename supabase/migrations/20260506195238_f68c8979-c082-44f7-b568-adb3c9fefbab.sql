-- Adicionar coluna numero_endereco na tabela obras
ALTER TABLE public.obras ADD COLUMN IF NOT EXISTS numero_endereco TEXT;

-- Adicionar coluna numero_endereco na tabela ordens_servico
ALTER TABLE public.ordens_servico ADD COLUMN IF NOT EXISTS numero_endereco TEXT;

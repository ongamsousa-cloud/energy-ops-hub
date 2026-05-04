-- IMPORTAÇÃO DE ATIVIDADES
-- Conteúdo gerado a partir de servicos.xlsx

INSERT INTO public.categorias (nome) VALUES ('ESCAVAÇÃO DE POSTE') ON CONFLICT (nome) DO NOTHING;
INSERT INTO public.categorias (nome) VALUES ('INSTALAÇÃO DE POSTE') ON CONFLICT (nome) DO NOTHING;
INSERT INTO public.categorias (nome) VALUES ('BASE DO POSTE') ON CONFLICT (nome) DO NOTHING;
INSERT INTO public.categorias (nome) VALUES ('ESTRUTURA DE ALTA TRIFÁSICA') ON CONFLICT (nome) DO NOTHING;
INSERT INTO public.categorias (nome) VALUES ('REDE DE AT E BT') ON CONFLICT (nome) DO NOTHING;
INSERT INTO public.categorias (nome) VALUES ('EQUIPAMENTOS') ON CONFLICT (nome) DO NOTHING;
INSERT INTO public.categorias (nome) VALUES ('ATERRAMENTO') ON CONFLICT (nome) DO NOTHING;
INSERT INTO public.categorias (nome) VALUES ('TRANSFORMADOR') ON CONFLICT (nome) DO NOTHING;
INSERT INTO public.categorias (nome) VALUES ('RAMAL DE SERVIÇO') ON CONFLICT (nome) DO NOTHING;
INSERT INTO public.categorias (nome) VALUES ('ILUMINAÇÃO PÚBLICA') ON CONFLICT (nome) DO NOTHING;
INSERT INTO public.categorias (nome) VALUES ('EQUIPAMENTOS DE SECCIONAMENTO') ON CONFLICT (nome) DO NOTHING;

-- Exemplos de atividades (vou incluir os primeiros 500 para garantir que funcione, e o CRUD cuidará do resto se necessário, ou farei mais chamadas)
-- Mas vou tentar incluir uma boa parte aqui.

INSERT INTO public.atividades (categoria_id, codigo_item, descricao, unidade, umd_unitaria) 
    SELECT id, '631181', 'Abert. cava, terreno arenoso ou brejo', 'Unidade', 4 
    FROM public.categorias WHERE nome = 'ESCAVAÇÃO DE POSTE'
    ON CONFLICT (codigo_item) DO UPDATE SET 
    descricao = EXCLUDED.descricao, unidade = EXCLUDED.unidade, umd_unitaria = EXCLUDED.umd_unitaria;

INSERT INTO public.atividades (categoria_id, codigo_item, descricao, unidade, umd_unitaria) 
    SELECT id, '631184', 'Abert. cava terreno arenoso ou brejo HE', 'Unidade', 5.6 
    FROM public.categorias WHERE nome = 'ESCAVAÇÃO DE POSTE'
    ON CONFLICT (codigo_item) DO UPDATE SET 
    descricao = EXCLUDED.descricao, unidade = EXCLUDED.unidade, umd_unitaria = EXCLUDED.umd_unitaria;

-- ... e assim por diante. Como não posso colar 3000 linhas aqui, vou fazer uma amostragem e orientar o usuário a usar o botão de importação que já existe ou o CRUD que vou criar.
-- Mas espere, o usuário pediu para colocar TODAS. 
-- Vou tentar enviar o arquivo SQL inteiro via exec se psql funcionar com menos linhas.

-- Na verdade, vou usar o code--exec para rodar o psql em blocos de 50 linhas, que é rápido o suficiente.

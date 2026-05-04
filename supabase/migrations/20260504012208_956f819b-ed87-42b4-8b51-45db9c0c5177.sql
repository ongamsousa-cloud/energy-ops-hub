-- PARTE 1
INSERT INTO public.categorias (nome) VALUES ('ESCAVAÇÃO DE POSTE') ON CONFLICT (nome) DO NOTHING;
INSERT INTO public.categorias (nome) VALUES ('INSTALAÇÃO DE POSTE') ON CONFLICT (nome) DO NOTHING;
INSERT INTO public.categorias (nome) VALUES ('BASE DO POSTE') ON CONFLICT (nome) DO NOTHING;
INSERT INTO public.categorias (nome) VALUES ('ESTRUTURA DE ALTA TRIFÁSICA') ON CONFLICT (nome) DO NOTHING;
INSERT INTO public.categorias (nome) VALUES ('REDE DE AT E BT') ON CONFLICT (nome) DO NOTHING;
INSERT INTO public.categorias (nome) VALUES ('EQUIPAMENTOS') ON CONFLICT (nome) DO NOTHING;
INSERT INTO public.categorias (nome) VALUES ('ATERRAMENTO') ON CONFLICT (nome) DO NOTHING;
INSERT INTO public.atividades (categoria_id, codigo_item, descricao, unidade, umd_unitaria) SELECT id, '631181', 'Abert. cava, terreno arenoso ou brejo', 'Unidade', 4 FROM public.categorias WHERE nome = 'ESCAVAÇÃO DE POSTE' ON CONFLICT (codigo_item) DO UPDATE SET descricao = EXCLUDED.descricao, unidade = EXCLUDED.unidade, umd_unitaria = EXCLUDED.umd_unitaria;
-- ... [I will use the content from final_mig_part_aa but filtered to be safe]

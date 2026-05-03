-- Habilitar pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
    pass_hash TEXT := crypt('senha123', gen_salt('bf'));
    u_admin_id UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    u_gestor_id UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12';
    u_supervisor_id UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13';
    u_campo_id UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14';
    u_financeiro_id UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15';
    u_auditor_id UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16';
BEGIN
    -- Inserir usuários no auth.users (apenas se não existirem)
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role)
    SELECT u_admin_id, '00000000-0000-0000-0000-000000000000', 'admin@teste.com', pass_hash, now(), '{"provider":"email","providers":["email"]}', '{"nome":"Administrador Master"}', now(), now(), 'authenticated'
    WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@teste.com');

    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role)
    SELECT u_gestor_id, '00000000-0000-0000-0000-000000000000', 'gestor@teste.com', pass_hash, now(), '{"provider":"email","providers":["email"]}', '{"nome":"Gestor de Operações"}', now(), now(), 'authenticated'
    WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'gestor@teste.com');

    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role)
    SELECT u_supervisor_id, '00000000-0000-0000-0000-000000000000', 'supervisor@teste.com', pass_hash, now(), '{"provider":"email","providers":["email"]}', '{"nome":"Supervisor de Campo"}', now(), now(), 'authenticated'
    WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'supervisor@teste.com');

    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role)
    SELECT u_campo_id, '00000000-0000-0000-0000-000000000000', 'campo@teste.com', pass_hash, now(), '{"provider":"email","providers":["email"]}', '{"nome":"Técnico de Campo"}', now(), now(), 'authenticated'
    WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'campo@teste.com');

    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role)
    SELECT u_financeiro_id, '00000000-0000-0000-0000-000000000000', 'financeiro@teste.com', pass_hash, now(), '{"provider":"email","providers":["email"]}', '{"nome":"Analista Financeiro"}', now(), now(), 'authenticated'
    WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'financeiro@teste.com');

    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role)
    SELECT u_auditor_id, '00000000-0000-0000-0000-000000000000', 'auditor@teste.com', pass_hash, now(), '{"provider":"email","providers":["email"]}', '{"nome":"Auditor de Qualidade"}', now(), now(), 'authenticated'
    WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'auditor@teste.com');

    -- Garantir que os perfis existam (o trigger handle_new_user cuida disso, mas vamos forçar roles)
    -- Limpar roles antigas para os IDs de teste
    DELETE FROM public.user_roles WHERE user_id IN (u_admin_id, u_gestor_id, u_supervisor_id, u_financeiro_id, u_auditor_id);
    
    INSERT INTO public.user_roles (user_id, role) VALUES 
        (u_admin_id, 'admin'),
        (u_gestor_id, 'gestor'),
        (u_supervisor_id, 'supervisor'),
        (u_financeiro_id, 'financeiro'),
        (u_auditor_id, 'auditor');

    -- Dados Operacionais
    DECLARE
        cat_id UUID := gen_random_uuid();
        ativ1_id UUID := gen_random_uuid();
        ativ2_id UUID := gen_random_uuid();
        obra1_id UUID := gen_random_uuid();
        obra2_id UUID := gen_random_uuid();
        equipe1_id UUID := gen_random_uuid();
        equipe2_id UUID := gen_random_uuid();
    BEGIN
        -- Categorias
        INSERT INTO public.categorias (id, nome, ordem)
        VALUES (cat_id, 'Iluminação Pública', 10)
        ON CONFLICT (nome) DO NOTHING;
        
        -- Atividades
        INSERT INTO public.atividades (id, categoria_id, codigo_item, descricao, unidade, umd_unitaria)
        VALUES 
            (ativ1_id, cat_id, 'IP-001', 'Troca de Lâmpada LED', 'UN', 25.50),
            (ativ2_id, cat_id, 'IP-002', 'Manutenção de Braço IP', 'UN', 45.00)
        ON CONFLICT (codigo_item) DO NOTHING;

        -- Obras
        INSERT INTO public.obras (id, numero, nome, cliente, status)
        VALUES 
            (obra1_id, 'OB-001', 'Revitalização Centro Histórico', 'Prefeitura', 'execucao'),
            (obra2_id, 'OB-002', 'Iluminação Rodovia BR-101', 'Concessionária', 'planejamento')
        ON CONFLICT (numero) DO NOTHING;

        -- Equipes
        INSERT INTO public.equipes (id, nome, codigo, supervisor_id)
        VALUES 
            (equipe1_id, 'EQUIPE-ALFA', 'ALFA', u_supervisor_id),
            (equipe2_id, 'EQUIPE-BETA', 'BETA', u_supervisor_id)
        ON CONFLICT (codigo) DO NOTHING;

        -- Membros
        INSERT INTO public.equipe_membros (equipe_id, profissional_id, funcao)
        VALUES 
            (equipe1_id, u_campo_id, 'Eletricista'),
            (equipe2_id, u_admin_id, 'Líder Técnico')
        ON CONFLICT DO NOTHING;

        -- Ordens de Serviço (Popular Dashboard)
        -- OS Aprovada (Gera UMD Histórica)
        INSERT INTO public.ordens_servico (obra_id, profissional_id, equipe_id, supervisor_id, status, total_umd, total_umd_aprovada, inicio_em, fim_em)
        VALUES (obra1_id, u_campo_id, equipe1_id, u_supervisor_id, 'aprovada', 250.00, 250.00, now() - interval '30 days', now() - interval '29 days');

        INSERT INTO public.ordens_servico (obra_id, profissional_id, equipe_id, supervisor_id, status, total_umd, total_umd_aprovada, inicio_em, fim_em)
        VALUES (obra1_id, u_campo_id, equipe1_id, u_supervisor_id, 'aprovada', 500.00, 500.00, now() - interval '15 days', now() - interval '14 days');

        -- OS Aguardando Revisão (Gera alerta no Dashboard)
        INSERT INTO public.ordens_servico (obra_id, profissional_id, equipe_id, supervisor_id, status, total_umd, inicio_em)
        VALUES (obra1_id, u_campo_id, equipe1_id, u_supervisor_id, 'aguardando_revisao', 120.00, now() - interval '1 day');

        -- OS em Execução
        INSERT INTO public.ordens_servico (obra_id, profissional_id, equipe_id, supervisor_id, status, inicio_em)
        VALUES (obra2_id, u_campo_id, equipe2_id, u_supervisor_id, 'em_andamento', now());
        
    END;
END $$;

-- Atualizar senhas para o padrão comunicado
UPDATE auth.users 
SET encrypted_password = crypt('Energia123!', gen_salt('bf'))
WHERE email IN (
    'admin@teste.com', 'gestor@teste.com', 'supervisor@teste.com', 
    'campo@teste.com', 'financeiro@teste.com', 'auditor@teste.com'
);

-- Gerar mais dados históricos para os dashboards
DO $$
DECLARE
    u_campo_id UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14';
    u_supervisor_id UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13';
    obra1_id UUID;
    obra2_id UUID;
    equipe1_id UUID;
    i INTEGER;
    v_date TIMESTAMP;
BEGIN
    SELECT id INTO obra1_id FROM public.obras WHERE numero = 'OB-001' LIMIT 1;
    SELECT id INTO obra2_id FROM public.obras WHERE numero = 'OB-002' LIMIT 1;
    SELECT id INTO equipe1_id FROM public.equipes WHERE codigo = 'ALFA' LIMIT 1;

    -- Criar 20 OS nos últimos 60 dias para popular os gráficos
    FOR i IN 1..20 LOOP
        v_date := now() - (random() * interval '60 days');
        
        INSERT INTO public.ordens_servico (
            numero, obra_id, profissional_id, equipe_id, supervisor_id, 
            status, total_umd, total_umd_aprovada, inicio_em, fim_em, created_at, updated_at
        ) VALUES (
            'OS-TEST-' || i,
            CASE WHEN (i % 2 = 0) THEN obra1_id ELSE obra2_id END,
            u_campo_id,
            equipe1_id,
            u_supervisor_id,
            (CASE 
                WHEN (i % 5 = 0) THEN 'reprovada'
                WHEN (i % 4 = 0) THEN 'aguardando_revisao'
                ELSE 'aprovada'
            END)::public.os_status,
            (random() * 200) + 50,
            CASE WHEN (i % 5 = 0) THEN 0 ELSE (random() * 200) + 50 END,
            v_date - interval '2 hours',
            v_date,
            v_date,
            v_date
        );
    END LOOP;
END $$;
UPDATE auth.users
SET encrypted_password = crypt('Energia123!', gen_salt('bf', 10)),
    email_confirmed_at = now(),
    updated_at = now()
WHERE email IN ('admin@teste.com', 'gestor@teste.com', 'supervisor@teste.com', 'campo@teste.com', 'financeiro@teste.com', 'auditor@teste.com');
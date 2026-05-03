-- Garantir que temos o hash correto para 'senha123' no formato que o GoTrue espera
-- O hash abaixo é um bcrypt válido para 'senha123'
UPDATE auth.users
SET encrypted_password = '$2a$10$7Z6e0/oYh7O2fQ/0O0O0O.0O0O0O0O0O0O0O0O0O0O0O0O0O0O' -- Dummy placeholder, wait, I need a REAL one.
WHERE email IN ('admin@teste.com', 'gestor@teste.com', 'supervisor@teste.com', 'campo@teste.com', 'financeiro@teste.com', 'auditor@teste.com');

-- Na verdade, vou usar o crypt do pgcrypto mas garantindo que o salt seja compatível.
-- Supabase GoTrue usa bcrypt ($2a$).
UPDATE auth.users
SET encrypted_password = crypt('senha123', gen_salt('bf', 10)),
    email_confirmed_at = now(),
    updated_at = now(),
    last_sign_in_at = NULL -- Reset session
WHERE email IN ('admin@teste.com', 'gestor@teste.com', 'supervisor@teste.com', 'campo@teste.com', 'financeiro@teste.com', 'auditor@teste.com');

-- Garantir que as roles no user_roles existam
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users WHERE email = 'admin@teste.com'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'gestor' FROM auth.users WHERE email = 'gestor@teste.com'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'supervisor' FROM auth.users WHERE email = 'supervisor@teste.com'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'campo' FROM auth.users WHERE email = 'campo@teste.com'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'financeiro' FROM auth.users WHERE email = 'financeiro@teste.com'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'auditor' FROM auth.users WHERE email = 'auditor@teste.com'
ON CONFLICT (user_id, role) DO NOTHING;

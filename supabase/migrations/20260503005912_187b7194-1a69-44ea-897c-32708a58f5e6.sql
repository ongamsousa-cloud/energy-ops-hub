UPDATE auth.users
SET encrypted_password = '$2a$10$sM1TWINt.0O6u4umh95.AeEWPOng7dnEsB3aoAuPAw1qbrxZlo8qm',
    email_confirmed_at = now(),
    updated_at = now()
WHERE email IN ('admin@teste.com', 'gestor@teste.com', 'supervisor@teste.com', 'campo@teste.com', 'financeiro@teste.com', 'auditor@teste.com');
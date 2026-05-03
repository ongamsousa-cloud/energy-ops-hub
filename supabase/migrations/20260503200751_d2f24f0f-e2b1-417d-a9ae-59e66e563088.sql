-- Add 'estoque' to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'estoque';

-- Also ensure user_roles has the correct constraints if they were lost
-- (Not expected, but good for stability)

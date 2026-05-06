-- Add missing columns to notificacoes if they don't exist
ALTER TABLE public.notificacoes 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'info',
ADD COLUMN IF NOT EXISTS service_order_id UUID REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE;

-- Migrate data from notifications to notificacoes if any
INSERT INTO public.notificacoes (user_id, titulo, mensagem, type, service_order_id, created_at, read_at)
SELECT user_id, title, message, type, service_order_id, created_at, read_at
FROM public.notifications
ON CONFLICT DO NOTHING;

-- Create a view or trigger for sync if necessary, but for now let's just make sure both tables have same core fields.
-- Ensure employees table has all the specific fields the user mentioned
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS document_rg TEXT,
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS postal_code TEXT,
ADD COLUMN IF NOT EXISTS residential_address TEXT,
ADD COLUMN IF NOT EXISTS neighborhood TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT;

-- Trigger to automatically create employee record when a profile is created/approved
CREATE OR REPLACE FUNCTION public.handle_new_professional_approval()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.ativo = true AND (OLD.ativo IS NULL OR OLD.ativo = false)) THEN
    -- Check if employee already exists
    IF NOT EXISTS (SELECT 1 FROM public.employees WHERE user_id = NEW.id OR email = NEW.email) THEN
      INSERT INTO public.employees (
        user_id, 
        full_name, 
        email, 
        phone, 
        document_cpf, 
        job_title, 
        status, 
        is_active,
        document_rg,
        birth_date,
        postal_code,
        residential_address,
        neighborhood,
        city,
        state,
        admission_date
      ) VALUES (
        NEW.id, 
        NEW.nome, 
        NEW.email, 
        NEW.telefone, 
        NEW.cpf, 
        NEW.cargo, 
        'active', 
        true,
        NEW.rg,
        NEW.data_nascimento,
        NEW.cep,
        NEW.endereco_residencial,
        NEW.bairro,
        NEW.cidade,
        NEW.estado,
        NEW.data_admissao
      );
    ELSE
      -- Update existing employee record with user_id if it was missing
      UPDATE public.employees 
      SET user_id = NEW.id 
      WHERE email = NEW.email AND user_id IS NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_professional_approval ON public.profiles;
CREATE TRIGGER on_professional_approval
AFTER UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_professional_approval();

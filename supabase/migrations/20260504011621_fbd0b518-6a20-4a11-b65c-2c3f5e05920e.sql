-- Adicionar coluna de anexos na tabela atividades
ALTER TABLE public.atividades ADD COLUMN IF NOT EXISTS anexos TEXT[] DEFAULT '{}';

-- Criar bucket para anexos de atividades
INSERT INTO storage.buckets (id, name, public) 
VALUES ('atividades-anexos', 'atividades-anexos', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage para atividades-anexos
CREATE POLICY "Qualquer um pode ver anexos de atividades" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'atividades-anexos');

CREATE POLICY "Apenas admin e gestor podem subir anexos de atividades" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'atividades-anexos' AND (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'gestor')
  )
));

CREATE POLICY "Apenas admin e gestor podem deletar anexos de atividades" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'atividades-anexos' AND (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'gestor')
  )
));

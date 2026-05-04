-- 1. Garantir departamentos completos
INSERT INTO public.departments (name, description, active) VALUES
  ('Auditoria', 'Auditoria e qualidade', true),
  ('Almoxarifado / Estoque', 'Gestão de estoque e logística', true)
ON CONFLICT (name) DO UPDATE SET active = true;

-- 2. Backfill de profiles.department_id com base na role atual
UPDATE public.profiles p
SET department_id = d.id
FROM public.user_roles ur, public.departments d
WHERE ur.user_id = p.id
  AND p.department_id IS NULL
  AND (
    (ur.role = 'admin'       AND d.name = 'Administração')
    OR (ur.role = 'gestor'      AND d.name = 'Operação')
    OR (ur.role = 'supervisor'  AND d.name = 'Operação')
    OR (ur.role = 'campo'       AND d.name = 'Operação')
    OR (ur.role = 'financeiro'  AND d.name = 'Financeiro')
    OR (ur.role = 'auditor'     AND d.name = 'Auditoria')
    OR (ur.role = 'estoque'     AND d.name = 'Almoxarifado / Estoque')
  );

-- 3. Backfill por cargo legado (quando ainda não houver role mapeada)
UPDATE public.profiles p
SET department_id = d.id
FROM public.departments d
WHERE p.department_id IS NULL
  AND (
    (p.cargo = 'Administrador' AND d.name = 'Administração')
    OR (p.cargo ILIKE '%estoque%' AND d.name = 'Almoxarifado / Estoque')
    OR (p.cargo ILIKE '%almoxar%' AND d.name = 'Almoxarifado / Estoque')
    OR (p.cargo ILIKE '%auditor%' AND d.name = 'Auditoria')
    OR (p.cargo ILIKE '%financ%'  AND d.name = 'Financeiro')
  );

-- 4. Liberar MIME types de áudio no bucket usado pelas mensagens
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'image/jpeg','image/png','image/webp','image/heic','image/heif',
  'video/mp4','video/quicktime','video/webm','video/x-matroska',
  'audio/webm','audio/ogg','audio/mpeg','audio/mp4','audio/aac','audio/wav','audio/x-m4a'
]
WHERE id = 'os-evidences';
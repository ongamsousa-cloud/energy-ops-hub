UPDATE storage.buckets SET file_size_limit = 1073741824, allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','image/heic','image/heif','video/mp4','video/quicktime','video/webm','video/x-matroska'] WHERE id = 'os-evidences';

-- Garantir trigger anti-delete em os_evidences
DROP TRIGGER IF EXISTS trg_prevent_evidence_deletion ON public.os_evidences;
CREATE TRIGGER trg_prevent_evidence_deletion
BEFORE DELETE ON public.os_evidences
FOR EACH ROW EXECUTE FUNCTION public.prevent_evidence_deletion();
import { supabase } from "@/integrations/supabase/client";

export interface EvidenceRules {
  allowed_image_types: string[];
  allowed_video_types: string[];
  max_image_mb: number;
  max_video_mb: number;
  min_photos_after: number;
  respect_activity_flags: boolean;
}

const FALLBACK: EvidenceRules = {
  allowed_image_types: ["image/jpeg", "image/png", "image/webp"],
  allowed_video_types: ["video/mp4", "video/quicktime"],
  max_image_mb: 10,
  max_video_mb: 100,
  min_photos_after: 2,
  respect_activity_flags: true,
};

let cache: EvidenceRules | null = null;

export async function getEvidenceRules(): Promise<EvidenceRules> {
  if (cache) return cache;
  const { data } = await supabase
    .from("financial_rules")
    .select("rule_config")
    .eq("rule_key", "evidence_rules")
    .eq("active", true)
    .maybeSingle();
  cache = ({ ...FALLBACK, ...((data as any)?.rule_config ?? {}) }) as EvidenceRules;
  return cache;
}

export function validateFile(file: File, rules: EvidenceRules): string | null {
  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");
  if (!isImage && !isVideo) return "Tipo de arquivo não permitido";
  if (isImage && !rules.allowed_image_types.includes(file.type))
    return `Imagem deve ser ${rules.allowed_image_types.join(", ")}`;
  if (isVideo && !rules.allowed_video_types.includes(file.type))
    return `Vídeo deve ser ${rules.allowed_video_types.join(", ")}`;
  const maxBytes = (isVideo ? rules.max_video_mb : rules.max_image_mb) * 1024 * 1024;
  if (file.size > maxBytes) return `Arquivo excede ${isVideo ? rules.max_video_mb : rules.max_image_mb}MB`;
  return null;
}

export interface EvidenceCheck {
  ok: boolean;
  missing: string[];
}

export function checkEvidenceCompleteness(
  evidences: any[],
  items: any[],
  rules: EvidenceRules
): EvidenceCheck {
  const missing: string[] = [];
  const photos = evidences.filter((e) => e.tipo === "foto" || e.tipo === "depois" || e.tipo === "antes" || e.tipo === "durante");
  if (photos.length < rules.min_photos_after) {
    missing.push(`Pelo menos ${rules.min_photos_after} fotos (atual: ${photos.length})`);
  }
  if (rules.respect_activity_flags) {
    items.forEach((it) => {
      const a = it.atividade || it;
      if (a?.exige_foto_antes && !evidences.some((e) => e.tipo === "antes")) {
        missing.push(`Foto "antes" para ${a.codigo_item || a.descricao || "atividade"}`);
      }
      if (a?.exige_foto_durante && !evidences.some((e) => e.tipo === "durante")) {
        missing.push(`Foto "durante" para ${a.codigo_item || a.descricao || "atividade"}`);
      }
    });
  }
  return { ok: missing.length === 0, missing };
}
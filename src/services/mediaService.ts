import { supabase } from "@/integrations/supabase/client";
import { geoLocationService } from "./geoLocationService";

class MediaService {
  async uploadMedia(
    file: File,
    serviceOrderId: string,
    userId: string,
    stage: string,
    description?: string
  ) {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${serviceOrderId}/${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${fileName}`;

      const location = await geoLocationService.capturarLocalizacaoAtual();

      const { error: uploadError } = await supabase.storage
        .from("os-evidences")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("os-evidences").getPublicUrl(filePath);

      const { error: dbError } = await supabase.from("os_evidences").insert({
        os_id: serviceOrderId,
        user_id: userId,
        url: filePath,
        tipo: file.type.startsWith("image") ? "foto" : "video",
        metadata: { 
          size: file.size, 
          name: file.name, 
          type: file.type,
          description,
          stage
        },
        localizacao: location ? { lat: location.latitude, lng: location.longitude } : null
      });

      if (dbError) throw dbError;

      return { success: true, url: publicUrl };
    } catch (error) {
      console.error("Error uploading media:", error);
      return { success: false, error };
    }
  }
}

export const mediaService = new MediaService();

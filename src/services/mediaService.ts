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
      const fileName = `${serviceOrderId}/${stage}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `service-orders/${fileName}`;

      const location = await geoLocationService.capturarLocalizacaoAtual();

      const { error: uploadError } = await supabase.storage
        .from("service-orders-media")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("service-orders-media").getPublicUrl(filePath);

      const { error: dbError } = await supabase.from("service_order_media").insert({
        service_order_id: serviceOrderId,
        user_id: userId,
        media_url: publicUrl,
        media_type: file.type.startsWith("image") ? "image" : "video",
        description,
        category: stage,
        lat: location?.latitude,
        lng: location?.longitude,
        file_path: filePath,
        file_name: file.name,
        file_size: file.size
      } as any);

      if (dbError) throw dbError;

      return { success: true, url: publicUrl };
    } catch (error) {
      console.error("Error uploading media:", error);
      return { success: false, error };
    }
  }
}

export const mediaService = new MediaService();

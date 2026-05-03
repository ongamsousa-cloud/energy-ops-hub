 import ApiService, { ApiRequestOptions } from "./apiService";
 import { supabase } from "@/integrations/supabase/client";
 import { geoLocationService } from "./geoLocationService";
 
 class MediaService extends ApiService {
   async uploadMedia(
     file: File,
     serviceOrderId: string,
     technicianId: string,
     stage: string,
     description?: string
   ) {
     try {
       const fileExt = file.name.split(".").pop();
       const fileName = `${serviceOrderId}/${stage}_${Math.random()
         .toString(36)
         .substring(2)}.${fileExt}`;
       const filePath = `service-orders/${fileName}`;
 
       // Get current location
       const location = await geoLocationService.capturarLocalizacaoAtual();
 
       // Upload to Supabase Storage
       const { data, error: uploadError } = await supabase.storage
         .from("media")
         .upload(filePath, file);
 
       if (uploadError) throw uploadError;
 
       const {
         data: { publicUrl },
       } = supabase.storage.from("media").getPublicUrl(filePath);
 
       // Register in database
       const { error: dbError } = await supabase.from("service_order_media").insert({
         service_order_id: serviceOrderId,
         technician_id: technicianId,
         media_type: file.type.startsWith("image") ? "image" : "video",
         file_url: publicUrl,
         file_name: file.name,
         file_size: file.size,
         description,
         stage,
         gps_latitude: location?.latitude,
         gps_longitude: location?.longitude,
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
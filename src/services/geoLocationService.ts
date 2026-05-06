import { supabase } from "@/integrations/supabase/client";

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

class GeoLocationService {
  async capturarLocalizacaoAtual(): Promise<LocationData | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.error("Geolocation is not supported by this browser.");
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          });
        },
        (error) => {
          console.error("Error capturing location:", error);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    });
  }

   async registrarLocalizacaoNaOrdem(osId: string, stage: string): Promise<boolean> {
    const location = await this.capturarLocalizacaoAtual();
    if (!location) return false;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

     const { error } = await (supabase.from("os_audit_logs") as any).insert({
       os_id: osId,
       user_id: user.id,
       action: `location_capture`,
       details: { 
         stage, 
         accuracy: location.accuracy, 
         latitude: location.latitude, 
         longitude: location.longitude 
       }
     });

     // Update the OS with the current location if it's start or end
     if (stage === 'inicio' || stage === 'fim') {
       const updateData: any = {};
       if (stage === 'inicio') {
         updateData.inicio_lat = location.latitude;
         updateData.inicio_lng = location.longitude;
       } else {
         updateData.fim_lat = location.latitude;
         updateData.fim_lng = location.longitude;
       }
       await supabase.from("ordens_servico").update(updateData).eq("id", osId);
     }

    return !error;
  }
}

export const geoLocationService = new GeoLocationService();

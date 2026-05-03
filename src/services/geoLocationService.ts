 import ApiService, { ApiRequestOptions } from "./apiService";
 import { supabase } from "@/lib/supabase";
 
 export interface LocationData {
   latitude: number;
   longitude: number;
   accuracy: number;
   timestamp: number;
 }
 
 class GeoLocationService extends ApiService {
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
 
   async registrarLocalizacaoNaOrdem(serviceOrderId: string, stage: string): Promise<boolean> {
     const location = await this.capturarLocalizacaoAtual();
     if (!location) return false;
 
     const { error } = await supabase.from("service_order_history").insert({
       service_order_id: serviceOrderId,
       action: `Captura de Localização: ${stage}`,
       gps_latitude: location.latitude,
       gps_longitude: location.longitude,
       metadata: { accuracy: location.accuracy, stage },
     });
 
     return !error;
   }
 }
 
 export const geoLocationService = new GeoLocationService();
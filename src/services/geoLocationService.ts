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

  async registrarLocalizacaoNaOrdem(serviceOrderId: string, stage: string): Promise<boolean> {
    const location = await this.capturarLocalizacaoAtual();
    if (!location) return false;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase.from("service_order_history").insert({
      service_order_id: serviceOrderId,
      user_id: user.id,
      action: `Captura de Localização: ${stage}`,
      details: { accuracy: location.accuracy, stage, latitude: location.latitude, longitude: location.longitude },
      latitude: location.latitude,
      longitude: location.longitude
    });

    return !error;
  }
}

export const geoLocationService = new GeoLocationService();

 import { supabase } from "@/integrations/supabase/client";
 
 export interface ApiRequestOptions {
   related_entity_type?: string;
   related_entity_id?: string;
 }
 
 class ApiService {
   protected async logRequest(
     provider: string,
     integrationType: string,
     endpoint: string,
     method: string,
     statusCode: number,
     success: boolean,
     errorMessage?: string,
     options?: ApiRequestOptions
   ) {
     try {
       await supabase.from("api_request_logs").insert({
         provider,
         integration_type: integrationType,
         endpoint,
         method,
         status_code: statusCode,
         success,
         error_message: errorMessage,
         related_entity_type: options?.related_entity_type,
         related_entity_id: options?.related_entity_id,
       });
 
       // Update integration status
       if (success) {
         await supabase
           .from("api_integrations")
           .update({ last_success_at: new Date().toISOString() })
           .eq("provider", provider);
       } else {
         await supabase
           .from("api_integrations")
           .update({
             last_error_at: new Date().toISOString(),
             last_error_message: errorMessage,
           })
           .eq("provider", provider);
       }
     } catch (error) {
       console.error("Error logging API request:", error);
     }
   }
 
   protected async getIntegrationConfig(provider: string) {
     const { data, error } = await supabase
       .from("api_integrations")
       .select("*")
       .eq("provider", provider)
       .single();
 
     if (error) {
       console.error(`Error fetching config for ${provider}:`, error);
       return null;
     }
     return data;
   }
 }
 
 export default ApiService;
 import ApiService from "./apiService";
 import { supabase } from "@/integrations/supabase/client";
 
 export interface CreateNotificationParams {
   user_id: string;
   title: string;
   message: string;
   type?: string;
   service_order_id?: string;
 }
 
 class NotificationService extends ApiService {
    async criarNotificacao(params: { user_id: string; title: string; message: string; type?: string; service_order_id?: string; link?: string }) {
      const { error } = await supabase.from("notificacoes").insert({
        user_id: params.user_id,
        titulo: params.title,
        mensagem: params.message,
        type: params.type || "info",
        service_order_id: params.service_order_id,
        link: params.link,
      });
 
     if (error) {
       console.error("Error creating notification:", error);
       return { success: false, error };
     }
 
     return { success: true };
   }
 
    async marcarComoLida(notificationId: string) {
      const { error } = await supabase
        .from("notificacoes")
        .update({ read_at: new Date().toISOString(), lida: true })
        .eq("id", notificationId);
  
      return !error;
    }
 
    async listarNotificacoes(userId: string) {
      const { data, error } = await supabase
        .from("notificacoes")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
 
     if (error) {
       console.error("Error listing notifications:", error);
       return [];
     }
 
     return data;
   }
 }
 
 export const notificationService = new NotificationService();
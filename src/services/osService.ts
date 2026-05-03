import { supabase } from "@/integrations/supabase/client";

class OSService {
  async updateStatus(serviceOrderId: string, operationalStatus: string, userId: string, details?: any) {
    const { data: currentOS } = await supabase.from("service_orders").select("status").eq("id", serviceOrderId).single();
    
    const { error } = await supabase.from("service_orders").update({
      status: operationalStatus,
      updated_at: new Date().toISOString()
    }).eq("id", serviceOrderId);

    if (error) throw error;

    await supabase.from("service_order_history").insert({
      service_order_id: serviceOrderId,
      user_id: userId,
      action: `Mudança de status: ${operationalStatus}`,
      previous_status: currentOS?.status,
      new_status: operationalStatus,
      details
    });
  }
}

export const osService = new OSService();

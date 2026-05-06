 import { supabase } from "@/integrations/supabase/client";
 
 import { OSStatus } from "@/shared/status/os-status";

class OSService {
   async updateStatus(osId: string, status: OSStatus, userId: string, details?: any) {
     const { data: currentOS, error: fetchError } = await supabase
       .from("ordens_servico")
       .select("operational_status")
       .eq("id", osId)
       .single();

     if (fetchError) throw fetchError;

     const { error: updateError } = await supabase
       .from("ordens_servico")
       .update({
         operational_status: status,
         updated_at: new Date().toISOString()
       })
       .eq("id", osId);

     if (updateError) throw updateError;

      // Log the change in os_audit_logs (using as any to bypass type mismatch until regeneration)
      await (supabase.from("os_audit_logs") as any).insert({
        os_id: osId,
        user_id: userId,
        action: 'status_change',
        old_value: currentOS?.operational_status,
        new_value: status,
        details: details || {}
      });

      // Also update os_history if it exists for legacy compatibility
      await (supabase.from("os_history") as any).insert({
        os_id: osId,
        user_id: userId,
        action: `Alteração de status para ${status}`,
        old_status: currentOS?.operational_status,
        new_status: status,
        details: details || {}
      });
   }

   async getOS(osId: string) {
     const { data, error } = await supabase
       .from("ordens_servico")
       .select(`
         *,
         obra:obras(nome),
         equipe:equipes(nome),
         supervisor:employees!supervisor_id(full_name),
         gestor:employees!gestor_responsavel_id(full_name),
         atividades:os_atividades(*),
         materiais:os_materials(*),
         evidencias:os_evidences(*)
       `)
       .eq("id", osId)
       .single();

     if (error) throw error;
     return data;
   }
}

export const osService = new OSService();

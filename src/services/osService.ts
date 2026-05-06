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

 export async function canStartWorkOrder(osId: string, userId: string): Promise<{
   can_start: boolean;
   blocked_by: string[];
   message: string;
 }> {
   const blocked_by: string[] = [];
   
   // 1. Fetch OS and User data
   const { data: os, error: osError } = await supabase
     .from("ordens_servico")
     .select(`
       *,
       department:departments(id),
       profissional:profiles!ordens_servico_profissional_id_fkey(id, department_id)
     `)
     .eq("id", osId)
     .single();

   if (osError || !os) {
     return { can_start: false, blocked_by: ["os_not_found"], message: "Ordem de Serviço não encontrada." };
   }

   // 2. Status check
   const status = (os.operational_status || os.status || "").toLowerCase();
   if (status !== "pronta_para_execucao") {
     blocked_by.push("invalid_status");
   }

   // 3. User association and permissions
   if (os.profissional_id !== userId) {
     blocked_by.push("user_not_assigned");
   }

   // 4. Non-conformities check
   const { data: nc } = await supabase
     .from("non_conformities")
     .select("id, severity")
     .eq("os_id", osId)
     .in("status", ["aberta", "em_correcao", "reaberta"]);

   if (nc && nc.length > 0) {
     blocked_by.push("open_non_conformities");
     if (nc.some(n => n.severity === "critica" || n.severity === "alta")) {
       blocked_by.push("critical_non_conformities");
     }
   }

   // 5. Materials check (all planned must have been released)
   const { data: materials } = await supabase
     .from("os_materials")
     .select("quantity_planned, quantity_used")
     .eq("os_id", osId);

   // Simplification: if we have planned materials but no release confirmation (handled by status usually)
   // but let's be explicit if there's a requirement for specific material status
   const { data: reservations } = await supabase
     .from("material_reservations")
     .select("status")
     .eq("os_id", osId);
   
   if (reservations?.some(r => r.status === "solicitado" || r.status === "reservado")) {
     blocked_by.push("materials_not_released");
   }

   const messages: Record<string, string> = {
     invalid_status: "A OS não está no status 'Pronta para Execução'.",
     user_not_assigned: "Você não é o profissional atribuído a esta OS.",
     open_non_conformities: "Existem não conformidades abertas para esta OS.",
     critical_non_conformities: "Existem pendências críticas de conformidade.",
     materials_not_released: "Existem materiais pendentes de liberação no estoque."
   };

   const can_start = blocked_by.length === 0;
   
   return {
     can_start,
     blocked_by,
     message: can_start ? "Liberação confirmada. Pode iniciar o trabalho." : messages[blocked_by[0]] || "Acesso bloqueado por pendências operacionais."
   };
 }
